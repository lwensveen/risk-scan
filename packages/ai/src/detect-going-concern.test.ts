import { expect, it } from 'vitest';
import { detectGoingConcern } from './detect-going-concern.js';

it('regex catches obvious phrasing', async () => {
  const text = 'There is substantial doubt about our ability to continue.';
  expect(await detectGoingConcern(text, { skipLLM: true })).toBe(true);
});
