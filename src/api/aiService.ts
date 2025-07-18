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

/**
 * Отправляет запрос на генерацию учебного плана.
 * @param kbId - ID Базы Знаний
 * @param topic - Тема для генерации плана
 */
export const generatePlan = async (kbId: number, topic: string): Promise<{ fullResponse: string }> => {
    const response = await fetch(`${API_URL}/generate-plan`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ kbId, topic }),
    });
    if (!response.ok) {
        throw new Error('Не удалось сгенерировать план обучения');
    }
    return response.json();
};