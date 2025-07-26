import type { TeacherProject, TeacherCourse, PlanStep, Message } from '../types';
import { type StepState } from '../context/AppContext';


// Вспомогательная функция для заголовков
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Токен авторизации не найден");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const API_URL = 'http://localhost:3001/api/teacher';

interface CourseDataPayload {
  course: {
    id: number;
    topic: string;
    status: 'planning' | 'approved';
    plan: PlanStep[];
  };
  messages: Message[];
}

interface StepProgressData {
  id: number;
  course_progress_id: number;
  step_id: string;
  status: 'locked' | 'unlocked' | 'completed';
  messages_json: string | null;
  lesson_nodes_json: string | null;
  lesson_edges_json: string | null;
  clarification_nodes_json: string | null;
  clarification_edges_json: string | null;
  updated_at: string;
}

export const fetchKnowledgeBases = async (): Promise<TeacherProject[]> => {
    const response = await fetch(`${API_URL}/knowledge-bases`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Не удалось загрузить учебные проекты');
    }
    return response.json();
};


export const fetchCoursesForKB = async (kbId: number): Promise<TeacherCourse[]> => {
    const response = await fetch(`${API_URL}/knowledge-bases/${kbId}/courses`, { headers: getAuthHeaders() });
    if (!response.ok) {
        throw new Error('Не удалось загрузить курсы для проекта');
    }
    return response.json();
};

export const createCourse = async (kbId: number, topic: string): Promise<{ course: TeacherCourse }> => {
    const response = await fetch(`${API_URL}/knowledge-bases/${kbId}/courses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic }), // Отправляем только тему
    });
    if (!response.ok) {
        throw new Error('Не удалось создать курс');
    }
    return response.json();
};

export const approveCoursePlan = async (courseId: number, plan: PlanStep[]): Promise<{ courseProgressId: number }> => {
    const response = await fetch(`${API_URL}/courses/${courseId}/approve`, {
        method: 'PUT',
        headers: getAuthHeaders(),
         body: JSON.stringify({ plan }),
    });
    if (!response.ok) throw new Error('Не удалось утвердить план');
    return response.json();
};

export const fetchCourseData = async (courseId: number): Promise<CourseDataPayload> => {
    const response = await fetch(`${API_URL}/courses/${courseId}`, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error('Не удалось загрузить данные курса');
    return response.json();
};

export const sendCourseMessage = async (courseId: number, message: { sender: 'user' | 'ai', text: string }) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/messages`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(message),
    });
    if (!response.ok) {
        throw new Error('Не удалось сохранить сообщение курса');
    }
    return response.json();
};

export const updateCoursePlan = async (courseId: number, plan: PlanStep[]) => {
    const response = await fetch(`${API_URL}/courses/${courseId}/plan`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ plan }),
    });
    if (!response.ok) throw new Error('Не удалось обновить план');
    return response.json();
};

export const fetchStepProgress = async (courseProgressId: number, stepId: string): Promise<StepProgressData> => {
  const response = await fetch(`${API_URL}/progress/${courseProgressId}/step/${stepId}`, { headers: getAuthHeaders() });
  if (!response.ok) throw new Error('Не удалось загрузить прогресс шага');
  return response.json();
};

export const completeStep = async (stepProgressId: number) => {
    const response = await fetch(`${API_URL}/steps/${stepProgressId}/complete`, {
        method: 'PUT',
        headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error('Не удалось завершить шаг');
    return response.json();
};

export const saveStepState = async (stepProgressId: number, state: StepState) => {
    const response = await fetch(`${API_URL}/steps/${stepProgressId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(state),
    });
    if (!response.ok) throw new Error('Не удалось сохранить состояние шага');
    return response.json()
};