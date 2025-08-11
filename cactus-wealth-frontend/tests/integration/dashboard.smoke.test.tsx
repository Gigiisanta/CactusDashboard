import { renderWithProviders } from '../test-utils/renderWithProviders'
import { waitFor } from '@testing-library/react'
import Page from '../../app/dashboard/page'

it('renderiza Dashboard', async () => {
  const { getByText } = renderWithProviders(<Page />)
  await waitFor(() => {
    expect(getByText('Dashboard')).toBeInTheDocument()
  })
})


