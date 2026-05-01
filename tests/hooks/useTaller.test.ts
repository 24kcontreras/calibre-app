import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTaller } from '@/hooks/useTaller';
import { supabase } from '@/lib/supabase';

describe('useTaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useTaller());

    await waitFor(() => {
        expect(result.current.authLoading).toBe(false);
    });

    expect(result.current.vehiculos).toEqual([]);
    expect(result.current.ordenesAbiertas).toEqual([]);
    expect(result.current.nombreTaller).toBe('MI TALLER');
  });

  it('should call cargarTodo and update state when session is present', async () => {
    const mockSession = {
      user: {
        id: 'test-user-id',
        user_metadata: { nombre_taller: 'Taller de Prueba' }
      }
    };

    const mockTallerData = { id: 'test-user-id', nombre_taller: 'Taller de Prueba', pago_confirmado: true };
    const mockVehiculos = [{ id: 'v1', patente: 'ABCD12' }];
    const mockOrdenes = [{ id: 'o1', estado: 'Abierta' }];

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    // We mock .from() to return a specific chain for each table
    (supabase.from as any).mockImplementation((table: string) => {
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        if (table === 'talleres') {
            chain.single.mockResolvedValue({ data: mockTallerData, error: null });
        } else if (table === 'vehiculos') {
            chain.order.mockResolvedValue({ data: mockVehiculos, error: null });
        } else if (table === 'ordenes_trabajo') {
            // This is tricky because it's called twice. 
            // We can use a counter or just return a fixed value if we don't care about the difference.
            // But the hook differentiates between "Abiertas" and "Historial".
            // For this test, we'll just return mockOrdenes.
            chain.order.mockResolvedValue({ data: mockOrdenes, error: null });
        }
        return chain;
    });

    const { result } = renderHook(() => useTaller());

    await act(async () => {
        await result.current.cargarTodo('test-user-id');
    });

    expect(result.current.nombreTaller).toBe('Taller de Prueba');
    expect(result.current.vehiculos).toEqual(mockVehiculos);
    expect(result.current.ordenesAbiertas).toEqual(mockOrdenes);
  });
});
