import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';
import { HabitsQuestion, habitsQuestions } from '../lib/habitsQuestions';
import { markHabitsCompleted } from '../lib/habitsStorage';

// Icons mapping based on habit type
const HabitIcon = ({ name, selected }: { name: string; selected: boolean }) => {
  const iconMapping: { [key: string]: string } = {
    'Wake up early': 'alarm-outline',
    Run: 'walk-outline',
    'Gym workout': 'barbell-outline',
    'Sit up': 'body-outline',
    'Push up': 'fitness-outline',
    'Drink water': 'water-outline',
    'Screentime limit': 'phone-portrait-outline',
    'Cold shower': 'snow-outline',
  };

  const iconName = iconMapping[name] || 'help-outline';
  const color = selected ? '#fff' : 'rgba(255,255,255,0.6)';

  return <Ionicons name={iconName as any} size={22} color={color} />;
};

export default function HabitsQuizScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const questionIndex = parseInt(id || '0', 10);
  const { userData, updateHabitsAnswer } = useGlobal();
  const insets = useSafeAreaInsets();
  const [selectedValue, setSelectedValue] = useState<number | null>(1); // Default to 1 instead of null
  const [isNavigating, setIsNavigating] = useState(false);

  // DEBUG: Log the question IDs to verify all questions are present
  useEffect(() => {
    console.log(
      'All habit questions:',
      habitsQuestions.map((q) => `ID: ${q.id} - ${q.question}`)
    );
    console.log('Current question ID from URL:', id);
  }, []);

  // Find the current question by ID
  const currentQuestion: HabitsQuestion =
    habitsQuestions.find((q) => q.id === parseInt(id || '0', 10)) ||
    habitsQuestions[0]; // Fallback to first question if ID not found

  // Get the index to determine if this is the last question
  const currentIndex = habitsQuestions.findIndex(
    (q) => q.id === currentQuestion.id
  );
  const isLastQuestion = currentIndex === habitsQuestions.length - 1;

  // DEBUG: Log the current question and position
  useEffect(() => {
    console.log(
      `Current question: ID ${currentQuestion.id}, Index ${currentIndex}, Question: ${currentQuestion.question}`
    );
    console.log(`Is last question: ${isLastQuestion}`);
  }, [currentQuestion]);

  // Animated values setup for slider
  const screenWidth = Dimensions.get('window').width;
  const sliderWidth = screenWidth - 80; // Accounting for container padding
  const [sliderPosition] = useState(new Animated.Value(0));

  useEffect(() => {
    // Always ensure a default value is set
    let value = 1; // Default value (first position)
    let position = 0; // Default position (beginning of slider)

    // Check if there's already an answer for this question
    if (userData && userData.habits?.answers) {
      const existingAnswer = userData.habits.answers.find(
        (a) => a.questionId === currentQuestion.id
      );
      if (existingAnswer && typeof existingAnswer.answer === 'number') {
        value = existingAnswer.answer;
        // Set slider position based on existing answer
        position =
          ((existingAnswer.answer - 1) /
            ((currentQuestion.sliderOptions?.labels?.length || 5) - 1)) *
          sliderWidth;
      }
    }

    // Always set both values to ensure we have valid data
    setSelectedValue(value);
    sliderPosition.setValue(position);

    console.log(`Question ${currentQuestion.id}: Set default value to ${value}`);
  }, [questionIndex, userData, currentQuestion, sliderWidth]);

  // Calculate progress for the top bar
  const totalQuestions = habitsQuestions.length;
  const progress = (currentIndex + 1) / totalQuestions;

  const handleSliderChange = (position: number) => {
    // Ensure position is within bounds
    const clampedPosition = Math.max(0, Math.min(position, sliderWidth));

    // Calculate which step the user is closest to
    const totalOptions = currentQuestion.sliderOptions?.labels?.length || 5;
    const stepWidth = sliderWidth / (totalOptions - 1);
    let step = Math.round(clampedPosition / stepWidth) + 1;

    // Ensure step is valid
    step = Math.max(1, Math.min(totalOptions, step));

    if (step !== selectedValue) {
      setSelectedValue(step);

      // Calculate precise position for this step
      const snappedPosition = (step - 1) * stepWidth;
      sliderPosition.setValue(snappedPosition);
    }
  };

  const handleConfirm = async () => {
    if (selectedValue !== null) {
      try {
        setIsNavigating(true);

        // Save the current answer
        await updateHabitsAnswer(currentQuestion.id, selectedValue);

        // Get the next question ID (not index)
        const nextID =
          currentIndex < habitsQuestions.length - 1
            ? habitsQuestions[currentIndex + 1].id
            : null;

        // If this is the last question, mark habits as completed and verify data
        if (!nextID) {
          // Mark habits as completed
          await markHabitsCompleted();

          // Wait for 2 seconds to ensure data is saved
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Verify the data exists before proceeding
          const verifyData = await AsyncStorage.getItem(
            '@lifeguide_habits_data'
          );
          if (!verifyData) {
            throw new Error('Habits data not saved properly');
          }
        }

        // DEBUG: Show what we're going to do next
        console.log(`Current ID: ${currentQuestion.id}, Next ID: ${nextID}`);

        if (nextID !== null) {
          console.log(`Navigating to question ${nextID}`);
          router.push(`/habits/${nextID}`);
        } else {
          console.log('Navigating to results page');
          router.push('/results');
        }
      } catch (error) {
        console.error('Error during navigation:', error);
        Alert.alert(
          'Error',
          'There was an error saving your progress. Please try again.',
          [{ text: 'OK' }]
        );
      } finally {
        setIsNavigating(false);
      }
    }
  };

  const handleGoBack = () => {
    // Find the current question's position based on ID
    const allIds = habitsQuestions.map((q) => q.id);
    const currentIdIndex = allIds.indexOf(currentQuestion.id);

    if (currentIdIndex > 0) {
      // Get the previous question's ID
      const prevQuestionId = habitsQuestions[currentIdIndex - 1]?.id;
      if (prevQuestionId) {
        router.push(`/habits/${prevQuestionId}`);
      } else {
        // Fallback to onboarding if no previous question
        router.back();
      }
    } else {
      // Go back to previous screen (likely onboarding or welcome)
      router.back();
    }
  };

  // Get the current selected label
  const selectedLabel =
    currentQuestion.sliderOptions?.labels[
    selectedValue ? selectedValue - 1 : 0
    ] || '';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>

      {/* Debug button - show question indices */}
      <TouchableOpacity
        style={styles.debugButton}
        onPress={() => {
          const questionInfo = habitsQuestions
            .map(
              (q, i) =>
                `Question ${i + 1}: ID=${q.id}, ${q.question.substring(
                  0,
                  20
                )}...`
            )
            .join('\n');
          Alert.alert(
            'Habit Questions',
            `Current: ID=${currentQuestion.id}, Index=${currentIndex}\n\n${questionInfo}`
          );
        }}
      >
        <Text style={styles.debugButtonText}>🐞</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.scrollContent}>
        {/* Question */}
        <Text style={styles.question}>{currentQuestion.question}</Text>

        {/* Habit icons grid */}
        <View style={styles.iconsGrid}>
          {currentQuestion.icons?.map((icon, index) => {
            // Determine which icon to highlight based on current question ID
            const iconNameToHighlight =
              {
                1: 'Wake up early',
                2: 'Run',
                3: 'Gym workout',
                4: 'Sit up',
                5: 'Push up',
                6: 'Drink water',
                7: 'Screentime limit',
                8: 'Cold shower',
              }[currentQuestion.id] || '';

            const isSelected = icon === iconNameToHighlight;

            return (
              <View
                key={index}
                style={[styles.iconItem, isSelected && styles.iconItemSelected]}
              >
                <HabitIcon name={icon} selected={isSelected} />
                <Text
                  style={[
                    styles.iconLabel,
                    isSelected && styles.iconLabelSelected,
                  ]}
                >
                  {icon}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Selected value label */}
        <Text style={styles.scaleValue}>{selectedLabel}</Text>

        {/* Custom slider - rebuilt from scratch */}
        <View style={styles.sliderContainer}>
          {/* Base track line */}
          <View style={styles.sliderTrack} />

          {/* Tick marks */}
          {currentQuestion.sliderOptions?.labels?.map((_, index) => {
            const totalOptions =
              currentQuestion.sliderOptions?.labels?.length || 5;
            const percentage = index * (100 / (totalOptions - 1));
            return (
              <View
                key={index}
                style={[styles.sliderTick, { left: `${percentage}%` as any }]}
              />
            );
          })}

          {/* Draggable thumb */}
          <Animated.View
            style={[styles.sliderThumb, { left: sliderPosition }]}
          />

          {/* Touch area - full width transparent overlay */}
          <View
            style={styles.touchArea}
            onTouchStart={(e) => {
              const { locationX } = e.nativeEvent;
              handleSliderChange(locationX);
            }}
            onTouchMove={(e) => {
              const { locationX } = e.nativeEvent;
              handleSliderChange(locationX);
            }}
          />
        </View>
      </View>

      {/* Footer with Confirm button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            (selectedValue === null || isNavigating) &&
            styles.nextButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={selectedValue === null || isNavigating}
        >
          <Text style={styles.nextButtonText}>
            {isNavigating
              ? 'Please wait...'
              : isLastQuestion
                ? 'Finish'
                : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#2a2a2a',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff7300',
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  debugButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 20,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    flex: 1,
  },
  question: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  iconItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  iconItemSelected: {
    backgroundColor: 'rgba(255, 115, 0, 0.2)',
  },
  iconLabel: {
    color: 'white',
    marginLeft: 12,
    fontSize: 16,
  },
  iconLabelSelected: {
    color: '#ff7300',
    fontWeight: '600',
  },
  scaleValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  sliderContainer: {
    width: '100%',
    height: 30,
    position: 'relative',
    marginBottom: 20,
    justifyContent: 'center',
  },
  sliderTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#333',
    top: 14, // Center vertically in the container
  },
  sliderTick: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555',
    top: 12, // Center with the track (14 - 1 = 13, 13 - 3 = 10)
    marginLeft: -3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff7300',
    top: 1, // Center with the track
    marginLeft: -14, // Center the thumb horizontally
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  touchArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: 20,
    backgroundColor: '#111',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  nextButton: {
    backgroundColor: '#ff7300',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
