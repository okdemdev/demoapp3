import React, { createContext, useContext, useEffect, useState } from 'react';
import { QuizAnswer, getQuizData, saveQuizAnswer } from '../quizStorage';
import {
  clearSubscription,
  getSubscription,
  saveSubscription,
} from '../subscriptionStorage';

// Define all possible data types that can be stored
export interface GlobalData {
  quiz: {
    answers: QuizAnswer[];
    completed: boolean;
    insights?: {
      [key: number]: string; // questionId -> AI generated insight
    };
  };
  subscription?: {
    subscribedAt: string;
    active: boolean;
  };
}

interface GlobalContextType {
  userData: GlobalData | null;
  isLoading: boolean;
  updateQuizAnswer: (
    questionId: number,
    answer: string | number
  ) => Promise<void>;
  updateQuizInsight: (questionId: number, insight: string) => Promise<void>;
  updateSubscription: (active: boolean) => Promise<void>;
  clearUserData: () => Promise<void>;
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
      const quizData = await getQuizData();
      const subscriptionData = await getSubscription();

      setUserData({
        quiz: {
          answers: quizData?.answers || [],
          completed: quizData?.completed || false,
          insights: {},
        },
        subscription: subscriptionData || undefined,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
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
      setUserData(null);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  return (
    <GlobalContext.Provider
      value={{
        userData,
        isLoading,
        updateQuizAnswer,
        updateQuizInsight,
        updateSubscription,
        clearUserData,
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
