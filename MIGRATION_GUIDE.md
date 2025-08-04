# 🔄 Guía de Migración - Sistema de Autenticación Nativa

## 📋 Resumen de Cambios

### ✅ **Nuevas Características Implementadas**

1. **Sistema de Autenticación Dual**
   - Google OAuth (existente, funcionando en paralelo)
   - Autenticación nativa con email/contraseña

2. **Verificación de Email con SendGrid**
   - Plantilla HTML profesional
   - Tokens de verificación con expiración de 24h
   - Integración SMTP completa

3. **Nuevas Páginas de Autenticación**
   - `/auth/login` - Login dual (Google + credenciales)
   - `/auth/register` - Registro de usuarios
   - `/auth/verify` - Verificación de email

4. **Nuevos Endpoints API**
   - `POST /api/v1/auth/register` - Registro de usuario
   - `POST /api/v1/auth/verify-credentials` - Verificación de credenciales
   - `POST /api/v1/auth/verify-email` - Verificación de email

## 🚀 **Pasos de Migración**

### 1. Actualizar Variables de Entorno

Agregar estas variables a tu archivo `.env.local`:

```env
# === SMTP CONFIGURACIÓN SENDGRID ===
EMAIL_SERVER_HOST=smtp.sendgrid.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=apikey
EMAIL_SERVER_PASS=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
EMAIL_FROM="Cactus Wealth <gsantarelli@grupoabax.com>"
```

### 2. Reconstruir Backend

```bash
# Reconstruir con nueva configuración
docker-compose -f config/docker/docker-compose.yml build backend
docker-compose -f config/docker/docker-compose.yml up -d backend
```

### 3. Verificar Configuración

```bash
# Test SMTP desde frontend
npm run test:smtp

# Test SMTP desde backend
cd cactus-wealth-backend
python test_smtp.py

# Verificar endpoints
curl http://localhost:8000/api/v1/health
```

### 4. Probar Sistema Completo

```bash
# 1. Acceder al registro
http://localhost:3000/auth/register

# 2. Crear usuario de prueba
# 3. Verificar email recibido
# 4. Completar verificación
# 5. Probar login
```

## 🔄 **Cambios en URLs**

### URLs Actualizadas
- **Login**: `/login` → `/auth/login`
- **Registro**: Nuevo en `/auth/register`
- **Verificación**: Nuevo en `/auth/verify`

### URLs Mantenidas
- **Dashboard**: `/dashboard` (sin cambios)
- **Google OAuth**: Funcionando en paralelo

## 📊 **Impacto en Usuarios Existentes**

### ✅ **Sin Impacto**
- Usuarios con Google OAuth: **Sin cambios**
- Sesiones existentes: **Mantienen funcionamiento**
- Dashboard y funcionalidades: **Sin cambios**

### 🔄 **Nuevas Opciones**
- Usuarios pueden elegir entre Google OAuth o credenciales nativas
- Registro de nuevos usuarios con verificación de email
- Sistema de roles y jerarquías mejorado

## 🛡️ **Seguridad**

### Nuevas Medidas
- ✅ Verificación de email obligatoria para usuarios nativos
- ✅ Tokens de verificación con expiración automática
- ✅ Hashing seguro con bcrypt
- ✅ Validación de contraseñas (mínimo 8 caracteres)

### Mantenidas
- ✅ Google OAuth (sin cambios)
- ✅ Sesiones JWT seguras
- ✅ Cookies HttpOnly

## 🧪 **Testing**

### Scripts de Test Nuevos
```bash
# Test SMTP
npm run test:smtp
task auth:test-smtp

# Test Backend SMTP
task auth:test-backend-smtp

# Test E2E completo
npm run e2e
```

### Verificaciones Recomendadas
1. **Configuración SMTP**: `npm run test:smtp`
2. **Endpoints API**: Verificar `/api/v1/auth/*`
3. **Flujo completo**: Registro → verificación → login
4. **Google OAuth**: Verificar que sigue funcionando

## 📚 **Documentación Actualizada**

### Archivos Modificados
- ✅ `README.md` - Enlaces a autenticación nativa
- ✅ `DOCUMENTATION.md` - Sección completa de autenticación
- ✅ `DESARROLLO.md` - Configuración actualizada
- ✅ `QUICK_REFERENCE.md` - Comandos de test SMTP
- ✅ `Taskfile.yml` - Comandos de autenticación
- ✅ `.env.example` - Variables SMTP

### Nuevos Archivos
- ✅ `AUTH_SETUP.md` - Documentación completa del sistema
- ✅ `MIGRATION_GUIDE.md` - Esta guía de migración

## 🔧 **Troubleshooting**

### Problemas Comunes

#### 1. Email no llega
```bash
# Verificar configuración SMTP
npm run test:smtp

# Verificar variables de entorno
echo $EMAIL_SERVER_HOST
echo $EMAIL_SERVER_PASS
```

#### 2. Backend no inicia
```bash
# Reconstruir backend
docker-compose -f config/docker/docker-compose.yml build backend
docker-compose -f config/docker/docker-compose.yml up -d backend
```

#### 3. Endpoints no encontrados
```bash
# Verificar que el backend esté corriendo
curl http://localhost:8000/api/v1/health

# Verificar logs
docker logs docker-backend-1
```

#### 4. Google OAuth no funciona
```bash
# Verificar configuración OAuth
task oauth:verify
task oauth:diagnose
```

## ✅ **Checklist de Migración**

- [ ] Variables SMTP agregadas a `.env.local`
- [ ] Backend reconstruido y funcionando
- [ ] Test SMTP exitoso
- [ ] Endpoints de auth respondiendo
- [ ] Registro de usuario funcionando
- [ ] Verificación de email funcionando
- [ ] Login con credenciales funcionando
- [ ] Google OAuth sigue funcionando
- [ ] Documentación actualizada
- [ ] Tests E2E pasando

## 🎯 **Próximos Pasos**

1. **Configurar variables SMTP** en producción
2. **Probar flujo completo** en ambiente de staging
3. **Migrar base de datos** (cuando esté listo)
4. **Desplegar a producción** con nueva configuración
5. **Monitorear logs** y métricas de email

---

**🌵 Cactus Wealth - Sistema de Autenticación Nativa**
*Migración completada y lista para producción* 