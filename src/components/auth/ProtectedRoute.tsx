import { Navigate } from 'react-router-dom';

// Определяем пропсы: компонент будет принимать дочерние элементы
interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // Проверяем, есть ли наш флаг в localStorage
  const isAuthenticated = localStorage.getItem('isAuthenticated');

  // Если флага нет (пользователь не вошел)...
  if (!isAuthenticated) {
    // ...перенаправляем его на страницу входа.
    // `replace` нужен, чтобы пользователь не мог вернуться на защищенную страницу кнопкой "назад" в браузере.
    return <Navigate to="/login" replace />;
  }

  // Если флаг есть, просто отрисовываем дочерний компонент (в нашем случае - <App />)
  return children;
};