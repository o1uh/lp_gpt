import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage.tsx';
import { AppLayout } from './pages/AppLayout.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { PublicOnlyRoute } from './components/auth/PublicOnlyRoute.tsx'; // 1. Импортируем наш новый защитник
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        // 2. Оборачиваем LoginPage в PublicOnlyRoute
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "app",
        element: (
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        ),
      },
    ]
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)