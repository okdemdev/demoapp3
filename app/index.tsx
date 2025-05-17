import { BlurView } from 'expo-blur';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <BlurView intensity={20} style={styles.blurContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to LifeGuide</Text>
          <Text style={styles.subtitle}>
            Your personal journey to better mental health and wellness starts
            here
          </Text>

          <View style={styles.features}>
            <Text style={styles.featureText}>✨ Personalized Guidance</Text>
            <Text style={styles.featureText}>📊 Track Your Progress</Text>
            <Text style={styles.featureText}>
              🤝 Join a Supportive Community
            </Text>
          </View>

          <Link href="/quiz/1" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.buttonText}>Start Your Journey</Text>
            </Pressable>
          </Link>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  blurContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  features: {
    marginBottom: 40,
    width: '100%',
  },
  featureText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
