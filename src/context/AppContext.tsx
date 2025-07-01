import { createContext, useState, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';
import type { Message } from '../types';
import { useChat } from '../hooks/useChat'; // Наш будущий хук

// 1. Описываем, какие данные будут храниться в контексте
interface AppContextType {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection | Edge) => void;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => void;
}

// 2. Создаем сам контекст
const AppContext = createContext<AppContextType | undefined>(undefined);

// 3. Создаем "Провайдер" - компонент, который будет оборачивать наше приложение
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Логика управления узлами и связями остается здесь
  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdgeHelper(params, eds)), [setEdges]);

  // 4. Используем наш кастомный хук для всей логики чата
  const { messages, isLoading, sendMessage } = useChat({ nodes, edges, setNodes, setEdges });

  // 5. Собираем все значения, которые предоставим дочерним компонентам
  const value = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    messages,
    isLoading,
    sendMessage,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 6. Создаем хук для удобного доступа к контексту
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};