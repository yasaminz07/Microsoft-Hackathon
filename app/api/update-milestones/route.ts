import { NextRequest, NextResponse } from 'next/server';
import { callAzureOpenAI } from '@/lib/azure';
import { parseAIJson } from '@/lib/utils';
import { Log, Milestone } from '@/types';

export const dynamic = 'force-dynamic';

interface MilestoneUpdate {
  id: string;
  status: 'done' | 'at-risk' | 'pending';
}

export async function POST(req: NextRequest) {
  try {
    const { logs, milestones, current_week } = await req.json() as {
      logs: Log[];
      milestones: Milestone[];
      current_week: number;
    };

    const logSummary = logs
      .map((l) => `[Week ${l.week_number}] ${l.tags.join(', ')}: ${l.content}`)
      .join('\n');

    const milestoneSummary = milestones
      .map((m) => `id: ${m.id} | week: ${m.week_number} | title: ${m.title} | current status: ${m.status}`)
      .join('\n');

    const systemPrompt = `You are assessing internship milestone completion based on journal logs.
Return ONLY valid JSON array, no markdown, no explanation.`;

    const userMessage = `Current week: ${current_week}

JOURNAL LOGS:
${logSummary}

MILESTONES TO ASSESS:
${milestoneSummary}

For each milestone, assess whether evidence in the logs suggests it is "done", "at-risk", or "pending".
- "done": clear evidence in the logs that this was completed
- "at-risk": the milestone week has passed or is current with no evidence of progress
- "pending": not yet due or no strong signal either way

Return a JSON array of objects with exactly: { "id": string, "status": "done" | "at-risk" | "pending" }
Include every milestone in the response.`;

    const raw = await callAzureOpenAI(systemPrompt, userMessage);
    const updates = parseAIJson<MilestoneUpdate[]>(raw);

    return NextResponse.json({ updates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
