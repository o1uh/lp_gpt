import { useState, useRef, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, Send, Pencil, Trash2 } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import { useAppContext } from '../../context/AppContext';
import { ChatMessage } from './ChatMessage';
import { PromptSuggestions } from './PromptSuggestions';
import type { Message} from '../../types';

interface ChatPanelProps {
  isPanelVisible: boolean;
  onTogglePanel: () => void;
  activeTab: 'assistant' | 'teacher' | 'examiner'; 
}

export const ChatPanel = ({ isPanelVisible, onTogglePanel, activeTab }: ChatPanelProps) => {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    promptSuggestions, 
    activeProjectName, 
    activeProjectId, 
    renameCurrentProject, 
    deleteCurrentProject, 
    isPlanning, 
    approvePlan,
    currentTopic,
    activeCourseMessages,
    sendTeacherMessage,
    activeStep, 
    activeStepState, 
    sendStepMessage,
    activeStepProgressId,
    } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  const chatEndRef = useRef<null | HTMLDivElement>(null);

  let currentMessages: Message[] = messages;
  if (activeTab === 'teacher') {
    currentMessages = activeStep ? activeStepState.messages : activeCourseMessages;
  }

  const isInPlanningMode = isPlanning && activeTab === 'teacher' && !activeStep;
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isLoading]);

  const handleSendMessageClick = () => {
    if (inputValue.trim() === '' || isLoading) return;

    // Вызываем нужную функцию с правильным набором аргументов
    if (activeTab === 'teacher' && activeStep && activeStepProgressId) {
      sendStepMessage(inputValue, activeStep, activeStepProgressId);
    } else if (activeTab === 'teacher') {
      sendTeacherMessage(inputValue);
    } else {
      sendMessage(inputValue);
    }
    
    setInputValue('');
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    if (suggestion === "Начать с чистого листа") {
      // Эта логика должна быть в AppContext/useChat, но для простоты пока здесь
      setInputValue(''); 
    } else {
      sendMessage(suggestion);
    }
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
        <h2 className="text-xl font-bold truncate" title={currentTopic}>
          {isInPlanningMode ? `Планирование: ${currentTopic}` : activeProjectName}
        </h2>
        {activeProjectId && (
          <div className="flex items-center gap-x-2 ml-auto">
            <button onClick={renameCurrentProject} className="p-1 text-gray-400 hover:text-white" title="Переименовать проект">
              <Pencil size={16} />
            </button>
            <button onClick={deleteCurrentProject} className="p-1 text-red-500 hover:text-red-400" title="Удалить проект">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-grow bg-gray-800 rounded-lg p-4 space-y-4 overflow-y-auto flex flex-col">
        {/* НОВАЯ ЛОГИКА: Показываем заглушку, если нет сообщений */}
        {currentMessages.length === 0 ? (
          <div className="m-auto text-center text-gray-500">
            <p className="text-lg">С чего начнём?</p>
            <p className="text-sm">Выберите подсказку ниже или задайте свой вопрос</p>
          </div>
        ) : (
          // Иначе показываем сообщения
          currentMessages.map(message => (
            <ChatMessage 
              key={message.id} 
              message={message} 
              isPanelVisible={isPanelVisible}
            />
          ))
        )}
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

      <div className="mt-4">
        {/* НОВОЕ: Показываем кнопку "Утвердить", если есть план */}
        {isInPlanningMode && (
          <div className="mb-4 text-center">
            <button 
              onClick={approvePlan}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold disabled:bg-gray-500"
            >
              Утвердить этот план и начать обучение
            </button>
          </div>
        )}
        {!isPlanning && (
          <PromptSuggestions 
            suggestions={promptSuggestions} 
            onSuggestionClick={handleSuggestionClick} 
          />
        )}
        <div className="relative flex items-start">
          <TextareaAutosize
             placeholder={
              isLoading ? "AI думает..." 
              : isPlanning ? "Обсудите или утвердите план..." 
              : "Задайте ваш вопрос... (Ctrl+Enter для отправки)"
            }
            disabled={isLoading}
            className="w-full p-3 pr-12 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
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
    </div>
  );
};