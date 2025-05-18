import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  HabitsAnswer,
  clearHabitsData,
  getHabitsData,
  saveHabitsAnswer,
} from '../habitsStorage';
import { Plan, clearPlan, getPlan, savePlan } from '../planStorage';
import {
  QuizAnswer,
  clearQuizData,
  getQuizData,
  saveQuizAnswer,
} from '../quizStorage';
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

export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
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
  plan?: Plan;
  community: {
    friendsPosts: Post[];
    eventPosts: Post[];
  };
}

type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

interface GlobalContextType {
  userData: GlobalData | null;
  isLoading: boolean;
  updateQuizAnswer: (
    questionId: number,
    answer: string | number
  ) => Promise<void>;
  updateQuizInsight: (questionId: number, insight: string) => Promise<void>;
  updateHabitsAnswer: (
    questionId: number,
    answer: string | number
  ) => Promise<void>;
  updateSubscription: (active: boolean) => Promise<void>;
  clearUserData: () => Promise<void>;
  updatePlan: (plan: Plan) => Promise<void>;
  addTodo: (text: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  uncheckAllTodos: () => Promise<void>;
  updateMetrics: (metrics: Record<MetricKey, number>) => Promise<void>;
  addPost: (content: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<GlobalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  const loadUserData = async () => {
    try {
      console.log('🔄 Loading user data...');
      // First try to load from AsyncStorage
      const storedData = await AsyncStorage.getItem('userData');
      console.log('📦 Raw stored data:', storedData);

      if (storedData) {
        console.log('✅ Found stored user data');
        const parsedData = JSON.parse(storedData);
        console.log(
          '📝 Parsed stored data:',
          JSON.stringify(parsedData, null, 2)
        );

        // Ensure required properties exist
        if (!parsedData.metrics) {
          parsedData.metrics = {
            wisdom: 0,
            strength: 0,
            focus: 0,
            confidence: 0,
            discipline: 0,
          };
        }

        // Ensure community data exists
        if (!parsedData.community) {
          parsedData.community = {
            friendsPosts: [
              {
                id: '1',
                author: 'John',
                content:
                  '🎯 Just completed my first week of daily meditation! Feeling more focused and calm already.',
                timestamp: '3h ago',
                comments: [
                  {
                    id: '1',
                    author: 'Emma',
                    content: "That's amazing! Keep it up! 🙌",
                    timestamp: '2h ago',
                  },
                  {
                    id: '2',
                    author: 'Sarah',
                    content: 'Which app are you using?',
                    timestamp: '1h ago',
                  },
                ],
              },
              {
                id: '2',
                author: 'Lisa',
                content:
                  '💪 Hit a new personal record in my workout today! Small wins add up.',
                timestamp: '5h ago',
                comments: [
                  {
                    id: '3',
                    author: 'Mike',
                    content: 'Crushing it! 💪',
                    timestamp: '4h ago',
                  },
                ],
              },
            ],
            eventPosts: [
              {
                id: '1',
                author: 'Community Team',
                content:
                  '🏃‍♂️ Join our Virtual 5K Challenge! Track your progress and compete with others in our community. Starting next week!',
                timestamp: '2h ago',
                comments: [
                  {
                    id: '1',
                    author: 'Sarah',
                    content:
                      'Count me in! Been looking for motivation to start running again.',
                    timestamp: '1h ago',
                  },
                  {
                    id: '2',
                    author: 'Mike',
                    content:
                      'Is there a specific app we should use to track our runs?',
                    timestamp: '30m ago',
                  },
                ],
              },
              {
                id: '2',
                author: 'Community Team',
                content:
                  '🧘‍♀️ Weekly Meditation Session - Join us every Monday at 8 AM EST for a guided meditation session to start your week with clarity and focus.',
                timestamp: '1d ago',
                comments: [
                  {
                    id: '3',
                    author: 'Emma',
                    content:
                      'These sessions have been life-changing! Highly recommend.',
                    timestamp: '20h ago',
                  },
                ],
              },
              {
                id: '3',
                author: 'Community Team',
                content:
                  '💪 30-Day Habit Building Challenge - Start small, stay consistent. Join us in building one positive habit over the next month.',
                timestamp: '2d ago',
                comments: [
                  {
                    id: '4',
                    author: 'Alex',
                    content:
                      "Perfect timing! I've been wanting to establish a morning routine.",
                    timestamp: '1d ago',
                  },
                ],
              },
            ],
          };
        }

        setUserData(parsedData);
      } else {
        console.log('⚠️ No stored data, loading individual components...');
        // Load individual components
        const [quizData, habitsData, subscriptionData, storedTodos, planData] =
          await Promise.all([
            getQuizData(),
            getHabitsData(),
            getSubscription(),
            getTodos(),
            getPlan(),
          ]);

        console.log('📝 Individual components loaded:', {
          quizData: JSON.stringify(quizData, null, 2),
          habitsData: JSON.stringify(habitsData, null, 2),
          subscriptionData: JSON.stringify(subscriptionData, null, 2),
          storedTodos: JSON.stringify(storedTodos, null, 2),
          planData: JSON.stringify(planData, null, 2),
        });

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
          todos: storedTodos,
          metrics: {
            wisdom: 10,
            strength: 10,
            focus: 10,
            confidence: 10,
            discipline: 10,
          },
          plan: planData || undefined,
          community: {
            friendsPosts: [
              {
                id: '1',
                author: 'John',
                content:
                  '🎯 Just completed my first week of daily meditation! Feeling more focused and calm already.',
                timestamp: '3h ago',
                comments: [
                  {
                    id: '1',
                    author: 'Emma',
                    content: "That's amazing! Keep it up! 🙌",
                    timestamp: '2h ago',
                  },
                  {
                    id: '2',
                    author: 'Sarah',
                    content: 'Which app are you using?',
                    timestamp: '1h ago',
                  },
                ],
              },
              {
                id: '2',
                author: 'Lisa',
                content:
                  '💪 Hit a new personal record in my workout today! Small wins add up.',
                timestamp: '5h ago',
                comments: [
                  {
                    id: '3',
                    author: 'Mike',
                    content: 'Crushing it! 💪',
                    timestamp: '4h ago',
                  },
                ],
              },
            ],
            eventPosts: [
              {
                id: '1',
                author: 'Community Team',
                content:
                  '🏃‍♂️ Join our Virtual 5K Challenge! Track your progress and compete with others in our community. Starting next week!',
                timestamp: '2h ago',
                comments: [
                  {
                    id: '1',
                    author: 'Sarah',
                    content:
                      'Count me in! Been looking for motivation to start running again.',
                    timestamp: '1h ago',
                  },
                  {
                    id: '2',
                    author: 'Mike',
                    content:
                      'Is there a specific app we should use to track our runs?',
                    timestamp: '30m ago',
                  },
                ],
              },
              {
                id: '2',
                author: 'Community Team',
                content:
                  '🧘‍♀️ Weekly Meditation Session - Join us every Monday at 8 AM EST for a guided meditation session to start your week with clarity and focus.',
                timestamp: '1d ago',
                comments: [
                  {
                    id: '3',
                    author: 'Emma',
                    content:
                      'These sessions have been life-changing! Highly recommend.',
                    timestamp: '20h ago',
                  },
                ],
              },
              {
                id: '3',
                author: 'Community Team',
                content:
                  '💪 30-Day Habit Building Challenge - Start small, stay consistent. Join us in building one positive habit over the next month.',
                timestamp: '2d ago',
                comments: [
                  {
                    id: '4',
                    author: 'Alex',
                    content: `Perfect timing! I've been wanting to establish a morning routine.`,
                    timestamp: '1d ago',
                  },
                ],
              },
            ],
          },
        };

        console.log(
          '📝 Setting initial user data:',
          JSON.stringify(newUserData, null, 2)
        );
        setUserData(newUserData);
        // Also save to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(newUserData));
        console.log('✅ Saved initial user data to AsyncStorage');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
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
      console.log('💾 Saving user data:', JSON.stringify(newData, null, 2));
      await AsyncStorage.setItem('userData', JSON.stringify(newData));
      setUserData(newData);
      console.log('✅ Successfully saved and updated user data');
    } catch (error) {
      console.error('❌ Error saving user data:', error);
    }
  };

  const updateQuizAnswer = async (
    questionId: number,
    answer: string | number
  ) => {
    try {
      console.log('🎯 Saving quiz answer:', { questionId, answer });
      console.log(
        '📊 Current userData before quiz update:',
        JSON.stringify(userData, null, 2)
      );

      await saveQuizAnswer(questionId, answer);

      setUserData((prev) => {
        if (!prev) {
          console.log('❌ Previous userData is null in quiz update!');
          return null;
        }

        const updatedAnswers = [...prev.quiz.answers];
        const existingIndex = updatedAnswers.findIndex(
          (a) => a.questionId === questionId
        );

        if (existingIndex !== -1) {
          updatedAnswers[existingIndex] = { questionId, answer };
        } else {
          updatedAnswers.push({ questionId, answer });
        }

        const newData = {
          ...prev,
          quiz: {
            ...prev.quiz,
            answers: updatedAnswers,
          },
        };

        console.log(
          '📊 Updated userData after quiz answer:',
          JSON.stringify(newData, null, 2)
        );
        return newData;
      });

      // Verify the data was saved
      const storedQuizData = await AsyncStorage.getItem('@lifeguide_quiz_data');
      console.log('📊 Stored quiz data in AsyncStorage:', storedQuizData);

      // Also verify global userData storage
      const globalData = await AsyncStorage.getItem('userData');
      console.log('🌍 Current global userData in storage:', globalData);
    } catch (error) {
      console.error('❌ Error updating quiz answer:', error);
    }
  };

  const updateQuizInsight = async (questionId: number, insight: string) => {
    console.log('💡 Updating quiz insight:', { questionId, insight });
    setUserData((prev) => {
      if (!prev) {
        console.log('❌ Previous userData is null in insight update!');
        return null;
      }
      const newData = {
        ...prev,
        quiz: {
          ...prev.quiz,
          insights: {
            ...prev.quiz.insights,
            [questionId]: insight,
          },
        },
      };
      console.log(
        '💡 Updated userData after insight:',
        JSON.stringify(newData, null, 2)
      );
      return newData;
    });
  };

  const updateHabitsAnswer = async (
    questionId: number,
    answer: string | number
  ) => {
    try {
      console.log('💪 Saving habit answer:', { questionId, answer });
      console.log(
        '📊 Current userData before habit update:',
        JSON.stringify(userData, null, 2)
      );

      await saveHabitsAnswer(questionId, answer);

      setUserData((prev) => {
        if (!prev) {
          console.log('❌ Previous userData is null in habit update!');
          return null;
        }

        const updatedAnswers = [...prev.habits.answers];
        const existingIndex = updatedAnswers.findIndex(
          (a) => a.questionId === questionId
        );

        if (existingIndex !== -1) {
          updatedAnswers[existingIndex] = { questionId, answer };
        } else {
          updatedAnswers.push({ questionId, answer });
        }

        const newData = {
          ...prev,
          habits: {
            ...prev.habits,
            answers: updatedAnswers,
          },
        };

        console.log(
          '📊 Updated userData after habit answer:',
          JSON.stringify(newData, null, 2)
        );
        return newData;
      });

      // Verify the data was saved
      const storedHabitsData = await AsyncStorage.getItem(
        '@lifeguide_habits_data'
      );
      console.log('📊 Stored habits data in AsyncStorage:', storedHabitsData);

      // Also verify global userData storage
      const globalData = await AsyncStorage.getItem('userData');
      console.log('🌍 Current global userData in storage:', globalData);
    } catch (error) {
      console.error('❌ Error updating habits answer:', error);
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

  const updatePlan = async (plan: Plan) => {
    try {
      // Save to plan storage
      await savePlan(plan);

      // Update global state
      const newData: GlobalData = {
        ...userData!,
        plan,
      };

      // Save to AsyncStorage and update state
      await saveUserData(newData);

      console.log('Plan updated:', plan);
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  };

  const clearUserData = async () => {
    try {
      await Promise.all([
        clearSubscription(),
        clearTodos(),
        clearQuizData(),
        clearHabitsData(),
        clearPlan(),
        AsyncStorage.removeItem('userData'),
        AsyncStorage.removeItem('dayTracker'),
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

  const addPost = async (content: string) => {
    if (!userData) return;

    const newPost: Post = {
      id: Date.now().toString(),
      author: 'You',
      content,
      timestamp: 'Just now',
      comments: [],
    };

    const newData = {
      ...userData,
      community: {
        ...userData.community,
        friendsPosts: [newPost, ...userData.community.friendsPosts],
      },
    };

    await saveUserData(newData);
  };

  const addComment = async (postId: string, content: string) => {
    if (!userData) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: 'You',
      content,
      timestamp: 'Just now',
    };

    const newData = {
      ...userData,
      community: {
        ...userData.community,
        friendsPosts: userData.community.friendsPosts.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, newComment] }
            : post
        ),
      },
    };

    await saveUserData(newData);
  };

  return (
    <GlobalContext.Provider
      value={{
        userData,
        isLoading,
        updateQuizAnswer,
        updateQuizInsight,
        updateHabitsAnswer,
        updateSubscription,
        clearUserData,
        updatePlan,
        addTodo,
        toggleTodo,
        uncheckAllTodos,
        updateMetrics,
        addPost,
        addComment,
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
