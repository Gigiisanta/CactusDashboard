# Manifiesto de Arquitectura y Reconstrucción - CactusDashboard

## 1. Principios y Visión Arquitectónica

La arquitectura de CactusDashboard se rige por un conjunto de principios fundamentales, diseñados para garantizar la escalabilidad, mantenibilidad y seguridad de la plataforma FinTech.

1.  **Seguridad de Tipos de Extremo a Extremo (E2E Type Safety)**: Un contrato estricto une al backend y al frontend. El esquema OpenAPI del backend es la única fuente de verdad, y los tipos del frontend se generan automáticamente a partir de él. Esto elimina una clase entera de errores de integración y asegura que los datos sean consistentes en toda la pila.
2.  **Configuración Centralizada y Validada**: Toda la configuración de la aplicación (bases de datos, claves secretas, orígenes CORS) se gestiona a través de variables de entorno y se carga en un único objeto de configuración (`Settings` en Pydantic) al inicio. Esto proporciona un único lugar para gestionar la configuración y valida que todos los valores necesarios estén presentes y sean correctos antes de que la aplicación se inicie.
3.  **Manejo de Errores Unificado y Semántico**: Las excepciones del backend no son errores genéricos 500. Se utiliza una jerarquía de excepciones personalizadas (`DetailedHTTPException`) que se propagan al frontend con códigos de error semánticos (ej. `CLIENT_NOT_FOUND`). Un hook de React (`useApiErrorHandler`) intercepta estos errores y muestra mensajes claros al usuario, creando un flujo de error predecible y robusto.
4.  **Principio DRY en Lógica y Componentes**: La lógica de negocio está encapsulada en la capa de Servicios del backend, evitando la duplicación en los endpoints. En el frontend, se utiliza un sistema de diseño interno (`components/ui`) y hooks personalizados para reutilizar la lógica de la UI y el manejo de datos, asegurando consistencia y reduciendo el código repetitivo.
5.  **Rendimiento Proactivo y Asincronía**: La arquitectura está diseñada para ser rápida y responsiva. Se utilizan operaciones de base de datos asíncronas, se delegan tareas pesadas (como la generación de informes) a un trabajador en segundo plano (ARQ con Redis) y se implementa caching a nivel de datos (ej. yfinance) para minimizar la latencia.

## 2. Especificación de la Pila Tecnológica Definitiva

| Capa | Tecnología | Versión | Propósito |
|---|---|---|---|
| **Backend** | Python | 3.12 | Lenguaje de programación principal. |
| | FastAPI | 0.111.0 | Framework de API de alto rendimiento. |
| | SQLModel | 0.0.19 | ORM moderno que combina Pydantic y SQLAlchemy. |
| | Pydantic | 2.3.4 (pydantic-settings) | Validación de datos y gestión de esquemas de API. |
| | ARQ | 0.25.0 | Cola de tareas asíncronas. |
| | Redis | 5.0.0 | Broker de mensajes para ARQ. |
| | Pytest | 8.2.2 | Framework de pruebas para Python. |
| | Ruff | 0.5.0 | Linter y formateador de código Python. |
| | MyPy | 1.10.0 | Verificador de tipos estático para Python. |
| **Frontend** | TypeScript | 5.2.2 | Lenguaje de programación con tipado estático. |
| | Next.js | 15.4.1 | Framework de React para aplicaciones web modernas con SSR/SSG. |
| | Zustand | 5.0.6 | Gestor de estado minimalista y potente para React. |
| | shadcn/ui, Radix UI | N/A | Componentes de UI reutilizables y accesibles. |
| | Tailwind CSS | 3.3.6 | Framework CSS de utilidad para un diseño rápido. |
| | Jest | 29.7.0 | Pruebas unitarias/componentes para React. |
| | Playwright | 1.40.0 | Pruebas E2E. |
| **Base de Datos** | PostgreSQL | N/A | Base de datos relacional robusta y escalable. |
| **Contenerización** | Docker, Docker Compose | N/A | Entornos de desarrollo y producción consistentes. |
| **Gestión de Dependencias** | Poetry | N/A | Gestión de dependencias y empaquetado de Python. |

## 3. Arquitectura del Backend (cactus-wealth-backend)

### 3.1. Estructura de Directorios Actual

La estructura de directorios sigue una estricta separación de capas, facilitando la navegación y el mantenimiento.

