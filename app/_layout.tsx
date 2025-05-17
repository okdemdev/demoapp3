import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GlobalProvider, useGlobal } from './lib/context/GlobalContext';

function RootLayoutNav() {
  const router = useRouter();
  const { userData, isLoading } = useGlobal();

  useEffect(() => {
    if (isLoading) return;

    // If user has an active subscription, redirect to plan
    if (userData?.subscription?.active) {
      console.log('🔄 Active subscription found, redirecting to plan');
      router.replace('/(tabs)/plan');
      return;
    }

    // If user has completed habits assessment but no subscription
    if (userData?.habits?.completed && !userData?.subscription?.active) {
      console.log('📊 Assessment completed, showing results');
      router.replace('/results');
      return;
    }

    // If no data or incomplete assessment, start from beginning
    if (!userData || !userData.habits?.completed) {
      console.log('🆕 New or incomplete user, starting from beginning');
      router.replace('/');
    }
  }, [isLoading, userData?.subscription?.active, userData?.habits?.completed]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#1a1a1a',
        },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <GlobalProvider>
      <RootLayoutNav />
    </GlobalProvider>
  );
}
