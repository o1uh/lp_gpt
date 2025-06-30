import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectListPanel } from './components/layout/ProjectListPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { ArchitecturePanel } from './components/architecture/ArchitecturePanel';
import type { Message } from './types'; // Импортируем наш тип

function App() {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Здравствуйте! Я ваш AI-ассистент по архитектуре. Какой проект мы будем сегодня проектировать?", sender: 'ai' }
  ]);

  // Фейковые данные для списка чатов
  const chatHistory = [
    { id: 1, name: "Проект CRM-системы" },
    { id: 2, name: "Архитектура блога" },
  ];

  // Эта функция теперь живет в App, так как она меняет "глобальное" состояние messages
  const handleSendMessage = (text: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    // TODO: AI logic
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
        />
        <ArchitecturePanel />
      </main>
    </div>
  )
}

export default App;