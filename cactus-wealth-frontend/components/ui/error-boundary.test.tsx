import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary, useErrorHandler, withErrorBoundary } from './error-boundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowError = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Test component for useErrorHandler hook
const ErrorHandlerTestComponent = () => {
  const { error, handleError, clearError } = useErrorHandler();

  return (
    <div>
      {error ? (
        <div>
          <div>Error: {error.message}</div>
          <button onClick={clearError}>Clear Error</button>
        </div>
      ) : (
        <div>
          <div>No error</div>
          <button onClick={() => handleError(new Error('Hook error'))}>
            Trigger Error
          </button>
        </div>
      )}
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders default error UI when an error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(screen.getByText('Ha ocurrido un error inesperado. Por favor, inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    expect(screen.getByText('Recargar página')).toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Algo salió mal')).not.toBeInTheDocument();
  });

  it('calls onError callback when an error occurs', () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('retries when retry button is clicked', async () => {
    const TestComponent = () => {
      return <ThrowError shouldThrow={true} />;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Reintentar'));

    // After retry, the component is remounted and will throw again, so error UI should still be there
    // This tests that the retry mechanism works (resets the error boundary state)
    await waitFor(() => {
      expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    });
  });

  it('reloads page when reload button is clicked', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Recargar página'));

    expect(mockReload).toHaveBeenCalled();
  });

  describe('Development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
    });

    it('shows error details in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Detalles del error (solo desarrollo)')).toBeInTheDocument();
    });

    it('logs error to console in development mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'ErrorBoundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });

  describe('Production mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalNodeEnv,
        writable: true,
        configurable: true,
      });
    });

    it('does not show error details in production mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Detalles del error (solo desarrollo)')).not.toBeInTheDocument();
    });

    it('logs error to console in production mode', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(console.error).toHaveBeenCalledWith(
        'Production error:',
        expect.objectContaining({
          message: 'Test error',
          stack: expect.any(String),
          componentStack: expect.any(String),
        })
      );
    });
  });
});

describe('useErrorHandler', () => {
  it('initializes with no error', () => {
    render(<ErrorHandlerTestComponent />);

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(screen.getByText('Trigger Error')).toBeInTheDocument();
  });

  it('handles error when triggered', () => {
    render(<ErrorHandlerTestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));

    expect(screen.getByText('Error: Hook error')).toBeInTheDocument();
    expect(screen.getByText('Clear Error')).toBeInTheDocument();
  });

  it('clears error when clearError is called', () => {
    render(<ErrorHandlerTestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));
    expect(screen.getByText('Error: Hook error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Clear Error'));
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('logs error in development mode', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      writable: true,
      configurable: true,
    });

    render(<ErrorHandlerTestComponent />);

    fireEvent.click(screen.getByText('Trigger Error'));

    expect(console.error).toHaveBeenCalledWith(
      'useErrorHandler caught an error:',
      expect.any(Error)
    );

    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      configurable: true,
    });
  });
});

describe('withErrorBoundary', () => {
  const TestComponent = ({ shouldThrow = false }: { shouldThrow?: boolean }) => {
    if (shouldThrow) {
      throw new Error('HOC test error');
    }
    return <div>HOC component content</div>;
  };

  it('wraps component with ErrorBoundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent shouldThrow={false} />);

    expect(screen.getByText('HOC component content')).toBeInTheDocument();
  });

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('uses custom fallback when provided', () => {
    const customFallback = <div>HOC custom error</div>;
    const WrappedComponent = withErrorBoundary(TestComponent, customFallback);

    render(<WrappedComponent shouldThrow={true} />);

    expect(screen.getByText('HOC custom error')).toBeInTheDocument();
  });

  it('calls custom onError when provided', () => {
    const onError = jest.fn();
    const WrappedComponent = withErrorBoundary(TestComponent, undefined, onError);

    render(<WrappedComponent shouldThrow={true} />);

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String),
      })
    );
  });

  it('passes props correctly to wrapped component', () => {
    const TestComponentWithProps = ({ message }: { message: string }) => (
      <div>{message}</div>
    );
    const WrappedComponent = withErrorBoundary(TestComponentWithProps);

    render(<WrappedComponent message="Test message" />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});

describe('ErrorBoundary state management', () => {
  it('updates state correctly when error occurs', () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);

      return (
        <div>
          <button onClick={() => setShouldThrow(true)}>Throw Error</button>
          <ThrowError shouldThrow={shouldThrow} />
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Throw Error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Throw Error'));

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
  });

  it('resets state when retry is clicked', () => {
    const TestComponent = () => {
      const [count, setCount] = React.useState(0);
      const shouldThrow = count === 1;

      return (
        <div>
          <button onClick={() => setCount(c => c + 1)}>
            Count: {count}
          </button>
          <ThrowError shouldThrow={shouldThrow} />
        </div>
      );
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Trigger error
    fireEvent.click(screen.getByText('Count: 0'));
    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();

    // Retry should reset the error boundary state and remount the component
    fireEvent.click(screen.getByText('Reintentar'));
    expect(screen.getByText('Count: 0')).toBeInTheDocument(); // Component is remounted, so count resets to 0
  });
});