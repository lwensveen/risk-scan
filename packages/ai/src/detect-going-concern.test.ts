import { beforeEach, describe, expect, it, vi } from 'vitest';
import { detectGoingConcern } from './detect-going-concern.js';

const { openAICtorSpy, createSpy } = vi.hoisted(() => {
  const createSpy = vi.fn();
  const openAICtorSpy = vi
    .fn()
    .mockReturnValue({ chat: { completions: { create: createSpy } } });
  return { openAICtorSpy, createSpy };
});

vi.mock('openai', () => ({
  default: openAICtorSpy,
}));

describe('detectGoingConcern', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when regex matches (no LLM call)', async () => {
    const text =
      'There is substantial doubt about our ability to continue as a going concern.';
    const out = await detectGoingConcern(text, { skipLLM: true });

    expect(out).toBe(true);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('returns false when regex misses and skipLLM=true', async () => {
    const out = await detectGoingConcern('Totally benign liquidity note.', {
      skipLLM: true,
    });
    expect(out).toBe(false);
    expect(createSpy).not.toHaveBeenCalled();
  });

  it('calls OpenAI and returns true when model says "true"', async () => {
    createSpy.mockResolvedValueOnce({
      choices: [{ message: { content: 'true' } }],
    });

    const out = await detectGoingConcern('No obvious regex hit here.');
    expect(out).toBe(true);

    expect(openAICtorSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledTimes(1);

    const arg = createSpy.mock.calls[0]![0];
    expect(arg.model).toBe('gpt-4o-mini');
    expect(arg.temperature).toBe(0);
    expect(arg.max_completion_tokens).toBe(1);
    expect(arg.messages[0].role).toBe('user');
  });

  it('returns false when model says "false"', async () => {
    createSpy.mockResolvedValueOnce({
      choices: [{ message: { content: 'false' } }],
    });

    const out = await detectGoingConcern('Still no regex hit...');
    expect(out).toBe(false);
  });

  it('trims & lowercases model answer', async () => {
    createSpy.mockResolvedValueOnce({
      choices: [{ message: { content: '  TRUE  \n' } }],
    });

    const out = await detectGoingConcern('regex miss, use llm');
    expect(out).toBe(true);
  });

  it('handles unexpected / empty LLM content safely (defaults to false)', async () => {
    createSpy.mockResolvedValueOnce({
      choices: [{ message: { content: '' } }],
    });

    const out = await detectGoingConcern('regex miss, weird llm output');
    expect(out).toBe(false);
  });

  it('passes custom model and apiKey from opts', async () => {
    createSpy.mockResolvedValueOnce({
      choices: [{ message: { content: 'true' } }],
    });

    const out = await detectGoingConcern('no regex hit', {
      model: 'gpt-4o-mini-something',
      apiKey: 'XYZ',
    });
    expect(out).toBe(true);

    expect(openAICtorSpy).toHaveBeenCalledWith({ apiKey: 'XYZ' });
    expect(createSpy.mock.calls[0]![0].model).toBe('gpt-4o-mini-something');
  });

  it('only sends first 7000 chars of footnote in prompt', async () => {
    createSpy.mockResolvedValueOnce({
      choices: [{ message: { content: 'false' } }],
    });

    const longText = 'a'.repeat(8000);
    await detectGoingConcern(longText);

    const [{ messages }] = createSpy.mock.calls[0]!;
    const sentPrompt: string = messages[0].content as string;

    const inBlock = sentPrompt.match(/"""([\s\S]*)"""/)?.[1] ?? '';
    expect(inBlock.length).toBeLessThanOrEqual(7010);
    expect(inBlock.length).toBeGreaterThan(6900);
  });
});
