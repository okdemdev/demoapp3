import { FontAwesome, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DailyTask, MetricKey, useGlobal } from '../lib/context/GlobalContext';
import { TaskService } from '../lib/services/TaskService';

// Task interface - using DailyTask from GlobalContext
interface Task extends DailyTask {
  image?: any; // Image source for the task
}

// Define a type for FontAwesome icons we're using
type FontAwesomeIconType =
  | 'book'
  | 'heartbeat'
  | 'bullseye'
  | 'trophy'
  | 'clock-o'
  | 'check-circle'
  | 'times-circle'
  | 'hand-o-left'
  | 'check'
  | 'times'
  | 'star'
  | 'bar-chart'
  | 'line-chart'
  | 'arrow-up';

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const { userData, toggleTodo, updateMetrics, saveDailyTasks, updateDailyTask } = useGlobal();
  const [currentDay, setCurrentDay] = useState(10); // Current day counter
  const [totalDays, setTotalDays] = useState(66); // Total days counter
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [beforeStats, setBeforeStats] = useState<Record<MetricKey, number>>({
    wisdom: 0,
    strength: 0,
    focus: 0,
    confidence: 0,
    discipline: 0,
  });
  const [afterStats, setAfterStats] = useState<Record<MetricKey, number>>({
    wisdom: 0,
    strength: 0,
    focus: 0,
    confidence: 0,
    discipline: 0,
  });

  // Add this for stats modal animation
  const [showStatsModal, setShowStatsModal] = useState(false);
  const modalAnimation = useRef(new Animated.Value(-1000)).current;

  // Define refs at the top level of the component
  const isInitialRender = useRef(true);
  const currentDayChanged = useRef(false);

  // Load current day from AsyncStorage
  useEffect(() => {
    loadDayInfo();
  }, []);

  // Mark initial render as complete after the component mounts
  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  // Check for existing tasks or show welcome screen
  useEffect(() => {
    if (userData && currentDay) {
      // Check if we have tasks for today
      const hasTodaysTasks = userData.dailyTasks &&
        userData.dailyTasks.generatedForDay === currentDay &&
        userData.dailyTasks.tasks &&
        userData.dailyTasks.tasks.length > 0;

      if (hasTodaysTasks) {
        console.log('📝 Found existing tasks for day', currentDay);
        console.log('📊 Global tasks:', JSON.stringify(userData.dailyTasks!.tasks.map(t => ({ id: t.id, completed: t.completed }))));
        console.log('📊 Local tasks state:', JSON.stringify(tasks.map(t => ({ id: t.id, completed: t.completed }))));

        // When loading existing tasks, preserve the local state for tasks that
        // might have been modified during this session
        if (tasks.length === 0) {
          // Only load tasks from userData if we don't have any local tasks yet
          // (this prevents overwriting completed tasks on re-renders)
          console.log('🔄 Loading tasks from global context into local state');
          setTasks(userData.dailyTasks!.tasks as Task[]);
        } else {
          // We already have tasks, so let's keep our local state
          console.log('🔒 Preserving existing local task state');

          // This approach preserves local completion state but updates other task properties
          // that might have changed in the global context
          const mergedTasks = tasks.map(localTask => {
            const globalTask = userData.dailyTasks!.tasks.find(t => t.id === localTask.id);
            if (globalTask) {
              // Keep local completion state but update other properties from global
              return {
                ...globalTask,
                completed: localTask.completed, // Preserve local completion state
                skipped: localTask.skipped,    // Preserve local skipped state
              };
            }
            return localTask;
          });

          console.log('📊 Merged tasks:', JSON.stringify(mergedTasks.map(t => ({ id: t.id, completed: t.completed }))));
          setTasks(mergedTasks);
        }

        // Set before/after stats
        if (userData.metrics) {
          setBeforeStats({ ...userData.metrics });
          setAfterStats({ ...userData.metrics });
        }

        // Hide welcome screen
        setShowWelcomeScreen(false);
      } else {
        console.log('⚠️ No tasks found for day', currentDay);
        // Show welcome screen to generate tasks
        setShowWelcomeScreen(true);
        setTasks([]);
      }
    }
  }, [userData, currentDay]);

  // Update currentDayChanged ref when day changes
  useEffect(() => {
    currentDayChanged.current = true;

    // If day changes, we need to check for tasks again
    if (!isInitialRender.current && userData) {
      const hasTodaysTasks = userData.dailyTasks &&
        userData.dailyTasks.generatedForDay === currentDay;

      if (!hasTodaysTasks) {
        // Show welcome screen for the new day
        setShowWelcomeScreen(true);
        setTasks([]);
      }
    }
  }, [currentDay]);

  // Update afterStats whenever metrics change
  useEffect(() => {
    if (userData?.metrics) {
      console.log('📊 Metrics updated, updating afterStats');
      setAfterStats({ ...userData.metrics });

      // Don't update tasks here, as that would overwrite completion state
    }
  }, [userData?.metrics]);

  // Add animation for modal
  useEffect(() => {
    if (showStatsModal) {
      Animated.spring(modalAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 20,
        friction: 7,
      }).start();
    } else {
      Animated.timing(modalAnimation, {
        toValue: -1000,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showStatsModal]);

  // Load current day information
  const loadDayInfo = async () => {
    try {
      const dayInfo = await AsyncStorage.getItem('dayTracker');
      if (dayInfo) {
        const { day, lastUpdated } = JSON.parse(dayInfo);

        // Check if last update was today or not
        const lastDate = new Date(lastUpdated);
        const today = new Date();
        const isNewDay =
          lastDate.getDate() !== today.getDate() ||
          lastDate.getMonth() !== today.getMonth() ||
          lastDate.getFullYear() !== today.getFullYear();

        if (isNewDay) {
          // It's a new day, increment the counter
          const newDay = day + 1;
          setCurrentDay(newDay);
          saveDayInfo(newDay);
        } else {
          // Same day, just use the stored value
          setCurrentDay(day);
        }
      } else {
        // First time using the app, initialize with day 1
        saveDayInfo(1);
        setCurrentDay(1);
      }
    } catch (error) {
      console.error('Error loading day info:', error);
    }
  };

  // Save current day information
  const saveDayInfo = async (day: number) => {
    try {
      await AsyncStorage.setItem(
        'dayTracker',
        JSON.stringify({
          day,
          lastUpdated: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error('Error saving day info:', error);
    }
  };

  const generateDailyTasks = async () => {
    console.log('📝 Generating daily tasks');

    // Clear any existing tasks first
    setTasks([]);
    setIsGeneratingTasks(true);

    if (!userData?.metrics) {
      console.error('❌ No metrics found in userData for task generation');
      setIsGeneratingTasks(false);
      return;
    }

    try {
      // Get the task service instance
      const taskService = TaskService.getInstance();

      // Generate AI tasks based on metrics and current day
      const aiTasks = await taskService.generateDailyTasks(
        userData.metrics,
        currentDay
      );

      console.log('🧠 AI generated tasks:', aiTasks);

      // Transform AI tasks to our Task interface format
      const newTasks: Task[] = aiTasks.map((aiTask, index) => {
        return {
          id: `task-${Date.now()}-${index}`,
          title: aiTask.title,
          description: aiTask.description,
          metric: aiTask.metric,
          points: aiTask.points,
          streak: Math.floor(Math.random() * 15) + 1, // 1-15 days streak
          repeat: 'Daily',
          difficulty: aiTask.difficulty,
          completed: false,
          skipped: false,
        };
      });

      console.log(`📊 Setting ${newTasks.length} new AI-generated tasks`);

      // Set local state
      setTasks(newTasks);

      // Save to global context for persistence
      await saveDailyTasks(newTasks, currentDay);

      // Hide welcome screen after generation
      setShowWelcomeScreen(false);

      // Save the current stats as "before" stats
      if (userData.metrics) {
        setBeforeStats({ ...userData.metrics });
        setAfterStats({ ...userData.metrics });
      }
    } catch (error) {
      console.error('❌ Error generating AI tasks:', error);

      // Fallback to basic tasks if AI generation fails
      generateFallbackTasks();
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  // Fallback to original task generation if AI fails
  const generateFallbackTasks = async () => {
    console.log('⚠️ Using fallback task generation');

    const metrics: MetricKey[] = [
      'wisdom',
      'strength',
      'focus',
      'confidence',
      'discipline',
    ];

    const newTasks: Task[] = metrics.map((metric, index) => {
      // Create a task based on the metric type
      const baseTask = getTaskForMetric(metric, index);

      // Construct the full task with required properties
      const task: Task = {
        id: `task-${Date.now()}-${index}`,
        title: baseTask.title || `Task for ${metric}`,
        description: baseTask.description || `Task description for ${metric}`,
        metric: metric,
        points: baseTask.points || 5,
        streak: Math.floor(Math.random() * 15) + 1, // 1-15 days streak
        repeat: 'Daily',
        difficulty: baseTask.difficulty || 2,
        completed: false,
        skipped: false,
      };

      console.log(`📋 Created fallback task for ${metric}:`, task.title);
      return task;
    });

    console.log(`📊 Setting ${newTasks.length} fallback tasks`);

    // Set local state
    setTasks(newTasks);

    // Save to global context for persistence
    await saveDailyTasks(newTasks, currentDay);

    // Hide welcome screen after generation
    setShowWelcomeScreen(false);

    // Save the current stats as "before" stats
    if (userData?.metrics) {
      setBeforeStats({ ...userData.metrics });
      setAfterStats({ ...userData.metrics });
    }
  };

  // Get task details based on metric
  const getTaskForMetric = (
    metric: MetricKey,
    index: number
  ): Partial<Task> => {
    switch (metric) {
      case 'wisdom':
        return {
          title: 'Read for 20 minutes',
          description: 'Feed your mind with knowledge.',
          difficulty: 3,
          points: 10,
        };
      case 'strength':
        return {
          title: 'Do 20 push-ups',
          description: 'Build your physical strength.',
          difficulty: 4,
          points: 15,
        };
      case 'focus':
        return {
          title: 'Meditate for 10 minutes',
          description: 'Clear your mind and enhance focus.',
          difficulty: 2,
          points: 10,
        };
      case 'confidence':
        return {
          title: 'Practice public speaking',
          description: 'Prepare and deliver a short speech.',
          difficulty: 4,
          points: 20,
        };
      case 'discipline':
        return {
          title: 'Wake up at 7AM',
          description: 'Rise before everyone, seize the day.',
          difficulty: 3,
          points: 15,
        };
      default:
        return {
          title: `Task ${index + 1}`,
          description: 'Complete this task to earn points.',
          difficulty: 2,
          points: 5,
        };
    }
  };

  // Complete a task
  const completeTask = (taskId: string) => {
    console.log('⭐ Attempting to complete task:', taskId);
    console.log('📊 Current tasks state:', JSON.stringify(tasks.map(t => ({ id: t.id, completed: t.completed }))));
    console.log('🌍 Current userData.dailyTasks:', userData?.dailyTasks ? JSON.stringify(userData.dailyTasks.tasks.map(t => ({ id: t.id, completed: t.completed }))) : 'no dailyTasks');

    // Find the task in our local state
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      console.error('❌ Task not found:', taskId);
      return;
    }

    const taskToComplete = tasks[taskIndex];
    console.log('📋 Task to complete:', taskToComplete);

    // Immediately update local state for quicker feedback
    const newTasks = tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: true, skipped: false }
        : { ...task }
    );

    // Update the local state right away
    console.log('🔄 Setting local state with updated tasks');
    setTasks(newTasks);

    // Update the task in global context
    console.log('🌍 Updating task in global context');
    updateDailyTask(taskId, { completed: true, skipped: false });

    // After a delay, verify the update was applied
    setTimeout(() => {
      console.log('✅ Verification after delay - Local tasks:', JSON.stringify(tasks.map(t => ({ id: t.id, completed: t.completed }))));
      console.log('✅ Verification after delay - Global tasks:', userData?.dailyTasks ? JSON.stringify(userData.dailyTasks.tasks.map(t => ({ id: t.id, completed: t.completed }))) : 'no dailyTasks');

      // Start a slight delay to allow any animations to complete
      // Update the metrics if they exist
      if (userData?.metrics) {
        console.log('📈 Current metrics:', userData.metrics);
        console.log(
          `📊 Adding ${taskToComplete.points} points to ${taskToComplete.metric}`
        );

        // Update the after stats for UI display
        const newAfterStats = { ...afterStats };
        newAfterStats[taskToComplete.metric] += taskToComplete.points;
        setAfterStats(newAfterStats);

        // Update global metrics
        const updatedMetrics = { ...userData.metrics };
        updatedMetrics[taskToComplete.metric] += taskToComplete.points;

        console.log('📊 New metrics will be:', updatedMetrics);
        updateMetrics(updatedMetrics);
      } else {
        console.error('❌ No metrics found in userData');
      }
    }, 1000); // Increased delay for better verification
  };

  // Skip a task
  const skipTask = (taskId: string) => {
    console.log('Skipping task:', taskId);

    // Immediately update local state for better visual feedback
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, completed: false, skipped: true };
      }
      return task;
    });

    // Update local state immediately
    setTasks(updatedTasks);

    // Update in global context
    updateDailyTask(taskId, { completed: false, skipped: true });
  };

  // Navigation functions
  const goToPreviousDay = () => {
    if (currentDay > 1) {
      console.log('⬅️ Going to previous day');
      setCurrentDay(currentDay - 1);
      saveDayInfo(currentDay - 1);
      // The useEffect that watches currentDay will set the flag that triggers regeneration
    }
  };

  const goToNextDay = () => {
    if (currentDay < totalDays) {
      console.log('➡️ Going to next day');
      setCurrentDay(currentDay + 1);
      saveDayInfo(currentDay + 1);
      // The useEffect that watches currentDay will set the flag that triggers regeneration
    }
  };

  // Task Card Component with swipe functionality
  const TaskCard = ({ task }: { task: Task }) => {
    console.log(
      `Rendering task ${task.id}: ${task.completed ? 'COMPLETED' : 'PENDING'}`
    );

    // For completed tasks, show a different card
    if (task.completed) {
      return (
        <View style={[styles.taskCardContainer]}>
          <View style={[styles.taskCard, styles.completedTaskCard]}>
            <View style={styles.taskImageContainer}>
              <View style={styles.completedIndicator}>
                <FontAwesome name="check-circle" size={24} color="#fff" />
              </View>
              <Text style={[styles.taskTitle, styles.completedText]}>
                {task.title}
              </Text>
              <Text style={[styles.taskDescription, styles.completedText]}>
                Completed! +{task.points} {task.metric}
              </Text>
              <View style={styles.taskStats}>
                <Text style={[styles.completedText, { marginTop: 8 }]}>
                  Well done! You've earned {task.points} points for your{' '}
                  {task.metric}.
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    // For skipped tasks, show a different card
    if (task.skipped) {
      return (
        <View style={[styles.taskCardContainer]}>
          <View style={[styles.taskCard, styles.skippedTaskCard]}>
            <View style={styles.taskImageContainer}>
              <View style={styles.skippedIndicator}>
                <FontAwesome name="times-circle" size={24} color="#fff" />
              </View>
              <Text style={[styles.taskTitle, styles.skippedText]}>
                {task.title}
              </Text>
              <Text style={[styles.taskDescription, styles.skippedText]}>
                You decided to skip this task
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // For pending tasks, show the normal card with pan responder
    const pan = useState(new Animated.ValueXY())[0];
    const [showOptions, setShowOptions] = useState(false);
    const [completePressed, setCompletePressed] = useState(false);
    const [skipPressed, setSkipPressed] = useState(false);

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Only allow horizontal movement (right swipe reveals options)
        if (gestureState.dx > 0) {
          // Right swipe - limit to maximum width of options
          pan.setValue({ x: Math.min(gestureState.dx, 130), y: 0 });
          if (gestureState.dx > 50 && !showOptions) {
            setShowOptions(true);
          }
        } else {
          // Left swipe - not allowing
          pan.setValue({ x: Math.max(gestureState.dx, 0), y: 0 });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 40) {
          // Swiped right enough - show options
          Animated.spring(pan, {
            toValue: { x: 130, y: 0 },
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
          setShowOptions(true);
        } else {
          // Return to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            friction: 8,
            tension: 40,
          }).start();
          setShowOptions(false);
        }
      },
    });

    // Get the appropriate icon for the metric
    const metricIcon = getIoniconsForMetric(task.metric);

    return (
      <View style={styles.taskCardContainer}>
        {/* Options Container (positioned behind the card) */}
        <View style={styles.taskOptionsContainer}>
          <View style={styles.taskOptions}>
            <TouchableOpacity
              style={[
                styles.completeOptionButton,
                completePressed && { backgroundColor: '#388E3C' }
              ]}
              activeOpacity={0.7}
              onPress={() => {
                console.log('✅ Complete option button pressed for task:', task.id);

                // Visual feedback with state
                setCompletePressed(true);

                // Call complete task
                completeTask(task.id);

                // Reset animation and hide options
                Animated.spring(pan, {
                  toValue: { x: 0, y: 0 },
                  useNativeDriver: true,
                  friction: 8,
                  tension: 40,
                }).start();
                setShowOptions(false);

                // Reset pressed state after delay
                setTimeout(() => {
                  setCompletePressed(false);
                }, 300);
              }}
            >
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
              <Text style={styles.optionButtonText}>Complete</Text>
              <View style={styles.optionMetricContainer}>
                <Ionicons name={metricIcon} size={16} color="#fff" />
                <Text style={styles.optionMetricText}>+{task.points}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.skipOptionButton,
                skipPressed && { backgroundColor: '#424242' }
              ]}
              activeOpacity={0.7}
              onPress={() => {
                console.log('🔴 Skip option button pressed for task:', task.id);

                // Visual feedback with state
                setSkipPressed(true);

                // Call skip task
                skipTask(task.id);

                // Reset animation and hide options
                Animated.spring(pan, {
                  toValue: { x: 0, y: 0 },
                  useNativeDriver: true,
                  friction: 8,
                  tension: 40,
                }).start();
                setShowOptions(false);

                // Reset pressed state after delay
                setTimeout(() => {
                  setSkipPressed(false);
                }, 300);
              }}
            >
              <Ionicons name="close-circle" size={28} color="#fff" />
              <Text style={styles.optionButtonText}>Skip</Text>
              <View style={styles.optionMetricContainer}>
                <Ionicons name={metricIcon} size={16} color="#fff" />
                <Text style={styles.optionMetricText}>+0</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Task Card (slides to reveal options) */}
        <Animated.View
          style={[
            styles.taskCard,
            { transform: [{ translateX: pan.x }] }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.taskImageContainer}>
            {/* Task Icon */}
            <View style={styles.taskIcon}>
              <FontAwesome
                name={getFontAwesomeIconForMetric(task.metric)}
                size={24}
                color="#fff"
              />
            </View>

            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskDescription}>{task.description}</Text>

            <View style={styles.taskStats}>
              <Text style={styles.streakText}>Streak {task.streak} days</Text>
              <Text style={styles.repeatText}>Repeat {task.repeat}</Text>
              <View style={styles.difficultyContainer}>
                <Text style={styles.difficultyText}>Difficulty</Text>
                <View style={styles.stars}>
                  {[...Array(5)].map((_, i) => (
                    <FontAwesome
                      key={i}
                      name="star"
                      size={16}
                      color={i < task.difficulty ? '#fff' : '#555'}
                      style={styles.star}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.swipeHint}>
              <Ionicons name="chevron-forward" size={20} color="#F37335" />
              <Text style={styles.swipeText}>Swipe right for options</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Helper to get FontAwesome icon name for metric (in TaskCard)
  const getFontAwesomeIconForMetric = (
    metric: MetricKey
  ): FontAwesomeIconType => {
    switch (metric) {
      case 'wisdom':
        return 'book';
      case 'strength':
        return 'heartbeat';
      case 'focus':
        return 'bullseye';
      case 'confidence':
        return 'trophy';
      case 'discipline':
        return 'clock-o';
      default:
        return 'check-circle';
    }
  };

  // Helper to get Ionicons name for metric
  const getIoniconsForMetric = (metric: MetricKey): any => {
    const icons: Record<MetricKey, string> = {
      wisdom: 'book-outline',
      strength: 'barbell-outline',
      focus: 'eye-outline',
      confidence: 'sunny-outline',
      discipline: 'time-outline',
    };
    return icons[metric];
  };

  // Count completed and skipped tasks
  const completedCount = tasks.filter((t) => t.completed).length;
  const skippedCount = tasks.filter((t) => t.skipped).length;
  const pendingCount = tasks.length - completedCount - skippedCount;

  // Function to calculate overall score
  const calculateOverall = (metrics: Record<MetricKey, number> | undefined) => {
    if (!metrics) return 0;

    return Math.round(
      Object.values(metrics).reduce((sum, value) => sum + value, 0) /
      Object.keys(metrics).length
    );
  };

  // Getting current and before overall scores
  const currentOverall = calculateOverall(afterStats);
  const beforeOverall = calculateOverall(beforeStats);
  const overallImprovement = currentOverall - beforeOverall;

  // Render the Statistics Modal
  const renderStatsModal = () => {
    return (
      <Modal
        transparent={true}
        visible={showStatsModal}
        animationType="none"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalAnimation }] },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowStatsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.modalSubtitle}>
                Today's metrics show your progress after completing tasks
              </Text>

              {/* Overall score card */}
              <View style={styles.overallScoreCard}>
                <View style={styles.scoreHeader}>
                  <Ionicons name="star" size={24} color="#fff" />
                  <Text style={styles.scoreLabel}>Overall</Text>
                </View>
                <Text style={styles.overallScoreValue}>{currentOverall}</Text>
                <View style={styles.scoreBarContainer}>
                  <View
                    style={[
                      styles.scoreBar,
                      { width: `${Math.min(100, currentOverall)}%` },
                    ]}
                  />
                </View>
              </View>

              <Text style={styles.sectionTitle}>Today's Impact</Text>

              {/* Individual metrics cards */}
              <View style={styles.metricsGrid}>
                {Object.entries(afterStats).map(([key, value]) => {
                  const metricKey = key as MetricKey;
                  const beforeValue = beforeStats[metricKey];
                  const improvement = value - beforeValue;

                  return (
                    <View key={key} style={styles.metricCard}>
                      <View style={styles.metricHeader}>
                        <Ionicons
                          name={getIoniconsForMetric(metricKey)}
                          size={24}
                          color="#000"
                        />
                        <Text style={styles.metricLabel}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </Text>
                      </View>
                      <Text style={styles.metricValue}>
                        {Math.round(value)}
                      </Text>
                      <View style={styles.metricBarContainer}>
                        <View
                          style={[
                            styles.metricBar,
                            { width: `${Math.min(100, value)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Add this function to render the welcome screen
  const renderWelcomeScreen = () => {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeIconContainer}>
          <Ionicons name="calendar-outline" size={64} color="#F37335" />
        </View>

        <Text style={styles.welcomeTitle}>Ready to win today?</Text>
        <Text style={styles.welcomeDescription}>
          Get personalized tasks designed to improve your weakest areas while maintaining your strengths.
        </Text>

        <TouchableOpacity
          style={[
            styles.generateTasksButton,
            isGeneratingTasks && styles.generatingTasksButton
          ]}
          onPress={generateDailyTasks}
          disabled={isGeneratingTasks}
        >
          <Text style={styles.generateTasksButtonText}>
            {isGeneratingTasks ? 'Generating Tasks...' : "Generate Today's Tasks"}
          </Text>
          {isGeneratingTasks ? (
            <Ionicons name="hourglass-outline" size={24} color="#fff" style={styles.welcomeButtonIcon} />
          ) : (
            <Ionicons name="rocket-outline" size={24} color="#fff" style={styles.welcomeButtonIcon} />
          )}
        </TouchableOpacity>

        {isGeneratingTasks && (
          <Text style={styles.generatingHint}>
            Analyzing your metrics to create the most effective tasks for you...
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dayCounter}>
          Day {currentDay}/{totalDays}
        </Text>
        <View style={styles.navigationButtons}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton}>
            <FontAwesome name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
            <FontAwesome name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.motivationalText}>You are going to make it.</Text>

      {/* Task Stats - only show when not on welcome screen */}
      {!showWelcomeScreen && (
        <View style={styles.taskStatsContainer}>
          <View style={styles.statsBadge}>
            <Text style={styles.statsText}>To-dos ({pendingCount})</Text>
          </View>
          <View style={[styles.statsBadge, styles.doneBadge]}>
            <Text style={styles.statsText}>Done ({completedCount})</Text>
          </View>
          <View style={[styles.statsBadge, styles.skippedBadge]}>
            <Text style={styles.statsText}>Skipped ({skippedCount})</Text>
          </View>
        </View>
      )}

      {/* Welcome Screen or Task Cards */}
      {showWelcomeScreen ? (
        renderWelcomeScreen()
      ) : (
        <ScrollView style={styles.tasksContainer}>
          {isGeneratingTasks ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Generating personalized tasks...</Text>
              <Text style={styles.loadingSubText}>Analyzing your metrics to create tasks tailored to your needs</Text>
            </View>
          ) : (
            <>
              {tasks.map((task) => (
                // Use a key that includes the completed state to force re-render
                <TaskCard
                  key={`${task.id}-${task.completed ? 'completed' : 'pending'}-${task.skipped ? 'skipped' : 'active'
                    }`}
                  task={task}
                />
              ))}

              {/* If no tasks are available */}
              {tasks.length === 0 && (
                <View style={styles.allDoneContainer}>
                  <Text style={styles.allDoneText}>No tasks available for today</Text>
                  <TouchableOpacity
                    style={styles.generateButton}
                    onPress={generateDailyTasks}
                  >
                    <Text style={styles.generateButtonText}>Generate New Tasks</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Space at the bottom when all tasks are completed */}
              {tasks.length > 0 && tasks.every((t) => t.completed || t.skipped) && (
                <View style={{ height: 20 }} />
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* Stats Button - only show when all tasks are completed */}
      {!showWelcomeScreen && tasks.length > 0 && tasks.every((t) => t.completed || t.skipped) && (
        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => setShowStatsModal(true)}
        >
          <Text style={styles.statsButtonText}>Today's Gains</Text>
          <Ionicons
            name="stats-chart"
            size={20}
            color="#fff"
            style={styles.statsButtonIcon}
          />
        </TouchableOpacity>
      )}

      {/* Render the modal */}
      {renderStatsModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayCounter: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  navigationButtons: {
    flexDirection: 'row',
  },
  navButton: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  motivationalText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  taskStatsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  statsBadge: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  doneBadge: {
    borderColor: '#444',
  },
  skippedBadge: {
    borderColor: '#444',
  },
  statsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tasksContainer: {
    flex: 1,
  },
  taskCardContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  taskCard: {
    backgroundColor: '#e89c3e', // Orange color from the design
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 1,
  },
  taskImageContainer: {
    padding: 16,
    // Add a light gradient overlay on the background
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  taskDescription: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
  },
  taskStats: {
    marginBottom: 16,
  },
  streakText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  repeatText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  difficultyContainer: {
    marginTop: 6,
  },
  difficultyText: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 4,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(243, 115, 53, 0.2)', // F37335 with opacity
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: 'rgba(243, 115, 53, 0.5)',
  },
  swipeText: {
    marginLeft: 8,
    color: '#F37335',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  skipButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
  },
  completeButton: {
    backgroundColor: 'rgba(46, 125, 50, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  allDoneContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  allDoneText: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  statsButton: {
    backgroundColor: '#F37335',
    paddingVertical: 18,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 20,
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  statsButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsButtonIcon: {
    marginLeft: 10,
  },
  statsPanel: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  statsPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsComparison: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsColumn: {
    flex: 1,
  },
  statsColumnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  statName: {
    color: '#bbb',
    fontSize: 14,
  },
  statValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statDiff: {
    color: '#4caf50',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completedTaskCard: {
    backgroundColor: '#2e7d32',
    opacity: 1,
    borderWidth: 2,
    borderColor: '#fff',
  },
  skippedTaskCard: {
    backgroundColor: '#616161',
    opacity: 1,
  },
  completedIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  skippedIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  completedText: {
    color: '#fff',
    opacity: 1,
  },
  skippedText: {
    color: '#ccc',
    opacity: 0.9,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-start',
  },
  modalContainer: {
    backgroundColor: '#111',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: '75%',
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
    marginBottom: 10,
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 16,
  },
  overallScoreCard: {
    backgroundColor: '#F37335',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
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
  overallScoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  improvement: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '48%',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  metricBarContainer: {
    height: 6,
    backgroundColor: '#E5E5E5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsInfoBox: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  statsInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsInfoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsTipsList: {
    marginTop: 8,
  },
  statsTipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  statsTipText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 60,
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingSubText: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    marginTop: 20,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: 18,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  generateTasksButton: {
    backgroundColor: '#F37335',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    marginTop: 20,
  },
  welcomeButtonIcon: {
    marginLeft: 10,
  },
  generateTasksButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  welcomeIconContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 16,
  },
  generatingTasksButton: {
    backgroundColor: '#4a90e2',
  },
  generatingHint: {
    color: '#aaa',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  taskOptionsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '100%',
    paddingLeft: 15,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
  },
  taskOptions: {
    flexDirection: 'column',
    justifyContent: 'center',
    width: 100,
  },
  completeOptionButton: {
    backgroundColor: '#4CAF50', // Green like in statistics/potential-ratings
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: 105, // Slightly increase width to ensure text fits
    height: 90,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipOptionButton: {
    backgroundColor: '#616161', // Grey for skip
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: 105, // Match width with complete button
    height: 90,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  optionButtonText: {
    color: '#fff',
    fontSize: 15, // Slightly larger font
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
    width: '100%', // Ensure text has full width
  },
  optionMetricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 6,
  },
  optionMetricText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});
