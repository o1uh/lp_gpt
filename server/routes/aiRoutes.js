const express = require('express');
const router = express.Router();
const { queryKB } = require('../services/kbService');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Инициализируем Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KB_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest"});

// POST /api/ai/generate-plan - Эндпоинт для генерации учебного плана
router.post('/generate-plan', async (req, res) => {
    const { kbId, topic } = req.body;

    if (!kbId || !topic) {
        return res.status(400).json({ error: 'Необходимо указать ID Базы Знаний и тему' });
    }

    try {
        // 1. Получаем контекст из Базы Знаний по теме
        const contextDocs = await queryKB(kbId, topic, 10); // Ищем 10 самых релевантных фрагментов
        const context = contextDocs.map(doc => doc.pageContent).join('\n---\n');

        // 2. Создаем промпт для "Методиста"
        const plannerPrompt = `
            Твоя роль: AI-методист.
            Твоя задача: На основе предоставленной темы и контекста из базы знаний, создай детализированный, пошаговый план теоретического обучения. Практических заданий быть не должно.
            
            ТЕМА КУРСА: "${topic}"

            КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ:
            ---
            ${context}
            ---

            ПРАВИЛА:
            1. План должен быть логичным и последовательным.
            2. Разбей план на несколько основных глав (например, 2-4).
            3. Каждую главу разбей на несколько подпунктов (шагов).
            4. Для каждого шага придумай уникальный ID в формате "глава.шаг" (например, "1.1", "1.2", "2.1").
            5. Верни результат ИСКЛЮЧИТЕЛЬНО в виде JSON-массива объектов. Никакого лишнего текста до или после.
            
            Формат JSON:
            [
                { "id": "1.1", "title": "Название первого шага" },
                { "id": "1.2", "title": "Название второго шага" },
                { "id": "2.1", "title": "Название шага из второй главы" }
            ]
        `;

        // 3. Отправляем запрос в Gemini
        const result = await model.generateContent(plannerPrompt);
        const response = result.response;
        const jsonResponse = response.text();

        // 4. Валидируем и отправляем ответ
        JSON.parse(jsonResponse); // Проверяем, что это валидный JSON
        res.setHeader('Content-Type', 'application/json');
        res.send(jsonResponse);

    } catch (error) {
        console.error("Error in /generate-plan route:", error);
        res.status(500).json({ error: "Не удалось сгенерировать план. Возможно, ответ AI был в неверном формате." });
    }
});

module.exports = router;