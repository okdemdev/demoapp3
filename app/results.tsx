import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useGlobal } from './lib/context/GlobalContext';
import quizQuestions from './lib/quizQuestions';
import { QuizAnswer } from './lib/quizStorage';
import OpenAIService from './lib/services/OpenAIService';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

const METRIC_DESCRIPTIONS: Record<MetricKey, string> = {
  wisdom:
    "Wisdom (Self-awareness & Purpose) measures the user's self-understanding, sense of purpose, and ability to reflect on their life and choices.",
  strength:
    "Strength (Physical Health & Energy) measures the user's physical health, energy, and ability to maintain healthy habits.",
  focus:
    "Focus (Clarity & Attention) measures the user's ability to concentrate, avoid distractions, and maintain mental clarity.",
  confidence:
    "Confidence (Self-esteem & Support) measures the user's self-esteem, belief in themselves, and the strength of their support system.",
  discipline:
    "Discipline (Habits & Self-control) measures the user's ability to build good habits, avoid bad ones, and maintain self-control.",
};

// Schema for validating the score response
const scoreSchema = z.preprocess((val) => {
  // Try to parse the value as a number
  const parsed = Number(String(val));
  return isNaN(parsed) ? null : parsed;
}, z.number().min(0).max(100).int()) as z.ZodType<number>;

function buildContextString(answers: QuizAnswer[]): string {
  return quizQuestions
    .filter((q) => q.type !== 'message')
    .map((q) => {
      const userAnswer =
        answers.find((a) => a.questionId === q.id)?.answer ?? '[No answer]';
      return `Q${q.id}: ${q.question} — ${userAnswer}`;
    })
    .join('\n');
}

async function getMetricScore(
  metric: MetricKey,
  context: string,
  answers: QuizAnswer[]
): Promise<number> {
  const openai = OpenAIService.getInstance();

  const scoringCriteria = getScoringCriteria(metric);

  const prompt = `
Rate the person's "${metric}" on a scale from 0 to 100 based on their quiz answers.

${METRIC_DESCRIPTIONS[metric]}

SCORING CRITERIA:
${scoringCriteria}

QUESTIONS AND ANSWERS:
${context}

RESPONSE FORMAT: Single integer between 0-100 only.
`.trim();

  try {
    const score = await openai.generateWithZodSchema<number>(
      prompt,
      'You are a scoring algorithm that outputs only a single integer between 0 and 100.',
      scoreSchema,
      5 // Use 5 retries with exponential backoff
    );

    return Math.min(100, Math.max(0, Math.round(score)));
  } catch (error) {
    console.error(`Error generating score for ${metric}:`, error);
    return calculateFallbackScore(metric, answers);
  }
}

// Helper function to get specific scoring criteria for each metric
function getScoringCriteria(metric: MetricKey): string {
  switch (metric) {
    case 'wisdom':
      return `
- High scores (70-100): Clear life purpose, strong self-awareness, intrinsic motivation, reflective thinking
- Medium scores (40-69): Developing purpose, growing self-awareness, mixed motivations
- Low scores (0-39): Unclear purpose, limited self-awareness, external motivations only`;

    case 'strength':
      return `
- High scores (70-100): Regular physical activity, quality sleep (7-8 hours), few/no addictions, good energy
- Medium scores (40-69): Moderate activity, inconsistent sleep, managed addictions, fluctuating energy
- Low scores (0-39): Minimal physical activity, poor sleep, multiple addictions, low energy`;

    case 'focus':
      return `
- High scores (70-100): Excellent concentration, rarely distracted, clear mental state, recent accomplishments
- Medium scores (40-69): Adequate concentration, occasional distraction, somewhat clear thinking
- Low scores (0-39): Poor concentration, easily distracted, mental fog, lack of recent accomplishments`;

    case 'confidence':
      return `
- High scores (70-100): Strong self-esteem, robust support network, regular self-care, confident decisions
- Medium scores (40-69): Moderate self-esteem, some support, occasional self-care
- Low scores (0-39): Low self-esteem, limited support network, neglects self-care`;

    case 'discipline':
      return `
- High scores (70-100): Strong habits, excellent self-control, consistent routines, no addictions
- Medium scores (40-69): Developing habits, moderate self-control, somewhat consistent routines
- Low scores (0-39): Poor habits, weak self-control, inconsistent routines, multiple addictions`;
  }
}

