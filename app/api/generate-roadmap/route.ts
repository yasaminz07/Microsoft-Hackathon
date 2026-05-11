import { NextRequest, NextResponse } from 'next/server';
import { callAzureOpenAI } from '@/lib/azure';
import { parseAIJson } from '@/lib/utils';
import { RoadmapWeek } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, role, company, start_date, end_date } = await req.json();

    const systemPrompt = `You are a career coaching assistant specialising in internship success.
Return ONLY a valid JSON array with no markdown, no explanation, no extra text.`;

    const userMessage = `Create a 12-week internship roadmap for ${name}, a ${role} intern at ${company}.
Internship runs from ${start_date} to ${end_date}.
Return a JSON array of exactly 12 objects, each with: week (number 1-12), focus (2-4 word theme), goal (one specific, actionable sentence).
Focus on visibility, relationship building, technical delivery, and signalling return interest.`;

    const raw = await callAzureOpenAI(systemPrompt, userMessage);
    const roadmap = parseAIJson<RoadmapWeek[]>(raw);

    return NextResponse.json({ roadmap });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
