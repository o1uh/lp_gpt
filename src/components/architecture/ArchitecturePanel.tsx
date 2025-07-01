import { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArchitectureNode } from './ArchitectureNode';
import { useAppContext } from '../../context/AppContext'; // 1. Импортируем хук

export const ArchitecturePanel = () => {
  // 2. Получаем все нужные данные и функции прямо из контекста
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useAppContext();

  const nodeTypes = useMemo(() => ({ architectureNode: ArchitectureNode }), []);

  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-xl font-bold mb-4">Текущая архитектура</h2>
      <div className="flex-grow bg-gray-800 rounded-lg">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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