`src/cactus_wealth/`
├── `__init__.py`
├── `api`
│   ├── `__init__.py`
│   └── `v1`
│       ├── `__init__.py`
│       ├── `api.py`            # Ensamblador de routers
│       └── `endpoints`
│           ├── `__init__.py`
│           ├── `assets.py`
│           ├── `automations.py`
│           ├── `clients.py`
│           ├── `dashboard.py`
│           ├── `health.py`
│           ├── `insurance_policies.py`
│           ├── `investment_accounts.py`
│           ├── `login.py`
│           ├── `model_portfolios.py`
│           ├── `notifications.py`
│           ├── `portfolios.py`
│           ├── `reports.py`
│           ├── `users.py`
│           └── `websockets.py`
├── `client_event_bus.py`
├── `core`
│   ├── `__init__.py`
│   ├── `arq.py`              # Configuración del worker
│   ├── `config.py`           # Settings de la aplicación
│   ├── `dataprovider.py`     # Abstracción de datos de mercado
│   ├── `logging_config.py`
│   ├── `middleware.py`
│   ├── `tasks.py`            # Definición de tareas asíncronas
│   └── `websocket_manager.py`
├── `crud.py`                 # Operaciones de base de datos (aún en uso, en transición a repositorios)
├── `email_actions.py`
├── `repositories`
│   ├── `__init__.py`
│   ├── `asset_repository.py`
│   ├── `base_repository.py`
│   ├── `client_repository.py`
│   ├── `notification_repository.py`
│   ├── `portfolio_repository.py`
│   └── `user_repository.py`
├── `database.py`             # Configuración y sesión de BD
├── `models.py`               # Modelos de datos SQLAlchemy
├── `schemas.py`              # Esquemas Pydantic (contratos API)
├── `security.py`             # Lógica de autenticación y seguridad
├── `services.py`             # Lógica de negocio
├── `templates`
│   ├── `report.html`
│   └── `styles.css`
└── `worker.py`               # Punto de entrada del worker ARQ

### 3.2. Modelos de Datos (SQLAlchemy)

Los modelos definen el esquema de la base de datos usando `SQLModel`.

```python
# En models.py

# --- Enums ---
# UserRole, RiskProfile, AssetType, ClientStatus, LeadSource, ActivityType

# --- Tablas ---
class User(SQLModel, table=True): ...
class Client(SQLModel, table=True): ...
class ClientActivity(SQLModel, table=True): ...
class ClientNote(SQLModel, table=True): ...
class Asset(SQLModel, table=True): ...
class Portfolio(SQLModel, table=True): ...
class Position(SQLModel, table=True): ...
class PortfolioSnapshot(SQLModel, table=True): ...
class Report(SQLModel, table=True): ...
class InvestmentAccount(SQLModel, table=True): ...
class InsurancePolicy(SQLModel, table=True): ...
class Notification(SQLModel, table=True): ...
class ModelPortfolio(SQLModel, table=True): ...
class ModelPortfolioPosition(SQLModel, table=True): ...
```

### 3.3. Contratos de API (Pydantic)

Los esquemas de `Pydantic` definen las formas de los datos para las peticiones y respuestas de la API, desacoplando los modelos de la base de datos de la interfaz pública.

```python
# En schemas.py

# --- Schemas de Creación (Create) ---
class UserCreate(BaseModel): ...
class ClientCreate(BaseModel): ...
class ClientActivityCreate(BaseModel): ...
class ClientNoteCreate(BaseModel): ...
class InvestmentAccountCreate(BaseModel): ...
class InsurancePolicyCreate(BaseModel): ...
class ModelPortfolioCreate(BaseModel): ...
class ModelPortfolioPositionCreate(BaseModel): ...
class ReportCreate(BaseModel): ...

# --- Schemas de Actualización (Update) ---
class ClientUpdate(BaseModel): ...
class InvestmentAccountUpdate(BaseModel): ...
class InsurancePolicyUpdate(BaseModel): ...
class ModelPortfolioUpdate(BaseModel): ...
class ModelPortfolioPositionUpdate(BaseModel): ...

# --- Schemas de Lectura (Read) ---
class UserRead(BaseModel): ...
class ClientRead(BaseModel): ...
class ClientReadWithDetails(BaseModel): ...
class ClientActivityRead(BaseModel): ...
class ClientNoteRead(BaseModel): ...
class AssetRead(BaseModel): ...
class PositionRead(BaseModel): ...
class PortfolioRead(BaseModel): ...
class PortfolioValuation(BaseModel): ...
class PositionRead(BaseModel): ...
class InvestmentAccountRead(BaseModel): ...
class InsurancePolicyRead(BaseModel): ...
class NotificationRead(BaseModel): ...
class ModelPortfolioRead(BaseModel): ...
class ModelPortfolioPositionRead(BaseModel): ...
class ReportRead(BaseModel): ...

# --- Schemas de Operaciones Específicas ---
class Token(BaseModel): ...
class TokenData(BaseModel): ...
class PortfolioValuation(BaseModel): ...
class DashboardSummaryResponse(BaseModel): ...
class ReportResponse(BaseModel): ...
class BacktestRequest(BaseModel): ...
class BacktestResponse(BaseModel): ...
```

