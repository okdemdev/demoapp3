import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';
import { useGlobal } from './lib/context/GlobalContext';
import { habitsQuestions } from './lib/habitsQuestions';
import { HabitsAnswer } from './lib/habitsStorage';
import quizQuestions from './lib/quizQuestions';
import { QuizAnswer } from './lib/quizStorage';
import OpenAIService from './lib/services/OpenAIService';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

const METRIC_ICONS: Record<MetricKey, string> = {
  wisdom: 'brain-outline',
  strength: 'barbell-outline',
  focus: 'eye-outline',
  confidence: 'sunny-outline',
  discipline: 'lock-closed-outline',
};

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

// Build context string with both quiz and habits answers
function buildContextString(
  quizAnswers: QuizAnswer[],
  habitsAnswers: HabitsAnswer[]
): string {
  const quizContext = quizQuestions
    .filter((q) => q.type !== 'message')
    .map((q) => {
      const userAnswer =
        quizAnswers.find((a) => a.questionId === q.id)?.answer ?? '[No answer]';
      return `Quiz Q${q.id}: ${q.question} — ${userAnswer}`;
    })
    .join('\n');

  const habitsContext = habitsQuestions
    .map((q) => {
      const userAnswer = habitsAnswers.find(
        (a) => a.questionId === q.id
      )?.answer;

      // Get the label for slider answers instead of just the number
      let displayAnswer = '[No answer]';
      if (userAnswer !== undefined) {
        if (typeof userAnswer === 'number' && q.sliderOptions?.labels) {
          const index = Math.max(
            0,
            Math.min(q.sliderOptions.labels.length - 1, userAnswer - 1)
          );
          displayAnswer = q.sliderOptions.labels[index];
        } else {
          displayAnswer = String(userAnswer);
        }
      }

      return `Habits Q${q.id}: ${q.question} — ${displayAnswer}`;
    })
    .join('\n');

  return `${quizContext}\n\n${habitsContext}`;
}

