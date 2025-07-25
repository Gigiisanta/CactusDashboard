# 🧹 Plan de Limpieza Profunda - Fase 2

## 🔍 Análisis Completado

### Problemas Identificados:

#### 1. 📄 Archivos de Configuración Duplicados
- **3 archivos .env.example** diferentes:
  - `/config/env/.env-example` (66 líneas)
  - `/.env.aws.example` (85 líneas) 
  - `/cactus-wealth-backend/.env.example` (12 líneas)
- **Nginx configs duplicados**: `nginx.conf` y `nginx-secure.conf`

#### 2. 🚀 Scripts AWS Fragmentados
- `deploy-aws.sh`, `setup-aws.sh`, `quick-setup-aws.sh` - funcionalidades superpuestas
- `backup-aws.sh`, `monitor-aws.sh` - podrían consolidarse
- `security-setup.sh`, `security-check.sh` - relacionados pero separados

#### 3. 📚 Documentación Dispersa
- **AWS**: `AWS-DEPLOYMENT.md` vs `README_DEPLOY_AWS.md` (ya identificado)
- **Testing**: múltiples archivos en `/docs/` con overlap
- **Optimization**: varios archivos de optimización separados

#### 4. 🗂️ Estructura de Directorios Subóptima
- `/config/` con subdirectorios poco utilizados
- `/data/` con contenido mínimo
- `/tools/` (no examinado aún)

## 🎯 Plan de Consolidación

### Fase 2A: Consolidación de Configuraciones
1. **Unificar archivos .env.example**
2. **Consolidar configuraciones nginx**
3. **Reorganizar `/config/`**

### Fase 2B: Consolidación de Scripts AWS
1. **Crear `aws-manager.sh` unificado**
2. **Eliminar scripts redundantes**
3. **Actualizar referencias en `cactus.sh`**

### Fase 2C: Consolidación de Documentación
1. **Crear `/docs/consolidated/`**
2. **Unificar documentación de testing**
3. **Consolidar guías de optimización**

### Fase 2D: Optimización de Estructura
1. **Reorganizar `/config/`, `/data/`, `/tools/`**
2. **Actualizar `.gitignore` con nuevas reglas**
3. **Verificar y actualizar referencias**

## 📊 Beneficios Esperados
- **Reducción**: ~30-40 archivos adicionales
- **Espacio**: ~50-100MB adicionales
- **Mantenimiento**: Configuración centralizada
- **Claridad**: Documentación unificada
- **Eficiencia**: Scripts consolidados