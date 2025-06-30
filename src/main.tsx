import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx'; // 1. Импортируем наш защитник
import './index.css'

const router = createBrowserRouter([
  {
    path: "/app",
    // 2. Оборачиваем наш компонент App в ProtectedRoute
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Navigate to="/login" replace />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)