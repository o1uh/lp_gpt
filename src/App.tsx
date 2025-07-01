import { useState, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectListPanel } from './components/layout/ProjectListPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { ArchitecturePanel } from './components/architecture/ArchitecturePanel';
import type { Message } from './types';
import { geminiModel } from './services/gemini';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';

function App() {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Здравствуйте! Я ваш AI-ассистент по архитектуре. Какой проект мы будем сегодня проектировать?", sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [nodes, setNodes] = useState<Node[]>([
    { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
  // 1. Создаем обработчики, которые будем передавать в панель архитектуры
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]  
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdgeHelper(params, eds)),
    [setEdges]
  );
  
  const chatHistory = [
    { id: 1, name: "Проект CRM-системы" },
    { id: 2, name: "Архитектура блога" },
  ];

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const historyForAPI = messages
        .filter(msg => msg.id !== 1) // Убираем стартовое системное сообщение
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
          parts: [{ text: msg.text }],
        }));
      
      const chat = geminiModel.startChat({
        history: historyForAPI,
        generationConfig: { maxOutputTokens: 8192 },
      });

      const systemInstruction = `СИСТЕМНАЯ ИНСТРУКЦИЯ:
      Ты — AI-ассистент по проектированию IT-архитектуры.
      Твоя задача — вести диалог и пошагово строить архитектуру.
      ИСПОЛЬЗУЙ MARKDOWN для форматирования текстового ответа (списки, **жирный шрифт**, \`code snippets\`). Для улучшения читаемости добавляй переносы строк (\n).
      
      ТЕКУЩАЯ АРХИТЕКТУРА (включая позиции, размеры и id, которые задал пользователь):
      ${JSON.stringify({ nodes, edges }, null, 2)}

      ПРАВИЛА ОБНОВЛЕНИЯ АРХИТЕКТУРЫ:
      1. На основе ТЕКУЩЕЙ АРХИТЕКТУРЫ и запроса пользователя, верни ОБНОВЛЕННУЮ ПОЛНУЮ архитектуру.
      2. ОБЯЗАТЕЛЬНО СОХРАНЯЙ ID, ПОЗИЦИИ (position) и РАЗМЕРЫ (style) существующих узлов. Не меняй их, если пользователь явно не попросил.
      3. При добавлении нового узла, давай ему УНИКАЛЬНЫЙ ID и располагай его в свободном месте. Если он не имеет описания, задавай ему начальный размер style: { width: 180, height: 100 }.
      4. Если узел ИМЕЕТ описание (поле implementation), задай ему БОЛЬШУЮ начальную высоту, например, style: { width: 220, height: 150 }, чтобы текст поместился.
      5. Связи (edges) могут иметь метку (label).
      6. Если в текущей архитектуре есть узел с id 'start-node', УДАЛИ его.
      7. У каждого узла есть 4 точки для связей (ручки) с id: "top", "bottom", "left", "right".
      8. Когда создаешь или изменяешь связь, используй свойства "sourceHandle" и "targetHandle", чтобы указать, из какой ручки узла-источника в какую ручку узла-назначения идет связь. Это позволяет управлять расположением связей.
      
      В конце ответа верни JSON в тегах \`\`\`json ... \`\`\` с ключами "nodes" и "edges".
      
      Формат Узла: { "id": "string", "type": "architectureNode", "data": { "label": "Заголовок", "implementation": "Описание..." }, "position": { "x": number, "y": number }, "style": { "width": number, "height": number } }
      Формат Связи: { "id": "e1-2", "source": "id_узла_1", "target": "id_узла_2", "label": "Описание связи", "sourceHandle": "right", "targetHandle": "left" }
      
      НАЧАЛО ДИАЛОГА.`;
      
      let messageToSend = text;
      const hasUserMessagedBefore = messages.some(msg => msg.sender === 'user');
      
      if (!hasUserMessagedBefore) {
        messageToSend = `${systemInstruction}\nПользователь: ${text}`;
      } else {
        // Для последующих сообщений тоже добавляем контекст текущей архитектуры
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
          
          let finalNodes = parsedJson.nodes || nodes;

          // "Страховочная" логика удаления начального блока, если AI забыл
          const isFirstResponse = nodes.some(n => n.id === 'start-node');
          if (isFirstResponse && finalNodes.some((n: Node) => n.id === 'start-node')) {
            finalNodes = finalNodes.filter((n: Node) => n.id !== 'start-node');
          }

          if (finalNodes) setNodes(finalNodes);
          if (parsedJson.edges) setEdges(parsedJson.edges);

        } catch (e) { console.error("Ошибка парсинга JSON от AI:", e); }
      }
      
      const chatResponse = aiResponseText.replace(jsonRegex, '').trim();
      const aiMessage: Message = { id: Date.now() + 1, text: chatResponse || "Архитектура обновлена. Что дальше?", sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Ошибка при вызове Gemini API:", error);
      const errorMessage: Message = { id: Date.now() + 1, text: "К сожалению, произошла ошибка при обращении к AI. Попробуйте еще раз.", sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex">
      <Sidebar />
      {isPanelVisible && <ProjectListPanel chatHistory={chatHistory} />}
      <main className="flex-grow flex flex-row">
        <ChatPanel 
          messages={messages} 
          onSendMessage={handleSendMessage}
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
          isLoading={isLoading}
        />
        <div className={`transition-all duration-300 w-full flex-1`}>
          {/* 3. Передаем и nodes/edges, и функции для их изменения */}
          <ArchitecturePanel 
            nodes={nodes} 
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
        </div>
      </main>
    </div>
  );
}

export default App;