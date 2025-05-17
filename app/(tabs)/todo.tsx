import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';

// Metrics type
type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

// Task interface
interface Task {
  id: string;
  title: string;
  description: string;
  metric: MetricKey;
  points: number;
  streak: number;
  repeat: 'Daily' | 'Weekly' | 'Monthly' | 'Custom';
  difficulty: number; // 1-5
  completed: boolean;
  skipped: boolean;
  image?: any; // Image source for the task
}

// Type for FontAwesome icons we're using
type TaskIcon = 'book' | 'heartbeat' | 'bullseye' | 'trophy' | 'clock-o' | 'check-circle' | 'hand-o-left';

export default function TodoScreen() {
  const insets = useSafeAreaInsets();
  const { userData, toggleTodo, updateMetrics } = useGlobal();
  const [currentDay, setCurrentDay] = useState(10); // Current day counter
  const [totalDays, setTotalDays] = useState(66); // Total days counter
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Define refs at the top level of the component
  const isInitialRender = useRef(true);
  const currentDayChanged = useRef(false);

  // Load current day from AsyncStorage
  useEffect(() => {
    loadDayInfo();
  }, []);

  // Generate daily tasks based on metrics
  useEffect(() => {
    // Only generate tasks on initial render or when day changes
    if (isInitialRender.current) {
      // Initial render - generate tasks
      console.log('🔄 Initial task generation');
      if (userData) {
        generateDailyTasks();
        // Save the current stats as "before" stats
        if (userData.metrics) {
          setBeforeStats({ ...userData.metrics });
          setAfterStats({ ...userData.metrics });
        }
      }
      isInitialRender.current = false;
    } else if (currentDayChanged.current) {
      // Only regenerate on day change
      console.log('🔄 Day changed - regenerating tasks');
      if (userData) {
        generateDailyTasks();
        // Save the current stats as "before" stats
        if (userData.metrics) {
          setBeforeStats({ ...userData.metrics });
          setAfterStats({ ...userData.metrics });
        }
      }
      currentDayChanged.current = false;
    }
  }, [userData]); // Only depend on userData, not currentDay

  // Update currentDayChanged ref when day changes
  useEffect(() => {
    currentDayChanged.current = true;
  }, [currentDay]);

  // Update afterStats whenever metrics change
  useEffect(() => {
    if (userData?.metrics) {
      console.log('📊 Metrics updated, updating afterStats');
      setAfterStats({ ...userData.metrics });
    }
  }, [userData?.metrics]);

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
      await AsyncStorage.setItem('dayTracker', JSON.stringify({
        day,
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving day info:', error);
    }
  };

  const generateDailyTasks = () => {
    console.log('📝 Generating daily tasks');

    const metrics: MetricKey[] = [
      'wisdom',
      'strength',
      'focus',
      'confidence',
      'discipline',
    ];

    // Clear any existing tasks first
    setTasks([]);

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

      console.log(`📋 Created task for ${metric}:`, task.title);
      return task;
    });

    // Set the new tasks
    console.log(`📊 Setting ${newTasks.length} new tasks`);
    setTasks(newTasks);
  };

  // Get task details based on metric
  const getTaskForMetric = (metric: MetricKey, index: number): Partial<Task> => {
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

    // Find the task in our local state
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
      console.error('❌ Task not found:', taskId);
      return;
    }

    const taskToComplete = tasks[taskIndex];
    console.log('📋 Task to complete:', taskToComplete);

    // Create a completely new array (to ensure React detects the change)
    const newTasks = tasks.map(task =>
      task.id === taskId
        ? { ...task, completed: true, skipped: false }
        : { ...task }
    );

    // Set the new tasks array
    console.log('📊 Setting new tasks array');
    console.log('Before update:', tasks.map(t => `${t.title}: ${t.completed ? 'completed' : 'pending'}`));
    console.log('After update:', newTasks.map(t => `${t.title}: ${t.completed ? 'completed' : 'pending'}`));

    setTasks(newTasks);

    // Update the metrics if they exist
    if (userData?.metrics) {
      console.log('📈 Current metrics:', userData.metrics);
      console.log(`📊 Adding ${taskToComplete.points} points to ${taskToComplete.metric}`);

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
  };

  // Skip a task
  const skipTask = (taskId: string) => {
    console.log('Skipping task:', taskId);

    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: false, skipped: true };
      }
      return task;
    });

    setTasks(updatedTasks);
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

  // Task Card Component - completely revised to ensure proper rendering
  const TaskCard = ({ task }: { task: Task }) => {
    console.log(`Rendering task ${task.id}: ${task.completed ? 'COMPLETED' : 'PENDING'}`);

    // For completed tasks, show a different card
    if (task.completed) {
      return (
        <View style={[styles.taskCardContainer]}>
          <View style={[styles.taskCard, styles.completedTaskCard]}>
            <View style={styles.taskImageContainer}>
              <View style={styles.completedIndicator}>
                <FontAwesome name="check-circle" size={24} color="#fff" />
              </View>
              <Text style={[styles.taskTitle, styles.completedText]}>{task.title}</Text>
              <Text style={[styles.taskDescription, styles.completedText]}>
                Completed! +{task.points} {task.metric}
              </Text>
              <View style={styles.taskStats}>
                <Text style={[styles.completedText, { marginTop: 8 }]}>
                  Well done! You've earned {task.points} points for your {task.metric}.
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
              <Text style={[styles.taskTitle, styles.skippedText]}>{task.title}</Text>
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

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Only allow horizontal movement
        pan.setValue({ x: gestureState.dx, y: 0 });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 120) {
          // Swiped right - Complete
          completeTask(task.id);
          Animated.spring(pan, {
            toValue: { x: 400, y: 0 },
            useNativeDriver: true,
          }).start();
        } else if (gestureState.dx < -120) {
          // Swiped left - Skip
          skipTask(task.id);
          Animated.spring(pan, {
            toValue: { x: -400, y: 0 },
            useNativeDriver: true,
          }).start();
        } else {
          // Return to center
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start();
        }
      },
    });

    return (
      <View style={styles.taskCardContainer}>
        <Animated.View
          style={[
            styles.taskCard,
            { transform: [{ translateX: pan.x }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.taskImageContainer}>
            {/* Task Icon */}
            <View style={styles.taskIcon}>
              <FontAwesome name={getIconForMetric(task.metric) as TaskIcon} size={24} color="#fff" />
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
                      color={i < task.difficulty ? "#fff" : "#555"}
                      style={styles.star}
                    />
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.swipeHint}>
              <FontAwesome name="hand-o-left" size={16} color="#fff" />
              <Text style={styles.swipeText}>Swipe to complete or skip</Text>
            </View>

            {/* Direct action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={() => {
                  console.log('🔴 Skip button pressed for task:', task.id);
                  skipTask(task.id);
                }}
              >
                <FontAwesome name="times" size={20} color="#fff" />
                <Text style={styles.buttonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => {
                  console.log('✅ Complete button pressed for task:', task.id);
                  completeTask(task.id);
                }}
              >
                <FontAwesome name="check" size={20} color="#fff" />
                <Text style={styles.buttonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };

  // Helper to get icon name based on metric
  const getIconForMetric = (metric: MetricKey): TaskIcon => {
    switch (metric) {
      case 'wisdom': return 'book';
      case 'strength': return 'heartbeat';
      case 'focus': return 'bullseye';
      case 'confidence': return 'trophy';
      case 'discipline': return 'clock-o';
      default: return 'check-circle';
    }
  };

  // Count completed and skipped tasks
  const completedCount = tasks.filter(t => t.completed).length;
  const skippedCount = tasks.filter(t => t.skipped).length;
  const pendingCount = tasks.length - completedCount - skippedCount;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dayCounter}>Day {currentDay}/{totalDays}</Text>
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

      {/* Task Stats */}
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

      {/* Debug button - only visible in development */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => {
          console.log('📊 Current tasks:', tasks);
          console.log('📈 Current metrics:', userData?.metrics);
          console.log('🔄 Before stats:', beforeStats);
          console.log('🔄 After stats:', afterStats);

          // Force complete the first incomplete task if any exists
          const incompleteTask = tasks.find(t => !t.completed && !t.skipped);
          if (incompleteTask) {
            console.log('🔶 Force completing task:', incompleteTask.id);
            completeTask(incompleteTask.id);
          } else {
            console.log('❌ No incomplete tasks found');
          }
        }}
      >
        <Text style={styles.debugButtonText}>Debug</Text>
      </TouchableOpacity>

      {/* Task Cards */}
      <ScrollView style={styles.tasksContainer}>
        {tasks.map(task => (
          // Use a key that includes the completed state to force re-render
          <TaskCard
            key={`${task.id}-${task.completed ? 'completed' : 'pending'}-${task.skipped ? 'skipped' : 'active'}`}
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

        {/* If all tasks are completed or skipped */}
        {tasks.length > 0 && tasks.every(t => t.completed || t.skipped) && (
          <View style={styles.allDoneContainer}>
            <Text style={styles.allDoneText}>All tasks completed for today!</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateDailyTasks}
            >
              <Text style={styles.generateButtonText}>Generate New Tasks</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Stats Button */}
      <TouchableOpacity
        style={styles.statsButton}
        onPress={() => setShowStats(!showStats)}
      >
        <Text style={styles.statsButtonText}>
          {showStats ? 'Hide Stats' : 'Show Stats'}
        </Text>
      </TouchableOpacity>

      {/* Stats Panel */}
      {showStats && (
        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelTitle}>Stats for Day {currentDay}</Text>
          <View style={styles.statsComparison}>
            <View style={styles.statsColumn}>
              <Text style={styles.statsColumnTitle}>Before</Text>
              {Object.entries(beforeStats).map(([key, value]) => (
                <View key={key} style={styles.statRow}>
                  <Text style={styles.statName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.statValue}>{value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.statsColumn}>
              <Text style={styles.statsColumnTitle}>After</Text>
              {Object.entries(afterStats).map(([key, value]) => (
                <View key={key} style={styles.statRow}>
                  <Text style={styles.statName}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={styles.statValue}>{value}</Text>
                  {value > beforeStats[key as MetricKey] && (
                    <Text style={styles.statDiff}>+{value - beforeStats[key as MetricKey]}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
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
  },
  swipeText: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
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
    backgroundColor: '#4a90e2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: 20,
  },
  statsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
  debugButton: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'center',
    marginBottom: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
