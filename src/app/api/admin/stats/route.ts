import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ADMIN_EMAIL } from '@/lib/auth';

// Dominio corporativo
const CORPORATE_DOMAIN = 'konecta.com';

export async function GET() {
  try {
    const session = await auth();

    // Verificar que sea el admin
    if (!session?.user || session.user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener estadísticas
    const [totalUsers, totalTeams, totalLeaders, totalAgents, totalRequests] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.user.count({ where: { role: 'LEADER' } }),
      prisma.user.count({ where: { role: 'AGENT' } }),
      prisma.request.count(),
    ]);

    const stats = {
      totalUsers,
      totalTeams,
      totalLeaders,
      totalAgents,
      totalRequests,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
