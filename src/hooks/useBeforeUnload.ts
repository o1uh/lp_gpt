import { useEffect } from 'react';

// Хук принимает два аргумента:
// 1. when: boolean - условие, при котором нужно показывать предупреждение (наш флаг isDirty)
// 2. message: string - текст, который будет показан в стандартном окне браузера
export const useBeforeUnload = (when: boolean, message: string) => {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Если условие (when) истинно, то "активируем" предупреждение
      if (when) {
        event.preventDefault();
        // Стандарт требует возвращать пустую строку для показа стандартного сообщения
        event.returnValue = ''; 
        return message; // Некоторые старые браузеры могут показать этот текст
      }
    };

    // Добавляем обработчик события
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Очень важно! Убираем обработчик, когда компонент размонтируется,
    // чтобы избежать утечек памяти и багов
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [when, message]); // Эффект будет обновляться только при изменении `when` или `message`
};