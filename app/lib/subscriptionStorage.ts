import AsyncStorage from '@react-native-async-storage/async-storage';

const SUBSCRIPTION_STORAGE_KEY = '@lifeguide_subscription_data';

export interface SubscriptionData {
  subscribedAt: string;
  active: boolean;
}

export const saveSubscription = async (active: boolean) => {
  try {
    const subscriptionData: SubscriptionData = {
      subscribedAt: new Date().toISOString(),
      active,
    };
    await AsyncStorage.setItem(
      SUBSCRIPTION_STORAGE_KEY,
      JSON.stringify(subscriptionData)
    );
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
};

export const getSubscription = async (): Promise<SubscriptionData | null> => {
  try {
    const data = await AsyncStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting subscription data:', error);
    return null;
  }
};

export const clearSubscription = async () => {
  try {
    await AsyncStorage.removeItem(SUBSCRIPTION_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing subscription data:', error);
    return false;
  }
};
