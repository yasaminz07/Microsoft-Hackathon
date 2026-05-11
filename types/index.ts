export interface Profile {
  id: string;
  user_id: string;
  name: string;
  company: string;
  role: string;
  start_date: string;
  end_date: string;
  roadmap: RoadmapWeek[] | null;
  created_at: string;
}

export interface RoadmapWeek {
  week: number;
  focus: string;
  goal: string;
}

export interface Log {
  id: string;
  profile_id: string;
  content: string;
  tags: string[];
  week_number: number;
  created_at: string;
}

export interface Digest {
  id: string;
  profile_id: string;
  week_number: number;
  pattern: string;
  blind_spot: string;
  action: string;
  return_signal: ReturnSignal;
  created_at: string;
}

export interface Milestone {
  id: string;
  profile_id: string;
  week_number: number;
  title: string;
  description: string;
  status: MilestoneStatus;
  created_at: string;
}

export type ReturnSignal = 'Strong' | 'On Track' | 'Needs Attention' | 'At Risk';
export type MilestoneStatus = 'pending' | 'done' | 'at-risk';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}
