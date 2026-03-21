'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import AgentNavigation from '@/components/agent/AgentNavigation';
import { RequestType } from '@/types';

export const dynamic = 'force-dynamic';

export default function AgentNewRequestPage() {
  const router = useRouter();
  const [targetDate, setTargetDate] = useState('');
  const [currentSchedule, setCurrentSchedule] = useState('');
  const [requestedSchedule, setRequestedSchedule] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!targetDate || !requestedSchedule) {
      setError('Por favor completa los campos requeridos');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'SCHEDULE_CHANGE' satisfies RequestType,
          targetDate,
          currentSchedule: currentSchedule || undefined,
          requestedSchedule,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al crear la solicitud');
      }

      router.push('/agent/requests');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50">
      <AgentNavigation />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Nueva Solicitud
          </h1>
          <p className="text-slate-600 mt-1">
            Solicita un cambio individual de horario
          </p>
        </div>

        <Card>
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="rounded-2xl border border-primary-200 bg-primary-50 p-5">
                <p className="text-sm font-semibold text-primary-900">
                  Tipo de solicitud habilitado
                </p>
                <p className="mt-1 text-sm text-primary-800">
                  Por ahora el flujo disponible desde la app es el cambio individual de horario.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

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

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 h-12 text-base font-medium"
                >
                  {submitting ? 'Procesando...' : 'Enviar Solicitud'}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push('/agent/dashboard')}
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

        <Card className="mt-6 bg-slate-50 border-slate-200">
          <CardBody className="p-6">
            <p className="font-semibold text-slate-900">Información importante</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-600">
              <li>Las solicitudes requieren aprobación de tu líder.</li>
              <li>Recibirás una notificación cuando la solicitud sea resuelta.</li>
              <li>Usa un horario claro en formato `HH:MM-HH:MM` para evitar rechazos por datos incompletos.</li>
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
