import { Stack } from 'expo-router';
import { GlobalProvider } from './lib/context/GlobalContext';

export default function RootLayout() {
  return (
    <GlobalProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#1a1a1a',
          },
        }}
      />
    </GlobalProvider>
  );
}
