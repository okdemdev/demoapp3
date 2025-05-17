import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { userData } = useGlobal();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Your Plan</Text>
      <Text style={styles.subtitle}>
        Personalized guidance for your journey
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
  },
});
