'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sprout } from 'lucide-react';

interface EditSavingsCapacityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCapacity: number;
  onSubmit: (capacity: number) => void;
}

export function EditSavingsCapacityDialog({
  open,
  onOpenChange,
  currentCapacity,
  onSubmit,
}: EditSavingsCapacityDialogProps) {
  const [capacity, setCapacity] = useState(currentCapacity.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const numericCapacity = parseFloat(capacity) || 0;
      await onSubmit(numericCapacity);
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating savings capacity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setCapacity(currentCapacity.toString());
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-green-600" />
            Editar Capacidad de Ahorro
          </DialogTitle>
          <DialogDescription>
            Ingresa la capacidad de ahorro mensual del cliente.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="capacity" className="text-right">
                Capacidad
              </Label>
              <div className="col-span-3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="capacity"
                  type="number"
                  step="0.01"
                  min="0"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="pl-8"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}