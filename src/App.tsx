import { Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

function App() {
  return (
    // Оборачиваем все приложение в наш Провайдер, чтобы контекст был доступен везде
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}

export default App;