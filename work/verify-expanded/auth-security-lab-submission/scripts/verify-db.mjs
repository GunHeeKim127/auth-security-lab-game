import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const prisma = new PrismaClient();

try {
  const [users, resources, sessions, audits, grouped] = await Promise.all([
    prisma.user.count(),
    prisma.resource.count(),
    prisma.session.count(),
    prisma.auditLog.count(),
    prisma.auditLog.groupBy({ by: ["mode", "outcome"], _count: { _all: true } })
  ]);
  const result = {
    generatedAt: new Date().toISOString(),
    database: "auth_security_lab",
    schema: "public",
    counts: { users, resources, sessions, audits },
    grouped
  };
  const outputDirectory = resolve("results");
  const outputPath = resolve(outputDirectory, "db-verification.json");
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));
  console.log(`Saved: ${outputPath}`);
} finally {
  await prisma.$disconnect();
}