### 3.4. Definición de Endpoints de la API

| Método | Ruta | Esquema Petición | Esquema Respuesta | Lógica Principal |
|---|---|---|---|---|
| POST | `/login/access-token` | `OAuth2PasswordRequestForm` | `Token` | `security.authenticate_user` |
| GET | `/users/me` | - | `UserRead` | `security.get_current_user` |
| GET | `/clients/` | - | `list[ClientRead]` | `crud.get_clients_by_owner` |
| POST | `/clients/` | `ClientCreate` | `ClientRead` | `crud.create_client` |
| GET | `/clients/{id}` | - | `ClientRead` | `dependencies.get_client_from_path` |
| PUT | `/clients/{id}` | `ClientUpdate` | `ClientRead` | `crud.update_client` |
| DELETE| `/clients/{id}` | - | `ClientRead` | `crud.delete_client` |
| GET | `/portfolios/{id}/valuation` | - | `PortfolioValuation`| `PortfolioService.get_portfolio_valuation`|
| POST | `/portfolios/backtest` | `BacktestRequest` | `BacktestResponse` | `PortfolioBacktestService.perform_backtest` |
| GET | `/assets/search` | `query: str` | `list[AssetRead]`| `crud.search_assets` |
| GET | `/dashboard/summary` | - | `DashboardSummary`| `DashboardService.get_dashboard_summary`|
| POST | `/reports/.../generate-report`| `ReportCreate` | `ReportResponse` | `tasks.generate_client_report_task`|
| GET | `/reports/{id}/download` | - | `FileResponse` | `ReportService.generate_portfolio_report_pdf`|
| GET | `/model-portfolios/` | - | `list[ModelPortfolioRead]`| `crud.get_model_portfolios` |
| POST | `/model-portfolios/` | `ModelPortfolioCreate`| `ModelPortfolioRead`| `crud.create_model_portfolio` |
| POST | `.../positions` | `ModelPortfolioPositionCreate`|`ModelPortfolioPositionRead`| `crud.create_model_portfolio_position`|

*(Nota: La tabla es un resumen. Las rutas para `investment-accounts` y `insurance-policies` siguen un patrón CRUD similar.)*

### 3.5. Capa de Servicios

La capa de servicios (`services.py`) encapsula la lógica de negocio compleja, interactuando con la nueva capa de repositorios para las operaciones de persistencia de datos. Esto desacopla la lógica de negocio de los detalles de la base de datos, mejorando la modularidad y la capacidad de prueba.

-   **`BaseRepository`**: Clase base para todos los repositorios, proporcionando métodos CRUD genéricos.
-   **`AssetRepository`**, **`ClientRepository`**, **`NotificationRepository`**, **`PortfolioRepository`**, **`UserRepository`**: Repositorios específicos que manejan las operaciones de base de datos para sus respectivos modelos. Estos repositorios son inyectados en los servicios, permitiendo que los servicios se centren en la lógica de negocio sin preocuparse por los detalles de la base de datos.

-   **`CactusWebhookService`**: Gestiona la integración con sistemas externos (n8n) mediante webhooks para automatización de procesos.
-   **`PortfolioService`**: Orquesta el cálculo de la valoración de carteras, combinando datos de la BD con precios de mercado en tiempo real.
-   **`ReportService`**: Responsable de generar informes en PDF, utilizando plantillas `Jinja2` y `WeasyPrint` para renderizar los datos de valoración en un formato profesional.
-   **`DashboardService`**: Calcula métricas agregadas para el panel principal (AUM, crecimiento, etc.), respetando el control de acceso basado en roles.
-   **`InvestmentAccountService` / `InsurancePolicyService`**: Servicios CRUD que manejan la lógica de negocio de productos financieros, incluyendo la validación de acceso, y que utilizan repositorios específicos para sus operaciones de datos.
-   **`NotificationService`**: Lógica para crear y recuperar notificaciones para los usuarios, utilizando `NotificationRepository`.
-   **`PortfolioBacktestService`**: Orquesta la compleja lógica de backtesting, gestionando el cacheo de datos históricos (Redis), la ejecución concurrente de descargas y el cálculo de métricas de rendimiento.

