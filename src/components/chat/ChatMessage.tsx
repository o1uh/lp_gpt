import ReactMarkdown from 'react-markdown';
import type { Message } from '../../types';

interface ChatMessageProps {
  message: Message;
  isPanelVisible: boolean; // Добавляем пропс, чтобы компонент знал о состоянии панели
}

export const ChatMessage = ({ message, isPanelVisible }: ChatMessageProps) => {
  return (
    <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`prose prose-sm prose-invert p-3 rounded-lg break-words ${
          isPanelVisible ? 'max-w-xs lg:max-w-md' : 'max-w-lg lg:max-w-2xl'
        } ${
          message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <ReactMarkdown
          components={{
            p: ({ node: _node, ...props }) => <p {...props} />
          }}
        >
          {message.text}
        </ReactMarkdown>
      </div>
    </div>
  );
};