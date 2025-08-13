import { test as base, expect, request } from '@playwright/test'

type AuthFixtures = { authToken: string }

export const test = base.extend<AuthFixtures>({
  authToken: async ({}, use) => {
    const api = await request.newContext({ baseURL: process.env.BACKEND_URL || 'http://localhost:8000' })
    const res = await api.post('/api/v1/auth/login/access-token', {
      form: {
        username: process.env.E2E_USER || 'admin@cactuswealth.com',
        password: process.env.E2E_PASS || 'admin123',
      },
    })
    expect(res.ok()).toBeTruthy()
    const data = await res.json()
    const token = data?.access_token as string
    await use(token)
    await api.dispose()
  },
})

export const expect = base.expect


