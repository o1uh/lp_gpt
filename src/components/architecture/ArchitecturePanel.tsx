export const ArchitecturePanel = () => {
  return (
    <div className="w-1/2 p-4 flex flex-col">
      <h2 className="text-xl font-bold mb-4">Текущая архитектура</h2>
      <div className="flex-grow bg-gray-800 rounded-lg p-2 overflow-y-auto">
        {/* Схема Mermaid или React Flow будет тут */}
      </div>
    </div>
  );
};