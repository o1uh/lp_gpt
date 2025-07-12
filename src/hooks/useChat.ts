import { useState} from 'react';
import { type Node, type Edge } from 'reactflow';
import  type { Message } from '../types';
import { geminiModel } from '../api/gemini';
import { saveProjectState } from '../api/projectService';
import { createProject } from '../api/projectService';

type HistoryItem = {
  role: 'user' | 'model';
  parts: { text: string }[];
};

interface UseChatProps {
  nodes: Node[];
  edges: Edge[];
  activeProjectId: number | null
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;  
  loadProjects: () => Promise<void>;
  setActiveProjectId: React.Dispatch<React.SetStateAction<number | null>>;
  setActiveProjectName: React.Dispatch<React.SetStateAction<string>>;
}

export const useChat = ({ nodes, edges, activeProjectId, setNodes, setEdges, messages, setMessages, setIsDirty, loadProjects, setActiveProjectId, setActiveProjectName  }: UseChatProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  
  const sendMessage = async (text: string) => {
    setIsDirty(true);
    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setPromptSuggestions([]);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const dialogHistory: HistoryItem[] = messages
        .filter(msg => msg.id !== 1) 
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));

      const systemInstruction = `
        ### РОЛЬ И ЦЕЛЬ ###
        Ты — "Архитект", ядро интеллектуальной системы для визуального проектирования IT-архитектуры. Ты не внешний сервис, а неотъемлемая часть этого приложения. Твоя главная цель — помогать пользователю создавать, анализировать и модифицировать схемы архитектуры через диалог на естественном языке. Ты общаешься с пользователем на русском языке, но готов перейти на другой язык по его просьбе.

        ### ПРИНЦИПЫ ВЗАИМОДЕЙСТВИЯ ###
        1.  **Естественный диалог:** Общайся как эксперт-наставник. Задавай уточняющие вопросы, предлагай лучшие практики и паттерны, предупреждай об антипаттернах.
        2.  **Действие, а не описание:** Никогда не упоминай JSON, API, "формат данных" или "обновленный объект". Вместо "Я вернул JSON с новым узлом", говори "Хорошо, я добавил компонент 'База данных' на схему. Что дальше?". Ты не генерируешь JSON, ты **рисуешь на холсте**.
        3.  **Использование Markdown:** Активно используй Markdown для форматирования твоего текстового ответа, чтобы он был структурированным и читаемым (списки, **жирный шрифт**, \`code snippets\` и т.д.).

        ### ВХОДНЫЕ ДАННЫЕ ###
        В каждом сообщении от пользователя я буду предоставлять тебе актуальное состояние холста в виде JSON-объекта. Он описывает все компоненты (nodes) и связи (edges) на схеме. Ты должен воспринимать это как снимок текущего "визуального состояния".

        ТЕКУЩАЯ АРХИТЕКТУРА (позиции, размеры, связи, заданные пользователем):
        ${JSON.stringify({ nodes, edges }, null, 2)}

        ### ПРАВИЛА МОДИФИКАЦИИ АРХИТЕКТУРЫ ###
        Проанализировав запрос пользователя и ТЕКУЩУЮ АРХИТЕКТУРУ, ты должен сгенерировать новое, полное состояние холста, следуя этим правилам:

        1.  **Сохранение пользовательских изменений:** ВСЕГДА сохраняй ID, позиции (position) и размеры (style) существующих узлов, если пользователь явно не попросил их изменить. Уважай расположение элементов, которое выбрал пользователь.
        2.  **Уникальность ID:** При добавлении нового компонента всегда присваивай ему новый, уникальный строковый ID (например, 'node_123', 'component_auth').
        3.  **Начальный узел:** Если в текущей архитектуре есть узел с id 'start-node', он должен быть удален из нового состояния схемы.
        4.  **Размеры узлов по умолчанию:**
            *   Если узел не имеет детального описания, его начальный размер должен быть примерно 'style: { width: 180, height: 60 }'.
            *   Если узел содержит описание ("implementation"), его начальный размер должен быть больше, чтобы вместить текст, например, 'style: { width: 240, height: 160 }'.
        5.  **Точки соединения (Ручки):** У каждого компонента есть 4 точки для связей: "top", "bottom", "left", "right". При создании или изменении связи используй поля "sourceHandle" и "targetHandle", чтобы точно указать, откуда и куда она идет. Это позволяет создавать аккуратные и читаемые схемы.

        ### ПРАВИЛО ГЕНЕРАЦИИ ПОДСКАЗОК ###
        В дополнение к основному JSON, верни еще один ключ "suggestions" - это массив из 3-4 коротких, релевантных вопросов или команд, которые пользователь может задать следующими, чтобы развить диалог.

        ### ФОРМАТ ВЫХОДА ###
        Твой ответ ВСЕГДА должен состоять из двух частей:
        1.  **Текстовый ответ пользователю:** Твое сообщение в чате, отформатированное с помощью Markdown.
        2.  **Обновленное состояние холста:** Сразу после текстового ответа, без каких-либо дополнительных слов, ты ОБЯЗАН вернуть полный JSON-объект, описывающий **новое состояние всей схемы**, обернутый в теги \`\`\`json ... \`\`\` с ключами "nodes", "edges" и "suggestions".

        **Пример формата узла:** { "id": "string", "type": "architectureNode", "data": { "label": "Заголовок", "implementation": "Описание..." }, "position": { "x": number, "y": number }, "style": { "width": number, "height": number } }
        **Пример формата связи:** { "id": "e1-2", "source": "id_узла_1", "target": "id_узла_2", "label": "Описание связи", "sourceHandle": "right", "targetHandle": "left" }
        **Пример формата подсказок:** { "suggestions": ["Подсказка 1", "Подсказка 2"] }

        НАЧАЛО ДИАЛОГА.
        `;    

      const fullHistoryForAPI: HistoryItem[] = [
        // Это "загружает" роль и правила в память AI для этого конкретного диалога
        {
          role: 'user',
          parts: [{ text: systemInstruction }],
        },
        {
            role: 'model',
            parts: [{ text: "Понял. Я 'Архитект'. Я готов помочь с проектированием, следуя всем правилам. С чего начнем?" }]
        },
        ...dialogHistory // Добавляем всю предыдущую переписку
      ];

       const chat = geminiModel.startChat({
        // Передаем полную историю с промптом
        history: fullHistoryForAPI,
        generationConfig: { maxOutputTokens: 8192 },
      });
      
      // 3. Отправляем только последнее сообщение пользователя, дополненное контекстом схемы.
      // AI уже "знает" свою роль и правила из истории, которую мы передали в startChat.
      const messageToSend = `
        ТЕКУЩАЯ АРХИТЕКТУРА:
        ${JSON.stringify({ nodes, edges }, null, 2)}

        ЗАПРОС ПОЛЬЗОВАТЕЛЯ:
        ${text}
      `;

      console.log("ИСТОРИЯ:", fullHistoryForAPI)
      console.log("ОТПРАВЛЯЕМ В API:", messageToSend);
      // ------------------------------------
      const result = await chat.sendMessage(messageToSend);
      const aiResponseText = result.response.text();
      // ----------------------
      console.log("ПОЛУЧЕНО ОТ API:", aiResponseText);
      
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = aiResponseText.match(jsonRegex);
      if (match && match[1]) {
        try {
          const parsedJson = JSON.parse(match[1]);
          if (parsedJson.nodes) setNodes(parsedJson.nodes);
          if (parsedJson.edges) setEdges(parsedJson.edges);
          // Устанавливаем новые подсказки или пустой массив, если их нет
          setPromptSuggestions(parsedJson.suggestions || []);
        } catch (e) {
          console.error("Ошибка парсинга JSON от AI:", e);
          setPromptSuggestions([]);
        }
      }else {
        // Если в ответе нет JSON, тоже скрываем подсказки
        setPromptSuggestions([]);
      }

      const chatResponse = aiResponseText.replace(jsonRegex, '').trim();
      const aiMessage: Message = { id: Date.now() + 1, text: chatResponse || "Архитектура обновлена.", sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Ошибка при вызове Gemini API:", error);
      const errorMessage: Message = { id: Date.now() + 1, text: "К сожалению, произошла ошибка.", sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

   const saveCurrentProject = async () => {
    setIsLoading(true);
    try {
      if (activeProjectId) {
        // --- СЦЕНАРИЙ 1: ОБНОВЛЕНИЕ СУЩЕСТВУЮЩЕГО ПРОЕКТА ---
        await saveProjectState(activeProjectId, { nodes, edges, messages });
        setIsDirty(false);
        await loadProjects(); // Обновляем список, чтобы видеть новую дату
        alert("Проект успешно обновлен!");
      } else {
        // --- СЦЕНАРИЙ 2: СОХРАНЕНИЕ НОВОГО ПРОЕКТА ---
        const projectName = window.prompt("Введите название нового проекта:", "Новый проект");

        if (projectName && projectName.trim() !== '') {
          // 1. Создаем проект в БД и получаем его ID
          const newProject = await createProject(projectName);
          
          // 2. Устанавливаем ID и имя нового проекта как активные
          setActiveProjectId(newProject.id);
          setActiveProjectName(newProject.name);

          // 3. Сразу же сохраняем текущее состояние (nodes, edges, messages) для этого нового ID
          await saveProjectState(newProject.id, { nodes, edges, messages });
          
          setIsDirty(false); // Проект сохранен, он больше не "грязный"
          await loadProjects(); // Обновляем список проектов слева
          alert(`Проект "${projectName}" успешно создан и сохранен!`);
        }
      }
    } catch (error) {
      console.error("Ошибка сохранения проекта:", error);
      alert("Не удалось сохранить проект.");
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage, saveCurrentProject, promptSuggestions };
};