import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { Prisma, MovementType } from '@prisma/client';

interface ListParams {
  search?: string;
  category?: string;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export class ProductsService {
  async list(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const where: Prisma.ProductWhereInput = {
      ...(params.category ? { category: params.category } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { sku: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    let items = await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } });
    if (params.lowStock) {
      items = items.filter((p) => p.currentStock <= p.minStockAlert);
    }

    const total = items.length;
    const paged = items.slice((page - 1) * limit, page * limit);

    return { items: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { stockMovements: { orderBy: { createdAt: 'desc' }, take: 20, include: { createdBy: { select: { name: true } } } } },
    });
    if (!product) throw ApiError.notFound('Product not found');
    return product;
  }

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    await this.assertExists(id);
    return prisma.product.update({ where: { id }, data });
  }

  /**
   * Adjusts stock and writes an audit log entry atomically.
   * OUT movements can never push stock below zero.
   */
  async recordMovement(id: string, quantity: number, movementType: MovementType, reason: string, createdById: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id } });
      if (!product) throw ApiError.notFound('Product not found');

      const newStock = movementType === 'IN' ? product.currentStock + quantity : product.currentStock - quantity;

      if (newStock < 0) {
        throw ApiError.badRequest(
          `Insufficient stock for ${product.name}. Available: ${product.currentStock}, requested OUT: ${quantity}`
        );
      }

      const updated = await tx.product.update({ where: { id }, data: { currentStock: newStock } });

      const movement = await tx.stockMovement.create({
        data: { productId: id, quantityChanged: quantity, movementType, reason, createdById },
      });

      return { product: updated, movement };
    });
  }

  private async assertExists(id: string) {
    const exists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw ApiError.notFound('Product not found');
  }
}

export const productsService = new ProductsService();
