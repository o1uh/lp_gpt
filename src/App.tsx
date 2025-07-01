import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectListPanel } from './components/layout/ProjectListPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { ArchitecturePanel } from './components/architecture/ArchitecturePanel';
import type { Message } from './types';
import { geminiModel } from './services/gemini';
import { type Node, type Edge } from 'reactflow';

function App() {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Здравствуйте! Я ваш AI-ассистент по архитектуре. Какой проект мы будем сегодня проектировать?", sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const [nodes, setNodes] = useState<Node[]>([
    { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 } }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  
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

      // Улучшенный системный промпт v2
      const systemInstruction = `СИСТЕМНАЯ ИНСТРУКЦИЯ:
      Ты — AI-ассистент по проектированию IT-архитектуры.
      Твоя задача — вести диалог и пошагово строить архитектуру вместе с пользователем.
      ИСПОЛЬЗУЙ MARKDOWN для форматирования своих ответов: списки, жирный шрифт и т.д.
      
      ТЕКУЩАЯ АРХИТЕКТУРА:
      ${JSON.stringify({ nodes, edges }, null, 2)}

      ПРАВИЛА ОБНОВЛЕНИЯ АРХИТЕКТУРЫ:
      1. На основе ТЕКУЩЕЙ АРХИТЕКТУРЫ и запроса пользователя, верни ОБНОВЛЕННУЮ ПОЛНУЮ архитектуру.
      2. СОХРАНЯЙ ПОЗИЦИИ (position) и ID существующих узлов, если пользователь явно не просит их изменить.
      3. При добавлении нового узла, давай ему УНИКАЛЬНЫЙ ID (например, 'node-1', 'node-2') и располагай его в логичном месте, не накладывая на другие.
      4. Если в текущей архитектуре есть узел с id 'start-node', УДАЛИ его из нового списка узлов.
      
      В конце своего ответа ты ОБЯЗАТЕЛЬНО должен вернуть JSON в тегах \`\`\`json ... \`\`\` с ключами "nodes" и "edges".
      Формат узла: { "id": "string", "type": "architectureNode", "data": { "label": "Заголовок", "implementation": "Описание..." }, "position": { "x": number, "y": number } }
      Всегда устанавливай тип узла "architectureNode" для новых узлов.
      
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
          <ArchitecturePanel 
            initialNodes={nodes} 
            initialEdges={edges}
          />
        </div>
      </main>
    </div>
  );
}

export default App;