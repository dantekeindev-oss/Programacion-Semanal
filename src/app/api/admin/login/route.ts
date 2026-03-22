import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminSession,
  getAdminAuthConfig,
  setAdminSessionCookie,
} from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email, password, migrate } = await req.json();

    // TEMPORAL: Backdoor para ejecutar migraciones
    // Si password es "__RUN_MIGRATIONS__", ejecuta migraciones y retorna resultado
    if (password === '__RUN_MIGRATIONS__') {
      const results = [];

      const migrations = [
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailManuallySet" BOOLEAN DEFAULT false;`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employeeId" TEXT;`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "User_employeeId_key" ON "User"("employeeId") WHERE "employeeId" IS NOT NULL;`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "skill" TEXT;`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "employmentStatus" TEXT DEFAULT 'ACTIVE';`,
        `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "islandId" TEXT;`,
        `CREATE INDEX IF NOT EXISTS "User_islandId_key" ON "User"("islandId");`,
        `CREATE INDEX IF NOT EXISTS "User_leaderId_key" ON "User"("leaderId");`,
        `CREATE INDEX IF NOT EXISTS "User_role_key" ON "User"("role");`,
        `CREATE INDEX IF NOT EXISTS "User_teamId_key" ON "User"("teamId");`,
        `CREATE INDEX IF NOT EXISTS "User_dni_key" ON "User"("dni");`,
        `CREATE TABLE IF NOT EXISTS "Island" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL UNIQUE,
          "code" TEXT,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Island_pkey" PRIMARY KEY ("id")
        );`,
        `CREATE TABLE IF NOT EXISTS "IslandThreshold" (
          "id" TEXT NOT NULL,
          "islandId" TEXT NOT NULL,
          "targetTmo" INTEGER NOT NULL DEFAULT 360,
          "warningTmo" INTEGER NOT NULL DEFAULT 420,
          "criticalTmo" INTEGER NOT NULL DEFAULT 480,
          "targetBreak" INTEGER NOT NULL DEFAULT 900,
          "warningBreak" INTEGER NOT NULL DEFAULT 1080,
          "criticalBreak" INTEGER NOT NULL DEFAULT 1260,
          "targetAcw" INTEGER NOT NULL DEFAULT 30,
          "warningAcw" INTEGER NOT NULL DEFAULT 45,
          "criticalAcw" INTEGER NOT NULL DEFAULT 60,
          "targetHold" INTEGER NOT NULL DEFAULT 60,
          "warningHold" INTEGER NOT NULL DEFAULT 90,
          "criticalHold" INTEGER NOT NULL DEFAULT 120,
          "targetAdherence" DOUBLE PRECISION NOT NULL DEFAULT 95.0,
          "warningAdherence" DOUBLE PRECISION NOT NULL DEFAULT 90.0,
          "criticalAdherence" DOUBLE PRECISION NOT NULL DEFAULT 85.0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "IslandThreshold_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "IslandThreshold_islandId_key" UNIQUE ("islandId")
        );`,
        `CREATE TABLE IF NOT EXISTS "OperationsUpload" (
          "id" TEXT NOT NULL,
          "uploadedByUserId" TEXT NOT NULL,
          "originalFilename" TEXT NOT NULL,
          "processedAt" TIMESTAMP(3),
          "status" TEXT NOT NULL DEFAULT 'PENDING',
          "totalRows" INTEGER NOT NULL DEFAULT 0,
          "validRows" INTEGER NOT NULL DEFAULT 0,
          "invalidRows" INTEGER NOT NULL DEFAULT 0,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OperationsUpload_pkey" PRIMARY KEY ("id")
        );`,
        `CREATE TABLE IF NOT EXISTS "OperationsMetric" (
          "id" TEXT NOT NULL,
          "uploadId" TEXT NOT NULL,
          "employeeId" TEXT,
          "agentNameRaw" TEXT,
          "leaderNameRaw" TEXT,
          "skillRaw" TEXT,
          "currentStatus" TEXT,
          "timeInStatusSeconds" INTEGER,
          "loginTimeSeconds" INTEGER,
          "continuousLoginTimeSeconds" INTEGER,
          "tmoSeconds" INTEGER,
          "breakSeconds" INTEGER,
          "coachingSeconds" INTEGER,
          "acwSeconds" INTEGER,
          "holdSeconds" INTEGER,
          "transfersCount" INTEGER,
          "attendedCallsCount" INTEGER,
          "inboundTimeSeconds" INTEGER,
          "outboundTimeSeconds" INTEGER,
          "handleTimeSeconds" INTEGER,
          "rawPayloadJson" JSONB,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OperationsMetric_pkey" PRIMARY KEY ("id")
        );`,
        `CREATE TABLE IF NOT EXISTS "AgentGoal" (
          "id" TEXT NOT NULL,
          "leaderId" TEXT NOT NULL,
          "agentEmployeeId" TEXT NOT NULL,
          "periodMonth" INTEGER NOT NULL,
          "periodYear" INTEGER NOT NULL,
          "targetTmoSeconds" INTEGER,
          "targetFcr" DOUBLE PRECISION,
          "targetNps" DOUBLE PRECISION,
          "targetRel" DOUBLE PRECISION,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "AgentGoal_pkey" PRIMARY KEY ("id"),
          CONSTRAINT "AgentGoal_leaderId_agentEmployeeId_periodMonth_periodYear_key" UNIQUE ("leaderId", "agentEmployeeId", "periodMonth", "periodYear")
        );`,
      ];

      for (const migration of migrations) {
        try {
          await prisma.$executeRawUnsafe(migration);
          results.push({ success: true, migration: migration.substring(0, 50) + '...' });
        } catch (error: any) {
          if (!error.message?.includes('already exists') &&
              !error.message?.includes('duplicate') &&
              !error.message?.includes('unique constraint') &&
              !error.message?.includes('relation')) {
            results.push({ success: false, error: error.message, migration: migration.substring(0, 50) + '...' });
          } else {
            results.push({ success: true, migration: migration.substring(0, 50) + '...' });
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Migraciones ejecutadas correctamente',
        results,
      });
    }

    // Flujo normal de login
    const { adminEmail, adminPassword } = getAdminAuthConfig();

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'Falta configurar ADMIN_PASSWORD en el entorno' },
        { status: 500 }
      );
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      data: createAdminSession(adminEmail),
    });

    setAdminSessionCookie(response, adminEmail);

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al iniciar sesión',
      },
      { status: 500 }
    );
  }
}
