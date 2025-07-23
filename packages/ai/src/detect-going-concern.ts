import OpenAI from 'openai';

export interface DetectOptions {
  model?: string;
  apiKey?: string;
  skipLLM?: boolean;
}

const REGEX = new RegExp(
  [
    'going concern',
    'substantial doubt',
    'liquidity[\\w\\s]{0,20}doubt',
    'ability to continue',
    'cash burn',
    'material uncertainty',
    'insufficient liquidity',
  ].join('|'),
  'i'
);

export async function detectGoingConcern(
  footnoteText: string,
  opts: DetectOptions = {}
): Promise<boolean> {
  if (REGEX.test(footnoteText)) return true;

  if (opts.skipLLM) return false;

  const openai = new OpenAI({
    apiKey: opts.apiKey ?? process.env.OPENAI_API_KEY,
  });

  const prompt = `
  Read the following footnote from an SEC filing.
  Answer ONLY "true" or "false" (no other words).
  
  Return **true** if the company, its management, or its auditor
  expresses doubt about the firm's ability to continue operating
  (e.g. "substantial doubt about our ability to continue as a going concern").
  Otherwise return **false**.
  
  Footnote:
  """
  ${footnoteText.slice(0, 7000)}  
  """`;

  const resp = await openai.chat.completions.create({
    model: opts.model ?? 'gpt-4o-mini',
    temperature: 0,
    max_completion_tokens: 1,
    messages: [{ role: 'user', content: prompt.trim() }],
  });

  const answer = resp.choices[0]!.message.content?.trim().toLowerCase();
  return answer === 'true';
}
