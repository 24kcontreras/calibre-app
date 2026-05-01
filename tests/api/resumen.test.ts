import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as resumenHandler } from '@/app/api/resumen/route';

global.fetch = vi.fn();

describe('API Resumen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('should generate a professional summary when given valid data', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: 'Informe técnico: Se cambió aceite y filtros.' }]
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const req = new Request('http://localhost/api/resumen', {
      method: 'POST',
      body: JSON.stringify({ 
        vehiculo: { marca: 'Ford', modelo: 'Ranger' }, 
        items: [{ descripcion: 'Aceite 5W30', precio: 50000, tipo_item: 'repuesto' }], 
        falla: 'Cambio de aceite' 
      }),
    });

    const response = await resumenHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resumen).toBe('Informe técnico: Se cambió aceite y filtros.');
  });

  it('should return a fallback summary when API fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const req = new Request('http://localhost/api/resumen', {
      method: 'POST',
      body: JSON.stringify({ 
        vehiculo: { marca: 'Ford', modelo: 'Ranger' }, 
        items: [], 
        falla: 'Falla' 
      }),
    });

    const response = await resumenHandler(req);
    const data = await response.json();

    expect(data.resumen).toContain('Se realizó la revisión técnica');
  });
});
