import { createContext, useState, useCallback, useContext } from 'react';
import type { ReactNode } from 'react';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';
import type { Message } from '../types';
import { useChat } from '../hooks/useChat';
import { templateBlog, sandboxTasks } from '../components/config/templates';

type SandboxTask = typeof sandboxTasks[0];

interface AppContextType {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection | Edge) => void;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => void;
  startNewProject: (template?: 'empty' | 'blog') => void;
  startSandboxTask: (task: SandboxTask) => void;
  promptSuggestions: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdgeHelper(params, eds)), [setEdges]);

  const { messages, isLoading, sendMessage, setMessages, promptSuggestions } = useChat({ nodes, edges, setNodes, setEdges });

  const startNewProject = (template: 'empty' | 'blog' = 'empty') => {
    setMessages([{ id: Date.now(), text: "Начинаем новый проект! Что будем делать?", sender: 'ai' }]);
    if (template === 'blog') {
      setNodes(templateBlog.nodes);
      setEdges(templateBlog.edges);
    } else {
      setNodes([{ id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }]);
      setEdges([]);
    }
  };
  
  const startSandboxTask = (task: SandboxTask) => {
    setNodes(task.initialNodes.length > 0 ? task.initialNodes : [
      { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }
    ]);
    setEdges(task.initialEdges);
    setMessages([{ id: Date.now(), text: task.startMessage, sender: 'ai' }]);
  };

  const value = {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    messages,
    isLoading,
    sendMessage,
    startNewProject,
    startSandboxTask,
    promptSuggestions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};