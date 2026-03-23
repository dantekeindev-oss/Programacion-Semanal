import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getAdminAuthConfig, requireAdminSession } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const migrate = url.searchParams.get('migrate');

  // TEMPORAL: Ejecutar migraciones si se pasa ?migrate=1 (sin auth)
  if (migrate === '1') {
    return await runMigrations();
  }

  const authResult = requireAdminSession(req);
  if ('error' in authResult) {
    return authResult.error;
  }

  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { adminEmail } = getAdminAuthConfig();

    const users = await prisma.user.findMany({
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      teamId: user.teamId,
      teamName: user.team?.name || null,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      isAdmin: user.email === adminEmail || user.role === Role.ADMIN,
    }));

    return NextResponse.json({ data: formattedUsers });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const authResult = requireAdminSession(req);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { adminEmail } = getAdminAuthConfig();
    const body = await req.json();
    const { userId, role, teamId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    if (user.email === adminEmail) {
      return NextResponse.json(
        { error: 'No se puede modificar el rol del administrador principal' },
        { status: 403 }
      );
    }

    const updateData: Record<string, string | null> = {};

    if (role && ['LEADER', 'AGENT'].includes(role)) {
      updateData.role = role;

      if (role === 'LEADER' && teamId) {
        await prisma.team.update({
          where: { id: teamId },
          data: { leaderId: userId },
        });
      }
    }

    if (teamId !== undefined) {
      updateData.teamId = teamId;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail },
    });

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: 'USER_UPDATE',
          entity: 'USER',
          entityId: userId,
          changes: {
            previous: {
              role: user.role,
              teamId: user.teamId,
            },
            new: updateData,
          },
        },
      });
    }

    return NextResponse.json({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        teamId: updatedUser.teamId,
        teamName: updatedUser.team?.name || null,
        isAdmin: updatedUser.email === adminEmail || updatedUser.role === Role.ADMIN,
      },
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

// Función temporal para ejecutar migraciones
async function runMigrations() {
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
      if (
        !error.message?.includes('already exists') &&
        !error.message?.includes('duplicate') &&
        !error.message?.includes('unique constraint') &&
        !error.message?.includes('relation')
      ) {
        results.push({
          success: false,
          error: error.message,
          migration: migration.substring(0, 50) + '...',
        });
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