### 3.6. Módulos del Núcleo (Core)

-   **`core/config.py`**: Define la clase `Settings` que carga toda la configuración desde variables de entorno. Usa `Pydantic` para validación y `lru_cache` para asegurar que la configuración se lea una sola vez.
-   **`core/tasks.py`**: Define las cargas útiles (argumentos) para los trabajos asíncronos (`GenerateReportTaskArgs`) y los handlers que serán ejecutados por el worker `ARQ`. Desacopla la ejecución de tareas largas de las peticiones HTTP.
-   **`core/middleware.py`**: Middleware personalizado para logging, CORS, y manejo de errores.
-   **`core/websocket_manager.py`**: Gestión de conexiones WebSocket para notificaciones en tiempo real.
-   **`core/logging_config.py`**: Configuración de logging estructurado con `structlog`.
-   **`core/dataprovider.py`**: Abstracción para proveedores de datos de mercado (yfinance).

## 4. Arquitectura del Frontend (cactus-wealth-frontend)

### 4.1. Estructura de Directorios Actual

La estructura del frontend se centra en el `App Router` de Next.js y una clara separación de responsabilidades.

`cactus-wealth-frontend/`
├── `app/`
│   ├── `login/`
│   │   └── `page.tsx`
│   ├── `register/`
│   │   └── `page.tsx`
│   ├── `dashboard/`
│   │   ├── `layout.tsx`
│   │   ├── `page.tsx`
│   │   └── `clients/`
│   │       └── `[id]/`
│   │           └── `page.tsx`
│   ├── `clients/`
│   │   ├── `layout.tsx`
│   │   ├── `page.tsx`
│   │   └── `[clientId]/`
│   │       ├── `page.tsx`
│   │       └── `components/`
│   ├── `portfolios/`
│   │   ├── `layout.tsx`
│   │   ├── `page.tsx`
│   │   └── `manage/`
│   │       └── `[id]/`
│   │           └── `page.tsx`
│   ├── `layout.tsx`          # Layout raíz (proveedor de contexto)
│   └── `page.tsx`            # Página de entrada/redirección
├── `components/`
│   ├── `clients/`            # Componentes específicos para 'clients'
│   ├── `layout/`             # Componentes de layout (Header, Sidebar)
│   ├── `dashboard/`          # Componentes específicos del dashboard
│   ├── `automations/`        # Componentes de automatización
│   ├── `realtime/`           # Componentes de tiempo real
│   └── `ui/`                 # Sistema de diseño (Button, Card, etc.)
├── `hooks/`
│   ├── `useWebSocket.ts`     # Hook para WebSocket
│   ├── `useClientDetailPage.ts`
│   ├── `useDashboardActions.ts`
│   ├── `usePortfolio.ts`
│   ├── `useHistoricalPerformanceChart.ts`
│   └── `useLiveOpsDemo.ts`
├── `lib/`
│   ├── `api.ts`              # Cliente API manual (no generado automáticamente)
│   ├── `apiClient.ts`        # Cliente Axios con interceptores
│   ├── `utils.ts`            # Funciones de utilidad
│   ├── `token-utils.ts`      # Utilidades para manejo de tokens
│   └── `chart-colors.ts`     # Configuración de colores para gráficos
├── `services/`
│   ├── `auth.service.ts`
│   ├── `client.service.ts`
│   ├── `dashboard.service.ts`
│   ├── `notification.service.ts`
│   ├── `portfolio.service.ts`
│   ├── `websocket.service.ts`
│   └── `index.ts`
├── `stores/`
│   └── `auth.store.ts`       # Store de estado global (Zustand)
├── `types/`
│   └── `index.ts`            # Tipos TypeScript manuales (no generados)
└── `...`

### 4.2. Sistema de Diseño Interno (components/ui)

