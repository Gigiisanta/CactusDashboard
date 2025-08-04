# 🎯 CACTUS DASHBOARD - QUICK REFERENCE

## 🚀 **COMANDOS ESENCIALES**

### Desarrollo Diario
```bash
task dev              # 🚀 Iniciar desarrollo completo
task dev:stop         # ⏹️ Detener desarrollo
task dev:restart      # 🔄 Reiniciar desarrollo
task logs             # 📺 Ver logs en vivo
task status           # 📊 Estado del sistema
```

### AWS Management
```bash
task aws:start        # ▶️ Iniciar instancia EC2
task aws:stop         # ⏹️ Detener instancia (ahorrar dinero)
task aws:status       # 📊 Estado de la instancia
task aws:ip           # 🌐 Obtener IP pública
task aws:costs        # 💰 Ver información de costos
task deploy:aws       # 🚀 Desplegar a AWS
```

### OAuth y Autenticación
```bash
task oauth:verify     # 🔐 Verificar configuración OAuth
task oauth:diagnose   # 🔍 Diagnóstico completo de OAuth
task oauth:test       # 🧪 Probar configuración OAuth
task oauth:update     # 🔄 Actualizar credenciales OAuth
npm run test:smtp     # 📧 Test configuración SMTP SendGrid
```

### Troubleshooting
```bash
task debug            # 🔍 Diagnóstico completo
task cleanup          # 🧹 Limpiar puertos y cachés
task validate         # ✅ Validar configuración
task docker:diagnose  # 🐳 Diagnóstico de Docker
```

## 📋 **COMANDOS POR CATEGORÍA**

### 🚀 DESARROLLO
| Comando | Descripción |
|---------|-------------|
| `task dev` | Iniciar desarrollo completo |
| `task dev:stop` | Detener desarrollo |
| `task dev:restart` | Reiniciar desarrollo |
| `task dev:rebuild` | Rebuild completo |

### 📺 MONITOREO
| Comando | Descripción |
|---------|-------------|
| `task logs` | Logs en vivo (todos) |
| `task logs:backend` | Solo logs backend |
| `task logs:frontend` | Solo logs frontend |
| `task status` | Estado del sistema |
| `task health` | Verificar salud |

### ☁️ AWS
| Comando | Descripción |
|---------|-------------|
| `task aws:start` | Iniciar instancia EC2 |
| `task aws:stop` | Detener instancia |
| `task aws:status` | Estado de instancia |
| `task aws:ip` | Obtener IP pública |
| `task aws:costs` | Ver costos |
| `task deploy:aws` | Desplegar a AWS |

### 🔐 OAUTH Y AUTENTICACIÓN
| Comando | Descripción |
|---------|-------------|
| `task oauth:verify` | Verificar configuración OAuth |
| `task oauth:diagnose` | Diagnóstico completo OAuth |
| `task oauth:test` | Probar configuración OAuth |
| `task oauth:update` | Actualizar credenciales OAuth |
| `npm run test:smtp` | Test configuración SMTP SendGrid |

### 🔧 UTILIDADES
| Comando | Descripción |
|---------|-------------|
| `task debug` | Diagnóstico completo |
| `task cleanup` | Limpiar puertos/cachés |
| `task validate` | Validar configuración |
| `task docker:check` | Verificar Docker |

## 💡 **FLUJOS COMUNES**

### 🎯 Desarrollo Diario
```bash
# 1. Iniciar desarrollo
task dev

# 2. Monitorear logs
task logs

# 3. Verificar estado
task status

# 4. Detener al finalizar
task dev:stop
```

### ☁️ Gestión AWS
```bash
# 1. Verificar estado
task aws:status

# 2. Iniciar si está detenida
task aws:start

# 3. Desplegar aplicación
task deploy:aws

# 4. Detener para ahorrar
task aws:stop
```

### 🔐 Configuración OAuth
```bash
# 1. Verificar configuración
task oauth:verify

# 2. Diagnóstico completo
task oauth:diagnose

# 3. Actualizar credenciales
task oauth:update CLIENT_ID=xxx CLIENT_SECRET=xxx

# 4. Probar configuración
task oauth:test
```

### 🔧 Troubleshooting
```bash
# 1. Diagnóstico completo
task debug

# 2. Limpiar puertos
task cleanup

# 3. Validar configuración
task validate

# 4. Rebuild si es necesario
task dev:rebuild
```

## 🚨 **COMANDOS DE EMERGENCIA**

### 🆘 Detener Todo
```bash
task dev:stop
task cleanup
```

### 💰 Ahorro de Costos AWS
```bash
task aws:costs
task aws:stop
```

### 🔍 Diagnóstico de Emergencia
```bash
task debug
task docker:diagnose
```

## ❓ **AYUDA**

```bash
task help             # Ayuda completa
task help:quick       # Ayuda rápida
task --list           # Lista de comandos
```

## 📚 **DOCUMENTACIÓN**

- **[TASK_SYSTEM.md](TASK_SYSTEM.md)** - Sistema TASK completo
- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Documentación técnica
- **[README.md](README.md)** - Guía de inicio

---

*🌵 Cactus Dashboard - Sistema TASK Unificado v2.0* 