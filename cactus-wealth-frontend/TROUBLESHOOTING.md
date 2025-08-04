# Troubleshooting Guide - Cactus Wealth Frontend

## Error de Critters/CSS-Select

### Problema
```
Error: Cannot find module './general.js'
Require stack:
- node_modules/css-select/lib/compile.js
- node_modules/critters/dist/critters.js
- node_modules/next/dist/server/post-process.js
```

### Solución
Este error indica dependencias corruptas o incompatibles. Sigue estos pasos:

1. **Limpiar caché y dependencias:**
   ```bash
   rm -rf node_modules
   rm -rf .next
   rm -rf package-lock.json
   ```

2. **Reinstalar dependencias:**
   ```bash
   npm install
   ```

3. **Desactivar temporalmente critters** (si el error persiste):
   En `next.config.js`, cambiar:
   ```js
   experimental: {
     optimizeCss: false, // Temporarily disabled due to critters compatibility issues
     optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
   },
   ```

4. **Verificar build:**
   ```bash
   npm run build
   ```

## Error de useSearchParams sin Suspense

### Problema
```
useSearchParams() should be wrapped in a suspense boundary
```

### Solución
Envolver componentes que usan `useSearchParams` en un Suspense boundary:

```tsx
import { Suspense } from 'react';

function ComponentContent() {
  const searchParams = useSearchParams();
  // ... resto del código
}

export default function Component() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ComponentContent />
    </Suspense>
  );
}
```

## Error de TypeScript en NextAuth

### Problema
```
Type 'unknown' is not assignable to type 'string | undefined'
```

### Solución
Agregar type assertions en el callback de sesión:

```ts
async session({ session, token }) {
  return {
    ...session,
    accessToken: token.accessToken,
    user: {
      ...session.user,
      id: token.id as string,
      username: token.username as string,
      role: token.role as string,
      provider: token.provider as string,
    },
  };
},
```

## Error de React Hooks

### Problema
```
React Hook "useEffect" is called conditionally
```

### Solución
Mover todos los hooks al inicio del componente, antes de cualquier return condicional:

```tsx
export default function Component() {
  const [state, setState] = useState();
  
  useEffect(() => {
    // hook logic
  }, []);
  
  // Luego pueden venir returns condicionales
  if (condition) {
    return <div>...</div>;
  }
  
  return <div>...</div>;
}
```

## Limpieza de Caché Completa

Si experimentas problemas persistentes, ejecuta esta secuencia completa:

```bash
# 1. Detener servidor
pkill -f "next dev"

# 2. Limpiar todo
rm -rf node_modules
rm -rf .next
rm -rf package-lock.json
rm -rf yarn.lock
rm -rf pnpm-lock.yaml

# 3. Limpiar caché de npm
npm cache clean --force

# 4. Reinstalar
npm install

# 5. Verificar
npm run build
npm run dev
```

## Verificación de Estado

Para verificar que todo funciona correctamente:

1. **Build exitoso:**
   ```bash
   npm run build
   ```

2. **Servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Verificar puerto:**
   ```bash
   lsof -i :3000
   ```

4. **Test de conectividad:**
   ```bash
   curl -s http://localhost:3000
   ```

## Optimización de CSS

### Estado Actual
- **Critters está deprecado**: La versión 0.0.25 de critters está marcada como deprecada.
- **Optimización deshabilitada**: `optimizeCss` está deshabilitado por defecto para evitar errores.
- **Alternativas disponibles**: `@danielroe/beasties` es un fork mantenido de critters.

### Habilitar Optimización CSS

Cuando haya una alternativa estable disponible:

```bash
# Opción 1: Usar script automático
./scripts/enable-css-optimization.sh

# Opción 2: Manual
# 1. Instalar alternativa
npm install @danielroe/beasties
npm uninstall critters

# 2. Habilitar en .env.local
echo "ENABLE_CSS_OPTIMIZATION=true" >> .env.local

# 3. Verificar build
npm run build
```

### Deshabilitar Optimización CSS

Si aparecen problemas:

```bash
# Opción 1: Usar script automático
./scripts/disable-css-optimization.sh

# Opción 2: Manual
echo "ENABLE_CSS_OPTIMIZATION=false" >> .env.local
```

### Variables de Entorno para CSS

```env
# Habilitar optimización CSS (cuando esté disponible alternativa estable)
ENABLE_CSS_OPTIMIZATION=true

# Deshabilitar optimización CSS (por defecto)
ENABLE_CSS_OPTIMIZATION=false
```

## Notas Importantes

- **Next.js 15**: Asegúrate de que todas las dependencias sean compatibles con Next.js 15.4.1.
- **TypeScript 5.8.3**: Hay warnings sobre compatibilidad con @typescript-eslint, pero no afectan la funcionalidad.
- **Optimización CSS**: Monitorear cuando Next.js tenga optimización CSS nativa estable.

## Comandos Útiles

```bash
# Verificar dependencias
npm audit

# Verificar tipos
npm run type-check

# Linting
npm run lint

# Formateo
npm run format

# Tests
npm run test
``` 