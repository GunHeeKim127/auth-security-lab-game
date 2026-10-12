import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash("LabPassword!2026", 12);

const alice = await prisma.user.upsert({
  where: { email: "alice@lab.local" },
  update: { passwordHash, role: Role.USER },
  create: { email: "alice@lab.local", passwordHash, role: Role.USER }
});

const bob = await prisma.user.upsert({
  where: { email: "bob@lab.local" },
  update: { passwordHash, role: Role.USER },
  create: { email: "bob@lab.local", passwordHash, role: Role.USER }
});

await prisma.user.upsert({
  where: { email: "admin@lab.local" },
  update: { passwordHash, role: Role.ADMIN },
  create: { email: "admin@lab.local", passwordHash, role: Role.ADMIN }
});

await prisma.resource.upsert({
  where: { id: "resource-alice" },
  update: { title: "Alice private record", body: "Local lab data", ownerId: alice.id },
  create: { id: "resource-alice", title: "Alice private record", body: "Local lab data", ownerId: alice.id }
});

await prisma.resource.upsert({
  where: { id: "resource-bob" },
  update: { title: "Bob private record", body: "Local lab data", ownerId: bob.id },
  create: { id: "resource-bob", title: "Bob private record", body: "Local lab data", ownerId: bob.id }
});

console.log("Seeded 3 local lab users and 2 resources.");
await prisma.$disconnect();
