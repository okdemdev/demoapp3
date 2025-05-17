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
  metrics: Record<MetricKey, number>;
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
  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      // First try to load from AsyncStorage
      const storedData = await AsyncStorage.getItem('userData');

      if (storedData) {
        console.log('Found stored user data');
        const parsedData = JSON.parse(storedData);

        // Ensure metrics exist
        if (!parsedData.metrics) {
          parsedData.metrics = {
            wisdom: 0,
            strength: 0,
            focus: 0,
            confidence: 0,
            discipline: 0,
          };
        }

        setUserData(parsedData);
      } else {
        console.log('No stored data, loading individual components...');
        // Load individual components
        const [quizData, habitsData, subscriptionData, storedTodos] =
          await Promise.all([
            getQuizData(),
            getHabitsData(),
            getSubscription(),
            getTodos(),
          ]);

        console.log('Loaded subscription data:', subscriptionData);

        const newUserData: GlobalData = {
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
          // Initialize metrics with default values
          metrics: {
            wisdom: 10,
            strength: 10,
            focus: 10,
            confidence: 10,
            discipline: 10,
          },
        };

        console.log('Setting initial user data:', newUserData);
        setUserData(newUserData);
        // Also save to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadUserData();
  }, []);

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
      const subscriptionData = {
        subscribedAt: new Date().toISOString(),
        active,
      };

      // Save to subscription storage
      await saveSubscription(active);

      // Update global state
      const newData: GlobalData = {
        ...userData!,
        subscription: subscriptionData,
      };

      // Save to AsyncStorage and update state
      await saveUserData(newData);

      console.log('Subscription updated:', subscriptionData);
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error; // Re-throw to handle in UI
    }
  };

  const clearUserData = async () => {
    try {
      await Promise.all([
        clearSubscription(),
        clearTodos(),
        AsyncStorage.removeItem('userData'),
      ]);
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
    console.log('GlobalContext: Updating metrics to:', metrics);

    if (!userData) {
      console.error('Cannot update metrics: userData is null');
      return;
    }

    try {
      const newData = {
        ...userData,
        metrics,
        lastMetricsUpdate: Date.now(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem('userData', JSON.stringify(newData));
      console.log('GlobalContext: Metrics saved to AsyncStorage');

      // Update state
      setUserData(newData);
      console.log('GlobalContext: State updated with new metrics');
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
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