La UI se construye sobre un conjunto de componentes reutilizables, basados en `shadcn/ui` y `Radix UI`, asegurando consistencia visual y accesibilidad.

-   **`Button`**: Componente de botón con variantes (primary, secondary, destructive, ghost).
-   **`Input`**: Campo de entrada estandarizado.
-   **`Card`**: Contenedor con estilos predefinidos para agrupar información.
-   **`Dialog`**: Modal para acciones enfocadas (ej. crear/editar cliente).
-   **`Table`**: Componente de tabla con estilos para mostrar datos tabulares.
-   **`Select`**, **`Checkbox`**: Controles de formulario estandarizados.
-   **`Skeleton`**: Placeholder de carga para mejorar la UX percibida.
-   **`Sonner`**: Para mostrar notificaciones (toasts) de éxito o error.

### 4.3. Gestión de Estado (Zustand)

Se utiliza `Zustand` para el estado global del cliente, específicamente para la autenticación.

-   **`auth.store.ts`**:
    -   **State Slice**: `{ user: User | null, token: string | null }`
    -   **Acciones**:
        -   `login(user, token)`: Almacena el usuario y el token.
        -   `logout()`: Limpia el usuario y el token.
        -   `setUser(user)`: Actualiza la información del usuario.
    -   **Middleware**: Usa `persist` para guardar el estado en `localStorage`, permitiendo sesiones persistentes entre recargas de página.

### 4.4. Hooks Personalizados Reutilizables

-   **`useWebSocket`**: Hook para manejo de conexiones WebSocket y notificaciones en tiempo real.
-   **`useClientDetailPage`**: Hook específico para la página de detalles del cliente.
-   **`useDashboardActions`**: Hook para acciones del dashboard.
-   **`usePortfolio`**: Hook para manejo de portafolios.
-   **`useHistoricalPerformanceChart`**: Hook para gráficos de rendimiento histórico.
-   **`useLiveOpsDemo`**: Hook para demostración de operaciones en vivo.

### 4.5. Servicios del Frontend

Los servicios encapsulan la lógica de comunicación con la API:

-   **`auth.service.ts`**: Manejo de autenticación y autorización.
-   **`client.service.ts`**: Operaciones CRUD para clientes.
-   **`dashboard.service.ts`**: Datos del dashboard y métricas.
-   **`notification.service.ts`**: Gestión de notificaciones.
-   **`portfolio.service.ts`**: Operaciones de portafolios.
-   **`websocket.service.ts`**: Comunicación WebSocket en tiempo real.

## 5. Patrones de Integración Full-Stack

### Flujo de Tipado E2E (PENDIENTE DE IMPLEMENTACIÓN)

**ESTADO ACTUAL**: El frontend utiliza tipos TypeScript manuales definidos en `types/index.ts` en lugar de tipos generados automáticamente desde el backend.

**IMPLEMENTACIÓN PENDIENTE**:
1.  **Backend**: `FastAPI` genera automáticamente un `openapi.json` que describe toda la API, incluyendo endpoints, modelos y esquemas.
2.  **Proceso de Generación**: En el frontend, se debe ejecutar el script `npm run generate:api`.
3.  **Comando**: `openapi --input ../cactus-wealth-backend/openapi.json --output ./lib/generated ...`
4.  **Resultado**: Esto utilizaría `openapi-typescript-codegen` para crear un cliente de API (`axios`) completamente tipado en `lib/generated/`, con todos los servicios y modelos como interfaces de TypeScript.

### Flujo de Configuración

1.  **Backend**: `core/config.py` lee las variables de entorno (`.env`) en un objeto `Settings` de Pydantic. Esto centraliza y valida la configuración del servidor.
2.  **Frontend**: `lib/apiClient.ts` lee variables de entorno públicas (`NEXT_PUBLIC_*`) para configurar el cliente de API, como `NEXT_PUBLIC_API_URL`. Esto permite que el frontend se conecte al backend correcto sin hardcodear URLs.

### Flujo de Manejo de Errores (PENDIENTE DE IMPLEMENTACIÓN)

**ESTADO ACTUAL**: El frontend maneja errores de forma básica sin un sistema unificado de manejo de errores semánticos.

**IMPLEMENTACIÓN PENDIENTE**:
1.  **Backend**: Implementar jerarquía de excepciones personalizadas (`DetailedHTTPException`).
2.  **Respuesta API**: FastAPI intercepta excepciones y las serializa en respuestas JSON estructuradas.
3.  **Frontend**: Implementar `useApiErrorHandler` hook para manejo unificado de errores.
4.  **Componente React**: Usar `handleApiError(error)` del hook para mostrar mensajes claros al usuario.

