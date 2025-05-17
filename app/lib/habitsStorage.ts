import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HabitsAnswer {
    questionId: number;
    answer: string | number;
}

export interface HabitsData {
    answers: HabitsAnswer[];
    completed: boolean;
}

const HABITS_STORAGE_KEY = '@lifeguide_habits_data';

export const saveHabitsAnswer = async (
    questionId: number,
    answer: string | number
) => {
    try {
        const existingData = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
        const habitsData: HabitsData = existingData
            ? JSON.parse(existingData)
            : { answers: [], completed: false };

        const answerIndex = habitsData.answers.findIndex(
            (a) => a.questionId === questionId
        );
        if (answerIndex !== -1) {
            habitsData.answers[answerIndex].answer = answer;
        } else {
            habitsData.answers.push({ questionId, answer });
        }

        await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habitsData));
        return true;
    } catch (error) {
        console.error('Error saving habits answer:', error);
        return false;
    }
};

export const getHabitsData = async (): Promise<HabitsData | null> => {
    try {
        const data = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error getting habits data:', error);
        return null;
    }
};

export const markHabitsCompleted = async () => {
    try {
        const existingData = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
        const habitsData: HabitsData = existingData
            ? JSON.parse(existingData)
            : { answers: [], completed: false };
        habitsData.completed = true;
        await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habitsData));
        return true;
    } catch (error) {
        console.error('Error marking habits as completed:', error);
        return false;
    }
};

export const clearHabitsData = async () => {
    try {
        await AsyncStorage.removeItem(HABITS_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error('Error clearing habits data:', error);
        return false;
    }
};

const habitsStorage = {
    saveHabitsAnswer,
    getHabitsData,
    markHabitsCompleted,
    clearHabitsData,
};

export default habitsStorage; 