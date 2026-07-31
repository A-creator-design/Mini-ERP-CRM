import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { generateChallanNumber } from '../../utils/challanNumber';
import { Prisma, ChallanStatus } from '@prisma/client';

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

interface ListParams {
  status?: ChallanStatus;
  customerId?: string;
  page?: number;
  limit?: number;
}

export class ChallansService {
  async list(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const where: Prisma.ChallanWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.customerId ? { customerId: params.customerId } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.challan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { customer: { select: { name: true, businessName: true } }, createdBy: { select: { name: true } } },
      }),
      prisma.challan.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
    });
    if (!challan) throw ApiError.notFound('Challan not found');
    return challan;
  }

  /**
   * Creates a challan with product snapshots taken at creation time
   * (so historical challans stay accurate even if product price/name changes later).
   * If created directly as CONFIRMED, stock is deducted atomically in the
   * same transaction and can never go negative.
   */
  async create(customerId: string, items: ChallanItemInput[], status: 'DRAFT' | 'CONFIRMED', createdById: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw ApiError.notFound('Customer not found');

    return prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { id: { in: items.map((i) => i.productId) } } });
      if (products.length !== items.length) {
        throw ApiError.badRequest('One or more products in the challan do not exist');
      }

      const productMap = new Map(products.map((p) => [p.id, p]));

      if (status === 'CONFIRMED') {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          if (product.currentStock < item.quantity) {
            throw ApiError.badRequest(
              `Insufficient stock for ${product.name}. Available: ${product.currentStock}, requested: ${item.quantity}`
            );
          }
        }
      }

      const challanNumber = await generateChallanNumber();
      const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

      const challan = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          totalQuantity,
          status,
          createdById,
          items: {
            create: items.map((item) => {
              const product = productMap.get(item.productId)!;
              return {
                productId: item.productId,
                productNameSnapshot: product.name,
                productSkuSnapshot: product.sku,
                unitPriceSnapshot: product.unitPrice,
                quantity: item.quantity,
              };
            }),
          },
        },
        include: { items: true, customer: true },
      });

      if (status === 'CONFIRMED') {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: product.currentStock - item.quantity },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales challan ${challanNumber}`,
              createdById,
            },
          });
        }
      }

      return challan;
    });
  }

  /**
   * Transitions a challan's status. The critical business rule lives here:
   * DRAFT -> CONFIRMED deducts stock (never below zero).
   * CONFIRMED -> CANCELLED restores stock that was previously deducted.
   */
  async changeStatus(id: string, newStatus: ChallanStatus, actingUserId: string) {
    return prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({ where: { id }, include: { items: true } });
      if (!challan) throw ApiError.notFound('Challan not found');

      if (challan.status === newStatus) return challan;

      if (challan.status === 'CANCELLED') {
        throw ApiError.badRequest('A cancelled challan cannot change status');
      }

      if (challan.status === 'DRAFT' && newStatus === 'CONFIRMED') {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw ApiError.notFound(`Product ${item.productNameSnapshot} no longer exists`);
          if (product.currentStock < item.quantity) {
            throw ApiError.badRequest(
              `Insufficient stock for ${product.name}. Available: ${product.currentStock}, required: ${item.quantity}`
            );
          }
        }
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: product!.currentStock - item.quantity },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Sales challan ${challan.challanNumber} confirmed`,
              createdById: actingUserId,
            },
          });
        }
      }

      if (challan.status === 'DRAFT' && newStatus === 'CANCELLED') {
        // No stock was ever deducted for a draft, so cancelling is a no-op on stock.
      }

      if (challan.status === 'CONFIRMED' && newStatus === 'CANCELLED') {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: product!.currentStock + item.quantity },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Sales challan ${challan.challanNumber} cancelled - stock restored`,
              createdById: actingUserId,
            },
          });
        }
      }

      return tx.challan.update({
        where: { id },
        data: { status: newStatus },
        include: { items: true, customer: true },
      });
    });
  }
}

export const challansService = new ChallansService();
