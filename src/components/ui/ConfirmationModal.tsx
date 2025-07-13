import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSaveAndConfirm?: () => void; // Опциональная функция для кнопки "Сохранить и выйти"
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  saveAndConfirmText?: string;
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  onSaveAndConfirm,
  title,
  description,
  confirmText = "Да, продолжить",
  cancelText = "Отмена",
  saveAndConfirmText = "Сохранить и продолжить",
}: ConfirmationModalProps) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        {/* ... (код для фона из нашего Modal.tsx можно скопировать сюда) ... */}
        <Transition.Child as={Fragment} 
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0" 
            >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
                >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-white">{title}</Dialog.Title>
                <div className="mt-2">
                  <p className="text-sm text-gray-400">{description}</p>
                </div>

                <div className="mt-6 flex justify-end space-x-4">
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 focus:outline-none" onClick={onClose}>
                    {cancelText}
                  </button>
                  {/* Кнопка "Сохранить и выйти" будет показана, только если передана функция onSaveAndConfirm */}
                  {onSaveAndConfirm && (
                    <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none" onClick={onSaveAndConfirm}>
                      {saveAndConfirmText}
                    </button>
                  )}
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none" onClick={onConfirm}>
                    {confirmText}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};