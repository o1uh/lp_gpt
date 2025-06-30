import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Импортируем хук для навигации

export const LoginPage = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // 2. Инициализируем хук

  const handleLogin = () => {
    // 3. Наша заглушка: проверяем, что поля не пустые
    if (login.trim() !== '' && password.trim() !== '') {
      // 4. Имитируем успешный вход: сохраняем "токен" или флаг в localStorage
      // Это как бы говорит браузеру: "этот пользователь вошел в систему"
      localStorage.setItem('isAuthenticated', 'true'); 
      
      // 5. Программно перенаправляем пользователя на главную страницу приложения
      navigate('/app');
    } else {
      alert('Пожалуйста, введите логин и пароль.');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }

  return (
    <div className="bg-gray-900 text-white h-screen flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">Вход в систему</h1>
        <div className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-300">Логин</label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onKeyPress={handleKeyPress} // Добавляем обработчик для удобства
              className="mt-1 block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress} // Добавляем обработчик для удобства
              className="mt-1 block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  );
};