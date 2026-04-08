import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "account@bible.haus";
  const password = "biblehaus";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Default admin user "${email}" already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name: "Account",
    },
  });

  console.log(`Created default admin user: ${email} / ${password}`);
  console.log("Change the default password after the first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
