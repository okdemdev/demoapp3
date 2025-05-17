import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { GlobalProvider, useGlobal } from './lib/context/GlobalContext';

function RootLayoutNav() {
  const router = useRouter();
  const { userData, isLoading } = useGlobal();

  useEffect(() => {
    if (!isLoading && userData?.subscription?.active) {
      router.replace('/plan');
    }
  }, [isLoading, userData?.subscription?.active]);

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
