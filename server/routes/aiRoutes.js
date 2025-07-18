const express = require('express');
const router = express.Router();
const { queryKB } = require('../services/kbService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Инициализируем Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KB_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

// POST /api/ai/generate-plan - Эндпоинт для генерации учебного плана
router.post('/generate-plan', async (req, res) => {
    const { kbId, topic } = req.body;
    if (!kbId || !topic) return res.status(400).json({ error: '...' });

    try {
        // 1. Увеличиваем количество документов для контекста
        const contextDocs = await queryKB(kbId, topic, 20); 
        const context = contextDocs.map(doc => doc.pageContent).join('\n---\n');

        // 2. Обновляем промпт
        const plannerPrompt = `
            Твоя роль: AI-Тимлид, составляющий план онбординга для нового разработчика.
            Твоя задача: Создать пошаговый план обучения по конкретной теме в рамках существующего IT-проекта. План должен быть практическим и помогать новичку разобраться в устройстве **именно этого проекта**, а не в общих теоретических концепциях. Практических заданий быть не должно.
            
            ТЕМА ОНБОРДИНГА: "${topic}"

            КОНТЕКСТ ПРОЕКТА ИЗ БАЗЫ ЗНАНИЙ (фрагменты кода, документация):
            ---
            ${context}
            ---

             ПРАВИЛА ГЕНЕРАЦИИ ПЛАНА:
            1.  **Привязка к контексту:** Каждый шаг плана должен быть напрямую связан с предоставленным контекстом. Вместо "Что такое база данных?", правильный шаг — "1.1 Обзор схемы БД нашего проекта (таблицы users, projects)". Вместо "Изучение REST API", правильный шаг — "2.1 Анализ ключевых эндпоинтов в файле projectRoutes.js".
            2.  **Структура:** Разбей план на логические главы (1-3 главы) и подпункты (2-4 в каждой).
            3.  **Форматирование:** Обязательно используй Markdown для читаемости в твоем текстовом ответе (он не является частью JSON).
            4.  **Фокус на теории:** План должен быть теоретическим, без практических заданий "напиши код". Цель — понимание.

            ФОРМАТ ВЫХОДА:
            Твой ответ ДОЛЖЕН состоять из двух частей:
            1.  Сначала текстовое описание предложенного плана, отформатированное с помощью Markdown.
            2.  Сразу после текста, без лишних слов, ОБЯЗАТЕЛЬНО верни JSON-массив с планом, обернутый в теги \`\`\`json ... \`\`\`.
            
            Формат JSON:
            [
                { "id": "1.1", "title": "Название шага, привязанное к проекту" },
                { "id": "1.2", "title": "Следующий практический шаг по проекту" }
            ]
        `;
        console.log("ОТПРАВЛЯЕМ В API:", plannerPrompt);
        // ------------------------------------
        const result = await model.generateContent(plannerPrompt);
        const responseText = result.response.text();
        // ----------------------
        console.log("ПОЛУЧЕНО ОТ API:", responseText);

        res.json({ fullResponse: responseText });

    } catch (error) {
        console.error("Error in /generate-plan route:", error);
        res.status(500).json({ error: "Не удалось сгенерировать план." });
    }
});

module.exports = router;