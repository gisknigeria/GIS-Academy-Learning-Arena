const { PrismaClient, UserRole, PaymentStatus } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const adminName = process.env.SEED_ADMIN_NAME ?? "GIS Academy Super Admin";
  const adminPhone = process.env.SEED_ADMIN_PHONE;

  if (!adminEmail || !adminPassword) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
  }

  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: adminName,
      phone: adminPhone,
      role: UserRole.SUPER_ADMIN,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      passwordHash,
    },
    create: {
      fullName: adminName,
      email: adminEmail,
      phone: adminPhone,
      role: UserRole.SUPER_ADMIN,
      paymentStatus: PaymentStatus.NOT_REQUIRED,
      passwordHash,
    },
  });

  await prisma.platformSetting.upsert({
    where: { key: "payment_provider" },
    update: { value: "paystack" },
    create: { key: "payment_provider", value: "paystack" },
  });

  await prisma.platformSetting.upsert({
    where: { key: "registration_mode" },
    update: { value: "free_registration_payment_gated_access" },
    create: { key: "registration_mode", value: "free_registration_payment_gated_access" },
  });

  await prisma.platformSetting.upsert({
    where: { key: "brand_palette" },
    update: { value: "deep-green,lime,white,amber" },
    create: { key: "brand_palette", value: "deep-green,lime,white,amber" },
  });

  console.log("Seeded first Super Admin and platform settings.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
