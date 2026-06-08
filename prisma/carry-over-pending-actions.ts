import { PrismaClient } from "@prisma/client";
import { carryOverPendingHistoryActionItems } from "../lib/actionItemCarryOver";

const prisma = new PrismaClient();

async function main() {
  const count = await carryOverPendingHistoryActionItems(prisma);
  console.log(`Carried over ${count} pending history action items.`);
}

main()
  .catch((error) => {
    console.error("Failed to carry over pending action items:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
