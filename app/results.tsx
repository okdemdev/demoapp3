import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from './lib/context/GlobalContext';
import quizQuestions from './lib/quizQuestions';
import { QuizAnswer } from './lib/quizStorage';
import OpenAIService from './lib/services/OpenAIService';

function scoreRange(
  answerIndex: number,
  maxIndex: number,
  maxPoints: number
): number {
  return (answerIndex / maxIndex) * maxPoints;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

async function sentimentScore(text: string): Promise<number> {
  if (!text || text.trim() === '') return 0;
  // Use OpenAI to get a sentiment score 0-10
  const openai = OpenAIService.getInstance();
  const prompt = `Rate the following text for clarity, specificity, and growth language on a scale from 0 (very vague/negative) to 10 (very clear/positive):\n\n"${text}"\n\nRespond with only a single number.`;
  const response = await openai.generateCustomResponse(
    prompt,
    'You are a helpful assistant scoring self-reflection answers.'
  );
  const num = parseInt(response.match(/\d+/)?.[0] || '0', 10);
  return clamp(num, 0, 10);
}

async function computeMetrics(
  answers: QuizAnswer[]
): Promise<Record<string, number>> {
  const metrics: Record<string, number> = {
    wisdom: 0,
    strength: 0,
    focus: 0,
    confidence: 0,
    discipline: 0,
  };

  // Map answers by question id for easier access
  const a: Record<number, string | number> = {};
  answers.forEach((ans: QuizAnswer) => {
    a[ans.questionId] = ans.answer;
  });

  // --- Wisdom ---
  const lifeIdx = quizQuestions[2].options?.indexOf(String(a[3])) ?? 0; // Q3
  const purposeIdx = quizQuestions[3].options?.indexOf(String(a[4])) ?? 0; // Q4
  const motiveIdx = quizQuestions[6].options?.indexOf(String(a[7])) ?? 0; // Q7
  const textScore = await sentimentScore(String(a[14] || '')); // Q14
  metrics.wisdom =
    scoreRange(lifeIdx, 4, 15) +
    scoreRange(purposeIdx, 5, 10) +
    scoreRange(motiveIdx, 5, 15) +
    textScore;

  // --- Strength ---
  let sleepPoints = 0;
  switch (quizQuestions[11].options?.indexOf(String(a[12]))) {
    case 2:
      sleepPoints = 30;
      break; // 7-8h
    case 3:
      sleepPoints = 20;
      break; // >8h
    case 1:
      sleepPoints = 20;
      break; // 5-6h
    case 0:
      sleepPoints = 5;
      break; // <5h
    default:
      sleepPoints = 0;
  }
  const activityScale = Number(a[13] || 1);
  const activityPoints = ((activityScale - 1) / 9) * 30;
  let addictionDeduction = 0;
  if (quizQuestions[7].options?.indexOf(String(a[8])) === 4)
    addictionDeduction = 0;
  else if (quizQuestions[7].options?.indexOf(String(a[8])) === 5)
    addictionDeduction = -25;
  else addictionDeduction = -15;
  const wellBeing = Number(a[10] || 1);
  const wellBeingPoints = ((wellBeing - 1) / 9) * 15;
  metrics.strength = clamp(
    sleepPoints +
      activityPoints +
      wellBeingPoints +
      100 +
      addictionDeduction -
      100,
    0,
    100
  );

  // --- Focus ---
  const focusWellBeingPoints = ((wellBeing - 1) / 9) * 35;
  const stressIdx = quizQuestions[10].options?.indexOf(String(a[11])) ?? 0;
  const stressPoints = [35, 25, 15, 5][stressIdx] ?? 0;
  const proudIdx = quizQuestions[5].options?.indexOf(String(a[6])) ?? 0;
  const proudPoints = [30, 25, 20, 10, 5][proudIdx] ?? 0;
  metrics.focus = clamp(
    focusWellBeingPoints + stressPoints + proudPoints,
    0,
    100
  );

  // --- Confidence ---
  const confProudPoints = [25, 20, 15, 10, 5][proudIdx] ?? 0;
  const confWellBeingPoints = ((wellBeing - 1) / 9) * 25;
  const support = Number(a[16] || 1);
  const supportPoints = ((support - 1) / 9) * 30;
  const selfCareIdx = quizQuestions[14].options?.indexOf(String(a[15])) ?? 0;
  const selfCarePoints = [5, 10, 15, 20][selfCareIdx] ?? 0;
  metrics.confidence = clamp(
    confProudPoints + confWellBeingPoints + supportPoints + selfCarePoints,
    0,
    100
  );

  // --- Discipline ---
  let disciplineAddictionDeduction = 0;
  if (quizQuestions[7].options?.indexOf(String(a[8])) === 4)
    disciplineAddictionDeduction = 0;
  else if (quizQuestions[7].options?.indexOf(String(a[8])) === 5)
    disciplineAddictionDeduction = -35;
  else disciplineAddictionDeduction = -15;
  const disciplineSelfCarePoints = [5, 10, 15, 25][selfCareIdx] ?? 0;
  const disciplineActivityPoints = ((activityScale - 1) / 9) * 20;
  let disciplineSleepPoints = 0;
  switch (quizQuestions[11].options?.indexOf(String(a[12]))) {
    case 2:
      disciplineSleepPoints = 20;
      break;
    case 3:
      disciplineSleepPoints = 15;
      break;
    case 1:
      disciplineSleepPoints = 15;
      break;
    case 0:
      disciplineSleepPoints = 5;
      break;
    default:
      disciplineSleepPoints = 0;
  }
  metrics.discipline = clamp(
    disciplineSelfCarePoints +
      disciplineActivityPoints +
      disciplineSleepPoints +
      100 +
      disciplineAddictionDeduction -
      100,
    0,
    100
  );

  for (const k in metrics) metrics[k] = clamp(metrics[k], 0, 100);
  return metrics;
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData, isLoading, updateSubscription } = useGlobal();
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    async function calculate() {
      if (userData?.quiz?.answers) {
        setLoadingMetrics(true);
        const m = await computeMetrics(userData.quiz.answers);
        setMetrics(m);
        setLoadingMetrics(false);
      }
    }
    calculate();
  }, [userData]);

  const handleSubscribe = async () => {
    await updateSubscription(true);
    router.replace('/plan');
  };

  if (isLoading || !userData || loadingMetrics || !metrics) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>
          Computing your personalized scores...
        </Text>
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
        <Text style={styles.subtitle}>Here are your key life metrics</Text>
        <View style={{ marginBottom: 30 }}>
          {Object.entries(metrics).map(([key, value]) => (
            <View key={key} style={styles.resultCard}>
              <Text style={styles.question}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text style={styles.answer}>
                {Math.round(Number(value))} / 100
              </Text>
            </View>
          ))}
        </View>
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
