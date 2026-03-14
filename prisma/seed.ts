import { PrismaClient, Role, WeekDay } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de base de datos...');

  // Limpiar datos existentes
  console.log('🗑️  Limpiando datos existentes...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.request.deleteMany();
  await prisma.break.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  // Crear equipos
  console.log('👥 Creando equipos...');
  const team1 = await prisma.team.create({
    data: {
      name: 'Soporte Nivel 1',
      description: 'Equipo de soporte técnico de primer nivel',
    },
  });

  const team2 = await prisma.team.create({
    data: {
      name: 'Ventas',
      description: 'Equipo de ventas y atención al cliente',
    },
  });

  // Crear usuarios líderes
  console.log('👑 Creando líderes...');
  const leader1 = await prisma.user.create({
    data: {
      email: 'maria.garcia@tuempresa.com',
      name: 'María García',
      firstName: 'María',
      lastName: 'García',
      role: Role.LEADER,
      teamId: team1.id,
      weeklyDayOff: WeekDay.SUNDAY,
    },
  });

  const leader2 = await prisma.user.create({
    data: {
      email: 'carlos.perez@tuempresa.com',
      name: 'Carlos Pérez',
      firstName: 'Carlos',
      lastName: 'Pérez',
      role: Role.LEADER,
      teamId: team2.id,
      weeklyDayOff: WeekDay.SUNDAY,
    },
  });

  // Actualizar equipos con sus líderes
  await prisma.team.update({
    where: { id: team1.id },
    data: { leaderId: leader1.id },
  });

  await prisma.team.update({
    where: { id: team2.id },
    data: { leaderId: leader2.id },
  });

  // Crear usuarios agentes - Equipo 1
  console.log('👤 Creando agentes del equipo 1...');
  const agents1 = [
    { firstName: 'Juan', lastName: 'Rodríguez', email: 'juan.rodriguez@tuempresa.com', dayOff: WeekDay.MONDAY },
    { firstName: 'Ana', lastName: 'Martínez', email: 'ana.martinez@tuempresa.com', dayOff: WeekDay.TUESDAY },
    { firstName: 'Pedro', lastName: 'López', email: 'pedro.lopez@tuempresa.com', dayOff: WeekDay.WEDNESDAY },
    { firstName: 'Laura', lastName: 'Sánchez', email: 'laura.sanchez@tuempresa.com', dayOff: WeekDay.THURSDAY },
    { firstName: 'Diego', lastName: 'Ramírez', email: 'diego.ramirez@tuempresa.com', dayOff: WeekDay.FRIDAY },
  ];

  const agentUsers1: any[] = [];
  for (const agent of agents1) {
    const user = await prisma.user.create({
      data: {
        email: agent.email,
        name: `${agent.firstName} ${agent.lastName}`,
        firstName: agent.firstName,
        lastName: agent.lastName,
        role: Role.AGENT,
        teamId: team1.id,
        leaderId: leader1.id,
        weeklyDayOff: agent.dayOff,
      },
    });
    agentUsers1.push(user);
  }

  // Crear usuarios agentes - Equipo 2
  console.log('👤 Creando agentes del equipo 2...');
  const agents2 = [
    { firstName: 'Mónica', lastName: 'Fernández', email: 'monica.fernandez@tuempresa.com', dayOff: WeekDay.MONDAY },
    { firstName: 'Roberto', lastName: 'Díaz', email: 'roberto.diaz@tuempresa.com', dayOff: WeekDay.WEDNESDAY },
    { firstName: 'Carmen', lastName: 'Ruiz', email: 'carmen.ruiz@tuempresa.com', dayOff: WeekDay.FRIDAY },
  ];

  const agentUsers2: any[] = [];
  for (const agent of agents2) {
    const user = await prisma.user.create({
      data: {
        email: agent.email,
        name: `${agent.firstName} ${agent.lastName}`,
        firstName: agent.firstName,
        lastName: agent.lastName,
        role: Role.AGENT,
        teamId: team2.id,
        leaderId: leader2.id,
        weeklyDayOff: agent.dayOff,
      },
    });
    agentUsers2.push(user);
  }

  // Crear horarios para todos los usuarios
  console.log('📅 Creando horarios...');
  const allUsers = [leader1, leader2, ...agentUsers1, ...agentUsers2];
  for (const user of allUsers) {
    await prisma.schedule.create({
      data: {
        userId: user.id,
        teamId: user.teamId,
        timeRange: '09:00-18:00',
        validFrom: new Date('2024-01-01'),
        validTo: null,
      },
    });
  }

  // Crear breaks para todos los usuarios
  console.log('☕ Creando breaks...');
  for (const user of allUsers) {
    await prisma.break.create({
      data: {
        userId: user.id,
        teamId: user.teamId,
        type: 'DAILY',
        timeRange: '13:00-13:15',
        duration: 15,
        validFrom: new Date('2024-01-01'),
        validTo: null,
      },
    });
  }

  // Crear algunas solicitudes de prueba
  console.log('📋 Creando solicitudes de prueba...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const request1 = await prisma.request.create({
    data: {
      requesterId: agentUsers1[0].id,
      type: 'SCHEDULE_CHANGE',
      targetDate: tomorrow,
      currentSchedule: '09:00-18:00',
      requestedSchedule: '14:00-23:00',
      reason: 'Tengo un compromiso médico por la mañana',
      status: 'PENDING',
    },
  });

  const request2 = await prisma.request.create({
    data: {
      requesterId: agentUsers1[1].id,
      involvedAgentId: agentUsers1[2].id,
      type: 'SCHEDULE_SWAP',
      targetDate: tomorrow,
      currentSchedule: '09:00-18:00',
      requestedSchedule: '09:00-18:00',
      reason: 'Permuta de turno',
      status: 'PENDING',
    },
  });

  const request3 = await prisma.request.create({
    data: {
      requesterId: agentUsers1[3].id,
      type: 'SCHEDULE_CHANGE',
      targetDate: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000),
      currentSchedule: '09:00-18:00',
      requestedSchedule: '08:00-17:00',
      reason: 'Necesidad personal',
      status: 'APPROVED',
      resolvedBy: leader1.id,
      resolvedAt: new Date(),
      comment: 'Aprobado por compromiso previo',
    },
  });

  // Crear notificaciones para el líder
  console.log('🔔 Creando notificaciones...');
  await prisma.notification.create({
    data: {
      userId: leader1.id,
      type: 'REQUEST_PENDING',
      title: 'Nueva solicitud pendiente',
      message: `${agentUsers1[0].firstName} ${agentUsers1[0].lastName} ha realizado una solicitud de cambio.`,
      requestId: request1.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: leader1.id,
      type: 'REQUEST_PENDING',
      title: 'Nueva solicitud pendiente',
      message: `${agentUsers1[1].firstName} ${agentUsers1[1].lastName} ha solicitado un cambio de horario con otro agente.`,
      requestId: request2.id,
    },
  });

  // Crear logs de auditoría
  console.log('📝 Creando logs de auditoría...');
  for (const user of allUsers) {
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'USER',
        changes: { seedData: true },
      },
    });
  }

  console.log('✅ Seed completado exitosamente!');
  console.log('\n📊 Resumen:');
  console.log(`   - Equipos: 2`);
  console.log(`   - Líderes: 2`);
  console.log(`   - Agentes: ${agentUsers1.length + agentUsers2.length}`);
  console.log(`   - Solicitudes: 3`);
  console.log(`   - Notificaciones: 2`);

  console.log('\n🔐 Credenciales de prueba:');
  console.log(`   Líder 1: maria.garcia@tuempresa.com`);
  console.log(`   Líder 2: carlos.perez@tuempresa.com`);
  console.log(`   Agentes: *.rodriguez@tuempresa.com, *.martinez@tuempresa.com, etc.`);
  console.log(`   (Debes configurar Google OAuth para el dominio @tuempresa.com)`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
