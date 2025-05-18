import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';
import { PlanService } from '../lib/services/PlanService';
import { VideoService } from '../lib/services/VideoService';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { userData, updatePlan, updateVideoGenerationStatus } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrationScript, setNarrationScript] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

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

  const animateWord = useCallback(
    (index: number) => {
      fadeAnim.setValue(0);
      setCurrentWordIndex(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim]
  );

  const startPresentation = useCallback(async () => {
    if (!userData?.plan) return;

    try {
      // Update status to generating
      await updateVideoGenerationStatus({
        status: 'generating',
      });

      const videoService = VideoService.getInstance();
      const { script, words: newWords } = await videoService.generatePlanVideo(
        userData.plan
      );

      setNarrationScript(script);
      setWords(newWords);
      setCurrentWordIndex(0);

      // Start word animation
      let index = 0;
      const interval = setInterval(() => {
        if (index < newWords.length) {
          animateWord(index);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 500); // Change word every 500ms

      // Update status to completed
      await updateVideoGenerationStatus({
        status: 'completed',
      });
    } catch (error) {
      console.error('Error generating presentation:', error);
      await updateVideoGenerationStatus({
        status: 'error',
        error: 'Failed to generate presentation. Please try again.',
      });
    }
  }, [userData?.plan, updateVideoGenerationStatus, animateWord]);

  const replayPresentation = useCallback(async () => {
    try {
      setCurrentWordIndex(0);
      const videoService = VideoService.getInstance();
      await videoService.replayLastScript();

      // Restart word animation
      let index = 0;
      const interval = setInterval(() => {
        if (index < words.length) {
          animateWord(index);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 500);
    } catch (error) {
      console.error('Error replaying presentation:', error);
    }
  }, [words, animateWord]);

  useEffect(() => {
    if (userData && !userData.plan) {
      generatePlan();
    }
  }, [userData, generatePlan]);

  const isGeneratingVideo = userData?.videoGeneration?.status === 'generating';
  const isVideoCompleted = userData?.videoGeneration?.status === 'completed';
  const videoError = userData?.videoGeneration?.error;

  const renderVideoStatus = () => {
    if (isGeneratingVideo) {
      return (
        <View style={styles.videoStatusContainer}>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.videoStatusText}>Generating presentation...</Text>
        </View>
      );
    }
    if (isVideoCompleted && narrationScript) {
      return (
        <View style={styles.presentationContainer}>
          <View style={styles.presentationHeader}>
            <Text style={styles.presentationTitle}>Your Plan Presentation</Text>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={replayPresentation}
            >
              <Ionicons name="play-circle" size={24} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          <View style={styles.wordContainer}>
            <Animated.Text style={[styles.currentWord, { opacity: fadeAnim }]}>
              {words[currentWordIndex]}
            </Animated.Text>
          </View>
          <Text style={styles.narrationScript}>{narrationScript}</Text>
        </View>
      );
    }
    if (videoError) {
      return (
        <View style={styles.videoStatusContainer}>
          <Ionicons name="alert-circle" size={20} color="#f44336" />
          <Text style={[styles.videoStatusText, { color: '#f44336' }]}>
            {videoError}
          </Text>
        </View>
      );
    }
    return null;
  };

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
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[
              styles.videoButton,
              isGeneratingVideo && styles.videoButtonDisabled,
            ]}
            onPress={startPresentation}
            disabled={isGeneratingVideo || !userData.plan}
          >
            <Ionicons
              name={isGeneratingVideo ? 'stop-circle' : 'play'}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={generatePlan}>
            <Ionicons name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {renderVideoStatus()}

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
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
  weekContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  weekHeader: {
    marginBottom: 15,
  },
  weekTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  weekDates: {
    fontSize: 14,
    color: '#888888',
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  improvementIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  improvementText: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  refreshButton: {
    backgroundColor: '#333333',
    borderRadius: 20,
    padding: 10,
  },
  videoButton: {
    backgroundColor: '#333333',
    borderRadius: 20,
    padding: 10,
  },
  videoButtonDisabled: {
    opacity: 0.5,
  },
  loader: {
    marginTop: 20,
  },
  videoStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
  videoStatusText: {
    color: '#ffffff',
    marginLeft: 10,
    fontSize: 14,
  },
  presentationContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  presentationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  presentationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  controlButton: {
    padding: 5,
  },
  wordContainer: {
    backgroundColor: '#333333',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  currentWord: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  narrationScript: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
});
