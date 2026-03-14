'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import LeaderNavigation from '@/components/leader/LeaderNavigation';
import { TeamMemberInfo, WeekDayType } from '@/types';
import { getWeekDayLabel } from '@/lib/utils';

export default function LeaderTeamPage() {
  const [members, setMembers] = useState<TeamMemberInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/team/members');
      const data = await response.json();

      if (data.success && data.data) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error('Error al cargar miembros:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LeaderNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mi Equipo
          </h1>
          <p className="text-gray-600 mt-1">
            {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
          </p>
        </div>

        {members.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="mt-4 text-gray-600">No hay miembros en el equipo.</p>
              <p className="text-sm text-gray-500 mt-1">
                Carga un archivo Excel para agregar miembros.
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Franco semanal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Break
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {members.map((member, idx) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-700 font-medium">
                              {(member.firstName || member.email)[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {member.firstName} {member.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{member.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.weeklyDayOff ? (
                          <Badge variant="info">{getWeekDayLabel(member.weeklyDayOff)}</Badge>
                        ) : (
                          <span className="text-sm text-gray-400">No asignado</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{member.scheduleTime || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.breakTime ? (
                          <div>
                            <span className="text-sm text-gray-900">{member.breakTime}</span>
                            {member.breakDay && (
                              <Badge variant="default" className="ml-2">
                                {getWeekDayLabel(member.breakDay)}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No asignado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
