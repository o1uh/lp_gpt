import { useState } from 'react'; // 1. Добавляем useState для вкладок
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArchitectureNode } from './ArchitectureNode';
import { useAppContext } from '../../context/AppContext';

// Выносим `nodeTypes` за пределы компонента для оптимизации
const nodeTypes = { architectureNode: ArchitectureNode };

export const ArchitecturePanel = () => {
  // 2. Получаем все данные из контекста, включая новые для режима "Учитель"
  const { 
    // Данные для режима "Ассистент"
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect,
    // Данные для режима "Учитель"
    activeStep,      // Чтобы понять, находимся ли мы в режиме урока
    activeStepState, // Состояние с данными урока
  } = useAppContext();

  // 3. Локальное состояние для переключения вкладок в режиме урока
  const [diagramTab, setDiagramTab] = useState<'lesson' | 'clarification'>('lesson');

  // 4. Определяем, в каком режиме мы сейчас находимся
  const isLessonMode = !!activeStep; // Если есть активный шаг, значит мы в режиме урока

  // 5. Выбираем, какие узлы и связи показывать, в зависимости от режима
  const nodesToRender = isLessonMode
    ? (diagramTab === 'lesson' ? activeStepState.lessonNodes : activeStepState.clarificationNodes)
    : nodes; // Если не урок, показываем обычные узлы

  const edgesToRender = isLessonMode
    ? (diagramTab === 'lesson' ? activeStepState.lessonEdges : activeStepState.clarificationEdges)
    : edges; // Если не урок, показываем обычные связи

  // 6. Функция для стилизации кнопок-вкладок
  const getTabClassName = (tabName: 'lesson' | 'clarification') => {
    return `px-3 py-1 text-sm rounded-t-md transition-colors ${
      diagramTab === tabName 
        ? 'bg-gray-800 text-white' 
        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
    }`;
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Текущая архитектура</h2>
      
      {/* 7. Показываем вкладки, ТОЛЬКО если мы в режиме урока */}
      {isLessonMode && (
        <div className="flex space-x-1">
          <button onClick={() => setDiagramTab('lesson')} className={getTabClassName('lesson')}>
            Схема урока
          </button>
          <button onClick={() => setDiagramTab('clarification')} className={getTabClassName('clarification')}>
            Уточнения
          </button>
        </div>
      )}

      <div className="flex-grow bg-gray-800 rounded-lg">
        <ReactFlow
          nodes={nodesToRender}
          edges={edgesToRender}
          // 8. Делаем схему НЕредактируемой в режиме урока
          onNodesChange={isLessonMode ? undefined : onNodesChange}
          onEdgesChange={isLessonMode ? undefined : onEdgesChange}
          onConnect={isLessonMode ? undefined : onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-800"
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
};