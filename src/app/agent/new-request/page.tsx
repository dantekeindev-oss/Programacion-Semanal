'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AgentNavigation from '@/components/agent/AgentNavigation';
import { RequestType } from '@/types';
import { getRequestTypeLabel } from '@/lib/utils';

export default function AgentNewRequestPage() {
  const { data: session } = useSession();
  const [requestType, setRequestType] = useState<RequestType>('SCHEDULE_CHANGE');
  const [targetDate, setTargetDate] = useState('');
  const [currentSchedule, setCurrentSchedule] = useState('');
  const [requestedSchedule, setRequestedSchedule] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetDate || !requestedSchedule) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: requestType,
          targetDate,
          currentSchedule: currentSchedule || undefined,
          requestedSchedule,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = '/agent/requests';
      } else {
        alert(data.error || 'Error al crear la solicitud');
      }
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      alert('Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const requestTypes = [
    {
      value: 'SCHEDULE_CHANGE',
      label: 'Cambio individual de horario',
      description: 'Solicita cambiar tu horario en una fecha específica',
      icon: '🕐',
    },
    {
      value: 'SCHEDULE_SWAP',
      label: 'Cambio de horario con otro agente',
      description: 'Permuta tu horario con un compañero',
      icon: '🔄',
    },
    {
      value: 'DAY_OFF_SWAP',
      label: 'Cambio de franco con otro agente',
      description: 'Permuta tu día de franco con un compañero',
      icon: '📅',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AgentNavigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Nueva Solicitud
          </h1>
          <p className="text-slate-600 mt-1">
            Solicita un cambio de horario o franco
          </p>
        </div>

        <Card>
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Request Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-4">
                  Tipo de Solicitud
                </label>
                <div className="grid grid-cols-1 gap-4">
                  {requestTypes.map((type, idx) => (
                    <label
                      key={type.value}
                      className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        requestType === type.value
                          ? 'border-primary-500 bg-primary-50 shadow-md'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="requestType"
                        value={type.value}
                        checked={requestType === type.value}
                        onChange={(e) => setRequestType(e.target.value as RequestType)}
                        className="sr-only"
                      />
                      <div className="flex items-start gap-4">
                        <div className="text-3xl">{type.icon}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{type.label}</p>
                          <p className="text-sm text-slate-600 mt-1">{type.description}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Target Date */}
              <div>
                <label htmlFor="targetDate" className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha del Cambio <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  id="targetDate"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={minDate}
                  required
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
                <p className="text-xs text-slate-500 mt-2">
                  La fecha debe ser a partir de mañana
                </p>
              </div>

              {/* Current Schedule */}
              <div>
                <label htmlFor="currentSchedule" className="block text-sm font-semibold text-slate-700 mb-2">
                  Horario Actual
                </label>
                <input
                  type="text"
                  id="currentSchedule"
                  value={currentSchedule}
                  onChange={(e) => setCurrentSchedule(e.target.value)}
                  placeholder="Ej: 09:00-18:00"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Requested Schedule */}
              <div>
                <label htmlFor="requestedSchedule" className="block text-sm font-semibold text-slate-700 mb-2">
                  Horario Solicitado <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  id="requestedSchedule"
                  value={requestedSchedule}
                  onChange={(e) => setRequestedSchedule(e.target.value)}
                  placeholder="Ej: 14:00-23:00"
                  required
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 mb-2">
                  Motivo (opcional)
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe el motivo de tu solicitud..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 text-base font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4m8 0v-4m0 4l-4 4m0 0l-4 4" />
                      </svg>
                      Enviar Solicitud
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => window.location.href = '/agent/dashboard'}
                  variant="secondary"
                  disabled={submitting}
                  className="flex-1 h-12 text-base font-medium"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Help Text */}
        <Card className="mt-6 bg-slate-50 border-slate-200">
          <CardBody className="p-6">
            <div className="flex items-start gap-4">
              <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a2 2 0 11-4 0 2 2 0 014 0zm5 7a2 2 0 11-4 0 2 2 0 014 0zM9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0l-6-2-2 4m0 0l-2 4" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Información Importante</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">•</span>
                    <span>Las solicitudes requieren aprobación de tu líder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">•</span>
                    <span>Las solicitudes de cambio con otro agente requieren que ambas partes acepten</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 mt-0.5">•</span>
                    <span>Recibirás una notificación cuando la solicitud sea resuelta</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
