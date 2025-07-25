const express = require('express');
const router = express.Router();
const { queryKB } = require('../services/kbService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KB_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash"});

// POST /api/ai/plan-chat - Универсальный эндпоинт для диалога о плане
router.post('/plan-chat', async (req, res) => {
    // Теперь принимаем историю сообщений
    const { kbId, topic, history } = req.body; 

    if (!kbId || !topic) {
        return res.status(400).json({ error: 'Необходимо указать ID Базы Знаний и тему' });
    }

    try {
        const contextDocs = await queryKB(kbId, topic, 20);
        const context = contextDocs.map(doc => doc.pageContent).join('\n---\n');

        const plannerPrompt = `
            Твоя роль: AI-Тимлид, составляющий план онбординга для нового разработчика.
            Твоя задача: Вести с пользователем диалог для создания и доработки пошагового плана обучения по конкретной теме в рамках существующего IT-проекта.
            План должен быть практическим и помогать новичку разобраться в устройстве **именно этого проекта**, а не в общих теоретических концепциях. 
            Практических заданий быть не должно.
            Основывайся на теме, предоставленном контексте из базы знаний и истории вашего диалога.
            Если история пустая, сгенерируй первоначальный план. Если пользователь просит внести изменения, скорректируй план и верни его новую версию.
            
            ТЕМА КУРСА: "${topic}"

            КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ:
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
                { "id": "1.2", "title": "Следующий шаг по проекту" }
            ]
        `;
        
        let initialHistory = [
            { role: 'user', parts: [{ text: plannerPrompt }] },
            { role: 'model', parts: [{ text: "Я готов. Какой запрос от пользователя?" }] },
            ...history
        ];

        const chat = model.startChat({
            history: initialHistory
        });

        const messageToSend = history.length > 0 
            ? history[history.length - 1].parts[0].text // Если диалог уже идет, отправляем последнее сообщение
            : `Сгенерируй, пожалуйста, первоначальный план по теме "${topic}"`; // Если это начало, даем стартовую команду
        
        const result = await chat.sendMessage(messageToSend);
        const responseText = result.response.text();
        
        res.json({ fullResponse: responseText });

    } catch (error) {
        console.error("Error in /plan-chat route:", error);
        res.status(500).json({ error: "Не удалось обработать запрос." });
    }
});

// POST /api/ai/tutor-chat - Чат для конкретного шага урока
router.post('/tutor-chat', async (req, res) => {
    const { kbId, step, history } = req.body;
    if (!kbId || !step || !history) return res.status(400).json({ error: 'Необходимо указать ID Базы Знаний и тему' });

    try {
        const contextDocs = await queryKB(kbId, step.title, 5); // Узкий поиск по теме шага
        const context = contextDocs.map(doc => doc.pageContent).join('\n---\n');

        const tutorPrompt = `
            Твоя роль: AI-Учитель.
            Твоя задача: Провести пользователя по конкретному шагу урока.
            Объясняй материал просто, используя Markdown. Сопровождай объяснения визуализацией на схеме.
            
            ТЕКУЩИЙ ШАГ УРОКА: "${step.id} - ${step.title}"

            КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ:
            ---
            ${context}
            ---

            ПРАВИЛА ВИЗУАЛИЗАЦИИ:
            1. Для объяснения материала используй "схему урока".
            2. Если пользователь задает уточняющий вопрос, можешь сгенерировать отдельную схему для "уточнений".
            3. Возвращай JSON с ключами "lessonNodes", "lessonEdges", "clarificationNodes", "clarificationEdges".
            4. Если в конце урока ты считаешь, что тема раскрыта, верни в JSON флаг "stepCompleted": true.
        `;
        
        const chat = model.startChat({
            history: [
                { role: 'user', parts: [{ text: tutorPrompt }] },
                { role: 'model', parts: [{ text: "Я готов вести урок. Какой вопрос от пользователя?" }] },
                ...history
            ]
        });

        const lastUserMessage = history[history.length - 1].parts[0].text;
        const result = await chat.sendMessage(lastUserMessage);
        const responseText = result.response.text();
        
        res.json({ fullResponse: responseText });

    } catch (error) { 
        console.error("Error in /tutor-chat route:", error);
        res.status(500).json({ error: "Не удалось обработать запрос." }); }
});

module.exports = router;