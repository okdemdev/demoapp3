import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';
import { PlanService } from '../lib/services/PlanService';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { userData, updatePlan } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = useCallback(async () => {
    if (!userData) return;

    setIsLoading(true);
    setError(null);
    try {
      const planService = PlanService.getInstance();
      const newPlan = await planService.generatePlan(userData);
      await updatePlan(newPlan);
    } catch (error) {
      console.error('Error generating plan:', error);
      setError('Failed to generate your plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userData, updatePlan]);

  useEffect(() => {
    if (userData && !userData.plan) {
      generatePlan();
    }
  }, [userData, generatePlan]);

  if (!userData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Generating Your Plan</Text>
        <Text style={styles.subtitle}>
          Creating a personalized improvement plan based on your data...
        </Text>
        <ActivityIndicator size="large" color="#ffffff" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Plan</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={generatePlan}>
          <Ionicons name="refresh" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        {error || 'Personalized guidance for your journey'}
      </Text>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!error &&
          userData.plan?.weeks.map((week) => (
            <View key={week.weekNumber} style={styles.weekContainer}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
                <Text style={styles.weekDates}>
                  {new Date(week.startDate).toLocaleDateString()} -{' '}
                  {new Date(week.endDate).toLocaleDateString()}
                </Text>
              </View>
              {week.improvements.map((improvement, index) => (
                <View key={index} style={styles.improvementItem}>
                  {improvement.icon && (
                    <Text style={styles.improvementIcon}>
                      {improvement.icon}
                    </Text>
                  )}
                  <Text style={styles.improvementText}>{improvement.text}</Text>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.8,
    marginBottom: 20,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  weekContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  weekHeader: {
    marginBottom: 12,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  weekDates: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.6,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  improvementIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  improvementText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    opacity: 0.9,
  },
  loader: {
    marginTop: 32,
  },
});
