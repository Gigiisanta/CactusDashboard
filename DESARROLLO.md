# 🌵 CactusDashboard - Guía de Desarrollo

## 🚀 Inicio Rápido

### Frontend en localhost:3000

```bash
# Opción 1: Usar el script directo
./scripts/start-frontend.sh

# Opción 2: Usar Taskfile
task dev:frontend

# Opción 3: Limpieza completa + inicio
task dev:frontend:clean
```

### Comandos Disponibles

#### 🎯 Desarrollo Frontend
- `task dev:frontend` - Iniciar solo frontend en localhost:3000
- `task dev:frontend:clean` - Limpieza completa + inicio del frontend
- `./scripts/start-frontend.sh` - Script directo para iniciar frontend

#### 🧹 Limpieza
- `task cleanup` - Limpieza completa (puertos + caché)
- `task cleanup:ports` - Limpiar solo puertos (3000, 3001, 8000, 8080)
- `task cleanup:frontend` - Limpiar solo caché del frontend
- `./scripts/cleanup-ports.sh` - Script directo para limpiar puertos

#### 📊 Monitoreo
- `task status` - Estado general del sistema
- `task health` - Verificar salud de servicios
- `task ports` - Verificar puertos en uso
- `task logs:frontend` - Ver logs del frontend

## 🔧 Configuración de Puertos

El sistema está configurado para **siempre usar localhost:3000** para el frontend:

### Características:
- ✅ **Puerto fijo**: Siempre localhost:3000
- ✅ **Auto-limpieza**: Libera automáticamente el puerto si está ocupado
- ✅ **Verificación**: Valida configuración antes de iniciar
- ✅ **Flexibilidad**: Configuración adaptable via variables de entorno

### Variables de Entorno:
```bash
PORT=3000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000  # Backend configurable
```

## 🔐 Configuración OAuth

### Variables Requeridas (.env.local):
```bash
GOOGLE_CLIENT_ID=tu_client_id_real
GOOGLE_CLIENT_SECRET=tu_client_secret_real
NEXTAUTH_SECRET=tu_secret_aleatorio
NEXTAUTH_URL=http://localhost:3000
```

### Verificación:
```bash
# El script start-frontend.sh verifica automáticamente:
# ✅ Existencia de .env.local
# ✅ Configuración de GOOGLE_CLIENT_ID
# ✅ Configuración de GOOGLE_CLIENT_SECRET  
# ✅ Configuración de NEXTAUTH_SECRET
```

## 🌐 URLs Importantes

- **Frontend**: http://localhost:3000
- **Debug**: http://localhost:3000/debug
- **Login**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **Backend**: http://localhost:8000 (si está corriendo)

## 🛠️ Solución de Problemas

### Puerto 3000 ocupado:
```bash
# Automático (incluido en scripts)
./scripts/cleanup-ports.sh

# Manual
lsof -ti:3000 | xargs kill -9
```

### Error de build:
```bash
# Limpieza completa
task cleanup:frontend
cd cactus-wealth-frontend && npm install
```

### Error de configuración:
```bash
# Verificar variables
cat cactus-wealth-frontend/.env.local

# Usar debug page
open http://localhost:3000/debug
```

## 📁 Estructura de Scripts

```
scripts/
├── cleanup-ports.sh      # Limpia puertos 3000, 3001, 8000, 8080
└── start-frontend.sh     # Inicia frontend con verificaciones
```

## 🎯 Flujo de Trabajo Recomendado

1. **Desarrollo diario**:
   ```bash
   task dev:frontend
   ```

2. **Después de cambios importantes**:
   ```bash
   task dev:frontend:clean
   ```

3. **Solución de problemas**:
   ```bash
   task cleanup
   task dev:frontend
   ```

4. **Verificar estado**:
   ```bash
   task status
   task health
   ```

## ✅ Estado Actual

- ✅ Google OAuth configurado con NextAuth
- ✅ Frontend siempre en localhost:3000
- ✅ Auto-limpieza de puertos
- ✅ Verificación automática de configuración
- ✅ Scripts de desarrollo optimizados
- ✅ Documentación actualizada