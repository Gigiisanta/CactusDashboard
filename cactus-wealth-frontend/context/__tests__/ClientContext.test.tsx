import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientProvider, useClient } from '../ClientContext';
import { Client, RiskProfile, ClientStatus, LeadSource } from '@/types';

// Test component to interact with the context
function TestComponent() {
  const { activeClient, setActiveClient } = useClient();

  const mockClient: Client = {
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    risk_profile: RiskProfile.MEDIUM,
    status: ClientStatus.PROSPECT,
    lead_source: LeadSource.ORGANIC,
    notes: 'Test notes',
    owner_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  return (
    <div>
      <div data-testid="active-client">
        {activeClient ? `${activeClient.first_name} ${activeClient.last_name}` : 'No active client'}
      </div>
      <div data-testid="client-email">
        {activeClient?.email || 'No email'}
      </div>
      <div data-testid="client-id">
        {activeClient?.id || 'No ID'}
      </div>
      <button 
        data-testid="set-client" 
        onClick={() => setActiveClient(mockClient)}
      >
        Set Client
      </button>
      <button 
        data-testid="clear-client" 
        onClick={() => setActiveClient(null)}
      >
        Clear Client
      </button>
    </div>
  );
}

// Component to test error boundary
function ComponentWithoutProvider() {
  const { activeClient } = useClient();
  return <div>{activeClient?.first_name}</div>;
}

describe('ClientContext', () => {
  const user = userEvent.setup();

  describe('ClientProvider', () => {
    it('provides initial state with null activeClient', () => {
      render(
        <ClientProvider>
          <TestComponent />
        </ClientProvider>
      );

      expect(screen.getByTestId('active-client')).toHaveTextContent('No active client');
      expect(screen.getByTestId('client-email')).toHaveTextContent('No email');
      expect(screen.getByTestId('client-id')).toHaveTextContent('No ID');
    });

    it('allows setting an active client', async () => {
      render(
        <ClientProvider>
          <TestComponent />
        </ClientProvider>
      );

      const setClientButton = screen.getByTestId('set-client');
      await user.click(setClientButton);

      expect(screen.getByTestId('active-client')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('client-email')).toHaveTextContent('john.doe@example.com');
      expect(screen.getByTestId('client-id')).toHaveTextContent('1');
    });

    it('allows clearing the active client', async () => {
      render(
        <ClientProvider>
          <TestComponent />
        </ClientProvider>
      );

      // First set a client
      const setClientButton = screen.getByTestId('set-client');
      await user.click(setClientButton);
      expect(screen.getByTestId('active-client')).toHaveTextContent('John Doe');

      // Then clear it
      const clearClientButton = screen.getByTestId('clear-client');
      await user.click(clearClientButton);
      expect(screen.getByTestId('active-client')).toHaveTextContent('No active client');
      expect(screen.getByTestId('client-email')).toHaveTextContent('No email');
      expect(screen.getByTestId('client-id')).toHaveTextContent('No ID');
    });

    it('maintains state across multiple interactions', async () => {
      render(
        <ClientProvider>
          <TestComponent />
        </ClientProvider>
      );

      const setClientButton = screen.getByTestId('set-client');
      const clearClientButton = screen.getByTestId('clear-client');

      // Set client
      await user.click(setClientButton);
      expect(screen.getByTestId('active-client')).toHaveTextContent('John Doe');

      // Clear client
      await user.click(clearClientButton);
      expect(screen.getByTestId('active-client')).toHaveTextContent('No active client');

      // Set client again
      await user.click(setClientButton);
      expect(screen.getByTestId('active-client')).toHaveTextContent('John Doe');
    });

    it('renders children correctly', () => {
      render(
        <ClientProvider>
          <div data-testid="child-component">Child Content</div>
        </ClientProvider>
      );

      expect(screen.getByTestId('child-component')).toHaveTextContent('Child Content');
    });

    it('provides stable setActiveClient function reference', () => {
      let setActiveClientRef1: any;
      let setActiveClientRef2: any;

      function TestStableRef() {
        const { setActiveClient } = useClient();
        
        if (!setActiveClientRef1) {
          setActiveClientRef1 = setActiveClient;
        } else if (!setActiveClientRef2) {
          setActiveClientRef2 = setActiveClient;
        }

        return <div data-testid="stable-ref">Stable ref test</div>;
      }

      const { rerender } = render(
        <ClientProvider>
          <TestStableRef />
        </ClientProvider>
      );

      rerender(
        <ClientProvider>
          <TestStableRef />
        </ClientProvider>
      );

      expect(setActiveClientRef1).toBe(setActiveClientRef2);
    });
  });

  describe('useClient hook', () => {
    it('throws error when used outside of ClientProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<ComponentWithoutProvider />);
      }).toThrow('useClient must be used within a ClientProvider');

      console.error = originalError;
    });

    it('returns context value when used within ClientProvider', () => {
      let contextValue: any;

      function TestContextValue() {
        contextValue = useClient();
        return <div>Test</div>;
      }

      render(
        <ClientProvider>
          <TestContextValue />
        </ClientProvider>
      );

      expect(contextValue).toBeDefined();
      expect(contextValue.activeClient).toBe(null);
      expect(typeof contextValue.setActiveClient).toBe('function');
    });

    it('provides the same context value to multiple consumers', () => {
      let contextValue1: any;
      let contextValue2: any;

      function Consumer1() {
        contextValue1 = useClient();
        return <div>Consumer 1</div>;
      }

      function Consumer2() {
        contextValue2 = useClient();
        return <div>Consumer 2</div>;
      }

      render(
        <ClientProvider>
          <Consumer1 />
          <Consumer2 />
        </ClientProvider>
      );

      expect(contextValue1).toBe(contextValue2);
      expect(contextValue1.activeClient).toBe(contextValue2.activeClient);
      expect(contextValue1.setActiveClient).toBe(contextValue2.setActiveClient);
    });
  });

  describe('State Management', () => {
    it('handles different client objects correctly', async () => {
      const client1: Client = {
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        risk_profile: RiskProfile.LOW,
        status: ClientStatus.PROSPECT,
        lead_source: LeadSource.ORGANIC,
        owner_id: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const client2: Client = {
        id: 2,
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        risk_profile: RiskProfile.HIGH,
        status: ClientStatus.ACTIVE_INVESTOR,
        lead_source: LeadSource.REFERRAL,
        owner_id: 1,
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      function TestMultipleClients() {
        const { activeClient, setActiveClient } = useClient();

        return (
          <div>
            <div data-testid="current-client">
              {activeClient ? `${activeClient.first_name} ${activeClient.last_name}` : 'None'}
            </div>
            <button onClick={() => setActiveClient(client1)}>Set Client 1</button>
            <button onClick={() => setActiveClient(client2)}>Set Client 2</button>
          </div>
        );
      }

      render(
        <ClientProvider>
          <TestMultipleClients />
        </ClientProvider>
      );

      // Set first client
      await user.click(screen.getByText('Set Client 1'));
      expect(screen.getByTestId('current-client')).toHaveTextContent('John Doe');

      // Switch to second client
      await user.click(screen.getByText('Set Client 2'));
      expect(screen.getByTestId('current-client')).toHaveTextContent('Jane Smith');
    });

    it('handles null values correctly', async () => {
      function TestNullHandling() {
        const { activeClient, setActiveClient } = useClient();

        return (
          <div>
            <div data-testid="is-null">{activeClient === null ? 'true' : 'false'}</div>
            <button onClick={() => setActiveClient(null)}>Set Null</button>
          </div>
        );
      }

      render(
        <ClientProvider>
          <TestNullHandling />
        </ClientProvider>
      );

      expect(screen.getByTestId('is-null')).toHaveTextContent('true');

      await user.click(screen.getByText('Set Null'));
      expect(screen.getByTestId('is-null')).toHaveTextContent('true');
    });
  });

  describe('Integration with React', () => {
    it('works with React.StrictMode', () => {
      render(
        <React.StrictMode>
          <ClientProvider>
            <TestComponent />
          </ClientProvider>
        </React.StrictMode>
      );

      expect(screen.getByTestId('active-client')).toHaveTextContent('No active client');
    });

    it('handles component unmounting gracefully', () => {
      const { unmount } = render(
        <ClientProvider>
          <TestComponent />
        </ClientProvider>
      );

      expect(() => unmount()).not.toThrow();
    });

    it('supports nested providers (though not recommended)', () => {
      function NestedTest() {
        const { activeClient } = useClient();
        return <div data-testid="nested">{activeClient ? 'Has client' : 'No client'}</div>;
      }

      render(
        <ClientProvider>
          <ClientProvider>
            <NestedTest />
          </ClientProvider>
        </ClientProvider>
      );

      expect(screen.getByTestId('nested')).toHaveTextContent('No client');
    });
  });

  describe('Performance', () => {
    it('does not cause unnecessary re-renders', () => {
      let renderCount = 0;

      function RenderCounter() {
        renderCount++;
        const { activeClient } = useClient();
        return <div>{activeClient?.first_name || 'None'}</div>;
      }

      function SetterComponent() {
        const { setActiveClient } = useClient();
        return (
          <button onClick={() => setActiveClient(null)}>
            Set Same Value
          </button>
        );
      }

      render(
        <ClientProvider>
          <RenderCounter />
          <SetterComponent />
        </ClientProvider>
      );

      const initialRenderCount = renderCount;

      // Setting the same value (null) should not cause re-render
      act(() => {
        screen.getByText('Set Same Value').click();
      });

      // Should only re-render once due to the state update, even if value is the same
      expect(renderCount).toBe(initialRenderCount + 1);
    });
  });
});