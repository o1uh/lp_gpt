import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';
import type { Message } from '../types';
import { useChat } from '../hooks/useChat';
import { sandboxTasks } from '../components/config/templates';
import { fetchProjects, createProject, fetchProjectById } from '../api/projectService';

type SandboxTask = typeof sandboxTasks[0];
export interface Project { // Экспортируем, чтобы использовать в других файлах
  id: number;
  name: string;
  updated_at: string;
}

interface AppContextType {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection | Edge) => void;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => void;
  startNewProject: (name?: string) => void;
  startSandboxTask: (task: SandboxTask) => void;
  promptSuggestions: string[];
  projects: Project[]; 
  saveCurrentProject: () => void; 
  activeProjectName: string;
  loadProject: (projectId: number) => void;
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

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await fetchProjects();
        setProjects(data);
      } catch (error) {
        console.error("Ошибка загрузки проектов:", error);
        // TODO: показать ошибку пользователю
      }
    };
    loadProjects();
  }, []); // Пустой массив зависимостей - выполнится 1 раз

  const onNodesChange: OnNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);
  const onEdgesChange: OnEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), [setEdges]);
  const onConnect = useCallback((params: Connection | Edge) => setEdges((eds) => addEdgeHelper(params, eds)), [setEdges]);

  const { messages, isLoading, sendMessage, setMessages, promptSuggestions, saveCurrentProject } = useChat({ nodes, edges, setNodes, setEdges, activeProjectId });

  // Функция для загрузки списка проектов
  const loadProjects = useCallback(async () => {
    try {
      const data = await fetchProjects();
      setProjects(data);
    } catch (error) { console.error("Ошибка загрузки проектов:", error); }
  }, []);

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
        setActiveProjectId(projectId);
        // Найдем имя проекта для отображения
        const project = projects.find(p => p.id === projectId);
        if (project) setActiveProjectName(project.name);
      }
    } catch (error) { console.error("Ошибка загрузки проекта:", error); }
  }, [projects, setMessages]); // Зависимость от projects, чтобы найти имя


   const startNewProject = async (name: string = `Новый проект ${new Date().toLocaleTimeString()}`) => {
    try {
      const newProject = await createProject(name);
      await loadProjects(); // Обновляем список проектов, чтобы новый появился
      await loadProject(newProject.id); // Загружаем только что созданный проект
    } catch (error) {
      console.error("Ошибка создания проекта:", error);
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
    projects, 
    saveCurrentProject, 
    loadProject,
    activeProjectName
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