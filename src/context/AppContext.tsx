import { createContext, useState, useCallback, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection, applyNodeChanges, applyEdgeChanges, addEdge as addEdgeHelper } from 'reactflow';
import type { Message, PlanStep, TeacherCourse } from '../types';
import { useChat, type HistoryItem } from '../hooks/useChat';
import { templateBlog, sandboxTasks } from '../components/config/templates';
import { fetchProjects, fetchProjectById, renameProject, deleteProject } from '../api/projectService';
import { useAuth } from './AuthContext';
import { getPlanUpdate } from '../api/aiService';
import { createCourse, fetchCoursesForKB, approveCoursePlan, fetchCourseData, sendCourseMessage, updateCoursePlan, fetchStepData } from '../api/teacherService';



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

export interface StepState {
  messages: Message[];
  lessonNodes: Node[];
  lessonEdges: Edge[];
  clarificationNodes: Node[];
  clarificationEdges: Edge[];
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
  createNewCourse: (kbId: number, topic: string) => Promise<TeacherCourse | null>; 
  beginCoursePlanning: (course: TeacherCourse, kbId: number) => void; 
  currentTopic: string;
  teacherCourses: TeacherCourse[]; 
  loadCourses: (kbId: number) => Promise<void>;
  activeCourseMessages: Message[];
  loadCourse: (courseId: number, kbId: number, projectName: string) => void;  
  sendTeacherMessage: (text: string) => void;
  activeStep: PlanStep | null;
  activeStepState: StepState; 
  loadStep: (step: PlanStep, courseProgressId: number) => void;
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
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [activeCourseMessages, setActiveCourseMessages] = useState<Message[]>([]);
  const [activeStep, setActiveStep] = useState<PlanStep | null>(null);
  
  const [activeStepState, setActiveStepState] = useState<StepState>({
    messages: [],
    lessonNodes: [], lessonEdges: [],
    clarificationNodes: [], clarificationEdges: [],
  });

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
  const createNewCourse = async (kbId: number, topic: string): Promise<TeacherCourse | null> => {
    try {
      const newCourseData = await createCourse(kbId, topic);
      await loadCourses(kbId); // Обновляем список курсов
      return newCourseData.course;
    } catch (error) {
      console.error("Не удалось создать курс в БД:", error);
      alert("Ошибка создания курса.");
      return null;
    }
  };

