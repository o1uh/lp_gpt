import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import App from './App.tsx'
import { LoginPage } from './pages/LoginPage.tsx';
import { AppLayout } from './pages/AppLayout.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import './index.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Корневой элемент с Провайдером
    children: [
      {
        index: true, // Главная страница по умолчанию
        element: <Navigate to="/login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
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