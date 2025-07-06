import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { ContentPanel } from '../components/layout/ContentPanel'; // Импортируем новый компонент
import { ChatPanel } from '../components/chat/ChatPanel';
import { ArchitecturePanel } from '../components/architecture/ArchitecturePanel';

// Определяем тип для вкладок здесь, чтобы AppLayout им управлял
type Tab = 'assistant' | 'teacher' | 'examiner';

export const AppLayout = () => {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  // Создаем состояние для активной вкладки, по умолчанию - 'assistant'
  const [activeTab, setActiveTab] = useState<Tab>('assistant');

  return (
    <div className="bg-gray-900 text-white h-screen flex">
      <Sidebar />
      {isPanelVisible && (
        <ContentPanel 
          activeTab={activeTab} 
          onTabChange={(tab) => setActiveTab(tab)} 
        />
      )}
      <main className="flex-grow flex flex-row">
        <ChatPanel 
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
        />
        <div className="w-full flex-1">
          <ArchitecturePanel />
        </div>
      </main>
    </div>
  );
};