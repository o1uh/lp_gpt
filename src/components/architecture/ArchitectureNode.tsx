import { Handle, Position, type NodeProps } from 'reactflow';

// Типизируем данные, которые может содержать наш узел
type NodeData = {
  label: string;
  implementation?: string; // Добавляем опциональное поле для описания
};

// Наш кастомный компонент узла
export const ArchitectureNode = ({ data }: NodeProps<NodeData>) => {
  return (
    <div className="bg-white text-gray-800 rounded-md border-2 border-gray-400 p-4 w-48">
      {/* Ручки для связей. Можно размещать сверху, снизу, слева, справа */}
      <Handle type="target" position={Position.Top} className="!bg-gray-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
      
      {/* Отображение данных */}
      <div className="font-bold text-center mb-2">{data.label}</div>
      {data.implementation && (
        <>
          <hr className="my-2 border-gray-300"/>
          <div className="text-xs text-gray-600">{data.implementation}</div>
        </>
      )}
    </div>
  );
};