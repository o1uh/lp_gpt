import OpenAI from 'openai';

// Получаем API ключ из переменных окружения
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

// Создаем и экспортируем клиент OpenAI
export const openai = new OpenAI({
  apiKey: apiKey,
  // Этот флаг обязателен для использования API из браузера
  dangerouslyAllowBrowser: true, 
});