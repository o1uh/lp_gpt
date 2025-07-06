import { useState, type ReactNode } from 'react';
import { Plus, Hash, BookOpen, ClipboardCheck, MessageSquare } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAppContext } from '../../context/AppContext';

// Определяем типы для наших вкладок
type Tab = 'assistant' | 'teacher' | 'examiner';

// Пропсы для нашего нового компонента
interface ContentPanelProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

// Фейковые данные для вкладки "Ассистент"
const assistantDialogs = [
  { id: 1, name: "Проект CRM-системы" },
  { id: 2, name: "Архитектура блога" },
];



export const ContentPanel = ({ activeTab, onTabChange }: ContentPanelProps) => {
  const { startNewProject } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateProject = (template: 'empty' | 'blog') => {
    startNewProject(template);
    setIsModalOpen(false);
  };

  // Функция для стилизации кнопок-вкладок
  const getTabClassName = (tabName: Tab) => {
    return `p-2 rounded-lg transition-colors ${
      activeTab === tabName
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
  };

  // Функция для рендеринга контента активной вкладки
  const renderContent = (): ReactNode => {
    switch (activeTab) {
      case 'assistant':
        return (
          <>
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-2">Диалоги</h2>
            <ul className="space-y-2">
              {assistantDialogs.map(chat => (
                <li key={chat.id}>
                  <a href="#" className="flex items-center gap-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white">
                    <Hash size={16} /> <span>{chat.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        );
      case 'teacher':
        return <p className="text-sm text-gray-400">Раздел обучения в разработке.</p>;
      case 'examiner':
        return <p className="text-sm text-gray-400">Раздел тестов в разработке.</p>;
      default:
        return null;
    }
  };

  return (
    <aside className="w-64 bg-gray-800/50 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">Архитектура</h1>
        <button onClick={() => setIsModalOpen(true)} className="p-1 rounded hover:bg-gray-700" title="Создать новый проект">
          <Plus size={20} />
        </button>
      </div>

      <div className="flex justify-around items-center mb-4 border-b border-gray-700 pb-2">
        <button 
          onClick={() => onTabChange('assistant')} 
          className={getTabClassName('assistant')}
          title="Ассистент"
        >
          <MessageSquare size={20} />
        </button>
        <button 
          onClick={() => onTabChange('teacher')} 
          className={getTabClassName('teacher')}
          title="Обучение"
        >
          <BookOpen size={20} />
        </button>
        <button 
          onClick={() => onTabChange('examiner')} 
          className={getTabClassName('examiner')}
          title="Тесты"
        >
          <ClipboardCheck size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        {renderContent()}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Создать новый проект">
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-400">
            Начните с чистого листа или используйте готовый шаблон.
          </p>
          <button 
            onClick={() => handleCreateProject('empty')} 
            className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Пустой проект
          </button>
          <button 
            onClick={() => handleCreateProject('blog')} 
            className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Шаблон: Блог
          </button>
        </div>
      </Modal>
    </aside>
  );
};