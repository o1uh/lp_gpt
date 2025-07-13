import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';
import type { Message } from '../types';
import { useChat } from '../hooks/useChat';
import { templateBlog, sandboxTasks } from '../components/config/templates';
import { fetchProjects, fetchProjectById } from '../api/projectService';
import { useAuth } from './AuthContext';

type SandboxTask = typeof sandboxTasks[0];
export interface Project { // Экспортируем, чтобы использовать в других файлах
  id: number;
  name: string;
  updated_at: string;
}

type SaveModalStateType = {
  isOpen: boolean;
  onSave: (name: string) => void;
};

type ConfirmationStateType = {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onSaveAndConfirm?: () => Promise<void>; // Должен быть async, так как сохранение асинхронное
  confirmText?: string;
  saveAndConfirmText?: string;
};

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
  projects: Project[]; 
  saveCurrentProject: () => void; 
  activeProjectName: string;
  loadProject: (projectId: number) => void;
  isDirty: boolean; 
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>; 
  confirmationState: ConfirmationStateType; 
  setConfirmationState: React.Dispatch<React.SetStateAction<ConfirmationStateType>>; 
  navigateWithDirtyCheck: (action: () => void, actionName?: string) => void; 
  saveModalState: SaveModalStateType; 
  setSaveModalState: React.Dispatch<React.SetStateAction<SaveModalStateType>>; 
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }
  ]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [projects, setProjects] = useState<Project[]>([]); 
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null); 
  const [activeProjectName, setActiveProjectName] = useState("Новый проект");
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmationState, setConfirmationState] = useState<ConfirmationStateType>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const [saveModalState, setSaveModalState] = useState<SaveModalStateType>({
    isOpen: false,
    onSave: () => {}, // Пустая функция по умолчанию
  });

  const { isLoading, sendMessage, promptSuggestions, setPromptSuggestions, saveCurrentProject } = useChat({ 
        nodes, 
        edges, 
        activeProjectId,
        setNodes,
        setEdges,
        messages, 
        setMessages,
        setIsDirty,
        loadProjects: () => loadProjects(),
        setActiveProjectId,
        setActiveProjectName,
        setSaveModalState
    });

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    if (changes.some(c => c.type === 'position' && c.dragging === false)) {
      setIsDirty(true);
    }
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    if (changes.some(c => c.type === 'add' || c.type === 'remove')) {
      setIsDirty(true);
    }
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);
  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges((eds) => addEdgeHelper(params, eds));
    setIsDirty(true);
  }, []);

  const loadProjects = useCallback(async () => {
    if (!isAuthenticated) return; 

    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) {
      console.error("Ошибка загрузки проектов:", error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Функция для загрузки конкретного проекта
  const loadProject = useCallback(async (projectId: number) => {
    try {
      const data = await fetchProjectById(projectId);
      if (data) {
        setNodes(JSON.parse(data.nodes_json || '[]'));
        setEdges(JSON.parse(data.edges_json || '[]'));
        setMessages(JSON.parse(data.messages_json || '[]'));
        setPromptSuggestions(JSON.parse(data.suggestions_json || '[]'));
        setActiveProjectId(projectId);
        // Найдем имя проекта для отображения
        const project = projects.find(p => p.id === projectId);
        if (project) setActiveProjectName(project.name);
        setIsDirty(false);
      }
    } catch (error) { console.error("Ошибка загрузки проекта:", error); }
  }, [projects, setMessages, setNodes, setEdges, setIsDirty, setPromptSuggestions]); 


  const startNewProject = (template: 'empty' | 'blog' = 'empty') => {
    setActiveProjectId(null); // Самое важное: это теперь новый, несохраненный проект
    setPromptSuggestions([]);
    if (template === 'blog') {
      setActiveProjectName("Новый проект (Блог)");
      setNodes(templateBlog.nodes);
      setEdges(templateBlog.edges);
      setMessages([{ id: Date.now(), text: `Начинаем работу с шаблона "Блог"! Что будем изменять?`, sender: 'ai' }]);
    } else {
      setActiveProjectName("Новый проект (Пустой)");
      setNodes([{ id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 } }]);
      setEdges([]);
      setMessages([{ id: Date.now(), text: "Начинаем новый проект! С чего начнем?", sender: 'ai' }]);

      const initialSuggestions = sandboxTasks.map(task => task.name);
      initialSuggestions.push("Начать с чистого листа");
      setPromptSuggestions(initialSuggestions);
    }
    setIsDirty(true); // Новый проект по определению "грязный", т.к. не сохранен
  };
  
  const startSandboxTask = (task: SandboxTask) => {
    setNodes(task.initialNodes.length > 0 ? task.initialNodes : [
      { id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 }, style: { width: 180, height: 50 } }
    ]);
    setEdges(task.initialEdges);
    setMessages([{ id: Date.now(), text: task.startMessage, sender: 'ai' }]);
  };

  const navigateWithDirtyCheck = (action: () => void, actionName: string = 'Продолжить') => {
    if (isDirty) {
      setConfirmationState({
        isOpen: true,
        title: "Несохраненные изменения",
        description: "У вас есть несохраненные изменения. Вы уверены, что хотите продолжить?",
        // Действие для кнопки "Не сохранять"
        onConfirm: () => {
          setIsDirty(false);
          action();
          setConfirmationState(prev => ({ ...prev, isOpen: false }));
        },
        // НОВАЯ ЛОГИКА для кнопки "Сохранить и ..."
        onSaveAndConfirm: async () => {
          const success = await saveCurrentProject(); // Сначала сохраняем
          if (success) {
            setIsDirty(false);
            action(); // Выполняем действие только если сохранение прошло успешно
          }
          setConfirmationState(prev => ({ ...prev, isOpen: false }));
        },
        // Динамические тексты кнопок
        confirmText: `${actionName} без сохранения`,
        saveAndConfirmText: `Сохранить и ${actionName.toLowerCase()}`,
      });
    } else {
      // Если все чисто, просто выполняем действие
      action();
    }
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
    projects, 
    saveCurrentProject, 
    loadProject,
    activeProjectName,
    isDirty,
    setIsDirty,
    confirmationState, 
    setConfirmationState, 
    navigateWithDirtyCheck,
    saveModalState,
    setSaveModalState,
    setPromptSuggestions
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