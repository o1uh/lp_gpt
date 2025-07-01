import { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Send } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { ChatMessage } from './ChatMessage';
import { useAppContext } from '../../context/AppContext'; // 1. Импортируем наш хук

// 2. Упрощаем пропсы. Теперь нам нужны только isPanelVisible и onTogglePanel
interface ChatPanelProps {
  isPanelVisible: boolean;
  onTogglePanel: () => void;
}

export const ChatPanel = ({ isPanelVisible, onTogglePanel }: ChatPanelProps) => {
  // 3. Получаем все нужные данные и функции прямо из контекста
  const { messages, isLoading, sendMessage } = useAppContext();
  
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessageClick = () => {
    if (inputValue.trim() === '' || isLoading) return;
    sendMessage(inputValue); // Вызываем функцию из контекста
    setInputValue('');
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSendMessageClick();
    }
  };

  return (
    <div className={`transition-all duration-300 p-4 border-r border-gray-700 flex flex-col ${
      isPanelVisible ? 'w-1/2' : 'w-3/5'
    }`}>
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
          <ChatMessage 
            key={message.id} 
            message={message} 
            isPanelVisible={isPanelVisible}
          />
        ))}
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

      <div className="mt-4 relative flex items-start">
        <TextareaAutosize
          placeholder={isLoading ? "AI думает..." : "Задайте ваш вопрос... (Ctrl+Enter для отправки)"}
          className="w-full p-3 pr-12 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={isLoading}
          minRows={1}
          maxRows={6}
        />
        <button
          onClick={handleSendMessageClick}
          className="absolute right-2 bottom-2 p-2 rounded-lg text-gray-400 hover:bg-gray-600 hover:text-white transition-colors"
          disabled={isLoading}
          title="Отправить (Ctrl+Enter)"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};