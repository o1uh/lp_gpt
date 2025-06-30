import { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Send } from 'lucide-react';
import type { Message } from '../../types';

// Определяем пропсы для этого компонента
interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isPanelVisible: boolean;
  onTogglePanel: () => void;
  isLoading: boolean;
}

export const ChatPanel = ({ messages, onSendMessage, isPanelVisible, onTogglePanel, isLoading }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]); // Добавляем isLoading в зависимости, чтобы скроллить и при появлении индикатора

  const handleSendMessageClick = () => {
    if (inputValue.trim() === '') return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSendMessageClick();
    }
  };

  return (
    <div className="w-1/2 p-4 border-r border-gray-700 flex flex-col">
      <div className="flex items-center gap-x-2 mb-4">
        <button
          onClick={onTogglePanel}
          className="p-1 rounded hover:bg-gray-700"
          title={isPanelVisible ? "Скрыть панель" : "Показать панель"}
        >
          {isPanelVisible ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        <h2 className="text-xl font-bold">Диалог с AI</h2>
      </div>

      <div className="flex-grow bg-gray-800 rounded-lg p-4 space-y-4 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-md p-3 rounded-lg break-words ${message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'}`}>
              <p className="text-sm">{message.text}</p>
            </div>
          </div>
        ))}

        {/* Показываем индикатор, если идет загрузка */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-600 p-3 rounded-lg flex items-center gap-x-2">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse" style={{ animationDelay: '200ms' }}>●</span>
              <span className="animate-pulse" style={{ animationDelay: '400ms' }}>●</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      <div className="mt-4 relative flex items-center">
        <input
          type="text"
          placeholder={isLoading ? "AI думает..." : "Задайте ваш вопрос..."}
          className="w-full p-3 pr-12 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading} // Блокируем ввод, пока AI отвечает
        />
        <button
          onClick={handleSendMessageClick}
          className="absolute right-2 p-2 rounded-lg text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
          disabled={isLoading} // Блокируем кнопку
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};