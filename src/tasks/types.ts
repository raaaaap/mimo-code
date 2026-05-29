export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'killed';
export type TaskType = 'shell';

export interface TaskState {
  id: string;
  type: TaskType;
  status: TaskStatus;
  command: string;
  pid: number | null;
  outputFile: string;
  createdAt: number;
  completedAt: number | null;
  exitCode: number | null;
}
