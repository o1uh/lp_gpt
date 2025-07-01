import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { ProjectListPanel } from '../components/layout/ProjectListPanel';
import { ChatPanel } from '../components/chat/ChatPanel';
import { ArchitecturePanel } from '../components/architecture/ArchitecturePanel';
// Больше не нужен useAppContext здесь

export const AppLayout = () => {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  
  // Фейковые данные для списка чатов
  const chatHistory = [
    { id: 1, name: "Проект CRM-системы" },
    { id: 2, name: "Архитектура блога" },
  ];

  return (
    <div className="bg-gray-900 text-white h-screen flex">
      <Sidebar />
      {isPanelVisible && <ProjectListPanel chatHistory={chatHistory} />}
      <main className="flex-grow flex flex-row">
        {/* Передаем только те пропсы, которые управляют самим лэйаутом */}
        <ChatPanel 
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
        />
        <div className="w-full flex-1">
          {/* Этот компонент теперь вообще не требует пропсов */}
          <ArchitecturePanel />
        </div>
      </main>
    </div>
  );
};