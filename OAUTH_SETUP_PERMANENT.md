# 🔐 CONFIGURACIÓN OAUTH PERMANENTE - CACTUS DASHBOARD

## 🎯 OBJETIVO
Configurar OAuth de Google de manera permanente para evitar que se eliminen las credenciales.

## 📋 PASOS PARA CONFIGURACIÓN PERMANENTE

### 1. CREAR PROYECTO DE PRODUCCIÓN DEDICADO

**IMPORTANTE:** No uses el proyecto por defecto de Google Cloud.

1. Ve a: https://console.cloud.google.com/
2. Crea nuevo proyecto:
   - **Nombre:** `Cactus Wealth Production`
   - **ID:** `cactus-wealth-prod-2024`
   - **Organización:** Tu organización (si tienes)

### 2. CONFIGURAR APIS NECESARIAS

En el nuevo proyecto, habilita:
- Google+ API
- Google Identity API
- Google OAuth2 API

### 3. CREAR CREDENCIALES DE PRODUCCIÓN

#### OAuth 2.0 Client ID (Web Application)
- **Nombre:** `Cactus Dashboard Production`
- **Application type:** Web application

#### Authorized JavaScript origins:
```
http://localhost:3000
http://localhost:3001
http://127.0.0.1:3000
http://127.0.0.1:3001
https://tu-dominio-produccion.com
```

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
http://127.0.0.1:3000/api/auth/callback/google
http://127.0.0.1:3001/api/auth/callback/google
https://tu-dominio-produccion.com/api/auth/callback/google
```

### 4. CONFIGURAR SEGURIDAD ADICIONAL

#### Configurar OAuth consent screen:
- **User Type:** External
- **App name:** Cactus Wealth Dashboard
- **User support email:** tu-email@dominio.com
- **Developer contact information:** tu-email@dominio.com

#### Agregar dominios autorizados:
- `localhost`
- `127.0.0.1`
- `tu-dominio-produccion.com`

### 5. CONFIGURAR VARIABLES DE ENTORNO PERMANENTES

Una vez creadas las credenciales, actualizar:

```bash
# Actualizar credenciales
task oauth:update CLIENT_ID=tu_client_id_produccion CLIENT_SECRET=tu_client_secret_produccion

# Verificar configuración
task oauth:verify
```

### 6. BACKUP Y DOCUMENTACIÓN

#### Guardar credenciales de forma segura:
- **Password Manager:** 1Password, LastPass, Bitwarden
- **Archivo seguro:** Encriptado con GPG
- **Google Cloud Secret Manager:** Para producción

#### Documentar configuración:
- Proyecto de Google Cloud usado
- APIs habilitadas
- Dominios autorizados
- Fecha de creación

## 🛡️ MEDIDAS DE SEGURIDAD PERMANENTES

### 1. PROTEGER PROYECTO DE GOOGLE CLOUD
- **IAM:** Configurar permisos mínimos necesarios
- **Audit Logs:** Habilitar logs de auditoría
- **Alerts:** Configurar alertas para cambios en credenciales

### 2. MONITOREO AUTOMÁTICO
- **Health Checks:** Verificar OAuth diariamente
- **Backup:** Backup automático de configuración
- **Rollback:** Plan de rollback si algo falla

### 3. DOCUMENTACIÓN DE EMERGENCIA
- **Contacto de soporte:** Google Cloud Support
- **Proceso de recuperación:** Pasos para recrear credenciales
- **Comunicación:** Plan de comunicación con usuarios

## 🔄 MANTENIMIENTO PERIÓDICO

### Mensual:
- Verificar estado de APIs
- Revisar logs de auditoría
- Actualizar documentación

### Trimestral:
- Revisar permisos IAM
- Verificar dominios autorizados
- Actualizar plan de emergencia

### Anual:
- Revisar configuración completa
- Actualizar credenciales si es necesario
- Revisar mejores prácticas de seguridad

## 🚨 PLAN DE EMERGENCIA

### Si las credenciales se eliminan:
1. **Inmediato:** Usar credenciales de backup
2. **24h:** Recrear credenciales siguiendo este documento
3. **48h:** Actualizar configuración en producción
4. **72h:** Verificar funcionamiento completo

### Contactos de emergencia:
- **Google Cloud Support:** https://cloud.google.com/support
- **Documentación:** Este archivo
- **Backup:** Credenciales guardadas en password manager

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Proyecto de Google Cloud dedicado creado
- [ ] APIs necesarias habilitadas
- [ ] OAuth 2.0 Client ID creado
- [ ] Dominios autorizados configurados
- [ ] Credenciales actualizadas en .env
- [ ] Verificación exitosa con task oauth:verify
- [ ] Backup de credenciales realizado
- [ ] Documentación actualizada
- [ ] Plan de emergencia establecido 