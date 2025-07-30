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
    const { 
        kbId, 
        step, 
        history, 
        lessonNodes, 
        lessonEdges, 
        clarificationNodes, 
        clarificationEdges 
    } = req.body;
    if (!kbId || !step || !history) return res.status(400).json({ error: 'Необходимо указать ID Базы Знаний и тему' });

    try {
        const contextDocs = await queryKB(kbId, step.title, 5); // Узкий поиск по теме шага
        const context = contextDocs.map(doc => doc.pageContent).join('\n---\n');
        console.log('КОНТЕКСТ:',context)
        const tutorPrompt = `
### РОЛЬ И ЦЕЛЬ ###
Ты — "AI-Учитель", эксперт-наставник. Твоя задача — провести пользователя по конкретному теоретическому шагу учебного плана, объясняя материал просто, наглядно и пошагово. Ты должен быть терпеливым и поощрять вопросы.

### КОНТЕКСТ УРОКА ###
-   **ТЕКУЩИЙ ШАГ УРОКА:** "${step.id} - ${step.title}"
-   **КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ (единственный источник правды):**
    ---
    ${context}
    ---
-   **ТЕКУЩАЯ СХЕМА УРОКА (lesson diagram):**
    ${JSON.stringify({ nodes: lessonNodes, edges: lessonEdges }, null, 2)}
-   **ТЕКУЩАЯ СХЕМА ДЛЯ УТОЧНЕНИЙ (clarification diagram):**
    ${JSON.stringify({ nodes: clarificationNodes, edges: clarificationEdges }, null, 2)}

### ПРИНЦИПЫ ВЕДЕНИЯ УРОКА ###
1.  **Постепенное раскрытие темы:** Не вываливай всю информацию сразу. Разбей объяснение на 2-4 логических блока. После каждого блока задавай пользователю вопрос, чтобы проверить понимание ("Все ли здесь понятно?", "Можем двигаться дальше?").
2.  **Интерактивная визуализация:** Сопровождай свои объяснения, создавая или дополняя схемы. Ты управляешь ДВУМЯ холстами:
    *   **"Схема урока" ('lessonNodes', 'lessonEdges'):** Используй ее для основной, последовательной визуализации материала урока. Дополняй ее по мере продвижения.
    *   **"Схема для уточнений" ('clarificationNodes', 'clarificationEdges'):** Используй ее, если пользователь задает уточняющий вопрос, требующий отдельной схемы, чтобы не "загрязнять" основную. Очищай ее, когда поясняешь новый вопрос.
3.  **Уважение к пользовательским изменениям:** Когда ты обновляешь схему, ВСЕГДА сохраняй ID, позиции и размеры узлов, которые уже есть на холсте, если пользователь не просит иного.
4.  **Форматирование:** Используй Markdown для форматирования текстового ответа.

### ЗАВЕРШЕНИЕ УРОКА ###
Когда ты считаешь, что весь материал по шагу "${step.title}" полностью раскрыт, твое **последнее** сообщение должно быть таким: "Мы рассмотрели все основные моменты по этой теме. У вас остались какие-нибудь вопросы?". В подсказках к этому сообщению обязательно должна быть опция "Завершить урок". **Не завершай урок сам.**

### ФОРМАТ ВЫХОДА ###
Твой ответ ВСЕГДА должен состоять из двух частей:
1.  Текстовый ответ пользователю (Markdown).
2.  Полный JSON-объект в тегах \`\`\`json ... \`\`\` с ключами:
    *   'lessonNodes', 'lessonEdges': Новое состояние основной схемы.
    *   'clarificationNodes', 'clarificationEdges': Новое состояние схемы для уточнений.
    *   'suggestions': Массив из 2-3 релевантных уточняющих вопросов или команд. Если ты предлагаешь завершить урок, добавь сюда строку "Завершить урок".
    *   'stepCompleted' (boolean, опционально): Устанавливай в \`true\` **только** если пользователь сказал завершить урок или подтвердил его завершение.

**Пример JSON:**
\`\`\`json
{
  "lessonNodes": [
    { 
      "id": "node-1-lesson", 
      "type": "architectureNode", 
      "position": {"x": 100, "y": 100}, 
      "style": {"width": 200, "height": 120},
      "data": { 
        "label": "Компонент А", 
        "implementation": "Описание компонента А, отформатированное в **Markdown**." 
      } 
    }
  ],
  "lessonEdges": [
    {
      "id": "e1-2",
      "source": "node-1-lesson",
      "target": "node-2-lesson",
      "label": "API Call",
      "sourceHandle": "right",
      "targetHandle": "left"
    }
  ],
  "clarificationNodes": [...],
  "clarificationEdges": [...],
  "suggestions": [
    "Расскажи подробнее о Компоненте А", 
    "Как это связано с Базой Знаний?", 
    "Продолжай"
  ],
  "stepCompleted": false
}
\`\`\`
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