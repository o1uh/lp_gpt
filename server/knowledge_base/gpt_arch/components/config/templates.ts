import { type Node, type Edge } from 'reactflow';

// Шаблон проекта "Блог"
export const templateBlog: { nodes: Node[], edges: Edge[] } = {
  nodes: [
    { 
      id: 'blog-node-1', 
      type: 'architectureNode', 
      data: { label: 'Frontend (React)', implementation: 'Клиентское приложение для отображения постов и комментариев.' }, 
      position: { x: 100, y: 100 }, 
      style: { width: 240, height: 160 } 
    },
    { 
      id: 'blog-node-2', 
      type: 'architectureNode', 
      data: { label: 'Backend (Node.js)', implementation: 'Сервер для управления постами, пользователями и предоставления API.' }, 
      position: { x: 450, y: 100 }, 
      style: { width: 240, height: 160 } 
    },
    { 
      id: 'blog-node-3', 
      type: 'architectureNode', 
      data: { label: 'Database (PostgreSQL)', implementation: 'Хранение данных о постах, пользователях, комментариях.' }, 
      position: { x: 450, y: 350 }, 
      style: { width: 240, height: 160 } 
    },
  ],
  edges: [
    { id: 'e-blog-1-2', source: 'blog-node-1', target: 'blog-node-2', sourceHandle: 'right', targetHandle: 'left', label: 'REST API' },
    { id: 'e-blog-2-3', source: 'blog-node-2', target: 'blog-node-3', sourceHandle: 'bottom', targetHandle: 'top', label: 'SQL Queries' },
  ],
};

// Массив задач для режима "Песочница"
export const sandboxTasks = [
  {
    id: 'task-crm',
    name: 'Спроектировать простую CRM',
    startMessage: 'Отлично! Давай спроектируем простую CRM. Для начала, какие основные сущности будут в нашей системе? Например, "Клиенты", "Сделки", "Задачи"...',
    initialNodes: [],
    initialEdges: [],
  },
  {
    id: 'task-platform',
    name: 'Создать платформу для курсов',
    startMessage: 'Хорошая задача! Платформа для курсов. Давай определим ключевые компоненты. Нам точно понадобятся "Пользователи", "Курсы" и "Уроки". Согласен?',
    initialNodes: [],
    initialEdges: [],
  },
  {
    id: 'task-marketplace',
    name: 'Разработать архитектуру маркетплейса',
    startMessage: 'Интересный проект! Маркетплейс. Нам нужно будет подумать о таких вещах, как каталог товаров, корзина, система заказов и платежный шлюз. С чего начнем?',
    initialNodes: [],
    initialEdges: [],
  }
];