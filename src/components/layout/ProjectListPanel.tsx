import { Plus, Hash } from 'lucide-react';

// Определяем, какие данные (пропсы) компонент ожидает получить
interface ProjectListPanelProps {
  chatHistory: { id: number; name: string }[];
}

export const ProjectListPanel = ({ chatHistory }: ProjectListPanelProps) => {
  return (
    <aside className="w-64 bg-gray-800/50 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">Проекты</h1>
        <button className="p-1 rounded hover:bg-gray-700">
          <Plus size={20} />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        <ul className="space-y-2">
          {chatHistory.map(chat => (
            <li key={chat.id}>
              <a href="#" className="flex items-center gap-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white transition-colors">
                <Hash size={16} />
                <span>{chat.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};