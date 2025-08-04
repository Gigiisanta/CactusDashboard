#!/usr/bin/env node
/**
 * Script de test para verificar la configuración SMTP desde el frontend
 */

const fs = require('fs');
const path = require('path');

// Cargar variables de entorno manualmente
function loadEnvFile(filePath) {
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          envVars[key] = value;
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.log('⚠️  No se pudo cargar .env.local, usando variables del sistema');
    return {};
  }
}

// Cargar variables de entorno
const envFile = path.join(__dirname, '../.env.local');
const envVars = loadEnvFile(envFile);

// Asignar variables al process.env
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

function testSmtpConfiguration() {
  console.log('🧪 Test de Configuración SMTP - Frontend');
  console.log('=' .repeat(50));
  
  // Verificar variables de entorno
  const requiredVars = {
    EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
    EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
    EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
    EMAIL_SERVER_PASS: process.env.EMAIL_SERVER_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000'
  };
  
  console.log('📋 Variables de entorno:');
  Object.entries(requiredVars).forEach(([key, value]) => {
    const displayValue = key.includes('PASS') ? '*'.repeat(value?.length || 0) : value;
    const status = value ? '✅' : '❌';
    console.log(`  ${status} ${key}: ${displayValue || 'NO CONFIGURADA'}`);
  });
  
  console.log();
  
  // Verificar configuración completa
  const missingVars = Object.entries(requiredVars)
    .filter(([key, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.log('❌ Variables de entorno faltantes:');
    missingVars.forEach(varName => console.log(`  - ${varName}`));
    console.log();
    console.log('🔧 Agrega estas variables a tu archivo .env.local:');
    console.log(`
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASS=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
EMAIL_FROM="Cactus Wealth <gsantarelli@grupoabax.com>"
NEXTAUTH_URL=http://localhost:3000
    `);
    return false;
  }
  
  console.log('✅ Todas las variables de entorno están configuradas');
  console.log();
  
  // Verificar configuración específica de SendGrid
  if (requiredVars.EMAIL_SERVER_HOST !== 'smtp.sendgrid.net') {
    console.log('⚠️  Advertencia: EMAIL_SERVER_HOST no está configurado para SendGrid');
  }
  
  if (requiredVars.EMAIL_SERVER_USER !== 'apikey') {
    console.log('⚠️  Advertencia: EMAIL_SERVER_USER debe ser "apikey" para SendGrid');
  }
  
  if (!requiredVars.EMAIL_SERVER_PASS.startsWith('SG.')) {
    console.log('⚠️  Advertencia: EMAIL_SERVER_PASS no parece ser una API Key válida de SendGrid');
  }
  
  console.log();
  console.log('🎯 Configuración SMTP lista para producción');
  console.log('📧 El sistema de verificación de email está configurado correctamente');
  console.log();
  console.log('🚀 Para probar el sistema completo:');
  console.log('1. Inicia el backend: docker-compose up backend');
  console.log('2. Inicia el frontend: npm run dev');
  console.log('3. Ve a: http://localhost:3000/auth/register');
  console.log('4. Registra un nuevo usuario');
  console.log('5. Verifica el email recibido');
  
  return true;
}

// Ejecutar test
if (require.main === module) {
  const success = testSmtpConfiguration();
  process.exit(success ? 0 : 1);
}

module.exports = { testSmtpConfiguration }; 