import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlanWeek {
  weekNumber: number;
  startDate: string;
  endDate: string;
  improvements: {
    text: string;
    category: string;
    icon?: string;
  }[];
}

export interface Plan {
  generatedAt: string;
  weeks: PlanWeek[];
}

const PLAN_STORAGE_KEY = '@lifeguide_plan_data';

export const savePlan = async (plan: Plan) => {
  try {
    await AsyncStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
    return true;
  } catch (error) {
    console.error('Error saving plan:', error);
    return false;
  }
};

export const getPlan = async (): Promise<Plan | null> => {
  try {
    const data = await AsyncStorage.getItem(PLAN_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting plan:', error);
    return null;
  }
};

export const clearPlan = async () => {
  try {
    await AsyncStorage.removeItem(PLAN_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing plan:', error);
    return false;
  }
};

const planStorage = {
  savePlan,
  getPlan,
  clearPlan,
};

export default planStorage;
