import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as scannerHandler } from '@/app/api/scanner/route';
import { NextRequest, NextResponse } from 'next/server';

// Mock fetch to avoid real API calls to Gemini
global.fetch = vi.fn();

describe('API Scanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test-key';
  });

  it('should return a valid result when Gemini API responds successfully', async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: '<b>🔍 DIAGNÓSTICO:</b><br>Falla en sensor MAP.' }]
          }
        }
      ]
    };

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const req = new Request('http://localhost/api/scanner', {
      method: 'POST',
      body: JSON.stringify({ 
        codigo: 'P0101', 
        vehiculo: 'Toyota Hilux', 
        tipo: 'scanner' 
      }),
    });

    const response = await scannerHandler(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resultado).toBe('<b>🔍 DIAGNÓSTICO:</b><br>Falla en sensor MAP.');
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('gemini-2.5-flash'),
        expect.any(Object)
    );
  });

  it('should return an error message when API Key is missing', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const req = new Request('http://localhost/api/scanner', {
      method: 'POST',
      body: JSON.stringify({ 
        codigo: 'P0101', 
        vehiculo: 'Toyota Hilux', 
        tipo: 'scanner' 
      }),
    });

    const response = await scannerHandler(req);
    const data = await response.json();

    expect(data.resultado).toContain('Error de conexión');
  });

  it('should handle API failure gracefully', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const req = new Request('http://localhost/api/scanner', {
      method: 'POST',
      body: JSON.stringify({ 
        codigo: 'P0101', 
        vehiculo: 'Toyota Hilux', 
        tipo: 'scanner' 
      }),
    });

    const response = await scannerHandler(req);
    const data = await response.json();

    expect(data.resultado).toContain('Error de conexión');
  });
});
