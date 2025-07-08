import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { loginUser, setInitialPassword } from '../api/authService';

export const LoginPage = () => {
  const [login, setLogin] = useState('admin');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); 
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const { login: authLogin } = useAuth();

  const handleLogin = async () => {
    setErrorMessage('');
    try {
      const data = await loginUser(login, password);
      authLogin(data);
    } catch (err) { 
      if (err instanceof Error) {
        if (err.message.includes('Это ваш первый вход')) {
          setIsFirstLogin(true);
          setErrorMessage('Это ваш первый вход. Пожалуйста, придумайте и установите пароль.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Произошла неизвестная ошибка');
      }
    }
  };

  const handleSetPassword = async () => {
    setErrorMessage('');
    if (password.length < 4) {
      setErrorMessage('Пароль должен быть не менее 4 символов.');
      return;
    }
    try {
      await setInitialPassword(login, password);
      setIsFirstLogin(false);
      setErrorMessage('Пароль успешно установлен! Теперь вы можете войти с ним.');
      setPassword('');
    } catch (err) { 
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Произошла неизвестная ошибка');
      }
    }
  };
  
  const handleSubmit = () => {
    if (isFirstLogin) {
      handleSetPassword();
    } else {
      handleLogin();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="bg-gray-900 text-white h-screen flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {isFirstLogin ? 'Установка пароля' : 'Вход в систему'}
        </h1>
        {/* 3. Отображаем errorMessage, если он есть */}
        {errorMessage && <p className="text-red-400 text-sm text-center mb-4">{errorMessage}</p>}
        <div className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-gray-300">Логин</label>
            <input id="login" type="text" value={login} onChange={(e) => setLogin(e.target.value)} onKeyPress={handleKeyPress} disabled={isFirstLogin} className="mt-1 block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              {isFirstLogin ? 'Новый пароль' : 'Пароль'}
            </label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} className="mt-1 block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>
          <button onClick={handleSubmit} className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold transition-colors">
            {isFirstLogin ? 'Установить пароль' : 'Войти'}
          </button>
        </div>
      </div>
    </div>
  );
};