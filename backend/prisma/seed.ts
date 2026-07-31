/**
 * Seeds the database with one user per role + a few demo customers/products
 * so graders can log in immediately and see a populated system.
 * Run with: npm run prisma:seed
 */
import { PrismaClient, Role, CustomerType, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password@123', 10);

  const users = await Promise.all(
    [
      { name: 'Admin User', email: 'admin@erp.com', role: Role.ADMIN },
      { name: 'Sales User', email: 'sales@erp.com', role: Role.SALES },
      { name: 'Warehouse User', email: 'warehouse@erp.com', role: Role.WAREHOUSE },
      { name: 'Accounts User', email: 'accounts@erp.com', role: Role.ACCOUNTS },
    ].map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, passwordHash: password },
      })
    )
  );

  const salesUser = users.find((u) => u.role === Role.SALES)!;

  const customer1 = await prisma.customer.upsert({
    where: { id: 'seed-customer-1' },
    update: {},
    create: {
      id: 'seed-customer-1',
      name: 'Ramesh Traders',
      mobile: '9876543210',
      email: 'ramesh@traders.com',
      businessName: 'Ramesh Traders Pvt Ltd',
      gstNumber: '27ABCDE1234F1Z5',
      customerType: CustomerType.WHOLESALE,
      address: 'MG Road, Pune',
      status: CustomerStatus.ACTIVE,
    },
  });

  await prisma.customer.upsert({
    where: { id: 'seed-customer-2' },
    update: {},
    create: {
      id: 'seed-customer-2',
      name: 'Sunita Retail Store',
      mobile: '9123456780',
      email: 'sunita@retail.com',
      businessName: 'Sunita Retail',
      customerType: CustomerType.RETAIL,
      address: 'FC Road, Pune',
      status: CustomerStatus.LEAD,
      followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  const products = await Promise.all(
    [
      { name: 'Steel Bolt 8mm', sku: 'SKU-BOLT-8MM', category: 'Hardware', unitPrice: 5.5, currentStock: 500, minStockAlert: 50, location: 'Warehouse A' },
      { name: 'Steel Nut 8mm', sku: 'SKU-NUT-8MM', category: 'Hardware', unitPrice: 3.0, currentStock: 40, minStockAlert: 50, location: 'Warehouse A' },
      { name: 'PVC Pipe 1inch', sku: 'SKU-PVC-1IN', category: 'Plumbing', unitPrice: 120.0, currentStock: 200, minStockAlert: 20, location: 'Warehouse B' },
    ].map((p) =>
      prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: p,
      })
    )
  );

  await prisma.stockMovement.create({
    data: {
      productId: products[0].id,
      quantityChanged: 500,
      movementType: 'IN',
      reason: 'Initial stock load',
      createdById: salesUser.id,
    },
  });

  console.log('Seed complete.');
  console.log('Login credentials (all use password: Password@123):');
  users.forEach((u) => console.log(`  ${u.role.padEnd(10)} -> ${u.email}`));
  console.log(`Sample customer: ${customer1.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