  const beginCoursePlanning = async (course: TeacherCourse, kbId: number) => {
    setIsPlanning(true);
    setGeneratedPlan(null);
    setCurrentTopic(course.name);
    setCurrentKbId(kbId);
    setActiveCourseId(course.id);
    
    setActiveCourseMessages([{ id: Date.now(), text: `Генерирую план обучения по теме "${course.name}"...`, sender: 'ai' }]);
    setIsLoading(true);
    try {
      // 3. Генерируем план
      const response = await getPlanUpdate(kbId, course.name, []); // История пока пустая
      const fullResponseText = response.fullResponse;
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = fullResponseText.match(jsonRegex);
      
      let planText = fullResponseText;
      
      if (match && match[1]) {
        try {
          const plan = JSON.parse(match[1]);
          setGeneratedPlan(plan);
          await updateCoursePlan(course.id, plan); 
          planText = fullResponseText.replace(jsonRegex, '').trim();
        } catch (e) {
          console.error("Ошибка парсинга плана:", e);
          planText = "Не удалось обработать сгенерированный план. Попробуйте снова.";
        }
      } else {
        // Если AI не вернул JSON, просто показываем его текстовый ответ
        console.warn("AI did not return a JSON plan.");
      }

      // 4. Создаем и СОХРАНЯЕМ сообщение с планом
      const planMessage: Message = { id: Date.now() + 1, text: planText, sender: 'ai' };
      await sendCourseMessage(course.id, { sender: 'ai', text: planMessage.text });

      // 5. Обновляем UI финальным сообщением
      setActiveCourseMessages(prev => [...prev, planMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: Message = { id: Date.now() + 1, text: "Не удалось сгенерировать план.", sender: 'ai' };
      await sendCourseMessage(course.id, { sender: 'ai', text: errorMessage.text });
      setActiveCourseMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

// Новая функция для продолжения диалога
  const sendTeacherMessage = async (text: string) => {
    if (!activeCourseId || !currentKbId || !currentTopic) return; 

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    
    // 1. Создаем обновленный массив сообщений и СРАЗУ используем его
    const updatedMessages = [...activeCourseMessages, userMessage];
    setActiveCourseMessages(updatedMessages); // Обновляем UI
    setIsLoading(true);

    try {
      // 2. Сохраняем сообщение пользователя в БД
      await sendCourseMessage(activeCourseId, { sender: 'user', text });

      // 3. Формируем историю из этого же, уже обновленного массива
      const historyForAPI: HistoryItem[] = updatedMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      }));

      // --- Дальше в этой функции ничего не меняется ---
      const response = await getPlanUpdate(currentKbId, currentTopic, historyForAPI);
      const fullResponseText = response.fullResponse;
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = fullResponseText.match(jsonRegex);
      
      let planText = fullResponseText; // По умолчанию, весь ответ - это текст
      
      if (match && match[1]) {
        try {
          const plan = JSON.parse(match[1]);
          setGeneratedPlan(plan);
          if (activeCourseId) {
            await updateCoursePlan(activeCourseId, plan);
          }
          planText = fullResponseText.replace(jsonRegex, '').trim();
        } catch (e) {
          console.error("Ошибка парсинга плана:", e);
          planText = "Не удалось обработать сгенерированный план. Попробуйте снова.";
        }
      } else {
        console.warn("AI did not return a JSON plan.");
      }
      if (planText) {
          const aiMessage: Message = { id: Date.now() + 1, text: planText, sender: 'ai' };

          // 4. Сохраняем ответ AI в БД
          await sendCourseMessage(activeCourseId, { sender: 'ai', text: aiMessage.text });
          
          // 5. И только потом обновляем UI финальным сообщением
          setActiveCourseMessages(prev => [...prev, aiMessage]);
      }

    } catch (error) {
      console.error(error);
      const errorMessage: Message = { id: Date.now() + 1, text: "Не удалось получить ответ от AI.", sender: 'ai' };
      // Сохраняем сообщение об ошибке в БД
      await sendCourseMessage(activeCourseId, { sender: 'ai', text: errorMessage.text });
      setActiveCourseMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const approvePlan = async () => {
    if (!generatedPlan || !currentKbId || !activeCourseId) return;
    setIsLoading(true);
    try {
      // 5. Отправляем финальный план на новый эндпоинт
      await approveCoursePlan(activeCourseId);
      
      setIsPlanning(false);
      // setGeneratedPlan(null);
      await loadCourses(currentKbId);
      // 6. Трансформируем чат в Q&A
      setActiveCourseMessages([
        { 
          id: Date.now(), 
          text: `План по теме "${currentTopic}" утвержден. Теперь вы можете задавать общие вопросы по этой теме или выбрать конкретный шаг для изучения в панели слева.`, 
          sender: 'ai' 
        }
      ]);
      const firstStep = generatedPlan[0];
      if (firstStep) {
        setActiveStep(firstStep);
        // TODO: Загрузить состояние первого шага (пока будет пустой чат)
      }
      
      alert("Курс успешно утвержден!");
    } catch (error) {
      console.error(error);
      alert("Не удалось сохранить курс.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourse = useCallback(async (courseId: number, kbId: number, projectName: string) => {
    try {
      setIsLoading(true);
      const { course, messages } = await fetchCourseData(courseId);
      
      setActiveCourseMessages(messages);
      setActiveCourseId(courseId);
      // Устанавливаем текущую тему и ID Базы Знаний, чтобы чат знал, с чем работать
      setCurrentTopic(course.topic); 
      setCurrentKbId(kbId);
      
      // Устанавливаем имя для заголовка
      setActiveProjectName(projectName); // Или course.topic, в зависимости от желаемого UX

      // Восстанавливаем состояние планирования
      if (course.status === 'planning') {
        setIsPlanning(true);
        setGeneratedPlan(course.plan || []);
      } else { // 'approved'
        setIsPlanning(false);
        setGeneratedPlan(course.plan || []);
      }
      
    } catch (error) {
      console.error("Ошибка загрузки курса:", error);
      // В случае ошибки сбрасываем состояние
      setActiveCourseMessages([]);
      setIsPlanning(false);
      setGeneratedPlan(null);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStep = useCallback(async (step: PlanStep, courseProgressId: number) => {
    // TODO: Этот ID должен приходить из `step_progress`
    const stepProgressId = 1; // Заглушка
    
    // 1. Устанавливаем активный шаг
    setActiveStep(step);

    try {
      // 2. Загружаем данные для этого шага
      const data = await fetchStepData(stepProgressId);
      setActiveStepState({
        messages: JSON.parse(data.messages_json || '[]'),
        lessonNodes: JSON.parse(data.lesson_nodes_json || '[]'),
        lessonEdges: JSON.parse(data.lesson_edges_json || '[]'),
        clarificationNodes: JSON.parse(data.clarification_nodes_json || '[]'),
        clarificationEdges: JSON.parse(data.clarification_edges_json || '[]'),
      });
    } catch (error) {
      console.error("Ошибка загрузки шага:", error);
      // Если данных нет, устанавливаем начальное состояние
      setActiveStepState({
        messages: [{ id: Date.now(), text: `Начинаем урок: ${step.title}`, sender: 'ai' }],
        lessonNodes: [], lessonEdges: [],
        clarificationNodes: [], clarificationEdges: [],
      });
    }
  }, []);


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
    createNewCourse,
    beginCoursePlanning,
    teacherCourses,
    loadCourses,
    currentTopic,
    activeCourseMessages,
    loadCourse,
    sendTeacherMessage,
    activeStep,
    activeStepState,
    loadStep,
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