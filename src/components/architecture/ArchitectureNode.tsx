import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import ReactMarkdown from 'react-markdown'; // 1. Возвращаем react-markdown

// Типизируем данные
type NodeData = {
  label: string;
  implementation?: string;
};

export const ArchitectureNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    // Добавляем flex и flex-col, чтобы контент мог расти
    <div className="bg-white text-gray-800 rounded-md border-2 p-4 w-full h-full overflow-hidden shadow-lg flex flex-col"
      style={{ borderColor: selected ? '#3b82f6' : '#9ca3af' }}
    >
      <NodeResizer 
        minWidth={180} 
        minHeight={60} // Уменьшим минимальную высоту для компактных узлов
        isVisible={selected} 
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 rounded-full border-blue-400"
      />

      <Handle type="target" position={Position.Top} className="!bg-gray-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-gray-500" />
      <Handle type="target" position={Position.Left} className="!bg-gray-500" />
      <Handle type="source" position={Position.Right} className="!bg-gray-500" />
      
      {/* Оборачиваем все в `prose`, чтобы стили Markdown применялись ко всему содержимому */}
      <div className="prose prose-sm max-w-none h-full overflow-y-auto">
        <div className="font-bold text-center select-none">{data.label}</div>
        
        {data.implementation && (
          <>
            <hr className="my-1"/>
            {/* 2. Используем ReactMarkdown для рендеринга описания */}
            <ReactMarkdown>
              {data.implementation}
            </ReactMarkdown>
          </>
        )}
      </div>
    </div>
  );
};