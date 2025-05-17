import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';

type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

// Icons for each metric
const METRIC_ICONS: Record<MetricKey, string> = {
  wisdom: 'brain',
  strength: 'barbell-outline',
  focus: 'eye-outline',
  confidence: 'sunny-outline',
  discipline: 'lock-closed-outline',
};

// Descriptions for each metric
const METRIC_DESCRIPTIONS: Record<MetricKey, string> = {
  wisdom: 'Self-awareness & Purpose',
  strength: 'Physical Health & Energy',
  focus: 'Clarity & Attention',
  confidence: 'Self-esteem & Support',
  discipline: 'Habits & Self-control',
};

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const { userData } = useGlobal();
  const router = useRouter();
  const [selectedMetric, setSelectedMetric] = useState<MetricKey | null>(null);
  const [metricHistory, setMetricHistory] = useState<
    Record<MetricKey, number[]>
  >({
    wisdom: [],
    strength: [],
    focus: [],
    confidence: [],
    discipline: [],
  });

  // Function to calculate overall score
  const calculateOverall = (metrics: Record<MetricKey, number> | undefined) => {
    if (!metrics) return 0;

    return Math.round(
      Object.values(metrics).reduce((sum, value) => sum + value, 0) /
        Object.keys(metrics).length
    );
  };

  // Current overall score
  const overallScore = calculateOverall(userData?.metrics);

  // Generate some sample history data based on current metrics
  // In a real app, you would store historical data in the context
  useEffect(() => {
    if (userData?.metrics) {
      // Simulate historical data (last 5 days)
      const history: Record<MetricKey, number[]> = {
        wisdom: [],
        strength: [],
        focus: [],
        confidence: [],
        discipline: [],
      };

      Object.keys(userData.metrics).forEach((key) => {
        const metric = key as MetricKey;
        const currentValue = userData.metrics[metric];

        // Generate 5 historical points with small random variations
        const points = Array(5)
          .fill(0)
          .map((_, i) => {
            // Earlier values slightly lower than current
            const base = Math.max(0, currentValue - (5 - i) * 2);
            // Add small random variation (-1 to +1)
            return Math.round(
              Math.max(0, Math.min(100, base + (Math.random() * 2 - 1)))
            );
          });

        history[metric] = [...points, currentValue];
      });

      setMetricHistory(history);
    }
  }, [userData?.metrics]);

  // Function to get metric growth rate (comparing current to average of past 5 days)
  const getGrowthRate = (metric: MetricKey): number => {
    if (!metricHistory[metric] || metricHistory[metric].length < 2) return 0;

    const currentValue =
      metricHistory[metric][metricHistory[metric].length - 1];
    const previousAvg =
      metricHistory[metric].slice(0, -1).reduce((sum, val) => sum + val, 0) /
      (metricHistory[metric].length - 1);

    return Math.round(((currentValue - previousAvg) / previousAvg) * 100);
  };

  // Function to render a detailed view of the selected metric
  const renderMetricDetail = () => {
    if (!selectedMetric || !userData?.metrics) return null;

    const metric = selectedMetric;
    const currentValue = userData.metrics[metric];
    const growthRate = getGrowthRate(metric);

    return (
      <View style={styles.detailContainer}>
        <View style={styles.detailHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedMetric(null)}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.detailTitle}>
            {metric.charAt(0).toUpperCase() + metric.slice(1)} Details
          </Text>
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Rating</Text>
            <Text style={styles.detailValue}>{currentValue}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Growth Rate</Text>
            <Text
              style={[
                styles.detailValue,
                growthRate > 0 ? styles.positiveGrowth : styles.negativeGrowth,
              ]}
            >
              {growthRate > 0 ? '+' : ''}
              {growthRate}%
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={styles.detailDescription}>
              {METRIC_DESCRIPTIONS[metric]}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progress to Next Level</Text>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${(currentValue % 10) * 10}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(currentValue % 10) * 10}% to level{' '}
              {Math.floor(currentValue / 10) + 1}
            </Text>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Tips to Improve</Text>
            {renderTipsForMetric(metric)}
          </View>
        </View>
      </View>
    );
  };

  // Function to render tips for each metric
  const renderTipsForMetric = (metric: MetricKey) => {
    const tips: Record<MetricKey, string[]> = {
      wisdom: [
        'Read books outside your comfort zone',
        'Practice daily journaling',
        'Engage in philosophical discussions',
        'Meditate for self-awareness',
      ],
      strength: [
        'Exercise for 30 minutes daily',
        'Maintain a balanced diet',
        'Get 7-8 hours of quality sleep',
        'Stay hydrated throughout the day',
      ],
      focus: [
        'Practice mindfulness meditation',
        'Work in focused sprints (25-50 min)',
        'Minimize digital distractions',
        'Get regular physical exercise',
      ],
      confidence: [
        'Step outside your comfort zone daily',
        'Practice positive self-talk',
        'Set and achieve small goals',
        'Build supportive relationships',
      ],
      discipline: [
        'Create and follow daily routines',
        'Start with one habit at a time',
        'Track your progress visually',
        'Eliminate environment triggers for bad habits',
      ],
    };

    return (
      <View style={styles.tipsList}>
        {tips[metric].map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={18} color="#4CAF50" />
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (selectedMetric) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {renderMetricDetail()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Your Statistics</Text>
          <Text style={styles.subtitle}>
            Track your progress and see how you're improving over time
          </Text>

          {/* Overall score card */}
          <View style={[styles.scoreCard, styles.overallCard]}>
            <View style={styles.scoreHeader}>
              <Ionicons name="star" size={24} color="#fff" />
              <Text style={styles.scoreLabel}>Overall Rating</Text>
            </View>
            <View style={styles.scoreContent}>
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
          </View>

          {/* Individual metrics cards */}
          <Text style={styles.sectionTitle}>Your Metrics</Text>
          <View style={styles.metricsGrid}>
            {userData?.metrics &&
              Object.entries(userData.metrics).map(([key, value]) => {
                const metricKey = key as MetricKey;
                const growthRate = getGrowthRate(metricKey);

                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.metricCard]}
                    onPress={() => setSelectedMetric(metricKey)}
                  >
                    <View style={styles.metricHeader}>
                      <Ionicons
                        name={METRIC_ICONS[metricKey] as any}
                        size={24}
                        color="#000"
                      />
                      <Text style={styles.metricName}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                    </View>

                    <View style={styles.metricContent}>
                      <Text style={styles.metricValue}>
                        {Math.round(value)}
                      </Text>
                      <Text
                        style={[
                          styles.metricGrowth,
                          growthRate >= 0
                            ? styles.positiveGrowth
                            : styles.negativeGrowth,
                        ]}
                      >
                        {growthRate > 0 ? '+' : ''}
                        {growthRate}%
                      </Text>
                    </View>

                    <View style={styles.metricBarContainer}>
                      <View
                        style={[
                          styles.metricBar,
                          { width: `${Math.min(100, value)}%` },
                        ]}
                      />
                    </View>

                    <Text style={styles.metricDescription}>
                      {METRIC_DESCRIPTIONS[metricKey]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>

          {/* Tips for improvement */}
          <View style={styles.dailyTipsContainer}>
            <Text style={styles.dailyTipsTitle}>Today's Focus</Text>
            <Text style={styles.dailyTipsSubtitle}>
              Complete your daily tasks to improve your metrics
            </Text>

            <TouchableOpacity
              style={styles.taskButton}
              onPress={() => {
                router.push('/todo');
              }}
            >
              <Text style={styles.taskButtonText}>View Today's Tasks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  content: {
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
    color: '#999',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 16,
  },
  scoreCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  overallCard: {
    backgroundColor: '#F37335',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  scoreContent: {
    marginTop: 8,
  },
  scoreValue: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    backgroundColor: '#fff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    width: '48%',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  metricContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  metricGrowth: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  positiveGrowth: {
    color: '#4CAF50',
  },
  negativeGrowth: {
    color: '#F44336',
  },
  metricBarContainer: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  metricBar: {
    height: '100%',
    backgroundColor: '#F37335',
  },
  metricDescription: {
    fontSize: 12,
    color: '#666',
  },
  dailyTipsContainer: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
  },
  dailyTipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  dailyTipsSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  taskButton: {
    backgroundColor: '#F37335',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  taskButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Detail view styles
  detailContainer: {
    flex: 1,
    padding: 20,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailCard: {
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailDescription: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  progressContainer: {
    marginVertical: 16,
  },
  progressLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F37335',
  },
  progressText: {
    fontSize: 14,
    color: '#999',
  },
  tipsContainer: {
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  tipsList: {
    marginTop: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
});
