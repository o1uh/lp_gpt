import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';
import type { Message, PlanStep, TeacherCourse } from '../types';
import { useChat, type HistoryItem } from '../hooks/useChat';
import { templateBlog, sandboxTasks } from '../components/config/templates';
import { fetchProjects, fetchProjectById, renameProject, deleteProject } from '../api/projectService';
import { useAuth } from './AuthContext';
import { getPlanUpdate } from '../api/aiService';
import { createCourse, fetchCoursesForKB } from '../api/teacherService';


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
  activeProjectId: number | null;
  renameCurrentProject: () => void;
  deleteCurrentProject: () => void;
  isPlanning: boolean; // Флаг, что мы в режиме планирования
  generatedPlan: PlanStep[] | null; // Сгенерированный план
  approvePlan: () => void; // Функция для утверждения плана
  startCoursePlanning: (kbId: number, topic: string) => void;
  planningMessages: Message[]; 
  sendPlanningMessage: (text: string) => void;
  currentTopic: string;
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
  const [isPlanning, setIsPlanning] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<PlanStep[] | null>(null);
  const [currentTopic, setCurrentTopic] = useState('');
  const [currentKbId, setCurrentKbId] = useState<number | null>(null);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [planningMessages, setPlanningMessages] = useState<Message[]>([]);

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

  const { isLoading, sendMessage, promptSuggestions, setPromptSuggestions, saveCurrentProject, setIsLoading} = useChat({ 
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

// НОВАЯ ФУНКЦИЯ для загрузки курсов "Учителя"
  const loadCourses = useCallback(async (kbId: number) => {
    if (!isAuthenticated) return;
    try {
      const data = await fetchCoursesForKB(kbId);
      setTeacherCourses(data);
    } catch (error) {
      console.error(`Ошибка загрузки курсов для проекта ${kbId}:`, error);
      // Очищаем список курсов в случае ошибки
      setTeacherCourses([]); 
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
    setIsDirty(true); // Новый проект по определению "грязный", т.к. не сохранен
    if (template === 'blog') {
      setActiveProjectName("Новый проект (Блог)");
      setNodes(templateBlog.nodes);
      setEdges(templateBlog.edges);
      setMessages([{ id: Date.now(), text: `Начинаем работу с шаблона "Блог"! Что будем изменять?`, sender: 'ai' }]);
    } else {
      setActiveProjectName("Новый проект");
      setNodes([{ id: 'start-node', type: 'input', data: { label: 'Начните проектирование...' }, position: { x: 250, y: 5 } }]);
      setEdges([]);
      setMessages([]);

      const initialSuggestions = sandboxTasks.map(task => task.name);
      initialSuggestions.push("Начать с чистого листа");
      setPromptSuggestions(initialSuggestions);
      setIsDirty(false); // Пустой проект незачем контролировать
    }
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
  const renameCurrentProject = () => {
    if (!activeProjectId) return;
    
    // Используем наше универсальное модальное окно для сохранения
    setSaveModalState({
      isOpen: true,
      onSave: async (newName) => {
        try {
          await renameProject(activeProjectId, newName);
          await loadProjects(); // Обновляем список
          setActiveProjectName(newName); // Обновляем заголовок
          alert("Проект переименован!");
        } catch (error) {
          console.error(error);
          alert("Ошибка переименования.");
        }
      },
    });
  };

  // Функция для удаления
  const deleteCurrentProject = () => {
    if (!activeProjectId) return;
    
    // Используем наше универсальное окно подтверждения
    setConfirmationState({
      isOpen: true,
      title: "Удалить проект?",
      description: `Вы уверены, что хотите удалить проект "${activeProjectName}"? Это действие необратимо.`,
      confirmText: "Да, удалить",
      onConfirm: async () => {
        try {
          await deleteProject(activeProjectId);
          await loadProjects();
          // Сбрасываем до состояния нового проекта
          startNewProject('empty');
          alert("Проект удален.");
        } catch (error) {
          console.error(error);
          alert("Ошибка удаления.");
        }
        setConfirmationState(prev => ({...prev, isOpen: false}));
      },
      onSaveAndConfirm: undefined, 
    });
  };
  const startCoursePlanning = async (kbId: number, topic: string) => {
    setIsPlanning(true);
    setGeneratedPlan(null);
    setCurrentTopic(topic);
    setCurrentKbId(kbId);

    setMessages([]); 
    setPlanningMessages([{ id: Date.now(), text: `Генерирую план обучения по теме "${topic}"...`, sender: 'ai' }]);
    
    setIsLoading(true);
    try {
      const response = await getPlanUpdate(kbId, topic, []);
      const fullResponseText = response.fullResponse;

      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = fullResponseText.match(jsonRegex);
      
      let planText = fullResponseText; // По умолчанию, весь ответ - это текст
      
      if (match && match[1]) {
        try {
          const plan = JSON.parse(match[1]);
          setGeneratedPlan(plan);
          // Убираем JSON-блок из текстового ответа, который покажем в чате
          planText = fullResponseText.replace(jsonRegex, '').trim();
        } catch (e) {
          console.error("Ошибка парсинга плана:", e);
          planText = "Не удалось обработать сгенерированный план. Попробуйте снова.";
        }
      } else {
        // Если AI не вернул JSON, просто показываем его текстовый ответ
        console.warn("AI did not return a JSON plan.");
      }

      // Обновляем чат отформатированным текстом
      setPlanningMessages(prev => [...prev, { id: Date.now() + 1, text: planText, sender: 'ai' }]);
    } catch (error) {
      console.error(error);
      setPlanningMessages(prev => [...prev, { id: Date.now() + 1, text: "Не удалось сгенерировать план.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

// Новая функция для продолжения диалога
  const sendPlanningMessage = async (text: string) => {
    if (!currentKbId || !currentTopic) return;

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    setPlanningMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    const historyForAPI: HistoryItem[] = [...planningMessages, userMessage].map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    try {
        const response = await getPlanUpdate(currentKbId, currentTopic, historyForAPI);
        const fullResponseText = response.fullResponse;

      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = fullResponseText.match(jsonRegex);
      
      let planText = fullResponseText; // По умолчанию, весь ответ - это текст
      
      if (match && match[1]) {
        try {
          const plan = JSON.parse(match[1]);
          setGeneratedPlan(plan);
          // Убираем JSON-блок из текстового ответа, который покажем в чате
          planText = fullResponseText.replace(jsonRegex, '').trim();
        } catch (e) {
          console.error("Ошибка парсинга плана:", e);
          planText = "Не удалось обработать сгенерированный план. Попробуйте снова.";
        }
      } else {
        // Если AI не вернул JSON, просто показываем его текстовый ответ
        console.warn("AI did not return a JSON plan.");
      }

      // Обновляем чат отформатированным текстом
      setMessages(prev => [...prev, { id: Date.now() + 1, text: planText, sender: 'ai' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: "Не удалось сгенерировать план.", sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  
  const approvePlan = async () => {
    if (!generatedPlan || !currentKbId) return;
    setIsLoading(true);
    try {
      // 1. Сохраняем курс и план в БД
      await createCourse(currentKbId, currentTopic, generatedPlan);
      
      // 2. Выходим из режима планирования
      setIsPlanning(false);
      setGeneratedPlan(null);
      
      // 3. Обновляем список курсов в левой панели
      await loadCourses(currentKbId); 
      
      // 4. Очищаем чат и превращаем его в чат для общих вопросов
      setPlanningMessages([
        { 
          id: Date.now(), 
          text: `План по теме "${currentTopic}" утвержден. Теперь вы можете задавать общие вопросы по этой теме или выбрать конкретный шаг для изучения в панели слева.`, 
          sender: 'ai' 
        }
      ]);

      alert("Курс успешно создан! План утвержден.");

    } catch (error) {
      console.error(error);
      alert("Не удалось сохранить курс.");
    } finally {
      setIsLoading(false);
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
    setPromptSuggestions,
    activeProjectId,
    renameCurrentProject,
    deleteCurrentProject,
    isPlanning,
    generatedPlan,
    approvePlan,
    startCoursePlanning,
    teacherCourses,
    loadCourses,
    planningMessages, 
    sendPlanningMessage,
    currentTopic
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};