const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;

// Функция для входа в систему
export const loginUser = async (login: string, password: string) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, password }),
  });

  // fetch не выбрасывает ошибку на 4xx/5xx, поэтому проверяем `ok` вручную
  if (!response.ok) {
    const errorData = await response.json();
    // Создаем кастомную ошибку с сообщением от сервера
    throw new Error(errorData.message || 'Не удалось войти в систему');
  }

  return response.json();
};

// Функция для установки начального пароля
export const setInitialPassword = async (login: string, newPassword: string) => {
  const response = await fetch(`${API_URL}/set-initial-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Не удалось установить пароль');
  }

  return response.json();
};