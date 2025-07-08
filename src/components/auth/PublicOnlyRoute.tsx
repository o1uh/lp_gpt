import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { isAuthenticated } = useAuth();

  // Если пользователь УЖЕ авторизован...
  if (isAuthenticated) {
    // ...немедленно перенаправляем его на главную страницу приложения.
    return <Navigate to="/app" replace />;
  }

  // Если не авторизован, показываем запрошенную страницу (в нашем случае - <LoginPage />)
  return children;
};