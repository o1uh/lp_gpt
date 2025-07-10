import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from 'react'; 
import { useNavigate } from "react-router-dom";
//import { useAppContext } from './AppContext';

interface User {
  id: number;
  login: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (data: { token: string; user: User }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const navigate = useNavigate();

  //const appCtx = useAppContext();
  
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (token) {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Если есть токен, но нет пользователя - это невалидное состояние, выходим
          logout();
        }
      } catch (_e) { // Игнорируем неиспользуемую переменную `e`
        logout();
      }
    }
  }, [token, logout]); 

  const login = (data: { token: string; user: User }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    navigate('/app', { replace: true });
  };

  const value = {
    isAuthenticated: !!token,
    user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};