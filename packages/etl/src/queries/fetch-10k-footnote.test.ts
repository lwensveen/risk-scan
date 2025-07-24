import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { resolveCik } from './resolve-cik.js';

vi.mock('axios');
vi.mock('./resolve-cik.js', async () => ({
  resolveCik: vi.fn(),
}));

const mockedAxios = axios as unknown as {
  get: ReturnType<typeof vi.fn>;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('fetchLatest10KFootnote', () => {
  it('should throw if CIK is not found', async () => {
    (resolveCik as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const { fetchLatest10KFootnote } = await import('./fetch-10k-footnote.js');

    await expect(fetchLatest10KFootnote('XYZ')).rejects.toThrow(
      'CIK not found for XYZ'
    );
  });

  it('should throw if no 10-K filing exists', async () => {
    (resolveCik as ReturnType<typeof vi.fn>).mockResolvedValue('123456789');

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        filings: {
          recent: {
            form: ['10-Q'],
            accessionNumber: ['0000000000-00-000000'],
            primaryDocument: ['doc.htm'],
          },
        },
      },
    });

    const { fetchLatest10KFootnote } = await import('./fetch-10k-footnote.js');

    await expect(fetchLatest10KFootnote('XYZ')).rejects.toThrow(
      'No 10‑K found for XYZ'
    );
  });

  it('should return parsed footnote from 10-K HTML', async () => {
    (resolveCik as ReturnType<typeof vi.fn>).mockResolvedValue('123456789');

    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          filings: {
            recent: {
              form: ['10-K'],
              accessionNumber: ['0001234567-89-000001'],
              primaryDocument: ['report.htm'],
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: '<html><TABLE><tr><td>Note 1</td></tr></TABLE></html>',
      });

    const { fetchLatest10KFootnote } = await import('./fetch-10k-footnote.js');

    const result = await fetchLatest10KFootnote('XYZ');
    expect(result).toContain('Note 1');
  });

  it('should return null if no TABLE tag found in HTML', async () => {
    (resolveCik as ReturnType<typeof vi.fn>).mockResolvedValue('123456789');

    mockedAxios.get
      .mockResolvedValueOnce({
        data: {
          filings: {
            recent: {
              form: ['10-K'],
              accessionNumber: ['0001234567-89-000001'],
              primaryDocument: ['report.htm'],
            },
          },
        },
      })
      .mockResolvedValueOnce({
        data: '<html><p>No table here</p></html>',
      });

    const { fetchLatest10KFootnote } = await import('./fetch-10k-footnote.js');

    const result = await fetchLatest10KFootnote('XYZ');
    expect(result).toBeNull();
  });
});
