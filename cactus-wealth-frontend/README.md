# Cactus Wealth Frontend

A modern, professional dashboard for financial advisors built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Authentication**: Secure JWT-based authentication with persistent sessions
- **Client Management**: Complete CRUD operations for client data
- **Portfolio Valuation**: Real-time portfolio valuation with market data
- **PDF Reports**: Generate and download professional portfolio reports
- **Responsive Design**: Mobile-first design with Cactus Wealth branding
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom Cactus Wealth theme
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: React Context API
- **Icons**: Lucide React
- **HTTP Client**: Native fetch API with custom client

## 📋 Prerequisites

- Node.js 18+ and npm
- Cactus Wealth Backend API running on `http://localhost:8000`

## 🏃‍♂️ Quick Start

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to `http://localhost:3000`

## 🔐 Authentication

The application uses JWT token authentication. Demo credentials:

- Email: `demo@cactuswealth.com`
- Password: `demo123`

## 📁 Project Structure

```text
cactus-wealth-frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/          # Protected dashboard routes
│   ├── login/              # Authentication page
│   ├── layout.tsx          # Root layout with AuthProvider
│   └── page.tsx           # Root redirect page
├── components/
│   └── ui/                # Reusable UI components (shadcn/ui)
├── context/               # React Context providers
│   └── AuthContext.tsx   # Authentication state management
├── lib/                   # Utilities and API client
│   ├── api.ts            # Centralized API client
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🎨 Design System

The application implements Cactus Wealth's brand identity:

- **Primary Green**: `#2d8f2d` (cactus-500)
- **Secondary Sage**: `#5f6b5f` (sage-500)
- **Accent Sand**: `#d4b896` (sand-500)

Custom CSS classes:

- `.cactus-gradient`: Brand gradient background
- `.card-hover`: Interactive card hover effects
- `.brand-shadow`: Branded drop shadows

## 🔗 API Integration

The frontend integrates with the following backend endpoints:

- `POST /api/v1/login/access-token` - User authentication
- `GET /api/v1/clients/` - List clients
- `GET /api/v1/clients/{id}` - Get client details
- `GET /api/v1/portfolios/{id}/valuation` - Portfolio valuation
- `GET /api/v1/portfolios/{id}/report/download` - Download PDF report

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Testing

- Unit/Integration (Vitest):
  - `npm run test` – run tests
  - `npm run test:watch` – watch mode
  - `npm run test:ci` – CI mode with coverage (lcov, html)
  - `npm run test:coverage` – local coverage report
- E2E (Playwright):
  - `npm run e2e` – headless run
  - `npm run e2e:ui` – UI mode
  - `npm run e2e:report` – open report
- Legacy Jest (temporal, fallback):
  - `npm run test:legacy`

Guidelines for async hooks with debounce/timers:

- Use fake timers and advance to the exact debounce window (e.g., 100ms)
- Await async updates with `waitFor` prior to asserting hook state
- For rate‑limited flows, advance timers to pass the window (e.g., 1000ms)

Example:

```ts
import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

vi.useFakeTimers()
const { result } = renderHook(() => useHook())

act(() => result.current.refresh())
act(() => vi.advanceTimersByTime(100))

await waitFor(() => expect(result.current.loading).toBe(false))
```

Promise rejections:

- Always assert with `await expect(promise).rejects.toThrow(...)`
- Avoid unawaited rejections to prevent CI noise

### Key Features Implementation

#### 1. Authentication Flow

- JWT tokens stored in localStorage
- Automatic token inclusion in API requests
- Route protection with redirects
- Session persistence across browser refreshes

#### 2. Client Management

- Responsive data tables with search and filters
- CRUD operations with optimistic updates
- Risk profile visualization
- Client statistics dashboard

#### 3. Portfolio Integration

- Real-time portfolio valuation display
- Performance metrics with visual indicators
- PDF report generation and download
- Client portfolio overview

## 🚀 Deployment

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Start the production server**:

```bash
   npm start
   ```

## 🔧 Configuration

### Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: Backend API base URL
- `NEXT_PUBLIC_API_URL`: Alternative backend base (used by WebSocket service to build ws URL)
- `NEXT_PUBLIC_FRONTEND_URL`: Public frontend origin (used in debug page)
- `DEBUG_PROXY`: Enable verbose proxy logs on server (default: off in production)
- `NEXT_PUBLIC_DEBUG_WS`: Enable verbose WebSocket logs in browser (default: off in production)
- `NEXT_PUBLIC_DEBUG_PAGE`: Enable console logs in debug page even outside dev (default: off)
- `PROXY_TIMEOUT_MS`: Timeout in milliseconds for proxy requests (default: 12000)
- `PROXY_MAX_RETRIES`: Max retry attempts for proxy requests on 502/503/504 (default: 1)
- `PROXY_RETRY_BASE_DELAY_MS`: Base backoff delay for retries (default: 250)
- `NEXT_PUBLIC_LOCALE`: UI locale default for formatting (default: es-ES)
- `NEXT_PUBLIC_CURRENCY`: Default currency for formatting (default: EUR)

### Tailwind Configuration

The Tailwind config includes custom Cactus Wealth colors and theme extensions. Modify `tailwind.config.ts` to adjust the design system.

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Follow the established code style
2. Use TypeScript for all new code
3. Maintain responsive design principles
4. Test all API integrations
5. Follow the component structure patterns

## 📄 License

Proprietary - Cactus Wealth Management

---

Built with ❤️ by the Cactus Wealth team
