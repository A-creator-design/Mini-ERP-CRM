import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/ApiResponse';
import { prisma } from '../../config/prisma';

const router = Router();
router.use(authenticate);

// Aggregate dashboard stats for the admin-style UI landing page.
router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const [totalCustomers, leadCustomers, totalProducts, allProducts, draftChallans, confirmedChallans] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.product.count(),
      prisma.product.findMany({ select: { currentStock: true, minStockAlert: true, name: true, sku: true } }),
      prisma.challan.count({ where: { status: 'DRAFT' } }),
      prisma.challan.count({ where: { status: 'CONFIRMED' } }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.currentStock <= p.minStockAlert);

    const recentChallans = await prisma.challan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: { select: { name: true } } },
    });

    const upcomingFollowUps = await prisma.customer.findMany({
      where: { followUpDate: { gte: new Date() } },
      orderBy: { followUpDate: 'asc' },
      take: 5,
      select: { id: true, name: true, followUpDate: true, mobile: true },
    });

    sendSuccess(res, 200, {
      totalCustomers,
      leadCustomers,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      draftChallans,
      confirmedChallans,
      recentChallans,
      upcomingFollowUps,
    });
  })
);

export default router;
