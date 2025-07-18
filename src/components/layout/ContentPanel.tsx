import { useState, type ReactNode, useEffect } from 'react';
import { Plus, Hash, BookOpen, ClipboardCheck, MessageSquare, ArrowLeft, LoaderCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAppContext, type Project } from '../../context/AppContext';
import type { TeacherProject, TeacherCourse } from '../../types';
import { NewCourseModal } from '../ui/NewCourseModal';
import { fetchKnowledgeBases, fetchCoursesForKB } from '../../api/teacherService';

type ViewState = 
  | { level: 'projects' }
  | { level: 'courses', knowledgeBaseId: number, projectName: string } 
  | { level: 'steps', knowledgeBaseId: number, projectName: string, courseId: number, courseName: string };


// Определяем типы для наших вкладок
type Tab = 'assistant' | 'teacher' | 'examiner';

// Пропсы для нашего нового компонента
interface ContentPanelProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export const ContentPanel = ({ activeTab, onTabChange }: ContentPanelProps) => {
  const { startNewProject, projects, loadProject, navigateWithDirtyCheck, activeProjectId, startCoursePlanning } = useAppContext(); 
  
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  
  const [studyProjects, setStudyProjects] = useState<TeacherProject[]>([]);
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [teacherView, setTeacherView] = useState<ViewState>({ level: 'projects' });


