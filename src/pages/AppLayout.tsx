import { useState } from 'react';
import { Sidebar } from '../components/layout/Sidebar';
import { ContentPanel } from '../components/layout/ContentPanel'; // Импортируем новый компонент
import { ChatPanel } from '../components/chat/ChatPanel';
import { ArchitecturePanel } from '../components/architecture/ArchitecturePanel';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { useAppContext } from '../context/AppContext';
import { SaveProjectModal } from '../components/ui/SaveProjectModal';
import { useBeforeUnload } from '../hooks/useBeforeUnload';


// Определяем тип для вкладок здесь, чтобы AppLayout им управлял
type Tab = 'assistant' | 'teacher' | 'examiner';

export const AppLayout = () => {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  // Создаем состояние для активной вкладки, по умолчанию - 'assistant'
  const [activeTab, setActiveTab] = useState<Tab>('assistant');
  const { confirmationState, setConfirmationState, isDirty } = useAppContext();
  useBeforeUnload(
    isDirty,
    "У вас есть несохраненные изменения. Вы уверены, что хотите покинуть страницу?"
  );
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
      <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={() => setConfirmationState({ ...confirmationState, isOpen: false })}
        onConfirm={confirmationState.onConfirm}
        onSaveAndConfirm={confirmationState.onSaveAndConfirm} // <-- Передаем новую функцию
        title={confirmationState.title}
        description={confirmationState.description}
        confirmText={confirmationState.confirmText} 
        saveAndConfirmText={confirmationState.saveAndConfirmText} 
        cancelText="Вернуться"
      />
      <SaveProjectModal />
    </div>
  );
};