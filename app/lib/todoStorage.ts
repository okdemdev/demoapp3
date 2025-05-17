import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from './context/GlobalContext';

const TODO_STORAGE_KEY = '@lifeguide_todo_data';

export const saveTodos = async (todos: Todo[]) => {
  try {
    await AsyncStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
    return true;
  } catch (error) {
    console.error('Error saving todos:', error);
    return false;
  }
};

export const getTodos = async (): Promise<Todo[]> => {
  try {
    const data = await AsyncStorage.getItem(TODO_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting todos:', error);
    return [];
  }
};

export const clearTodos = async () => {
  try {
    await AsyncStorage.removeItem(TODO_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing todos:', error);
    return false;
  }
};
