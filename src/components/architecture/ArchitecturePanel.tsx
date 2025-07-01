import { useEffect, useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState,
  useEdgesState,
  type Node, 
  type Edge, 
  type OnNodesChange, 
  type OnEdgesChange 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArchitectureNode } from './ArchitectureNode'; // 1. Импортируем наш кастомный узел

interface ArchitecturePanelProps {
  initialNodes: Node[]; 
  initialEdges: Edge[];
}

export const ArchitecturePanel = ({ initialNodes, initialEdges }: ArchitecturePanelProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 2. Создаем объект с типами узлов, которые мы будем использовать
  const nodeTypes = useMemo(() => ({ architectureNode: ArchitectureNode }), []);

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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} // 3. Передаем наши кастомные типы в ReactFlow
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