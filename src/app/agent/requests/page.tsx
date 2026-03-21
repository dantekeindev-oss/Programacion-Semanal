'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AgentNavigation from '@/components/agent/AgentNavigation';
import { RequestWithRelations, RequestStatus } from '@/types';
import { getRequestStatusLabel, getRequestTypeLabel, getBadgeVariantForStatus, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function AgentRequestsPage() {
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [filter, setFilter] = useState<RequestStatus | 'ALL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithRelations | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'ALL'
        ? '/api/requests'
        : `/api/requests?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.data) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusCount = (status: RequestStatus | 'ALL') => {
    if (status === 'ALL') return requests.length;
    return requests.filter(r => r.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AgentNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mis Solicitudes
          </h1>
          <p className="text-gray-600 mt-1">
            Historial de solicitudes de cambio
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            variant={filter === 'ALL' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('ALL')}
          >
            Todas ({getStatusCount('ALL')})
          </Button>
          <Button
            variant={filter === 'PENDING' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('PENDING')}
          >
            Pendientes ({getStatusCount('PENDING')})
          </Button>
          <Button
            variant={filter === 'APPROVED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('APPROVED')}
          >
            Aprobadas ({getStatusCount('APPROVED')})
          </Button>
          <Button
            variant={filter === 'REJECTED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter('REJECTED')}
          >
            Rechazadas ({getStatusCount('REJECTED')})
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardBody className="py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-600">
                No hay solicitudes {filter === 'ALL' ? '' : getRequestStatusLabel(filter).toLowerCase()}.
              </p>
              <Button
                onClick={() => window.location.href = '/agent/new-request'}
                className="mt-4"
              >
                Crear nueva solicitud
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Requests List */}
            <div className="lg:col-span-2 space-y-4">
              {requests.map((request) => (
                <Card
                  key={request.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRequest?.id === request.id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <CardBody className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={getBadgeVariantForStatus(request.status)}>
                            {getRequestStatusLabel(request.status)}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDateTime(request.createdAt)}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">
                          {getRequestTypeLabel(request.type)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Fecha: {formatDateTime(request.targetDate)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.requestedSchedule}
                        </p>
                        {request.involvedAgent && (
                          <p className="text-sm text-gray-500 mt-1">
                            Con: {request.involvedAgent.firstName} {request.involvedAgent.lastName}
                          </p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Request Detail */}
            <div className="lg:col-span-1">
              {selectedRequest ? (
                <Card className="sticky top-20">
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Detalle de solicitud</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Estado</p>
                      <Badge variant={getBadgeVariantForStatus(selectedRequest.status)}>
                        {getRequestStatusLabel(selectedRequest.status)}
                      </Badge>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo</p>
                      <p className="text-gray-900">{getRequestTypeLabel(selectedRequest.type)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha solicitada</p>
                      <p className="text-gray-900">{formatDateTime(selectedRequest.targetDate)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
                      <p className="text-gray-900">{formatDateTime(selectedRequest.createdAt)}</p>
                    </div>

                    {selectedRequest.currentSchedule && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Horario actual</p>
                        <p className="text-gray-900">{selectedRequest.currentSchedule}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-medium text-gray-500">Horario solicitado</p>
                      <p className="text-gray-900">{selectedRequest.requestedSchedule}</p>
                    </div>

                    {selectedRequest.reason && (
                      <div>
                        <p className="text-sm font-medium text-gray-500">Motivo</p>
                        <p className="text-gray-900">{selectedRequest.reason}</p>
                      </div>
                    )}

                    {selectedRequest.status !== 'PENDING' && (
                      <>
                        {selectedRequest.resolvedAt && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Fecha de resolución</p>
                            <p className="text-gray-900">{formatDateTime(selectedRequest.resolvedAt)}</p>
                          </div>
                        )}

                        {selectedRequest.comment && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Comentario del líder</p>
                            <p className="text-gray-900">{selectedRequest.comment}</p>
                          </div>
                        )}
                      </>
                    )}

                    {selectedRequest.status === 'PENDING' && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-500 mb-3">
                          Esta solicitud está pendiente de aprobación por tu líder.
                        </p>
                        <Button
                          onClick={() => window.location.href = '/agent/new-request'}
                          variant="secondary"
                          className="w-full"
                        >
                          Crear otra solicitud
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ) : (
                <Card>
                  <CardBody className="py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-gray-600">
                      Selecciona una solicitud para ver el detalle
                    </p>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
