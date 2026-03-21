'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import LeaderNavigation from '@/components/leader/LeaderNavigation';
import { RequestWithRelations, RequestStatus } from '@/types';
import { getRequestStatusLabel, getRequestTypeLabel, getBadgeVariantForStatus, formatDateTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function LeaderRequestsPage() {
  const [requests, setRequests] = useState<RequestWithRelations[]>([]);
  const [filter, setFilter] = useState<RequestStatus | 'ALL'>('PENDING');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithRelations | null>(null);
  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);

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

  const handleApprove = async () => {
    if (!selectedRequest || processing) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequests();
        setSelectedRequest(null);
        setComment('');
      } else {
        alert(data.error || 'Error al aprobar la solicitud');
      }
    } catch (error) {
      console.error('Error al aprobar:', error);
      alert('Error al aprobar la solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || processing) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchRequests();
        setSelectedRequest(null);
        setComment('');
      } else {
        alert(data.error || 'Error al rechazar la solicitud');
      }
    } catch (error) {
      console.error('Error al rechazar:', error);
      alert('Error al rechazar la solicitud');
    } finally {
      setProcessing(false);
    }
  };

  const closeDetail = () => {
    setSelectedRequest(null);
    setComment('');
  };

  const getStatusCount = (status: RequestStatus | 'ALL') => {
    if (status === 'ALL') return requests.length;
    return requests.filter(r => r.status === status).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LeaderNavigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Solicitudes
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona las solicitudes de tu equipo
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
                  onClick={() => {
                    if (request.status === 'PENDING') {
                      setSelectedRequest(request);
                      setComment('');
                    }
                  }}
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
                          {request.requester.firstName} {request.requester.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {getRequestTypeLabel(request.type)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Fecha: {formatDateTime(request.targetDate)}
                        </p>
                        {request.involvedAgent && (
                          <p className="text-sm text-gray-500">
                            Con: {request.involvedAgent.firstName} {request.involvedAgent.lastName}
                          </p>
                        )}
                      </div>
                      {request.status === 'PENDING' && (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
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
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold">Detalle de solicitud</h2>
                      <button
                        onClick={closeDetail}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Solicitante</p>
                      <p className="text-gray-900">
                        {selectedRequest.requester.firstName} {selectedRequest.requester.lastName}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-gray-900">{selectedRequest.requester.email}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Tipo</p>
                      <p className="text-gray-900">{getRequestTypeLabel(selectedRequest.type)}</p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-500">Fecha solicitada</p>
                      <p className="text-gray-900">{formatDateTime(selectedRequest.targetDate)}</p>
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

                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-2">Comentario para el agente</p>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Agrega un comentario (opcional)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  </CardBody>
                  <div className="p-4 bg-gray-50 rounded-b-xl flex gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={processing}
                      variant="success"
                      className="flex-1"
                    >
                      {processing ? 'Procesando...' : 'Aprobar'}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={processing}
                      variant="danger"
                      className="flex-1"
                    >
                      {processing ? 'Procesando...' : 'Rechazar'}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card>
                  <CardBody className="py-12 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-gray-600">
                      Selecciona una solicitud pendiente para ver el detalle
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
