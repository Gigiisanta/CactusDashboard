'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { useSession, signIn } from 'next-auth/react';

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { data: session, status } = useSession();

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  const DEBUG_PAGE = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEBUG_PAGE === 'true';

  const log = useCallback((message: string, type: 'info' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    if (DEBUG_PAGE) {
      if (type === 'error') logger.error(logMessage);
      else if (type === 'warning') logger.warn(logMessage);
      else logger.info(logMessage);
    }
  }, [DEBUG_PAGE]);

  const addTestResult = useCallback((name: string, success: boolean, message: string, data?: any) => {
    setTestResults(prev => [...prev, { name, success, message, data }]);
  }, []);

  const testBackend = useCallback(async () => {
    log('Probando conectividad del backend...');
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      
      if (response.ok) {
        const data = await response.json();
        addTestResult('Backend Connectivity', true, 'Backend responde correctamente', data);
        log('Backend test: EXITOSO');
      } else {
        log(`Error del backend: ${response.status}`, 'error');
        addTestResult('Backend Connectivity', false, `HTTP ${response.status} error`);
      }
    } catch (error: any) {
      log(`Error de conexión al backend: ${error.message}`, 'error');
      addTestResult('Backend Connectivity', false, `Error de red: ${error.message}`);
    }
  }, [BACKEND_URL, log, addTestResult]);

  const testNextAuth = useCallback(() => {
    log('Verificando configuración de NextAuth...');
    
    // Verificar variables de entorno de NextAuth
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'NO_CONFIGURADO';
    const googleClientId = process.env.GOOGLE_CLIENT_ID || 'NO_CONFIGURADO';
    
    addTestResult('NextAuth URL', nextAuthUrl !== 'NO_CONFIGURADO', 
      nextAuthUrl !== 'NO_CONFIGURADO' ? 'NEXTAUTH_URL configurado' : 'NEXTAUTH_URL no configurado');
    
    addTestResult('Google Client ID', googleClientId !== 'NO_CONFIGURADO', 
      googleClientId !== 'NO_CONFIGURADO' ? 'GOOGLE_CLIENT_ID configurado' : 'GOOGLE_CLIENT_ID no configurado');
    
    // Verificar estado de la sesión
    addTestResult('Session Status', status !== 'loading', `Estado de sesión: ${status}`);
    
    if (session) {
      addTestResult('User Session', true, `Usuario autenticado: ${session.user?.email}`, session);
    } else {
      addTestResult('User Session', false, 'No hay sesión activa');
    }
    
    log(`NextAuth test: ${status === 'authenticated' ? 'EXITOSO' : 'PENDIENTE'}`);
  }, [session, status, log, addTestResult]);

  const testGoogleSignIn = async () => {
    log('Probando inicio de sesión con Google...');
    try {
      await signIn('google', { callbackUrl: '/debug' });
    } catch (error: any) {
      log(`Error en Google Sign-In: ${error.message}`, 'error');
      addTestResult('Google Sign-In', false, `Error: ${error.message}`);
    }
  };

  const testEnvironmentVars = useCallback(() => {
    log('Verificando variables de entorno...');
    
    const envVars = {
          NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'NO_CONFIGURADO',
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NO_CONFIGURADO',
      NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'NO_CONFIGURADO',
      NODE_ENV: process.env.NODE_ENV || 'NO_CONFIGURADO'
    };
    
    const allConfigured = Object.values(envVars).every(v => v !== 'NO_CONFIGURADO');
    
    addTestResult('Environment Variables', allConfigured, 
      allConfigured ? 'Todas las variables configuradas' : 'Algunas variables faltan', envVars);
    log(`Variables de entorno: ${allConfigured ? 'CONFIGURADAS' : 'INCOMPLETAS'}`);
  }, [log, addTestResult]);



  const runAllTests = useCallback(async () => {
    setLogs([]);
    setTestResults([]);
    log('Ejecutando todas las pruebas...');
    
    await testBackend();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testNextAuth();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testEnvironmentVars();
  }, [log, testBackend, testNextAuth, testEnvironmentVars]);

  useEffect(() => {
    log('Página de debug cargada');
    runAllTests();
  }, [status, runAllTests, log]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Debug NextAuth - Cactus Wealth</h1>
          <p className="text-gray-600 mb-6">Esta página te ayudará a diagnosticar la configuración de NextAuth y Google OAuth.</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">🔧 Pruebas Manuales</h3>
              <div className="space-y-2">
                <button 
                  onClick={testBackend}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Probar Backend
                </button>
                <button 
                  onClick={testNextAuth}
                  className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  Verificar NextAuth
                </button>
                <button 
                  onClick={testEnvironmentVars}
                  className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                >
                  Verificar Variables
                </button>
                {status !== 'authenticated' && (
                  <button 
                    onClick={testGoogleSignIn}
                    className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Probar Google Sign-In
                  </button>
                )}
                <button 
                  onClick={runAllTests}
                  className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Ejecutar Todas las Pruebas
                </button>
              </div>
              
              {/* Session Info */}
              <div className="mt-6">
                <h4 className="font-semibold mb-2">📋 Información de Sesión</h4>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p><strong>Estado:</strong> {status}</p>
                  {session && (
                    <>
                      <p><strong>Email:</strong> {session.user?.email}</p>
                      <p><strong>Nombre:</strong> {session.user?.name}</p>
                      <p><strong>Imagen:</strong> {session.user?.image ? 'Disponible' : 'No disponible'}</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">📊 Resultados de Pruebas</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    result.success ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'
                  }`}>
                    <div className="flex items-center">
                      <span className={`mr-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅' : '❌'}
                      </span>
                      <span className="font-medium">{result.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Ver datos</summary>
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📝 Logs de Depuración</h3>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}