## 6. Infraestructura y Operaciones

### 6.1. Servidor y Recursos

La aplicación Cactus Wealth se despliega en una instancia de AWS EC2 `t4g.small`. Esta instancia, basada en procesadores AWS Graviton2 (ARM64), ofrece un excelente equilibrio entre rendimiento y costo, siendo ideal para cargas de trabajo de desarrollo y producción iniciales. Es escalable a futuro según las necesidades de crecimiento de la plataforma.

**Recursos Clave de la Instancia `t4g.small`:**
-   **vCPUs:** 2
-   **Memoria:** 2 GiB
-   **Almacenamiento:** EBS (configurable, se recomienda SSD de propósito general para rendimiento).
-   **Red:** Hasta 5 Gigabit de ancho de banda.

### 6.2. Gestión del Servidor y Despliegue

La gestión del servidor y el ciclo de vida de la aplicación se orquestan principalmente a través de scripts `bash` y `Docker Compose`, encapsulados en el script `cactus.sh`.

**`cactus.sh` (Hub de Comandos):**
Este script es la interfaz principal para interactuar con el entorno de despliegue. Centraliza operaciones como:
-   **`deploy`**: Despliega la última versión de la aplicación en el servidor, utilizando Docker Compose para construir y levantar los servicios.
-   **`update`**: Actualiza las dependencias y el código en el servidor.
-   **`quick-setup-aws`**: Configura una nueva instancia de AWS EC2 desde cero, instalando Docker, Docker Compose y clonando el repositorio.
-   **`quick-status`**: Proporciona un resumen rápido del estado de los servicios en ejecución.
-   **`diagnose-server`**: Ejecuta una serie de comprobaciones para identificar problemas comunes en el servidor (uso de disco, memoria, estado de los contenedores).
-   **`security-check`**: Realiza escaneos básicos de seguridad en el entorno del servidor y las imágenes Docker.
-   **`test`**: Ejecuta tests segmentados por grupos (backend-core, backend-api, frontend-components, etc.).

**Docker y Docker Compose:**
Todos los componentes de la aplicación (backend, frontend, base de datos, Redis) se ejecutan como contenedores Docker. `config/docker/docker-compose.yml` define la configuración de los servicios, las redes y los volúmenes, asegurando un entorno consistente entre desarrollo y producción.

**Optimización del Funcionamiento:**
Para optimizar el rendimiento de la aplicación en la instancia `t4g.small`, se aplican las siguientes estrategias:
-   **Contenedores Ligeros:** Uso de imágenes base mínimas para los contenedores Docker.
-   **Gestión de Recursos:** Configuración de límites de CPU y memoria en Docker Compose para evitar que un servicio consuma todos los recursos.
-   **Tareas Asíncronas:** Delegación de operaciones que consumen muchos recursos (ej. generación de informes, backtesting) a tareas en segundo plano (`ARQ` con `Redis`), liberando el hilo principal de la API.
-   **Caching:** Implementación de caching a nivel de aplicación (ej. datos de mercado, resultados de backtesting) para reducir la carga en la base de datos y las APIs externas.
-   **Base de Datos Optimizada:** Uso de PostgreSQL, configurado para un rendimiento óptimo en la instancia, y consideración de TimescaleDB para datos de series temporales si es necesario.
-   **Nginx como Proxy Inverso:** Nginx se utiliza para servir el frontend estático, balancear la carga y manejar la terminación SSL, optimizando la entrega de contenido y la seguridad.

### 6.3. Infraestructura como Código (Terraform)

El directorio `terraform/` contiene la configuración de infraestructura como código:
-   **`main.tf`**: Configuración principal de AWS EC2, VPC, security groups.
-   **`user-data.sh`**: Script de inicialización de la instancia EC2.
-   **`terraform.tfvars.example`**: Variables de ejemplo para la configuración.

### 6.4. Scripts de Automatización

El directorio `scripts/` contiene scripts especializados:
-   **`master-deploy.sh`**: Script principal de despliegue.
-   **`deploy-automation.sh`**: Automatización de despliegues.
-   **`auto-recovery.sh`**: Recuperación automática de servicios.
-   **`backup.sh`**: Backup de base de datos.
-   **`security-check.sh`**: Verificaciones de seguridad.
-   **`diagnose-server.sh`**: Diagnóstico de problemas del servidor.

