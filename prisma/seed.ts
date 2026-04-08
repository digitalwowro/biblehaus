import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "admin@bible.haus";
  const password = "biblehaus";
  const legacyEmail = "account@bible.haus";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Default admin user "${email}" already exists, skipping.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const legacy = await prisma.adminUser.findUnique({ where: { email: legacyEmail } });
  if (legacy) {
    await prisma.adminUser.update({
      where: { id: legacy.id },
      data: {
        email,
        passwordHash,
        name: legacy.name ?? "Admin",
      },
    });

    console.log(`Migrated legacy default admin user to: ${email} / ${password}`);
    console.log("Change the default password after the first login.");
    return;
  }

  await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
      name: "Admin",
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
