import { Layers, User, Settings, LogOut } from 'lucide-react'; // 1. Импортируем иконку LogOut
import { useAuth } from '../../context/AuthContext'; // 2. Импортируем хук для доступа к функции logout

export const Sidebar = () => {
  // 3. Получаем функцию logout из нашего контекста
  const { logout } = useAuth();

  return (
    <nav className="w-16 bg-gray-800 p-2 flex flex-col items-center justify-between">
      {/* Верхняя часть с основными областями */}
      <div className="flex flex-col items-center gap-y-4">
        <button className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors" title="Архитектура">
          <Layers size={24} />
        </button>
      </div>
      
      {/* Нижняя часть с профилем и настройками */}
      <div className="flex flex-col items-center gap-y-4">
        <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors" title="Профиль">
          <User size={24} />
        </button>
        <button className="p-2 rounded-lg hover:bg-gray-700 transition-colors" title="Настройки">
          <Settings size={24} />
        </button>
        {/* 4. Добавляем кнопку выхода */}
        <button 
          onClick={logout} 
          className="p-2 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors" 
          title="Выйти"
        >
          <LogOut size={24} />
        </button>
      </div>
    </nav>
  );
};