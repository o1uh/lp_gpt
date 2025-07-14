import { type Node, type Edge } from 'reactflow';
import { type Message } from '../types';

const API_URL = 'http://localhost:3001/api/projects';

// Определяем интерфейс для данных, которые мы сохраняем
interface ProjectStateData {
  nodes: Node[];
  edges: Edge[];
  messages: Message[];
  suggestions: string[];
}


// Вспомогательная функция для создания заголовков с токеном
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Функция для получения списка проектов
export const fetchProjects = async () => {
  const response = await fetch(API_URL, { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Не удалось загрузить проекты');
  }
  return response.json();
};

// Функция для получения данных конкретного проекта
export const fetchProjectById = async (projectId: number) => {
  const response = await fetch(`${API_URL}/${projectId}`, { headers: getAuthHeaders() });
  if (!response.ok) {
    throw new Error('Не удалось загрузить данные проекта');
  }
  return response.json();
};

// Функция для создания нового проекта
export const createProject = async (name: string) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error('Не удалось создать проект');
  }
  return response.json();
};

// Функция для сохранения состояния проекта
export const saveProjectState = async (projectId: number, data: ProjectStateData) => {
    const response = await fetch(`${API_URL}/${projectId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        throw new Error('Не удалось сохранить проект');
    }
    return response.json();
};

// Функция для переименования проекта
export const renameProject = async (projectId: number, newName: string) => {
  const response = await fetch(`${API_URL}/${projectId}/rename`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ newName }),
  });
  if (!response.ok) {
    throw new Error('Не удалось переименовать проект');
  }
  return response.json();
};

// Функция для удаления проекта
export const deleteProject = async (projectId: number) => {
  const response = await fetch(`${API_URL}/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Не удалось удалить проект');
  }
  return response.json();
};