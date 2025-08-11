import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '../page';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseSearchParams = useSearchParams as jest.MockedFunction<typeof useSearchParams>;

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    } as any);

    mockUseSearchParams.mockReturnValue({
      get: mockGet,
    } as any);

    mockGetSession.mockResolvedValue(null);
  });

  it('renders login form with all required elements', () => {
    render(<LoginPage />);

    // Check for main elements
    expect(screen.getByText('Cactus Wealth')).toBeInTheDocument();
    expect(screen.getByText('Inicia sesión en tu cuenta')).toBeInTheDocument();
    
    // Check for form fields
    expect(screen.getByLabelText('Email o Usuario')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    
    // Check for buttons
    expect(screen.getByRole('button', { name: 'Continuar con Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar Sesión' })).toBeInTheDocument();
    
    // Check for links
    expect(screen.getByRole('link', { name: 'Regístrate aquí' })).toBeInTheDocument();
  });

  it('handles Google OAuth login', async () => {
    // next-auth signIn resolves to SignInResponse | undefined; cast to any for test flexibility
    mockSignIn.mockResolvedValue(undefined as any);
    
    render(<LoginPage />);
    
    const googleButton = screen.getByRole('button', { name: 'Continuar con Google' });
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('google', {
        callbackUrl: '/dashboard',
      });
    });
  });

  it('handles credentials login successfully', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: undefined, status: 200, url: '/dashboard' } as any);
    mockGetSession.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test User' },
    } as any);
    
    render(<LoginPage />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email o Usuario'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password123' },
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', {
        emailOrUsername: 'test@example.com',
        password: 'password123',
        redirect: false,
      });
    });
    
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('handles credentials login error', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'Credenciales inválidas', status: 401, url: '' } as any);
    
    render(<LoginPage />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email o Usuario'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'wrongpassword' },
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Credenciales inválidas')).toBeInTheDocument();
    });
  });

  it('handles network error during login', async () => {
    mockSignIn.mockRejectedValue(new Error('Network error'));
    
    render(<LoginPage />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email o Usuario'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password123' },
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error de conexión. Inténtalo de nuevo.')).toBeInTheDocument();
    });
  });

  it('shows error from URL parameters', () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'error') return 'CredentialsSignin';
      return null;
    });
    
    render(<LoginPage />);
    
    expect(screen.getByText('Credenciales inválidas. Verifica tu email/usuario y contraseña.')).toBeInTheDocument();
  });

  it('shows email not verified error from URL', () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'error') return 'EmailNotVerified';
      return null;
    });
    
    render(<LoginPage />);
    
    expect(screen.getByText('Email no verificado. Revisa tu bandeja de entrada.')).toBeInTheDocument();
  });

  it('clears error when user starts typing', async () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'error') return 'CredentialsSignin';
      return null;
    });
    
    render(<LoginPage />);
    
    // Error should be visible initially
    expect(screen.getByText('Credenciales inválidas. Verifica tu email/usuario y contraseña.')).toBeInTheDocument();
    
    // Start typing
    fireEvent.change(screen.getByLabelText('Email o Usuario'), {
      target: { value: 'test' },
    });
    
    // Error should be cleared
    await waitFor(() => {
      expect(screen.queryByText('Credenciales inválidas. Verifica tu email/usuario y contraseña.')).not.toBeInTheDocument();
    });
  });

  it('toggles password visibility', () => {
    render(<LoginPage />);
    
    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: '' }); // Eye icon button
    
    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');
    
    // Click to show password
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    
    // Click to hide password again
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('handles session creation failure', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: undefined, status: 200, url: '/dashboard' } as any);
    mockGetSession.mockResolvedValue(null); // No session created
    
    render(<LoginPage />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email o Usuario'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password123' },
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Error creando la sesión. Inténtalo de nuevo.')).toBeInTheDocument();
    });
  });

  it('uses custom callback URL from search params', () => {
    mockGet.mockImplementation((param: string) => {
      if (param === 'callbackUrl') return '/custom-page';
      return null;
    });
    
    render(<LoginPage />);
    
    const googleButton = screen.getByRole('button', { name: 'Continuar con Google' });
    fireEvent.click(googleButton);
    
    expect(mockSignIn).toHaveBeenCalledWith('google', {
      callbackUrl: '/custom-page',
    });
  });

  it('shows loading state during login', async () => {
    mockSignIn.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<LoginPage />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('Email o Usuario'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'password123' },
    });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' });
    fireEvent.click(submitButton);
    
    // Should show loading state
    expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
}); 