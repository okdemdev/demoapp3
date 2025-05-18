import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { VideoTheme } from '../lib/videoMapping';

export default function PlanScreen() {
  const insets = useSafeAreaInsets();
  const { userData, updatePlan, updateVideoGenerationStatus } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [narrationScript, setNarrationScript] = useState<string | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [videoTheme, setVideoTheme] = useState<VideoTheme | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef<Video>(null);

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
        duration: 200,
        useNativeDriver: true,
      }).start();
    },
    [fadeAnim]
  );

  const startPresentation = useCallback(async () => {
    if (!userData?.plan) return;

    try {
      await updateVideoGenerationStatus({
        status: 'generating',
      });

      const videoService = VideoService.getInstance();
      const {
        script,
        words: newWords,
        videoTheme: newTheme,
      } = await videoService.generatePlanVideo(userData.plan);

      setNarrationScript(script);
      setWords(newWords);
      setCurrentWordIndex(0);
      setVideoTheme(newTheme);

      await updateVideoGenerationStatus({
        status: 'completed',
      });

      if (videoRef.current) {
        try {
          await videoRef.current.setPositionAsync(0);
          await videoRef.current.playAsync();
        } catch (error) {
          console.error('Error playing video:', error);
        }
      }

      const startAnimation = () => {
        let index = 0;
        const wordsPerSecond = 2;
        const interval = setInterval(() => {
          if (index < newWords.length) {
            animateWord(index);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 1000 / wordsPerSecond);
      };

      await videoService.speakText(script, startAnimation);
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

      if (videoRef.current) {
        try {
          await videoRef.current.setPositionAsync(0);
          await videoRef.current.playAsync();
        } catch (error) {
          console.error('Error replaying video:', error);
        }
      }

      const startAnimation = () => {
        let index = 0;
        const wordsPerSecond = 2;
        const interval = setInterval(() => {
          if (index < words.length) {
            animateWord(index);
            index++;
          } else {
            clearInterval(interval);
          }
        }, 1000 / wordsPerSecond);
      };

      await videoService.replayLastScript(startAnimation);
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
        <ActivityIndicator size="large" color="#000000" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>How will I improve</Text>
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
              color="#000000"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshButton} onPress={generatePlan}>
            <Ionicons name="refresh" size={24} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.description}>
        <Text style={styles.descriptionText}>
          <Text style={styles.descriptionHighlight}>The Goose life reset program is </Text>
          <Text style={styles.descriptionBold}>designed scientifically from research studies </Text>
          <Text style={styles.descriptionHighlight}>to maximize your chance of success.</Text>
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {isGeneratingVideo && (
          <View style={styles.videoStatusContainer}>
            <ActivityIndicator size="small" color="#000000" />
            <Text style={styles.videoStatusText}>
              Generating presentation...
            </Text>
          </View>
        )}

        {videoError && (
          <View style={styles.videoStatusContainer}>
            <Ionicons name="alert-circle" size={20} color="#f44336" />
            <Text style={[styles.videoStatusText, { color: '#f44336' }]}>
              {videoError}
            </Text>
          </View>
        )}

        {isVideoCompleted && narrationScript && videoTheme && (
          <View style={styles.presentationContainer}>
            <View style={styles.presentationHeader}>
              <Text style={styles.presentationTitle}>{videoTheme.title}</Text>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={replayPresentation}
              >
                <Ionicons name="play-circle" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={videoTheme.assetPath}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                isLooping
                isMuted
                shouldPlay={true}
                onPlaybackStatusUpdate={(status) => {
                  if (!status.isLoaded) return;
                  // If video ends and we're not looping, restart it
                  if (status.didJustFinish) {
                    videoRef.current?.setPositionAsync(0);
                    videoRef.current?.playAsync();
                  }
                }}
              />
              <View style={styles.wordOverlay}>
                <Animated.Text
                  style={[styles.currentWord, { opacity: fadeAnim }]}
                >
                  {words[currentWordIndex]}
                </Animated.Text>
              </View>
            </View>
            <Text style={styles.narrationScript}>{narrationScript}</Text>
          </View>
        )}

        {!error &&
          userData.plan?.weeks.map((week) => (
            <View key={week.weekNumber} style={styles.weekContainer}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>
                  Week {week.weekNumber} ({new Date(week.startDate).getDate()} {new Date(week.startDate).toLocaleString('default', { month: 'short' })} to {new Date(week.endDate).getDate()} {new Date(week.endDate).toLocaleString('default', { month: 'short' })})
                </Text>
              </View>
              {week.improvements.map((improvement, index) => (
                <View key={index} style={styles.improvementItem}>
                  {improvement.icon ? (
                    <Text style={styles.improvementIcon}>
                      {improvement.icon}
                    </Text>
                  ) : (
                    <Ionicons
                      name={index === 0 ? "cube-outline" : index === 1 ? "sunny-outline" : "heart-outline"}
                      size={24}
                      color="#000"
                      style={styles.improvementIconFallback}
                    />
                  )}
                  <Text style={styles.improvementText}>
                    {renderHighlightedText(improvement.text)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

// Helper function to highlight certain parts of the text
function renderHighlightedText(text: string) {
  // This is a simplified function - in a real app you'd want to have a more sophisticated approach
  // to determine which parts to highlight based on data from the backend

  if (!text) return null;

  // Split by keywords that should be highlighted
  const keywordsToHighlight = [
    'basic, easy habits',
    'as the first week finishes',
    'boosted metabolism',
    'Improved clarity'
  ];

  // Check if text contains any of the keywords
  const foundKeyword = keywordsToHighlight.find(keyword => text.includes(keyword));

  if (foundKeyword) {
    const parts = text.split(foundKeyword);
    return (
      <>
        <Text>{parts[0]}</Text>
        <Text style={{ color: '#FF7D49' }}>{foundKeyword}</Text>
        <Text>{parts[1]}</Text>
      </>
    );
  }

  return <Text>{text}</Text>;
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
  description: {
    marginBottom: 20,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  descriptionHighlight: {
    color: '#888888',
  },
  descriptionBold: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  weekContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
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
  improvementIconFallback: {
    marginRight: 15,
    color: '#ffffff',
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
  videoContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  wordOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentWord: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  narrationScript: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
});
