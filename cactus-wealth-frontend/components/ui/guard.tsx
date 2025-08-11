'use client';

import React from 'react';

interface NoticeCardProps {
  title: string;
  message: string;
  cta?: { href: string; label: string };
}

export function NoticeCard({ title, message, cta }: NoticeCardProps) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md rounded-lg border bg-white p-6 text-center shadow-sm'>
        <h2 className='mb-2 text-xl font-semibold text-gray-900'>{title}</h2>
        <p className='mb-4 text-gray-600'>{message}</p>
        {cta && (
          <a
            href={cta.href}
            className='inline-flex items-center justify-center rounded-md bg-cactus-600 px-4 py-2 text-white hover:bg-cactus-700'
          >
            {cta.label}
          </a>
        )}
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='h-12 w-12 animate-spin rounded-full border-b-2 border-cactus-600' />
    </div>
  );
}

export function AccessDenied() {
  return (
    <NoticeCard
      title='Acceso denegado'
      message='Esta sección es solo para administradores.'
      cta={{ href: '/dashboard', label: 'Volver al Dashboard' }}
    />
  );
}

export function AuthRequired() {
  return (
    <NoticeCard
      title='Sesión requerida'
      message='Debes iniciar sesión para acceder a esta sección.'
      cta={{ href: '/auth/login', label: 'Ir a Iniciar sesión' }}
    />
  );
}


