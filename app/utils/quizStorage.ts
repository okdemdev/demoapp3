import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuizAnswer {
  questionId: number;
  answer: string | number;
}

export interface QuizData {
  answers: QuizAnswer[];
  completed: boolean;
}

const QUIZ_STORAGE_KEY = '@lifeguide_quiz_data';

export const saveQuizAnswer = async (
  questionId: number,
  answer: string | number
) => {
  try {
    const existingData = await AsyncStorage.getItem(QUIZ_STORAGE_KEY);
    const quizData: QuizData = existingData
      ? JSON.parse(existingData)
      : { answers: [], completed: false };

    const answerIndex = quizData.answers.findIndex(
      (a) => a.questionId === questionId
    );
    if (answerIndex !== -1) {
      quizData.answers[answerIndex].answer = answer;
    } else {
      quizData.answers.push({ questionId, answer });
    }

    await AsyncStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizData));
    return true;
  } catch (error) {
    console.error('Error saving quiz answer:', error);
    return false;
  }
};

export const getQuizData = async (): Promise<QuizData | null> => {
  try {
    const data = await AsyncStorage.getItem(QUIZ_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting quiz data:', error);
    return null;
  }
};

export const markQuizCompleted = async () => {
  try {
    const existingData = await AsyncStorage.getItem(QUIZ_STORAGE_KEY);
    const quizData: QuizData = existingData
      ? JSON.parse(existingData)
      : { answers: [], completed: false };
    quizData.completed = true;
    await AsyncStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizData));
    return true;
  } catch (error) {
    console.error('Error marking quiz as completed:', error);
    return false;
  }
};

export const clearQuizData = async () => {
  try {
    await AsyncStorage.removeItem(QUIZ_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing quiz data:', error);
    return false;
  }
};
