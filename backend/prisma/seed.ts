import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });
    console.log(`Admin user created: ${adminEmail}`);
  } else {
    console.log('Admin user already exists');
  }

  // Create default halls
  const defaultHalls = ['Hall A', 'Hall B', 'Hall C', 'Hall D'];
  for (const hallName of defaultHalls) {
    await prisma.hall.upsert({
      where: { name: hallName },
      update: {},
      create: { name: hallName, location: `Building ${hallName.split(' ')[1]}` },
    });
  }
  console.log('Default halls created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
