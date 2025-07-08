import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // 1. Импортируем наш хук

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // 2. Получаем статус авторизации напрямую из контекста
  const { isAuthenticated } = useAuth();

  // 3. Логика остается той же, но теперь она основана на состоянии, а не на localStorage
  if (!isAuthenticated) {
    // Если пользователь не авторизован, перенаправляем его на страницу входа.
    return <Navigate to="/login" replace />;
  }

  // Если авторизован, показываем запрошенную страницу (наш <AppLayout />)
  return children;
};