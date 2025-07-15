import { Handle, Position, type NodeProps, NodeResizer } from 'reactflow';
import ReactMarkdown from 'react-markdown';

type NodeData = {
  label: string;
  implementation?: string;
};

export const ArchitectureNode = ({ data, selected }: NodeProps<NodeData>) => {
  return (
    <div className="bg-white text-gray-800 rounded-md border-2 p-4 w-full h-full overflow-hidden shadow-lg flex flex-col"
      style={{ borderColor: selected ? '#3b82f6' : '#9ca3af' }}
    >
      <NodeResizer 
        minWidth={180} 
        minHeight={60}
        isVisible={selected} 
        lineClassName="border-blue-400"
        handleClassName="h-3 w-3 bg-white border-2 rounded-full border-blue-400"
      />

      {/* 1. Добавляем уникальные ID каждой ручке */}
      <Handle type="target" position={Position.Top} id="top" className="!bg-gray-500" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!bg-gray-500" />
      <Handle type="target" position={Position.Left} id="left" className="!bg-gray-500" />
      <Handle type="source" position={Position.Right} id="right" className="!bg-gray-500" />
      
      <div className="prose prose-sm max-w-none h-full overflow-y-auto">
        <div className="font-bold text-center select-none">{data.label}</div>
        
        {data.implementation && (
          <>
            <hr className="my-1"/>
            <ReactMarkdown>
              {data.implementation}
            </ReactMarkdown>
          </>
        )}
      </div>
    </div>
  );
};