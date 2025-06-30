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
    { id: '1', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 } }
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
        .filter(msg => msg.id !== 1)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model' as 'user' | 'model',
          parts: [{ text: msg.text }],
        }));
      
      const chat = geminiModel.startChat({
        history: historyForAPI,
        generationConfig: { maxOutputTokens: 8192 },
      });

      const systemInstruction = `СИСТЕМНАЯ ИНСТРУКЦИЯ: ... (весь твой длинный промпт) ... ТЕКУЩАЯ АРХИТЕКТУРА: ${JSON.stringify({ nodes, edges }, null, 2)} ... НАЧАЛО ДИАЛОГА.`;
      
      let messageToSend = text;
      const hasUserMessagedBefore = messages.some(msg => msg.sender === 'user');
      
      if (!hasUserMessagedBefore) {
        messageToSend = `${systemInstruction}\nПользователь: ${text}`;
      } else {
        // Для последующих сообщений тоже добавляем контекст текущей архитектуры
        messageToSend = `ТЕКУЩАЯ АРХИТЕКТУРА: ${JSON.stringify({ nodes, edges }, null, 2)}\nПользователь: ${text}`;
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
      const aiMessage: Message = { id: Date.now() + 1, text: chatResponse || "Архитектура обновлена. Что дальше?", sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error("Ошибка при вызове Gemini API:", error);
      const errorMessage: Message = { id: Date.now() + 1, text: "К сожалению, произошла ошибка.", sender: 'ai' };
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
        <div className={`transition-all duration-300 ${isPanelVisible ? 'w-1/2' : 'w-2/5'}`}>
          <ArchitecturePanel 
            initialNodes={nodes} 
            initialEdges={edges}
          />
        </div>
      </main>
    </div>
  )
}

export default App;