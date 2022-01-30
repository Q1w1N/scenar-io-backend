import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.script.create({
    data: { name: "New Script", description: "A test script, for testing" },
  });
  const allScripts = await prisma.script.findMany();
  console.log(allScripts);
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
