# 🌵 Sistema de Autenticación Nativa - Cactus Wealth

## 📋 Resumen

Sistema de autenticación nativa con NextAuth.js que incluye:
- ✅ **Google OAuth** (funcionando en paralelo)
- ✅ **Autenticación nativa** (email/usuario + contraseña)
- ✅ **Verificación de email** con SendGrid SMTP
- ✅ **Sesiones persistentes** (365 días)
- ✅ **Roles y jerarquías** (Advisor/Manager/Admin)
- ✅ **UI en español** con shadcn/ui

## 🚀 Configuración Rápida

### 1. Variables de Entorno

Agrega estas variables a tu archivo `.env.local`:

```env
# === SMTP CONFIGURACIÓN SENDGRID ===
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASS=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
EMAIL_FROM="Cactus Wealth <gsantarelli@grupoabax.com>"

# === NEXTAUTH CONFIGURACIÓN ===
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cactus-wealth-nextauth-secret-2025-secure-key-for-jwt-signing

# === GOOGLE OAUTH ===
GOOGLE_CLIENT_ID=460480375995-m23bgnheiof27airji1jkoor10k1vrpd.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 2. Test de Configuración

```bash
# Test desde frontend
npm run test:smtp

# Test desde backend
cd cactus-wealth-backend
python test_smtp.py
```

### 3. Iniciar Sistema

```bash
# Backend
docker-compose -f config/docker/docker-compose.yml up -d backend

# Frontend
npm run dev
```

## 📧 Configuración SendGrid

### 1. Single Sender Verification
- ✅ Ya activado para `gsantarelli@grupoabax.com`
- ✅ API Key configurada: `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`

### 2. Configuración SMTP
- **Host**: `smtp.sendgrid.net`
- **Puerto**: `587`
- **Usuario**: `apikey`
- **Contraseña**: API Key de SendGrid
- **From**: `Cactus Wealth <gsantarelli@grupoabax.com>`

## 🔐 Flujo de Autenticación

### Registro de Usuario
1. Usuario accede a `/auth/register`
2. Completa formulario (nombre, email, usuario, contraseña, rol)
3. Sistema crea usuario con `emailVerified=false`
4. Genera token de verificación (24h de validez)
5. Envía email con link de verificación
6. Usuario recibe email con diseño profesional

### Verificación de Email
1. Usuario hace clic en link del email
2. Sistema valida token en base de datos
3. Marca `emailVerified=true`
4. Elimina token usado
5. Redirige a login con mensaje de éxito

### Login
1. Usuario accede a `/auth/login`
2. Puede usar Google OAuth o credenciales nativas
3. Sistema valida `emailVerified=true` para credenciales nativas
4. Si no verificado → error claro en español
5. Sesión persistente por 365 días

## 🎨 Características de UI

### Diseño de Email
- ✅ **Responsive** y profesional
- ✅ **Branding** de Cactus Wealth
- ✅ **Botón de acción** prominente
- ✅ **Fallback** en texto plano
- ✅ **Información de seguridad** (24h expiración)

### Páginas de Autenticación
- ✅ **Login**: Google OAuth + credenciales nativas
- ✅ **Registro**: Formulario completo con validación
- ✅ **Verificación**: Página de confirmación
- ✅ **Mensajes de error** claros en español
- ✅ **Loading states** y feedback visual

## 🔧 Endpoints API

### Backend (FastAPI)
```
POST /api/v1/auth/register
POST /api/v1/auth/verify-credentials
POST /api/v1/auth/verify-email
GET  /api/v1/managers/
```

### Frontend (NextAuth.js)
```
/api/auth/[...nextauth]  # NextAuth handlers
/api/auth/register       # Proxy al backend
/api/auth/verify-email   # Proxy al backend
/api/managers           # Proxy al backend
```

## 🛡️ Seguridad

### Contraseñas
- ✅ **Hashing** con bcrypt
- ✅ **Validación** de fortaleza (mínimo 8 caracteres)
- ✅ **Verificación** segura

### Tokens
- ✅ **UUID** para tokens de verificación
- ✅ **Expiración** automática (24 horas)
- ✅ **Eliminación** después de uso
- ✅ **Validación** en base de datos

### Sesiones
- ✅ **JWT** con NextAuth.js
- ✅ **HttpOnly cookies** seguras
- ✅ **Expiración** configurable (365 días)
- ✅ **Renovación** automática

## 🧪 Testing

### Scripts Disponibles
```bash
# Test SMTP
npm run test:smtp
npm run send-test-email

# Test Backend
cd cactus-wealth-backend
python test_smtp.py

# Test E2E
npm run e2e
```

### Casos de Prueba
- ✅ Registro de usuario nuevo
- ✅ Envío de email de verificación
- ✅ Verificación de email
- ✅ Login con credenciales verificadas
- ✅ Bloqueo de login sin verificación
- ✅ Google OAuth funcionando en paralelo

## 📊 Monitoreo

### Logs del Sistema
```bash
# Backend logs
docker logs docker-backend-1

# Frontend logs
npm run dev
```

### Métricas de Email
- ✅ **Envío exitoso**: Logs en consola
- ✅ **Errores SMTP**: Capturados y reportados
- ✅ **Tokens expirados**: Limpieza automática

## 🚀 Producción

### Checklist de Despliegue
- [ ] Variables de entorno configuradas
- [ ] SendGrid SMTP funcionando
- [ ] Base de datos migrada
- [ ] Tests pasando
- [ ] Google OAuth configurado
- [ ] SSL/TLS habilitado

### Variables de Producción
```env
NEXTAUTH_URL=https://tu-dominio.com
EMAIL_FROM="Cactus Wealth <noreply@tu-dominio.com>"
ENVIRONMENT=production
```

## 🔄 Mantenimiento

### Limpieza de Tokens
Los tokens expirados se eliminan automáticamente al intentar usarlos.

### Monitoreo de Email
- Revisar logs de SendGrid
- Monitorear tasa de entrega
- Verificar configuración SMTP

## 📞 Soporte

### Problemas Comunes
1. **Email no llega**: Verificar configuración SMTP
2. **Token expirado**: Reenviar email de verificación
3. **Login falla**: Verificar `emailVerified=true`
4. **Google OAuth**: Verificar credenciales en Google Console

### Comandos de Diagnóstico
```bash
# Verificar configuración
npm run test:smtp

# Verificar backend
curl http://localhost:8000/api/v1/health

# Verificar frontend
curl http://localhost:3000/api/health
```

---

**🌵 Cactus Wealth - Sistema de Autenticación Nativa**
*Listo para producción con SendGrid SMTP* 