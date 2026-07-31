import { prisma } from '../config/prisma';

export async function generateChallanNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  const count = await prisma.challan.count({
    where: { challanNumber: { startsWith: prefix } },
  });

  const nextSeq = (count + 1).toString().padStart(4, '0');
  return `${prefix}${nextSeq}`;
}
