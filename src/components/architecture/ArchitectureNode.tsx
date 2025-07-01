import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';

// Типизируем данные, которые может содержать наш узел
type NodeData = {
  label: string;
  implementation?: string;
};

// Наш кастомный компонент узла
export const ArchitectureNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    // Добавляем overflow: hidden, чтобы текст не вылезал за пределы при изменении размера
    <div className="bg-white text-gray-800 rounded-md border-2 p-4 w-full h-full overflow-hidden shadow-lg"
      style={{ borderColor: selected ? '#3b82f6' : '#9ca3af' }} // Подсветка при выделении
    >
      {/* 1. Добавляем компонент для изменения размера. Он будет виден только при выделении узла. */}
      <NodeResizer 
        minWidth={180} 
        minHeight={100} 
        isVisible={selected} 
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 rounded-full border-blue-400"
      />

      {/* Ручки для связей */}
      <Handle type="target" position={Position.Top} className="!bg-gray-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      <Handle type="source" position={Position.Right} className="!bg-gray-500" />
      
      {/* 2. Оборачиваем все содержимое в div с классом `prose` для корректного форматирования */}
      <div className="prose prose-sm max-w-none h-full">
        <div className="font-bold text-center">{data.label}</div>
        {data.implementation && (
          <>
            <hr className="my-1"/>
            <div dangerouslySetInnerHTML={{ __html: data.implementation.replace(/\n/g, '<br />') }} />
          </>
        )}
      </div>
    </div>
  );
};