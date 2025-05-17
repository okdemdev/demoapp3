import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  HabitsAnswer,
  getHabitsData,
  saveHabitsAnswer,
} from '../habitsStorage';
import { QuizAnswer, getQuizData, saveQuizAnswer } from '../quizStorage';
import {
  clearSubscription,
  getSubscription,
  saveSubscription,
} from '../subscriptionStorage';
import { clearTodos, getTodos, saveTodos } from '../todoStorage';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

// Define all possible data types that can be stored
export interface GlobalData {
  quiz: {
    answers: QuizAnswer[];
    completed: boolean;
    insights?: {
      [key: number]: string; // questionId -> AI generated insight
    };
  };
  habits: {
    answers: HabitsAnswer[];
    completed: boolean;
  };
  subscription?: {
    subscribedAt: string;
    active: boolean;
  };
  todos: Todo[];
  metrics?: Record<MetricKey, number>;
  lastMetricsUpdate?: number; // timestamp of last metrics calculation
}

type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

interface GlobalContextType {
  userData: GlobalData | null;
  isLoading: boolean;
  updateQuizAnswer: (
    questionId: number,
    answer: string | number
  ) => Promise<void>;
  updateHabitsAnswer: (
    questionId: number,
    answer: string | number
  ) => Promise<void>;
  updateQuizInsight: (questionId: number, insight: string) => Promise<void>;
  updateSubscription: (active: boolean) => Promise<void>;
  clearUserData: () => Promise<void>;
  addTodo: (text: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  uncheckAllTodos: () => Promise<void>;
  updateMetrics: (metrics: Record<MetricKey, number>) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<GlobalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('userData');
      if (storedData) {
        setUserData(JSON.parse(storedData));
      } else {
        const quizData = await getQuizData();
        const habitsData = await getHabitsData();
        const subscriptionData = await getSubscription();
        const storedTodos = await getTodos();

        setUserData({
          quiz: {
            answers: quizData?.answers || [],
            completed: quizData?.completed || false,
            insights: {},
          },
          habits: {
            answers: habitsData?.answers || [],
            completed: habitsData?.completed || false,
          },
          subscription: subscriptionData || undefined,
          todos:
            storedTodos.length > 0
              ? storedTodos
              : [
                  {
                    id: '1',
                    text: 'Take a 10-minute meditation break',
                    completed: false,
                  },
                  {
                    id: '2',
                    text: 'Drink 8 glasses of water today',
                    completed: false,
                  },
                  {
                    id: '3',
                    text: 'Go for a 30-minute walk',
                    completed: false,
                  },
                  {
                    id: '4',
                    text: 'Practice deep breathing exercises',
                    completed: false,
                  },
                  {
                    id: '5',
                    text: "Write down 3 things you're grateful for",
                    completed: false,
                  },
                ],
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async (newData: GlobalData) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(newData));
      setUserData(newData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const updateQuizAnswer = async (
    questionId: number,
    answer: string | number
  ) => {
    try {
      await saveQuizAnswer(questionId, answer);
      setUserData((prev) => {
        if (!prev) return null;
        const updatedAnswers = [...prev.quiz.answers];
        const existingIndex = updatedAnswers.findIndex(
          (a) => a.questionId === questionId
        );

        if (existingIndex !== -1) {
          updatedAnswers[existingIndex] = { questionId, answer };
        } else {
          updatedAnswers.push({ questionId, answer });
        }

        return {
          ...prev,
          quiz: {
            ...prev.quiz,
            answers: updatedAnswers,
          },
        };
      });
    } catch (error) {
      console.error('Error updating quiz answer:', error);
    }
  };

  const updateQuizInsight = async (questionId: number, insight: string) => {
    setUserData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        quiz: {
          ...prev.quiz,
          insights: {
            ...prev.quiz.insights,
            [questionId]: insight,
          },
        },
      };
    });
  };

  const updateHabitsAnswer = async (
    questionId: number,
    answer: string | number
  ) => {
    try {
      await saveHabitsAnswer(questionId, answer);
      setUserData((prev) => {
        if (!prev) return null;
        const updatedAnswers = [...prev.habits.answers];
        const existingIndex = updatedAnswers.findIndex(
          (a) => a.questionId === questionId
        );

        if (existingIndex !== -1) {
          updatedAnswers[existingIndex] = { questionId, answer };
        } else {
          updatedAnswers.push({ questionId, answer });
        }

        return {
          ...prev,
          habits: {
            ...prev.habits,
            answers: updatedAnswers,
          },
        };
      });
    } catch (error) {
      console.error('Error updating habits answer:', error);
    }
  };

  const updateSubscription = async (active: boolean) => {
    try {
      await saveSubscription(active);
      setUserData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          subscription: {
            subscribedAt: new Date().toISOString(),
            active,
          },
        };
      });
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const clearUserData = async () => {
    try {
      await clearSubscription();
      await clearTodos();
      setUserData(null);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  const addTodo = async (text: string) => {
    setUserData((prev) => {
      if (!prev) return null;
      const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        completed: false,
      };
      const updatedTodos = [...prev.todos, newTodo];
      saveTodos(updatedTodos);
      return {
        ...prev,
        todos: updatedTodos,
      };
    });
  };

  const toggleTodo = async (id: string) => {
    setUserData((prev) => {
      if (!prev) return null;
      const updatedTodos = prev.todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      saveTodos(updatedTodos);
      return {
        ...prev,
        todos: updatedTodos,
      };
    });
  };

  const uncheckAllTodos = async () => {
    setUserData((prev) => {
      if (!prev) return null;
      const updatedTodos = prev.todos.map((todo) => ({
        ...todo,
        completed: false,
      }));
      saveTodos(updatedTodos);
      return {
        ...prev,
        todos: updatedTodos,
      };
    });
  };

  const updateMetrics = async (metrics: Record<MetricKey, number>) => {
    if (!userData) return;

    const newData = {
      ...userData,
      metrics,
      lastMetricsUpdate: Date.now(),
    };

    await saveUserData(newData);
  };

  return (
    <GlobalContext.Provider
      value={{
        userData,
        isLoading,
        updateQuizAnswer,
        updateHabitsAnswer,
        updateQuizInsight,
        updateSubscription,
        clearUserData,
        addTodo,
        toggleTodo,
        uncheckAllTodos,
        updateMetrics,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}

export function useGlobal() {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}
