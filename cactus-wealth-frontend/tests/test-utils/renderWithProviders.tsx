import { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'

export function renderWithProviders(ui: ReactElement) {
  return render(<SessionProvider session={{ user: { name: 'Test User' } } as any}>{ui}</SessionProvider>)
}


