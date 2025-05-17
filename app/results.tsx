import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from './lib/context/GlobalContext';
import { HabitsQuestion, habitsQuestions } from './lib/habitsQuestions';
import quizQuestions, { QuizQuestion } from './lib/quizQuestions';

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData, isLoading, updateSubscription } = useGlobal();

  const handleSubscribe = async () => {
    await updateSubscription(true);
    router.replace('/plan');
  };

  const getAnswerText = (answer: {
    questionId: number;
    answer: string | number;
  }, isHabit: boolean = false) => {
    if (isHabit) {
      const question = habitsQuestions.find(
        (q) => q.id === answer.questionId
      ) as HabitsQuestion | undefined;

      if (!question) return '';

      // Handle habits answers which use slider with discrete labels
      const sliderIndex = Number(answer.answer) - 1;
      const labels = question.sliderOptions?.labels || [];
      return labels[sliderIndex] || answer.answer.toString();
    } else {
      const question = quizQuestions.find(
        (q) => q.id === answer.questionId
      ) as QuizQuestion | undefined;

      if (!question) return '';

      if (question.type === 'scale') {
        return `${answer.answer}/10`;
      }
      return answer.answer.toString();
    }
  };

  const getHabitSuggestion = (
    questionId: number,
    answer: { answer: string | number }
  ) => {
    // Convert to number since habits answers are slider indices
    const score = Number(answer.answer);
    const question = habitsQuestions.find(
      (q) => q.id === questionId
    ) as HabitsQuestion | undefined;

    if (!question) return '';

    switch (questionId) {
      case 1: // Wake up time
        if (score >= 4) return "Try going to bed 15 minutes earlier each night until you reach your target wake-up time.";
        return "Maintain your early morning routine for optimal productivity.";

      case 2: // Running
        if (score <= 2) return "Consider starting with short walks, then progress to jogging for better cardiovascular health.";
        return "Great job with running! Try varying your routes to keep it interesting.";

      case 3: // Gym
        if (score <= 2) return "Start with 2 days a week at the gym focusing on full-body workouts.";
        return "Excellent gym routine! Make sure to include proper recovery periods.";

      case 4: // Sit-ups
        if (score <= 2) return "Begin with 3 sets of as many sit-ups as you can do. Gradually increase the count each week.";
        return "Great core strength! Try adding variations like bicycle crunches to your routine.";

      case 5: // Push-ups
        if (score <= 2) return "Start with modified push-ups on your knees if needed, aiming for 3 sets of 5-10 repetitions.";
        return "Excellent upper body strength! Consider adding diamond push-ups for tricep engagement.";

      case 6: // Water
        if (score <= 3) return "Keep a water bottle with you and set reminders to drink throughout the day.";
        return "Great hydration habits! Try infusing water with fruits for variety.";

      case 7: // Screentime limit
        if (score >= 4) return "Try to reduce screen time by setting app limits and taking regular breaks every hour.";
        return "You have healthy screen time habits. Continue being mindful of your digital consumption.";

      case 8: // Cold shower
        if (score <= 2) return "Consider starting with 30 seconds of cold water at the end of your regular shower, gradually increasing duration.";
        return "Great discipline with cold showers! Continue this practice for improved circulation and mental resilience.";

      default:
        return '';
    }
  };

  const getInsight = (
    questionId: number,
    answer: { answer: string | number }
  ) => {
    // First check if we have an AI-generated insight
    if (userData?.quiz.insights?.[questionId]) {
      return userData.quiz.insights[questionId];
    }

    // Fallback to static insights
    switch (questionId) {
      case 1: // Mental well-being
        const score = Number(answer.answer);
        if (score <= 3)
          return 'Your mental well-being needs attention. Consider reaching out to a mental health professional.';
        if (score <= 6)
          return "Your mental well-being is moderate. There's room for improvement.";
        return 'Great mental well-being! Keep up the good work!';

      case 2: // Stress levels
        if (answer.answer === 'Almost always')
          return "High stress levels detected. Let's work on stress management techniques.";
        if (answer.answer === 'Often')
          return "Regular stress is affecting you. We'll help you develop coping strategies.";
        return "Good stress management! Let's maintain this balance.";

      case 3: // Sleep
        if (answer.answer === 'Less than 5 hours')
          return "Insufficient sleep can impact your health. Let's improve your sleep habits.";
        if (answer.answer === '5-6 hours')
          return "Your sleep could be better. We'll help you optimize your sleep schedule.";
        return 'Great sleep habits! Keep maintaining this routine.';

      case 4: // Physical activity
        const activityScore = Number(answer.answer);
        if (activityScore <= 3)
          return "Low physical activity detected. Let's create an exercise plan that works for you.";
        if (activityScore <= 6)
          return 'Moderate activity level. We can help you increase your physical activity.';
        return 'Excellent activity level! Keep up the great work!';

      case 6: // Self-care
        if (answer.answer === 'Never' || answer.answer === 'Rarely')
          return "Self-care is important. We'll help you develop a self-care routine.";
        if (answer.answer === 'Sometimes')
          return "Good start with self-care. Let's make it more consistent.";
        return 'Great self-care habits! Keep prioritizing yourself.';

      case 7: // Social connections
        const socialScore = Number(answer.answer);
        if (socialScore <= 3)
          return "Limited social connections. We'll help you build a stronger support network.";
        if (socialScore <= 6)
          return "Moderate social connections. Let's strengthen your relationships.";
        return 'Strong social connections! Keep nurturing these relationships.';

      default:
        return '';
    }
  };

  if (isLoading || !userData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading your results...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Your Assessment Results</Text>
        <Text style={styles.subtitle}>Here's what we've learned about you</Text>

        {/* Quiz results */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mindset Assessment</Text>
        </View>

        {userData.quiz.answers.map((answer) => {
          const question = quizQuestions.find(
            (q) => q.id === answer.questionId
          ) as QuizQuestion | undefined;

          if (!question) return null;

          const insight = getInsight(question.id, answer);
          if (!insight) return null;

          return (
            <View key={`quiz-${answer.questionId}`} style={styles.resultCard}>
              <Text style={styles.question}>{question.question}</Text>
              <Text style={styles.answer}>
                Your answer: {getAnswerText(answer)}
              </Text>
              <Text style={styles.insight}>{insight}</Text>
            </View>
          );
        })}

        {/* Habits results */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Habits Assessment</Text>
        </View>

        {userData.habits?.answers.map((answer) => {
          const question = habitsQuestions.find(
            (q) => q.id === answer.questionId
          ) as HabitsQuestion | undefined;

          if (!question) return null;

          const suggestion = getHabitSuggestion(question.id, answer);
          if (!suggestion) return null;

          return (
            <View key={`habits-${answer.questionId}`} style={styles.resultCard}>
              <Text style={styles.question}>{question.question}</Text>
              <Text style={styles.answer}>
                Your answer: {getAnswerText(answer, true)}
              </Text>
              <Text style={styles.insight}>{suggestion}</Text>
            </View>
          );
        })}

        <View style={styles.ctaContainer}>
          <Text style={styles.ctaTitle}>Ready to start your journey?</Text>
          <Text style={styles.ctaText}>
            Get personalized guidance and a custom plan to improve your
            well-being
          </Text>
          <Pressable style={styles.ctaButton} onPress={handleSubscribe}>
            <Text style={styles.ctaButtonText}>Subscribe Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
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
    marginBottom: 30,
    opacity: 0.8,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  resultCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  question: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  answer: {
    color: '#007AFF',
    fontSize: 16,
    marginBottom: 10,
  },
  insight: {
    color: '#ffffff',
    fontSize: 16,
    opacity: 0.8,
  },
  ctaContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  ctaTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  ctaButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
