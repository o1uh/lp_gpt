import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectListPanel } from './components/layout/ProjectListPanel';
import { ChatPanel } from './components/chat/ChatPanel';
import { ArchitecturePanel } from './components/architecture/ArchitecturePanel';
import type { Message } from './types';
import { geminiModel } from './services/gemini'; // <-- 1. МЕНЯЕМ ИМПОРТ

function App() {
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Здравствуйте! Я ваш AI-ассистент по архитектуре. Какой проект мы будем сегодня проектировать?", sender: 'ai' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const chatHistory = [
    { id: 1, name: "Проект CRM-системы" },
    { id: 2, name: "Архитектура блога" },
  ];

  // 2. ПЕРЕПИСЫВАЕМ ФУНКЦИЮ ПОЛНОСТЬЮ
  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: Date.now(),
      text,
      sender: 'user',
    };

    // Создаем новый массив сообщений для обновления UI
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // 1. Фильтруем историю для API: убираем самое первое системное сообщение
      const historyForAPI = messages
        .filter(msg => msg.id !== 1) // Убираем сообщение с id: 1
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        }));
      
      const chat = geminiModel.startChat({
        history: historyForAPI,
        generationConfig: {
          maxOutputTokens: 2000,
        },
      });

      // 2. Создаем сообщение для отправки. Если это первый запрос пользователя, добавляем системный промпт
      let messageToSend = text;
      // Проверяем, было ли в чате до этого сообщение от пользователя
      const hasUserMessagedBefore = messages.some(msg => msg.sender === 'user');
      
      if (!hasUserMessagedBefore) {
        // Это первое сообщение от пользователя. Добавляем "скрытую" инструкцию.
        messageToSend = `СИСТЕМНАЯ ИНСТРУКЦИЯ: Ты — опытный AI-ассистент и ментор по проектированию IT-архитектуры. Твоя задача — вести диалог, задавать уточняющие вопросы и помогать пользователю проектировать систему. Отвечай кратко и по делу. НАЧАЛО ДИАЛОГА.
        Пользователь: ${text}`;
      }

      // Отправляем сообщение (возможно, с инструкцией)
      const result = await chat.sendMessage(messageToSend);
      const response = result.response;
      const aiResponseText = response.text();

      const aiMessage: Message = {
        id: Date.now() + 1,
        text: aiResponseText,
        sender: 'ai',
      };
      // Обновляем UI новым сообщением от AI
      setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error("Ошибка при вызове Gemini API:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "К сожалению, произошла ошибка при обращении к Google AI. Пожалуйста, проверьте ваш API ключ или попробуйте еще раз.",
        sender: 'ai',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex">
      <Sidebar />
      
      {isPanelVisible && <ProjectListPanel chatHistory={chatHistory} />}
      
      <main className="flex-grow flex flex-row">
        <ChatPanel 
          messages={messages} 
          onSendMessage={handleSendMessage}
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
          isLoading={isLoading}
        />
        <ArchitecturePanel />
      </main>
    </div>
  )
}

export default App;