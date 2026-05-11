import { NextRequest, NextResponse } from 'next/server';
import { callAzureOpenAI } from '@/lib/azure';
import { parseAIJson } from '@/lib/utils';
import { Log } from '@/types';

export const dynamic = 'force-dynamic';

interface DigestResult {
  pattern: string;
  blind_spot: string;
  action: string;
  return_signal: 'Strong' | 'On Track' | 'Needs Attention' | 'At Risk';
}

export async function POST(req: NextRequest) {
  try {
    const { week_number, logs, role, company } = await req.json() as {
      week_number: number;
      logs: Log[];
      role: string;
      company: string;
    };

    const logSummary = logs
      .map((l) => `[Week ${l.week_number}] Tags: ${l.tags.join(', ')}\n${l.content}`)
      .join('\n\n');

    const systemPrompt = `You are a sharp, direct career coach analysing an intern's weekly journal.
Be specific and concrete. No platitudes. No generic advice.
Return ONLY valid JSON with no markdown fences or extra text.`;

    const userMessage = `Analyse these logs from a ${role} intern at ${company}, week ${week_number}.

LOGS:
${logSummary}

Return a JSON object with exactly these four keys:
- pattern: (string) The single most important behavioural pattern you see — specific, not generic. 1-2 sentences.
- blind_spot: (string) One thing they are missing or underestimating that could cost them a return offer. Be direct. 1-2 sentences.
- action: (string) One specific, concrete action to take this week. Not a platitude — a real task. 1-2 sentences.
- return_signal: (string) Exactly one of: "Strong", "On Track", "Needs Attention", "At Risk" — based on their trajectory toward a return offer.`;

    const raw = await callAzureOpenAI(systemPrompt, userMessage);
    const digest = parseAIJson<DigestResult>(raw);

    return NextResponse.json({ digest });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
