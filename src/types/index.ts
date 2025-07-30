export type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai';
};

export interface TeacherProject {
  id: number;
  name: string;
}

export interface TeacherCourse {
  id: number;
  name: string;
  status: 'planning' | 'approved';
  courseProgressId: number | null;
}

export interface PlanStep {
  id: string;
  title: string;
  status?: 'locked' | 'unlocked' | 'completed';
}