async function getMetricScore(
  metric: MetricKey,
  context: string,
  quizAnswers: QuizAnswer[],
  habitsAnswers: HabitsAnswer[]
): Promise<number> {
  const openai = OpenAIService.getInstance();

  const scoringCriteria = getScoringCriteria(metric);

  const prompt = `
Rate the person's "${metric}" on a scale from 0 to 100 based on their quiz and habits assessment answers.

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
    return calculateFallbackScore(metric, quizAnswers, habitsAnswers);
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

// Add a formula-based scoring fallback that considers both quiz and habits data
function calculateFallbackScore(
  metric: MetricKey,
  quizAnswers: QuizAnswer[],
  habitsAnswers: HabitsAnswer[]
): number {
  // Base score
  let score = 50;
  let totalWeight = 0;

  // Each question in quiz might contribute differently to each metric
  const quizWeights: Record<MetricKey, Record<number, number>> = {
    wisdom: { 1: 2, 2: 3, 3: 1, 4: 2, 5: 3 },
    strength: { 1: 1, 2: 3, 3: 3, 4: 2, 5: 1 },
    focus: { 1: 1, 2: 1, 3: 3, 4: 3, 5: 2 },
    confidence: { 1: 3, 2: 2, 3: 1, 4: 2, 5: 2 },
    discipline: { 1: 2, 2: 1, 3: 2, 4: 3, 5: 3 },
  };

  // Calculate quiz component of the score
  quizAnswers.forEach((answer) => {
    const questionId = Number(answer.questionId);

    // Skip if not a number question or no weight for this metric
    if (isNaN(questionId) || !quizWeights[metric][questionId]) {
      return;
    }

    const weight = quizWeights[metric][questionId];
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

  // Habit weights for each metric
  const habitWeights: Record<MetricKey, Record<number, number>> = {
    wisdom: { 1: 1, 7: 2 }, // Wake up time, screen time
    strength: { 2: 3, 3: 3, 4: 2, 5: 2, 6: 2, 8: 1 }, // Exercise, gym, sit-ups, push-ups, water, cold showers
    focus: { 1: 1, 7: 3 }, // Wake up time, screen time
    confidence: { 2: 1, 3: 1, 4: 1, 5: 1 }, // Exercise habits can affect confidence
    discipline: { 1: 3, 2: 2, 3: 2, 6: 1, 8: 3 }, // Wake up, exercise, gym, water, cold showers
  };

  // Add habits component to the score
  habitsAnswers.forEach((answer) => {
    const questionId = Number(answer.questionId);

    // Skip if no weight for this metric
    if (!habitWeights[metric][questionId]) {
      return;
    }

    const weight = habitWeights[metric][questionId];
    totalWeight += weight;

    let answerValue = 0;
    if (typeof answer.answer === 'number') {
      // For most habits, like exercise, lower numbers are worse (e.g., "I don't run")
      if ([2, 3, 4, 5, 6, 8].includes(questionId)) {
        // Convert 1-5 scale to 0-4 scale
        answerValue = answer.answer - 1;
      }
      // For wake up time, lower is better (waking up earlier)
      else if (questionId === 1) {
        // Reverse the scale: 5→0, 4→1, 3→2, 2→3, 1→4
        answerValue = 5 - answer.answer;
      }
      // For screen time, lower is better (less screen time)
      else if (questionId === 7) {
        // Reverse the scale: 5→0, 4→1, 3→2, 2→3, 1→4
        answerValue = 5 - answer.answer;
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
  quizAnswers: QuizAnswer[],
  habitsAnswers: HabitsAnswer[]
): Promise<Record<MetricKey, number>> {
  console.log('Starting metrics computation with quiz and habits data...');
  const context = buildContextString(quizAnswers, habitsAnswers);

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
      const score = await getMetricScore(
        metric,
        context,
        quizAnswers,
        habitsAnswers
      );
      metrics[metric] = score;
    } catch (error) {
      console.error(
        `Failed to get score for ${metric}, using fallback:`,
        error
      );
      metrics[metric] = calculateFallbackScore(
        metric,
        quizAnswers,
        habitsAnswers
      );
    }
  }

  return metrics;
}

// Sun logo component
const SunLogo = () => (
  <View style={styles.logoContainer}>
    <View style={styles.sunLogo} />
  </View>
);

// Progress bar component
const ProgressBar = ({ progress }: { progress: number }) => (
  <View style={styles.progressBarContainer}>
    <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
  </View>
);

// Loading step component
type LoadingStep = {
  title: string;
  steps: string[];
  progress: number;
};

export default function ResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userData, isLoading, updateSubscription } = useGlobal();
  const [metrics, setMetrics] = useState<Record<MetricKey, number> | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const [progressAnim] = useState(new Animated.Value(0));
  const [currentStep, setCurrentStep] = useState(0);

  // Define the sequence of loading steps
  const loadingSteps: LoadingStep[] = [
    { title: 'Analysing your current habits...', steps: [], progress: 0.5 },
    {
      title: 'Customising a program...',
      steps: ['Analysing current habits'],
      progress: 0.7,
    },
    {
      title: 'Customising a program...',
      steps: ['Analysing current habits', 'Generating 66 days schedule'],
      progress: 0.9,
    },
  ];

  // Define calculate function for retry button
  const calculate = async () => {
    if (!userData?.quiz?.answers) {
      setError('No quiz data found. Please complete the quiz first.');
      return;
    }

    console.log('🔄 Manual retry of metrics calculation');
    setCurrentStep(0); // Reset to first loading step
    setError(null);

    // Animate through loading steps
    animateLoadingSequence();

    try {
      console.time('Metrics calculation (retry)');
      const m = await computeMetrics(
        userData.quiz.answers,
        userData.habits?.answers || []
      );
      console.timeEnd('Metrics calculation (retry)');
      setMetrics(m);
    } catch (err) {
      console.error('❌ Error calculating metrics on retry:', err);
      setError('Failed to calculate your metrics. Please try again later.');
    }
  };

  // Function to animate through the loading steps
  const animateLoadingSequence = () => {
    // Reset progress
    progressAnim.setValue(0);

    // Animate through each step
    loadingSteps.forEach((_, index) => {
      const delay = index * 1500; // 1.5 seconds per step

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: loadingSteps[index].progress,
        duration: 1000,
        delay: delay,
        useNativeDriver: false,
        easing: Easing.out(Easing.ease),
      }).start();

      // Update current step
      setTimeout(() => {
        setCurrentStep(index);
      }, delay);
    });

    // After the last step, wait a bit before showing results
    setTimeout(() => {
      // The component will show results after this
    }, loadingSteps.length * 1500 + 500);
  };

  useEffect(() => {
    async function calculateInitial() {
      if (!userData) {
        console.warn('⚠️ No user data available');
        setError('No data found. Please complete the assessment first.');
        return;
      }

      if (!userData.quiz?.answers || userData.quiz.answers.length === 0) {
        console.warn('⚠️ No quiz answers available in userData');
        setError('No quiz data found. Please complete the quiz first.');
        return;
      }

      if (!userData.habits?.answers || userData.habits.answers.length === 0) {
        console.warn('⚠️ No habits answers available in userData');
        setError(
          'No habits data found. Please complete the habits assessment first.'
        );
        return;
      }

      console.log('🔄 Starting metrics calculation in useEffect');
      setCurrentStep(0); // Start with the first loading step
      setError(null);

      // Animate through loading steps
      animateLoadingSequence();

      try {
        console.time('Metrics calculation');
        const m = await computeMetrics(
          userData.quiz.answers,
          userData.habits.answers
        );
        console.timeEnd('Metrics calculation');

        if (!m || Object.keys(m).length === 0) {
          throw new Error('Failed to compute metrics - no data returned');
        }

        console.log('📊 Setting metrics state with calculated values');
        setMetrics(m);
      } catch (err) {
        console.error('❌ Error calculating metrics:', err);
        setError('Failed to calculate your metrics. Please try again.');
      }
    }
    calculateInitial();
  }, [userData]);

  const handleSubscribe = async () => {
    await updateSubscription(true);
    router.replace('/plan');
  };

  const navigateToPotentialRatings = () => {
    // Pass current metrics to the potential ratings page
    router.push({
      pathname: '/potential-ratings' as any,
      params: {
        metrics: JSON.stringify(metrics)
      }
    });
  };

  if (isLoading || !userData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <SunLogo />
          <Text style={styles.loadingText}>
            Loading your assessment data...
          </Text>
          <ProgressBar progress={0.3} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={calculate}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Show loading screens sequence
  if (!metrics || currentStep < loadingSteps.length - 1) {
    const step = loadingSteps[currentStep];

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <View style={styles.loadingContent}>
          <SunLogo />
          <Text style={styles.loadingTitle}>{step.title}</Text>

          <Animated.View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </Animated.View>

          {step.steps.map((stepText, index) => (
            <View key={index} style={styles.stepItem}>
              <Ionicons name="checkmark-outline" size={18} color="#888" />
              <Text style={styles.stepText}>{stepText}</Text>
            </View>
          ))}

          <View style={styles.statsContainer}>
            <View style={styles.statWrapper}>
              <Text style={styles.statText}>400,000+ installs</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons key={star} name="star" size={16} color="#e5e5e5" />
                ))}
                <Text style={styles.ratingText}>4.6</Text>
              </View>
            </View>

            <View style={styles.statWrapper}>
              <Text style={styles.statText}>450,000+</Text>
              <Text style={styles.statText}>Program Generated</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Final results display with new design
  if (metrics) {
    // Calculate overall score as average of all metrics
    const overallScore = Math.round(
      Object.values(metrics).reduce((sum, value) => sum + value, 0) /
        Object.keys(metrics).length
    );

    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <ScrollView style={styles.scrollView}>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Your Rise Rating</Text>
            <Text style={styles.resultsSubtitle}>
              Based on your answers, this is your current Rise rating, which
              reflects your lifestyle and habits now.
            </Text>

            {/* Overall score card */}
            <View style={[styles.scoreCard, { backgroundColor: '#BB4430' }]}>
              <View style={styles.scoreHeader}>
                <Ionicons name="star" size={24} color="#fff" />
                <Text style={styles.scoreLabel}>Overall</Text>
              </View>
              <Text style={styles.scoreValue}>{overallScore}</Text>
              <View style={styles.scoreBarContainer}>
                <View
                  style={[
                    styles.scoreBar,
                    { width: `${Math.min(100, overallScore)}%` },
                  ]}
                />
              </View>
            </View>

            {/* Individual metrics cards */}
            <View style={styles.metricsGrid}>
              {Object.entries(metrics).map(([key, value]) => (
                <View key={key} style={styles.scoreCard}>
                  <View style={styles.scoreHeader}>
                    <Ionicons
                      name={METRIC_ICONS[key as MetricKey] as any}
                      size={24}
                      color="#000"
                    />
                    <Text style={[styles.scoreLabel, { color: '#000' }]}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                  </View>
                  <Text style={[styles.scoreValue, { color: '#000' }]}>
                    {Math.round(value)}
                  </Text>
                  <View
                    style={[
                      styles.scoreBarContainer,
                      { backgroundColor: '#E5E5E5' },
                    ]}
                  >
                    <View
                      style={[
                        styles.scoreBar,
                        {
                          width: `${Math.min(100, value)}%`,
                          backgroundColor: '#BB4430',
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>

            <Pressable style={styles.ctaButton} onPress={navigateToPotentialRatings}>
              <Text style={styles.ctaButtonText}>See Potential Ratings</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // This should never happen, but just in case
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollView: {
    flex: 1,
  },
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    width: 60,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  sunLogo: {
    width: 60,
    height: 30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  loadingTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 12,
  },
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepText: {
    fontSize: 16,
    color: '#888',
    marginLeft: 8,
  },
  statsContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  statWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    fontSize: 16,
    color: '#888',
    marginLeft: 8,
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
    marginHorizontal: 20,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  // Results screen styles
  resultsContainer: {
    padding: 20,
  },
  resultsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
    lineHeight: 22,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scoreBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  ctaButton: {
    backgroundColor: '#BB4430',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
