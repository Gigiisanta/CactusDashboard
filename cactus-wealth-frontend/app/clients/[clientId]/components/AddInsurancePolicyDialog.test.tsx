import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddInsurancePolicyDialog } from './AddInsurancePolicyDialog';
import { DialogDescription } from '@/components/ui/dialog';

describe('AddInsurancePolicyDialog', () => {
  it('renders and opens dialog', () => {
    render(
      <AddInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
      />
    );
    expect(screen.getByText(/Añadir Póliza de Seguro/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const onSubmit = jest.fn();
    render(
      <AddInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Crear Póliza/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form', async () => {
    const onSubmit = jest.fn().mockResolvedValueOnce({});
    render(
      <AddInsurancePolicyDialog
        open={true}
        onOpenChange={jest.fn()}
        onSubmit={onSubmit}
      />
    );
    
    // Fill in the policy number
    fireEvent.change(screen.getByLabelText(/número de póliza/i), {
      target: { value: '123' },
    });
    
    // For Select component, we need to click the trigger and then select an option
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    
    // Wait for the options to appear and click on "Seguro de Vida"
    await waitFor(() => {
      const vidaOption = screen.getByRole('option', { name: 'Seguro de Vida' });
      fireEvent.click(vidaOption);
    });
    
    // Fill in the premium amount
    fireEvent.change(screen.getByLabelText(/prima/i), {
      target: { value: '1000' },
    });
    
    // Fill in the coverage amount
    fireEvent.change(screen.getByLabelText(/cobertura/i), {
      target: { value: '5000' },
    });
    
    // Submit the form
    const submitButton = screen.getByText('Crear Póliza');
    fireEvent.click(submitButton);
    
    // Add a small delay to allow for any async operations
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });
});
