import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

// Темы, которые мы предлагаем по умолчанию
const predefinedTopics = ["Основы Базы Данных", "Frontend-архитектура", "Полный курс по проекту"];

interface NewCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Callback, который вызовется с выбранной или введенной темой
  onSubmit: (topic: string) => void;
}

export const NewCourseModal = ({ isOpen, onClose, onSubmit }: NewCourseModalProps) => {
  const [customTopic, setCustomTopic] = useState('');

  const handleSubmit = () => {
    // Если пользователь что-то ввел в поле, используем его ввод.
    // Иначе считаем, что он не выбрал ничего (можно добавить валидацию).
    if (customTopic.trim() !== '') {
      onSubmit(customTopic);
    }
  };

  const handleTopicClick = (topic: string) => {
    onSubmit(topic);
  };
  
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        {/* ... (код фона и оберток, как в других модальных окнах) ... */}
        <div className="fixed inset-0 bg-black/50" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} 
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">Начать новый курс обучения</Dialog.Title>
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-gray-400">Выберите готовую тему или введите свою собственную.</p>
                  
                  {/* Готовые темы */}
                  <div className="space-y-2">
                    {predefinedTopics.map(topic => (
                      <button key={topic} onClick={() => handleTopicClick(topic)} className="w-full text-left p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                        {topic}
                      </button>
                    ))}
                  </div>

                  <hr className="border-gray-600"/>

                  {/* Поле для своей темы */}
                  <div>
                    <label htmlFor="customTopic" className="block text-sm font-medium text-gray-300">Или введите свою тему</label>
                    <div className="mt-1 flex gap-x-2">
                      <input
                        id="customTopic"
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="Например, 'Оптимизация запросов...'"
                        className="flex-grow px-3 py-2 rounded-md bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold">Начать</button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};