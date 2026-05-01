import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as analisisHandler } from '@/app/api/analisis/route';

global.fetch = vi.fn();

describe('API Analisis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('should return a technical analysis when given valid data', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: '<h3>Análisis Técnico</h3><p>Causa: Sensor MAF sucio.</p>' }]
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const req = new Request('http://localhost/api/analisis', {
      method: 'POST',
      body: JSON.stringify({ 
        falla: 'El auto se apaga en ralentí', 
        vehiculo: { marca: 'Honda', modelo: 'Civic' } 
      }),
    });

    const response = await analisisHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resultado).toBe('<h3>Análisis Técnico</h3><p>Causa: Sensor MAF sucio.</p>');
  });

  it('should return 500 when API fails', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const req = new Request('http://localhost/api/analisis', {
      method: 'POST',
      body: JSON.stringify({ 
        falla: 'Falla', 
        vehiculo: { marca: 'Honda', modelo: 'Civic' } 
      }),
    });

    const response = await analisisHandler(req);
    expect(response.status).toBe(500);
  });
});
