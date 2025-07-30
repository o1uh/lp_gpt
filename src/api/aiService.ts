import type { HistoryItem } from '../hooks/useChat';
import type { PlanStep } from '../types';
import type { StepState } from '../context/AppContext';


// Вспомогательная функция для заголовков (можно вынести в общий файл)
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("Токен авторизации не найден");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const API_URL = 'http://localhost:3001/api/ai';

export const getPlanUpdate = async (kbId: number, topic: string, history: HistoryItem[]): Promise<{ fullResponse: string }> => {
    const response = await fetch(`${API_URL}/plan-chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ kbId, topic, history }),
    });
    if (!response.ok) {
        throw new Error('Не удалось получить ответ от планировщика');
    }
    return response.json();
};

export const tutorChat = async (kbId: number, step: PlanStep, history: HistoryItem[], state: StepState): Promise<{ fullResponse: string }> => {
    const response = await fetch(`${API_URL}/tutor-chat`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
            kbId, 
            step, 
            history,
            lessonNodes: state.lessonNodes,
            lessonEdges: state.lessonEdges,
            clarificationNodes: state.clarificationNodes,
            clarificationEdges: state.clarificationEdges
        }),
    });
    if (!response.ok) {
        throw new Error('Не удалось получить ответ от AI-Учителя');
    }
    return response.json();
};