// Add a simple formula-based scoring fallback when OpenAI fails
function calculateFallbackScore(
  metric: MetricKey,
  answers: QuizAnswer[]
): number {
  // Simple scoring system based on answer indices
  // Higher indices generally correspond to more positive answers
  let score = 50; // Default score
  let totalWeight = 0;

  // Each question might contribute differently to each metric
  const questionWeights: Record<MetricKey, Record<number, number>> = {
    wisdom: { 1: 2, 2: 3, 3: 1, 4: 2, 5: 3 },
    strength: { 1: 1, 2: 3, 3: 3, 4: 2, 5: 1 },
    focus: { 1: 1, 2: 1, 3: 3, 4: 3, 5: 2 },
    confidence: { 1: 3, 2: 2, 3: 1, 4: 2, 5: 2 },
    discipline: { 1: 2, 2: 1, 3: 2, 4: 3, 5: 3 },
  };

  // Calculate a weighted score based on the answers
  answers.forEach((answer) => {
    const questionId = Number(answer.questionId);

    // Skip if not a number question or no weight for this metric
    if (isNaN(questionId) || !questionWeights[metric][questionId]) {
      return;
    }

    const weight = questionWeights[metric][questionId];
    totalWeight += weight;

    // Convert answer to a score (assumed to be index-based, 0-4)
    let answerValue = 0;
    if (typeof answer.answer === 'number') {
      answerValue = answer.answer;
    } else if (typeof answer.answer === 'string') {
      const index = parseInt(answer.answer);
      if (!isNaN(index)) {
        answerValue = index;
      }
    }

    // Contribute to the score (0-4 scale to 0-100 scale)
    score += answerValue * 25 * weight;
  });

  // Normalize by weights
  if (totalWeight > 0) {
    score = Math.round(score / totalWeight);
  }

  // Ensure it's in range
  return Math.min(100, Math.max(0, score));
}

async function computeMetrics(
  answers: QuizAnswer[]
): Promise<Record<MetricKey, number>> {
  console.log('Starting metrics computation...');
  const context = buildContextString(answers);

  const metrics: Record<MetricKey, number> = {
    wisdom: 0,
    strength: 0,
    focus: 0,
    confidence: 0,
    discipline: 0,
  };

  // Process metrics sequentially to avoid rate limits
  const metricKeys = Object.keys(METRIC_DESCRIPTIONS) as MetricKey[];

  for (const metric of metricKeys) {
    try {
      const score = await getMetricScore(metric, context, answers);
      metrics[metric] = score;
    } catch (error) {
      console.error(
        `Failed to get score for ${metric}, using fallback:`,
        error
      );
      metrics[metric] = calculateFallbackScore(metric, answers);
    }
  }

  return metrics;
}

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData, isLoading, updateSubscription } = useGlobal();
  const [metrics, setMetrics] = useState<Record<MetricKey, number> | null>(
    null
  );
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define calculate function for retry button
  const calculate = async () => {
    if (!userData?.quiz?.answers) {
      setError('No quiz data found. Please complete the quiz first.');
      return;
    }

    console.log('🔄 Manual retry of metrics calculation');
    setLoadingMetrics(true);
    setError(null);

    try {
      console.time('Metrics calculation (retry)');
      const m = await computeMetrics(userData.quiz.answers);
      console.timeEnd('Metrics calculation (retry)');
      setMetrics(m);
    } catch (err) {
      console.error('❌ Error calculating metrics on retry:', err);
      setError('Failed to calculate your metrics. Please try again later.');
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    async function calculateInitial() {
      if (userData?.quiz?.answers) {
        console.log('🔄 Starting metrics calculation in useEffect');
        setLoadingMetrics(true);
        setError(null);

        try {
          console.time('Metrics calculation');
          const m = await computeMetrics(userData.quiz.answers);
          console.timeEnd('Metrics calculation');

          console.log('📊 Setting metrics state with calculated values');
          setMetrics(m);
        } catch (err) {
          console.error('❌ Error calculating metrics:', err);
          setError('Failed to calculate your metrics. Please try again.');
        } finally {
          setLoadingMetrics(false);
        }
      } else {
        console.warn('⚠️ No quiz answers available in userData');
        setError('No quiz data found. Please complete the quiz first.');
        setLoadingMetrics(false);
      }
    }
    calculateInitial();
  }, [userData]);

  const handleSubscribe = async () => {
    await updateSubscription(true);
    router.replace('/plan');
  };

  if (isLoading || !userData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading your assessment data...</Text>
      </View>
    );
  }

  if (loadingMetrics) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>
          Computing your personalized scores...
        </Text>
        <Text style={styles.loadingSubtext}>
          This may take a moment as we analyze your responses.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={calculate}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
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
          {metrics &&
            Object.entries(metrics).map(([key, value]) => (
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
  loadingSubtext: {
    color: '#ffffff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
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
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
