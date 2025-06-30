import { MessageSquare, Share2, User, Settings } from 'lucide-react';

export const Sidebar = () => {
  return (
    <nav className="w-16 bg-gray-800 p-2 flex flex-col items-center justify-between">
      <div className="flex flex-col items-center gap-y-4">
        <button className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors">
          <MessageSquare size={24} />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
          <Share2 size={24} />
        </button>
      </div>
      <div className="flex flex-col items-center gap-y-4">
        <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
          <User size={24} />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors">
          <Settings size={24} />
        </button>
      </div>
    </nav>
  );
};