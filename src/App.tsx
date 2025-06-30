// 1. Импортируем `useState` из React для управления состоянием
import { useState } from 'react';
import { MessageSquare, Share2, User, Settings, Plus, Hash, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

function App() {
  // 2. Создаем состояние для управления видимостью панели.
  // `isPanelVisible` - сама переменная (true или false).
  // `setIsPanelVisible` - функция для ее изменения.
  // По умолчанию панель будет видна (true).
  const [isPanelVisible, setIsPanelVisible] = useState(true);

  const chatHistory = [
    { id: 1, name: "Проект CRM-системы" },
    { id: 2, name: "Архитектура блога" },
    { id: 3, name: "Маркетплейс (v2)" },
    { id: 4, name: "Аналитическая система" },
  ];

  return (
    <div className="bg-gray-900 text-white h-screen flex">
      <nav className="w-16 bg-gray-800 p-2 flex flex-col items-center justify-between">
        {/* ... (код панели с иконками остается без изменений) ... */}
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

      {/* --------------------------------------------------- */}
      {/* |   КОЛОНКА 2: Список чатов/проектов (теперь скрываемая) | */}
      {/* --------------------------------------------------- */}
      {/* 3. Условный рендеринг. Эта колонка будет в DOM только если isPanelVisible === true */}
      {isPanelVisible && (
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
      )}

      {/* --------------------------------------------------- */}
      {/* |   ОСНОВНАЯ РАБОЧАЯ ОБЛАСТЬ                     | */}
      {/* --------------------------------------------------- */}
      <main className="flex-grow flex flex-row">
        {/* Левая часть основной области (Чат) */}
        <div className="w-1/2 p-4 border-r border-gray-700 flex flex-col">
          <div className="flex items-center gap-x-2 mb-4">
            {/* 4. Кнопка для переключения видимости панели */}
            <button 
              onClick={() => setIsPanelVisible(!isPanelVisible)} 
              className="p-1 rounded hover:bg-gray-700"
              title={isPanelVisible ? "Скрыть панель" : "Показать панель"}
            >
              {/* 5. Условная иконка: показываем разную иконку в зависимости от состояния */}
              {isPanelVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
            </button>
            <h2 className="text-xl font-bold">Диалог с AI</h2>
          </div>
          <div className="flex-grow bg-gray-800 rounded-lg p-2 overflow-y-auto">
            {/* ... */}
          </div>
          <div className="mt-4 relative">
            <input 
              type="text" 
              placeholder="Задайте ваш вопрос..."
              className="w-full p-2 pr-10 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Правая часть основной области (Артефакт проектирования) */}
        <div className="w-1/2 p-4 flex flex-col">
          <h2 className="text-xl font-bold mb-4">Текущая архитектура</h2>
          <div className="flex-grow bg-gray-800 rounded-lg p-2 overflow-y-auto">
            {/* ... */}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App