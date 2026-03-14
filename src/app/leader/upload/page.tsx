'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LeaderNavigation from '@/components/leader/LeaderNavigation';

type ExcelFormat = 'standard' | 'telefonico';

export default function LeaderUploadPage() {
  const [format, setFormat] = useState<ExcelFormat>('telefonico');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message?: string;
    errors?: Array<{ row: number; field: string; message: string }> | Array<{ dni: string; error: string }>;
    data?: any;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const endpoint = format === 'telefonico'
        ? '/api/excel/upload-telefonico'
        : '/api/excel/upload';

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      setResult(data);

      if (data.success) {
        setFile(null);
        if (e.target instanceof HTMLFormElement) {
          e.target.reset();
        }
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Error al subir el archivo',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    const response = await fetch('/api/excel/template');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_horarios.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const isTelefonicoFormat = format === 'telefonico';

  return (
    <div className="min-h-screen bg-slate-50">
      <LeaderNavigation />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Carga de Horarios
          </h1>
          <p className="text-slate-600 mt-1">
            Importa los horarios de tu equipo desde un archivo Excel
          </p>
        </div>

        {/* Format Tabs */}
        <div className="mb-6 bg-white rounded-xl p-1.5 border border-slate-200 inline-flex">
          <button
            type="button"
            onClick={() => setFormat('telefonico')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              format === 'telefonico'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="mr-2">📊</span>
            Formato TELEFONICO
          </button>
          <button
            type="button"
            onClick={() => setFormat('standard')}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              format === 'standard'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="mr-2">📋</span>
            Formato Estándar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-slate-900">Cargar Archivo</h2>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleUpload} className="space-y-6">
                  {/* File Drop Zone */}
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 text-center hover:border-primary-400 hover:bg-slate-50 transition-all duration-200 cursor-pointer group">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="block cursor-pointer">
                      <div className="w-16 h-16 rounded-xl bg-slate-100 group-hover:bg-primary-100 flex items-center justify-center mx-auto mb-4 transition-colors">
                        <svg className="w-8 h-8 text-slate-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-slate-700 group-hover:text-primary-700 transition-colors">
                        Haz clic para seleccionar un archivo
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Formatos aceptados: .xlsx, .xls
                      </p>
                    </label>
                  </div>

                  {/* Selected File */}
                  {file && (
                    <div className="flex items-center justify-between p-4 bg-primary-50 border border-primary-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
                          <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                          <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586 4.707 4.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={!file || uploading}
                      className="flex-1 h-12 text-base font-medium"
                    >
                      {uploading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4 8l-4-4m0 0L6 8m4-4v12" />
                          </svg>
                          Subir Archivo
                        </>
                      )}
                    </Button>
                    {!isTelefonicoFormat && (
                      <Button
                        type="button"
                        onClick={downloadTemplate}
                        variant="secondary"
                        disabled={uploading}
                        className="h-12 text-base"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m0 0l4 4" />
                        </svg>
                        Descargar Plantilla
                      </Button>
                    )}
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-900">
                {isTelefonicoFormat ? 'Instrucciones TELEFONICO' : 'Instrucciones Estándar'}
              </h2>
            </CardHeader>
            <CardBody>
              {isTelefonicoFormat ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">1</span>
                      Estructura del archivo
                    </h3>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600 pl-8">
                      <li>• El archivo debe tener una hoja llamada <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">TELEFONICO</span></li>
                      <li>• 2 filas de encabezados (DATOS REPS, FRANCO, HORARIOS)</li>
                      <li>• Nombres de columnas: DNI, Nombre, Equipo, Segmento</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">2</span>
                      Días de franco
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600 pl-8">
                      <li>• Se detectan las celdas con <span className="font-semibold text-slate-800">"Franco"</span> o <span className="font-semibold text-slate-800">"F"</span></li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">3</span>
                      Horarios
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600 pl-8">
                      <li>• Formato decimal de horas (ej: 0.333 = 08:00)</li>
                      <li>• Se convierten automáticamente a HH:MM</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">1</span>
                      Columnas requeridas
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600 pl-8">
                      <li>• nombre</li>
                      <li>• apellido</li>
                      <li>• email</li>
                      <li>• equipo</li>
                      <li>• dia_franco</li>
                      <li>• horario_break</li>
                      <li>• fecha_vigencia_desde</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-xs flex items-center justify-center">2</span>
                      Formatos
                    </h3>
                    <ul className="mt-2 space-y-1 text-sm text-slate-600 pl-8">
                      <li>• Día de franco: lunes, martes, etc.</li>
                      <li>• Horarios: HH:MM-HH:MM (ej: 09:00-18:00)</li>
                      <li>• Fechas: YYYY-MM-DD</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Result */}
        {result && (
          <Card className="mt-6 animate-fade-in">
            <CardBody>
              {result.success ? (
                <div className="text-emerald-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{result.message}</p>
                    </div>
                  </div>
                  {result.data && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <p className="text-3xl font-bold text-emerald-700">{result.data.processed || 0}</p>
                        <p className="text-sm text-emerald-600 mt-1">Procesados</p>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <p className="text-3xl font-bold text-emerald-700">{result.data.created || 0}</p>
                        <p className="text-sm text-emerald-600 mt-1">Creados</p>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <p className="text-3xl font-bold text-emerald-700">{result.data.updated || 0}</p>
                        <p className="text-sm text-emerald-600 mt-1">Actualizados</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-700 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{result.message}</p>
                    </div>
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="max-h-60 overflow-y-auto p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="font-medium mb-3 text-red-800">Errores encontrados ({result.errors.length}):</p>
                      <ul className="space-y-2 text-sm">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="text-red-700">
                            {isTelefonicoFormat
                              ? `DNI ${error.dni}: ${error.error}`
                              : `Fila ${error.row}, ${error.field}: ${error.message}`
                            }
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
