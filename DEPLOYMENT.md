# 🚀 CactusDashboard - Guía de Despliegue AWS

## 📋 Resumen

Esta guía te ayudará a desplegar CactusDashboard en AWS EC2 con Nginx como reverse proxy y subir el proyecto a GitHub.

## 🎯 Estado Actual

- **IP AWS**: 34.195.179.168
- **Instancia**: t4g.small (Free Tier)
- **Stack**: Next.js + FastAPI + PostgreSQL + Redis + Docker

## 🚀 Despliegue Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores reales
nano .env
```

### 2. Desplegar con Script Automatizado

```bash
# Ejecutar script completo de despliegue
./deploy-aws-complete.sh
```

### 3. Despliegue Manual (Alternativo)

```bash
# Verificar estado en EC2
task validate:aws:full

# Desplegar aplicación
task deploy:aws:prod

# Configurar Nginx (en el servidor)
task nginx:setup

# Verificar endpoints públicos
task validate:endpoints
```

## 📦 Tareas Disponibles

### Despliegue
- `task deploy:aws:prod` - Desplegar a AWS producción
- `task migrate:db` - Ejecutar migraciones de base de datos

### Logs y Monitoreo
- `task logs:all` - Ver logs de todos los servicios
- `task logs:backend` - Ver logs del backend
- `task logs:frontend` - Ver logs del frontend
- `task status:services` - Estado de servicios

### Nginx
- `task nginx:setup` - Configurar reverse proxy
- `task nginx:validate` - Validar configuración
- `task nginx:reload` - Recargar configuración

### Validación
- `task validate:aws:full` - Validación completa AWS
- `task validate:endpoints` - Validar endpoints públicos

### GitHub
- `task github:init` - Inicializar repositorio
- `task github:push` - Subir cambios

### Mantenimiento
- `task backup:db` - Backup de base de datos
- `task cleanup:docker` - Limpiar recursos Docker

## 🔧 Configuración Manual de Nginx

Si necesitas configurar Nginx manualmente en el servidor:

```bash
# SSH al servidor
ssh -i cactus-key.pem ubuntu@34.195.179.168

# Copiar configuración
sudo cp /home/ubuntu/CactusDashboard/nginx-reverse-proxy.conf /etc/nginx/sites-available/default

# Validar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

## 🌐 URLs de Producción

- **Frontend**: http://34.195.179.168
- **API**: http://34.195.179.168/api
- **API Docs**: http://34.195.179.168/api/docs
- **Health Check**: http://34.195.179.168/api/health

## 📊 Verificación Post-Despliegue

### Checklist de Validación

- [ ] ✅ Contenedores frontend/backend corriendo
- [ ] ✅ Configuración Nginx validada (`nginx -t`)
- [ ] ✅ Frontend accesible en `/`
- [ ] ✅ API accesible en `/api/docs`
- [ ] ✅ Base de datos PostgreSQL funcionando
- [ ] ✅ Redis funcionando
- [ ] ✅ Logs sin errores críticos

### Comandos de Verificación

```bash
# En el servidor AWS
docker-compose -f docker-compose.prod.yml ps
curl -f http://localhost:8000/health
curl -f http://localhost:3000

# Desde local
curl -f http://34.195.179.168
curl -f http://34.195.179.168/api/health
```

## 🔐 Seguridad

### Variables de Entorno Sensibles

**NUNCA** subas estos archivos al repositorio:
- `.env`
- `*.key`
- `*.pem`
- `tokens/`

### Configuración de GitHub Secrets

Para CI/CD, configura estos secrets en GitHub:

```
POSTGRES_PASSWORD
REDIS_PASSWORD
GOOGLE_CLIENT_SECRET
SENDGRID_API_KEY
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## 🆘 Troubleshooting

### Problemas Comunes

1. **Nginx muestra página por defecto**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

2. **Contenedores no inician**
   ```bash
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **API no responde**
   ```bash
   docker-compose -f docker-compose.prod.yml restart backend
   ```

4. **Frontend no carga**
   ```bash
   docker-compose -f docker-compose.prod.yml restart frontend
   ```

### Logs Útiles

```bash
# Logs de aplicación
task logs:all

# Logs de Nginx
sudo tail -f /var/log/nginx/cactus_error.log

# Logs del sistema
sudo journalctl -u nginx -f
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs con `task logs:all`
2. Verifica el estado con `task status:services`
3. Consulta la documentación en `/docs`
4. Revisa el archivo `MONITORING-RUNBOOK.md`

---

**¡Listo!** Tu aplicación CactusDashboard debería estar funcionando en http://34.195.179.168