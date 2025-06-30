function App() {
  return (
    // Главный контейнер, который занимает весь экран и использует flexbox
    <div className="bg-gray-800 text-white h-screen flex flex-row">

      {/* Левая колонка (Чат) */}
      <div className="w-1/2 p-4 border-r border-gray-600 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Диалог с AI</h2>
        {/* Здесь будет сам чат */}
        <div className="flex-grow bg-gray-700 rounded-lg p-2">
          {/* Сообщения чата будут тут */}
        </div>
        <input 
          type="text" 
          placeholder="Задайте ваш вопрос..."
          className="mt-4 p-2 rounded-lg bg-gray-900 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Правая колонка (Артефакт проектирования) */}
      <div className="w-1/2 p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Текущая архитектура</h2>
        {/* Здесь будет визуализация */}
        <div className="flex-grow bg-gray-700 rounded-lg p-2">
          {/* Схема Mermaid или React Flow будет тут */}
        </div>
      </div>

    </div>
  )
}

export default App