  useEffect(() => {
    return () => {setTeacherView({ level: 'projects' });}
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'teacher') return;
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (teacherView.level === 'projects') {
          const data = await fetchKnowledgeBases(); // Вызываем новый сервис
          setStudyProjects(data);
        } else if (teacherView.level === 'courses') {
          const data = await fetchCoursesForKB(teacherView.knowledgeBaseId);
          setTeacherCourses(data);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных для обучения:", error);
      } finally { setIsLoading(false); }
    };
    loadData();
  }, [activeTab, teacherView]);

  const handleOpenCreateProjectModal = () => {
    navigateWithDirtyCheck(
      () => { setIsProjectModalOpen(true); }, 
      "Создать новый диалог"
    );
  };
  
  const handleOpenCreateCourseModal = () => {
    setIsCourseModalOpen(true);
  };

  const handleCreateProject = (template: 'empty' | 'blog') => {
    startNewProject(template);
    setIsProjectModalOpen(false);
  };

  const handleCreateCourse = async (topic: string) => {
    if (teacherView.level !== 'courses') return; // Защита
    startCoursePlanning(teacherView.knowledgeBaseId, topic);
    setIsCourseModalOpen(false);
  };

  const handleTabChange = (tab: 'assistant' | 'teacher' | 'examiner') => {
    navigateWithDirtyCheck(() => onTabChange(tab), "Переключить режим");
  };

  const handleLoadProject = (projectId: number) => {
    navigateWithDirtyCheck(() => loadProject(projectId), "Перейти к проекту");
  };
  
  // Функция для стилизации кнопок-вкладок
  const getTabClassName = (tabName: Tab) => {
    return `p-2 rounded-lg transition-colors ${
      activeTab === tabName
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`;
  };

  // Функция для рендеринга контента активной вкладки
  const renderContent = (): ReactNode => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <LoaderCircle className="animate-spin text-gray-500" size={24} />
        </div>
      );
    }
    switch (activeTab) {
      case 'assistant':
        return (
          <>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xs font-bold text-gray-400 uppercase">Диалоги</h2>
              <button onClick={handleOpenCreateProjectModal} className="p-1 rounded text-gray-400 hover:text-white hover:bg-gray-700" title="Создать новый диалог">
                <Plus size={16} />
              </button>
            </div>
            <ul className="space-y-2">
              {projects.map((project: Project) => {
                const isActive = project.id === activeProjectId;
                return (
                  <li key={project.id}>
                    <button 
                      onClick={() => handleLoadProject(project.id)} 
                      className={`w-full text-left flex items-center gap-x-2 p-2 rounded transition-colors ${
                        isActive
                          ? 'bg-blue-600/20 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <Hash size={16} /> <span>{project.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        );
      case 'teacher':
        switch (teacherView.level) {
          case 'projects': { 
            return (
              <>
                <h2 className="text-xs font-bold text-gray-400 uppercase mb-2">Выберите проект для изучения</h2>
                <ul className="space-y-2">
                  {studyProjects.map(project => (
                    <li key={project.id}>
                      <button onClick={() => setTeacherView({ level: 'courses', knowledgeBaseId: project.id, projectName: project.name })}
                        className="w-full text-left flex items-center gap-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        <BookOpen size={16} /> <span>{project.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            );
          } 

          case 'courses': { 
             const courses = teacherCourses;
            return (
              <>
                <div className="flex justify-between items-center mb-4">
                  <button 
                    onClick={() => setTeacherView({ level: 'projects' })}
                    className="flex items-center gap-x-1 text-sm text-gray-400 hover:text-white"
                  >
                    <ArrowLeft size={16} />
                    Проекты
                  </button>
                  <button onClick={handleOpenCreateCourseModal} className="p-1 rounded hover:bg-gray-700" title="Начать новый курс">
                    <Plus size={20} />
                  </button>
                </div>
                <h2 className="text-xs font-bold text-gray-400 uppercase mb-2 truncate" title={teacherView.projectName}>
                  Курсы по проекту: {teacherView.projectName}
                </h2>
                <ul className="space-y-2">
                  {courses.length > 0 ? (
                    courses.map(course => (
                      <li key={course.id}>
                        <button 
                          onClick={() => {
                            // Проверяем, что teacherView имеет тип 'courses' перед доступом к projectId
                            if (teacherView.level === 'courses') {
                                setTeacherView({ level: 'steps', courseId: course.id, courseName: course.name, knowledgeBaseId: teacherView.knowledgeBaseId, projectName: teacherView.projectName });
                            }
                          }}
                          className="w-full text-left flex items-center gap-x-2 p-2 rounded text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          <Hash size={16} /> <span>{course.name}</span>
                        </button>
                      </li>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 p-2">Для этого проекта еще нет курсов. Создайте первый!</p>
                  )}
                </ul>
              </>
            );
          } 

          case 'steps': { 
            if (teacherView.level !== 'steps') return null; 
            return (
                <div className="flex justify-between items-center mb-4">
                    <button 
                      onClick={() => setTeacherView({ level: 'courses', knowledgeBaseId: teacherView.knowledgeBaseId, projectName: teacherView.projectName })}
                      className="flex items-center gap-x-1 text-sm text-gray-400 hover:text-white"
                    >
                      <ArrowLeft size={16} />
                      Курсы
                    </button>
                </div>
            )
          } 
        }
        return null;
      case 'examiner':
        return <p className="text-sm text-gray-400">Раздел тестов в разработке.</p>;
      default:
        return null;
    }
  };

  return (
    <aside className="w-64 bg-gray-800/50 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">Архитектура</h1>
      </div>

      <div className="flex justify-around items-center mb-4 border-b border-gray-700 pb-2">
        <button 
          onClick={() => handleTabChange('assistant')} 
          className={getTabClassName('assistant')}
          title="Ассистент"
        >
          <MessageSquare size={20} />
        </button>
        <button 
          onClick={() => handleTabChange('teacher')} 
          className={getTabClassName('teacher')}
          title="Обучение"
        >
          <BookOpen size={20} />
        </button>
        <button 
          onClick={() => handleTabChange('examiner')} 
          className={getTabClassName('examiner')}
          title="Тесты"
        >
          <ClipboardCheck size={20} />
        </button>
      </div>

      <div className="flex-grow overflow-y-auto pr-2">
        {renderContent()}
      </div>

      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title="Создать новый проект">
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-400">
            Начните с чистого листа или используйте готовый шаблон для быстрого старта.
          </p>
          <button 
            onClick={() => { handleCreateProject('empty')}}
            className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Пустой проект
          </button>
          <button 
            onClick={() => { handleCreateProject('blog')}}
            className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Шаблон: Блог
          </button>
        </div>
      </Modal>
       <NewCourseModal 
        isOpen={isCourseModalOpen} 
        onClose={() => setIsCourseModalOpen(false)}
        onSubmit={handleCreateCourse}
      />
    </aside>
  );
};