## 7. Estrategia de Pruebas y CI/CD

### Pirámide de Pruebas

La estrategia se alinea con la pirámide de pruebas clásica para un equilibrio entre velocidad y confianza:

-   **Unitarias (70%)**: Pruebas rápidas y aisladas. En el backend, para la lógica de los servicios (`services.py`). En el frontend, para componentes de UI y hooks (`Jest`).
-   **Integración (20%)**: Pruebas que verifican la interacción entre varias partes. En el backend, se prueba que un endpoint llama al servicio correcto y devuelve el esquema esperado (`pytest` con `httpx`). En el frontend, se prueba que un componente renderiza correctamente al recibir datos de un hook (`React Testing Library`).
-   **E2E (10%)**: Pruebas completas que simulan el flujo de un usuario real a través de la aplicación. Se utiliza `Playwright` para automatizar el navegador y probar flujos críticos como el login, la creación de un cliente y la generación de un informe.

### Patrones de Pruebas

-   **Backend**: Se utiliza `pytest` con `pytest-asyncio` para pruebas asíncronas.
-   **Frontend**: Se utiliza `Jest` con `@testing-library/react` para pruebas de componentes.

### Pipeline de CI (`cactus.sh`)

El script `cactus.sh` incluye comandos para ejecutar el pipeline de CI/CD:

1.  **Instalar Dependencias** (Backend y Frontend).
2.  **Linting**: Ejecutar `Ruff` (backend) y `ESLint` (frontend) para verificar la calidad y el estilo del código.
3.  **Formato**: Ejecutar `Ruff` (backend) y `Prettier` (frontend) para asegurar un formato de código consistente.
4.  **Type Checking**: Ejecutar `mypy` (backend) y `tsc` (frontend) para verificar la seguridad de tipos.
5.  **Pruebas Unitarias y de Integración**: Ejecutar `pytest` y `jest`.
6.  **Build**: Crear una build de producción del frontend (`next build`).
7.  **(Opcional) Pruebas E2E**: Ejecutar las pruebas de `Playwright`.

## 8. Critical File Index (Actualizado)

- `cactus.sh` — command hub (build, test, deploy, manage server).
- `main.py` (FastAPI entry point) | `lib/api.ts` (client) | `context/AuthContext.tsx` | `app/globals.css` | `app/layout.tsx` | `app/page.tsx`.
- `data_collector.py`, `data_manager.py` — DB ops.
- `config/docker/docker-compose.yml` — Definición de servicios Docker.
- `terraform/main.tf` — Infraestructura como código para AWS.
- `src/cactus_wealth/core/config.py`
- `src/cactus_wealth/security.py`
- `src/cactus_wealth/client_event_bus.py`
- `src/cactus_wealth/core/logging_config.py`
- `src/cactus_wealth/core/middleware.py`
- `src/cactus_wealth/core/tasks.py` — Definición de tareas asíncronas, incluye `create_all_snapshots`.
- `src/cactus_wealth/core/websocket_manager.py`
- `src/cactus_wealth/database.py`
- `src/cactus_wealth/email_actions.py`
- `src/cactus_wealth/models.py`
- `src/cactus_wealth/schemas.py`
- `src/cactus_wealth/services.py` — Lógica de negocio, incluye `PortfolioService` y `CactusWebhookService`.
- `src/cactus_wealth/repositories/base_repository.py`
- `src/cactus_wealth/repositories/asset_repository.py`
- `src/cactus_wealth/repositories/client_repository.py`
- `src/cactus_wealth/repositories/notification_repository.py`
- `src/cactus_wealth/repositories/portfolio_repository.py`
- `src/cactus_wealth/repositories/user_repository.py`
- `src/cactus_wealth/api/v1/endpoints/auth.py`
- `src/cactus_wealth/api/v1/endpoints/users.py`

## 9. Desviaciones Identificadas y Pendientes

### 9.1. Backend

**IMPLEMENTADO CORRECTAMENTE:**
- ✅ Estructura de directorios según especificación
- ✅ Modelos SQLModel y esquemas Pydantic
- ✅ Capa de repositorios con `BaseRepository`
- ✅ Servicios de negocio implementados
- ✅ Configuración centralizada con Pydantic
- ✅ Sistema de logging estructurado
- ✅ WebSocket manager
- ✅ Integración con webhooks (n8n)

