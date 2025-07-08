// src/App.tsx
import { Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext'; // Импортируем

function App() {
  return (
    // Оборачиваем все в AuthProvider, а внутри него AppProvider
    <AuthProvider>
      <AppProvider>
        <Outlet />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;