import { useMemo } from 'react'; // useMemo нужен для оптимизации nodeTypes
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
} from 'reactflow';
// Импортируем только те типы, которые нужны для пропсов
import { type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection } from 'reactflow';
import 'reactflow/dist/style.css';
import { ArchitectureNode } from './ArchitectureNode';

// Интерфейс пропсов остается таким же
interface ArchitecturePanelProps {
  nodes: Node[]; 
  edges: Edge[];
  onNodesChange: OnNodesChange; 
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection | Edge) => void;
}

export const ArchitecturePanel = ({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: ArchitecturePanelProps) => {

  // Оборачиваем nodeTypes в useMemo, чтобы избежать ненужных перерисовок
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