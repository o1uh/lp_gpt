import { useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState,
  useEdgesState,
} from 'reactflow';
// Исправленный импорт: импортируем типы отдельно
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange } from 'reactflow';
import 'reactflow/dist/style.css';

interface ArchitecturePanelProps {
  initialNodes: Node[]; 
  initialEdges: Edge[];
}

export const ArchitecturePanel = ({ initialNodes, initialEdges }: ArchitecturePanelProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Синхронизируем состояние, когда AI присылает новую архитектуру
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Текущая архитектура</h2>
      <div className="flex-grow bg-gray-800 rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange} // Приведение типов `as` больше не нужно
          onEdgesChange={onEdgesChange} // Приведение типов `as` больше не нужно
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
};