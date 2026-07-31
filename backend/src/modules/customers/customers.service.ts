import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/ApiError';
import { Prisma } from '@prisma/client';

interface ListParams {
  search?: string;
  status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  customerType?: 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
  page?: number;
  limit?: number;
}

export class CustomersService {
  async list(params: ListParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? params.limit : 20;

    const where: Prisma.CustomerWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.customerType ? { customerType: params.customerType } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { mobile: { contains: params.search, mode: 'insensitive' } },
              { businessName: { contains: params.search, mode: 'insensitive' } },
              { email: { contains: params.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        notes: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
        challans: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!customer) throw ApiError.notFound('Customer not found');
    return customer;
  }

  async create(data: Prisma.CustomerCreateInput) {
    return prisma.customer.create({ data });
  }

  async update(id: string, data: Prisma.CustomerUpdateInput) {
    await this.assertExists(id);
    return prisma.customer.update({ where: { id }, data });
  }

  async addNote(id: string, note: string, createdById: string) {
    await this.assertExists(id);
    return prisma.customerNote.create({
      data: { customerId: id, note, createdById },
      include: { createdBy: { select: { name: true } } },
    });
  }

  private async assertExists(id: string) {
    const exists = await prisma.customer.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw ApiError.notFound('Customer not found');
  }
}

export const customersService = new CustomersService();
