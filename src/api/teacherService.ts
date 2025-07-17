import type { TeacherProject, TeacherCourse } from '../types';

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
        body: JSON.stringify({ topic }),
    });
    if (!response.ok) {
        throw new Error('Не удалось создать курс');
    }
    return response.json();
};