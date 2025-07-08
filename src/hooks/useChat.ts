import { useState, useEffect } from 'react';
import { type Node, type Edge } from 'reactflow';
import  type { Message } from '../types';
import { geminiModel } from '../api/gemini';
import { sandboxTasks } from '../components/config/templates'; 
import { saveProjectState } from '../api/projectService';

interface UseChatProps {
  nodes: Node[];
  edges: Edge[];
  activeProjectId: number | null
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}

export const useChat = ({ nodes, edges, activeProjectId, setNodes, setEdges }: UseChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Здравствуйте! Я ваш AI-ассистент по архитектуре. Какой проект мы будем сегодня проектировать?", sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [promptSuggestions, setPromptSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    const hasUserInteracted = messages.some(m => m.sender === 'user');
    if (!hasUserInteracted) {
      const initialSuggestions = sandboxTasks.map(task => task.name);
      initialSuggestions.push("Начать с чистого листа");
      setPromptSuggestions(initialSuggestions);
    } else {
      setPromptSuggestions([]);
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const currentConversation: Message[] = [...messages, userMessage];
      const historyForAPI = currentConversation.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
        parts: [{ text: msg.text }],
      }));
      if (historyForAPI.length > 0 && historyForAPI[0].role === 'model') {
        historyForAPI.shift();
      }
      
      const chat = geminiModel.startChat({
        history: historyForAPI,
        generationConfig: { maxOutputTokens: 8192 },
      });

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

        ### ФОРМАТ ВЫХОДА ###
        Твой ответ ВСЕГДА должен состоять из двух частей:
        1.  **Текстовый ответ пользователю:** Твое сообщение в чате, отформатированное с помощью Markdown.
        2.  **Обновленное состояние холста:** Сразу после текстового ответа, без каких-либо дополнительных слов, ты ОБЯЗАН вернуть полный JSON-объект, описывающий **новое состояние всей схемы**, обернутый в теги \`\`\`json ... \`\`\`.

        **Пример формата узла:** { "id": "string", "type": "architectureNode", "data": { "label": "Заголовок", "implementation": "Описание..." }, "position": { "x": number, "y": number }, "style": { "width": number, "height": number } }
        **Пример формата связи:** { "id": "e1-2", "source": "id_узла_1", "target": "id_узла_2", "label": "Описание связи", "sourceHandle": "right", "targetHandle": "left" }

        НАЧАЛО ДИАЛОГА.
        `;      
      let messageToSend = text;
      const hasUserMessagedBefore = messages.some(msg => msg.sender === 'user');
      if (!hasUserMessagedBefore) {
        messageToSend = `${systemInstruction}\nПользователь: ${text}`;
      } else {
        const contextHeader = `ТЕКУЩАЯ АРХИТЕКТУРА:\n${JSON.stringify({ nodes, edges }, null, 2)}\n\nЗАПРОС ПОЛЬЗОВАТЕЛЯ:`;
        messageToSend = `${contextHeader}\n${text}`;
      }

      const result = await chat.sendMessage(messageToSend);
      const aiResponseText = result.response.text();

      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = aiResponseText.match(jsonRegex);
      if (match && match[1]) {
        try {
          const parsedJson = JSON.parse(match[1]);
          if (parsedJson.nodes) setNodes(parsedJson.nodes);
          if (parsedJson.edges) setEdges(parsedJson.edges);
        } catch (e) { console.error("Ошибка парсинга JSON от AI:", e); }
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
    if (!activeProjectId) {
      alert("Нет активного проекта для сохранения.");
      return;
    }
    setIsLoading(true); // Теперь мы можем использовать setIsLoading
    try {
      await saveProjectState(activeProjectId, { nodes, edges, messages });
      alert("Проект успешно сохранен!");
    } catch (error) {
      console.error("Ошибка сохранения проекта:", error);
      alert("Не удалось сохранить проект.");
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, isLoading, sendMessage, setMessages, promptSuggestions, saveCurrentProject};
};