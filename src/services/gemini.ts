import { GoogleGenerativeAI } from "@google/generative-ai";

// Получаем API ключ из переменных окружения
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Создаем главный объект Google AI
const genAI = new GoogleGenerativeAI(apiKey);

// Указываем, какую модель мы будем использовать
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

// Экспортируем готовую к использованию модель
export const geminiModel = model;