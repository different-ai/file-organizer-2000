export type AttentionPower = 'Squirrel' | 'Caffeinated' | 'Hyperfocus' | 'Time Lord'

export type Link = {
  url: string;
  title: string;
}

export type SubTask = {
  id: number;
  name: string;
  description: string;
  completed: boolean;
  timeEstimate: number;
}

export type CreateTask = {
  name: string;
  description: string;
  detailNeeded: boolean;
  attentionPower: AttentionPower;
  timeEstimate: number;
  points: number;
}


export interface Task extends CreateTask {
  id?: string;
  name: string;
  description: string;
  detailNeeded: boolean;
  attentionPower: AttentionPower;
  timeEstimate: number;
  points: number;
  parentTaskId: string | null;
  details?: string;
  status: 'active' | 'completed' | 'archived' | 'ignored';
  importance: string;
  rawMessage: string;
  links: Link[] | null;
  isMainTask: boolean | null;
}

export type UserStats = {
  points: number;
  level: number;
  streak: number;
}

export type ProcessedObject = {
  tasks: Task[];
  
};
