export type NodeCategory = 'objective' | 'initiative' | 'milestone' | 'risk' | 'control' | 'metric';

export type Quarter = 'q1' | 'q2' | 'q3' | 'q4';

export type Status = 'planned' | 'active' | 'done' | 'blocked';

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface StrategyNodeData extends Record<string, unknown> {
  category: NodeCategory;
  quarter: Quarter;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  value?: string; // For metrics
  [key: string]: unknown;
}

export const QUARTER_CONFIG: Record<Quarter, { label: string; color: string; months: string }> = {
  q1: { label: 'Q1', color: '#00D26A', months: 'Jan - Mar' },
  q2: { label: 'Q2', color: '#3b82f6', months: 'Apr - Jun' },
  q3: { label: 'Q3', color: '#8b5cf6', months: 'Jul - Sep' },
  q4: { label: 'Q4', color: '#f59e0b', months: 'Oct - Dec' },
};

export const CATEGORY_CONFIG: Record<NodeCategory, { label: string; color: string; icon: string }> = {
  objective: { label: 'Objective', color: '#00D26A', icon: 'target' },
  initiative: { label: 'Initiative', color: '#3b82f6', icon: 'zap' },
  milestone: { label: 'Milestone', color: '#8b5cf6', icon: 'flag' },
  risk: { label: 'Risk', color: '#ef4444', icon: 'alert' },
  control: { label: 'Control', color: '#14b8a6', icon: 'shield' },
  metric: { label: 'Metric', color: '#f59e0b', icon: 'chart' },
};

export const STATUS_CONFIG: Record<Status, { label: string; color: string }> = {
  planned: { label: 'Planned', color: '#6a6a6a' },
  active: { label: 'Active', color: '#3b82f6' },
  done: { label: 'Done', color: '#00D26A' },
  blocked: { label: 'Blocked', color: '#ef4444' },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  low: { label: 'Low', color: '#6a6a6a' },
  medium: { label: 'Medium', color: '#3b82f6' },
  high: { label: 'High', color: '#f59e0b' },
  critical: { label: 'Critical', color: '#ef4444' },
};
