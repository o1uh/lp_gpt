import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

export const SaveProjectModal = () => {
  // Получаем состояние модального окна и функцию для его изменения из контекста
  const { saveModalState, setSaveModalState } = useAppContext();
  const [projectName, setProjectName] = useState('');

  // Если окно открывается, фокусируемся на поле ввода
  useEffect(() => {
    if (saveModalState.isOpen) {
      // Даем небольшую задержку, чтобы поле ввода успело отрендериться
      setTimeout(() => {
        document.getElementById('projectNameInput')?.focus();
      }, 100);
    }
  }, [saveModalState.isOpen]);

  const handleClose = () => {
    setSaveModalState({ isOpen: false, onSave: () => {} });
    setProjectName(''); // Сбрасываем имя при закрытии
  };

  const handleSave = () => {
    // Вызываем callback-функцию, которую мы передали при открытии окна
    saveModalState.onSave(projectName);
    handleClose(); // Закрываем окно
  };
  
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSave();
    }
  }

  return (
    <Transition appear show={saveModalState.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">Сохранить новый проект</Dialog.Title>
                <div className="mt-4">
                  <label htmlFor="projectNameInput" className="block text-sm font-medium text-gray-300">Название проекта</label>
                  <input
                    id="projectNameInput"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="mt-1 block w-full px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mt-6 flex justify-end space-x-4">
                  <button type="button" onClick={handleClose} className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none">Отмена</button>
                  <button type="button" onClick={handleSave} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none">Сохранить</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};