**PENDIENTE:**
- ❌ Sistema de excepciones personalizadas (`DetailedHTTPException`)
- ❌ Generación automática de OpenAPI para frontend

### 9.2. Frontend

**IMPLEMENTADO CORRECTAMENTE:**
- ✅ Estructura de App Router de Next.js
- ✅ Sistema de diseño con shadcn/ui
- ✅ Gestión de estado con Zustand
- ✅ Hooks personalizados
- ✅ Servicios de API
- ✅ WebSocket integration
- ✅ Testing setup con Jest y Playwright

**PENDIENTE:**
- ❌ Tipos generados automáticamente desde backend
- ❌ Hook `useApiErrorHandler` para manejo unificado de errores
- ❌ Script `generate:api` para generación de tipos

### 9.3. Infraestructura

**IMPLEMENTADO CORRECTAMENTE:**
- ✅ Script maestro `cactus.sh`
- ✅ Docker Compose configuration
- ✅ Terraform para AWS
- ✅ Scripts de automatización
- ✅ Pipeline de CI/CD básico

**PENDIENTE:**
- ❌ Pipeline completo de generación de tipos E2E
- ❌ Sistema de monitoreo y alertas

## 10. Plan de Reconstrucción por Fases (Para Gemini 2.5 Pro)

Esta es una hoja de ruta de alto nivel para completar el proyecto, asegurando una base sólida en cada fase.

1.  **Fase 1: Completar Sistema de Errores Backend**
    -   Implementar jerarquía de excepciones personalizadas en `core/exceptions.py`.
    -   Crear `DetailedHTTPException` con códigos semánticos.
    -   Actualizar servicios para usar excepciones personalizadas.
    -   Configurar middleware de manejo de errores.

2.  **Fase 2: Implementar Generación de Tipos E2E**
    -   Configurar script `generate:api` en `package.json`.
    -   Implementar generación automática de tipos desde OpenAPI.
    -   Migrar de tipos manuales a tipos generados.
    -   Actualizar cliente API para usar tipos generados.

3.  **Fase 3: Completar Sistema de Errores Frontend**
    -   Implementar hook `useApiErrorHandler`.
    -   Actualizar componentes para usar manejo unificado de errores.
    -   Integrar con sistema de notificaciones (Sonner).

4.  **Fase 4: Optimización y Monitoreo**
    -   Implementar sistema de monitoreo y alertas.
    -   Optimizar consultas de base de datos.
    -   Mejorar caching y rendimiento.
    -   Documentar APIs y procesos.

5.  **Fase 5: Testing y CI/CD Completo**
    -   Completar cobertura de pruebas unitarias.
    -   Implementar pruebas de integración.
    -   Configurar pipeline de CI/CD completo.
    -   Validar despliegue automatizado.

## 11. Información del Servidor y Optimización

El servidor de producción se ejecuta en una instancia AWS EC2 `t4g.small`, la cual es ampliable a futuro según las necesidades de rendimiento. Esta instancia está optimizada para cargas de trabajo generales y ofrece un buen equilibrio entre cómputo, memoria y recursos de red, siendo una opción costo-efectiva para el despliegue inicial de CactusDashboard. La optimización continua del rendimiento de la aplicación se centrará en:

-   **Monitoreo Proactivo**: Implementación de herramientas de monitoreo para observar el uso de CPU, memoria, red y disco, así como métricas específicas de la aplicación (latencia de API, uso de base de datos, colas de tareas).
-   **Escalabilidad Horizontal y Vertical**: Preparación para escalar la aplicación añadiendo más instancias (horizontal) o mejorando la capacidad de la instancia existente (vertical) cuando sea necesario.
-   **Optimización de Base de Datos**: Revisión y optimización de consultas SQL, índices y configuración de PostgreSQL para asegurar un rendimiento óptimo.
-   **Gestión de Recursos de Contenedores**: Ajuste de los límites de recursos (CPU, memoria) para los contenedores Docker para evitar el consumo excesivo y garantizar la estabilidad del sistema.
-   **Caching Estratégico**: Expansión del uso de Redis para caching de datos frecuentemente accedidos, reduciendo la carga sobre la base de datos y mejorando los tiempos de respuesta.
-   **Optimización de Código**: Refinamiento continuo del código del backend y frontend para mejorar la eficiencia y reducir el consumo de recursos.