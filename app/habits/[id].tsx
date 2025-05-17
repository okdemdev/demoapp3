import { Ionicons } from '@expo/vector-icons';
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
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from '../lib/context/GlobalContext';
import { HabitsQuestion, habitsQuestions } from '../lib/habitsQuestions';

// Icons mapping based on habit type
const HabitIcon = ({ name, selected }: { name: string; selected: boolean }) => {
    const iconMapping: { [key: string]: string } = {
        'Wake up early': 'alarm-outline',
        'Run': 'walk-outline',
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
    const [selectedValue, setSelectedValue] = useState<number | null>(null);

    // DEBUG: Log the question IDs to verify all questions are present
    useEffect(() => {
        console.log('All habit questions:', habitsQuestions.map(q => `ID: ${q.id} - ${q.question}`));
        console.log('Current question ID from URL:', id);
    }, []);

    // Find the current question by ID
    const currentQuestion: HabitsQuestion = habitsQuestions.find(
        q => q.id === parseInt(id || '0', 10)
    ) || habitsQuestions[0];

    // Get the index to determine if this is the last question
    const currentIndex = habitsQuestions.findIndex(q => q.id === currentQuestion.id);
    const isLastQuestion = currentIndex === habitsQuestions.length - 1;

    // DEBUG: Log the current question and position
    useEffect(() => {
        console.log(`Current question: ID ${currentQuestion.id}, Index ${currentIndex}, Question: ${currentQuestion.question}`);
        console.log(`Is last question: ${isLastQuestion}`);
    }, [currentQuestion]);

    const screenWidth = Dimensions.get('window').width;
    const sliderWidth = screenWidth - 80;
    const [sliderPosition] = useState(new Animated.Value(0));

    useEffect(() => {
        // Check if there's already an answer for this question
        if (userData && userData.habits?.answers) {
            const existingAnswer = userData.habits.answers.find(
                (a) => a.questionId === currentQuestion.id
            );
            if (existingAnswer && typeof existingAnswer.answer === 'number') {
                setSelectedValue(existingAnswer.answer);
                // Set slider position based on existing answer
                const newPosition = ((existingAnswer.answer - 1) /
                    (currentQuestion.sliderOptions?.labels.length || 5 - 1)) * sliderWidth;
                sliderPosition.setValue(newPosition);
            } else {
                // Reset to first position by default
                setSelectedValue(1);
                sliderPosition.setValue(0);
            }
        }
    }, [questionIndex, userData, currentQuestion]);

    // Calculate progress for the top bar
    const totalQuestions = habitsQuestions.length;
    const progress = (currentIndex + 1) / totalQuestions;

    const handleSliderChange = (position: number) => {
        // Handle positioning
        const totalSteps = currentQuestion.sliderOptions?.labels.length || 5;
        const stepWidth = sliderWidth / (totalSteps - 1);

        // Calculate which step the user is closest to
        let step = Math.round(position / stepWidth) + 1;

        // Make sure step is valid (between 1 and max)
        step = Math.max(1, Math.min(totalSteps, step));

        // Only update if different to avoid unnecessary re-renders
        if (step !== selectedValue) {
            setSelectedValue(step);

            // Animate to the correct position for this step
            const newPosition = (step - 1) * stepWidth;
            Animated.spring(sliderPosition, {
                toValue: newPosition,
                useNativeDriver: false,
                friction: 8,
                tension: 40,
            }).start();
        }
    };

    const handleConfirm = async () => {
        if (selectedValue !== null) {
            await updateHabitsAnswer(currentQuestion.id, selectedValue);

            // Get the next question ID (not index)
            const nextID = currentIndex < habitsQuestions.length - 1
                ? habitsQuestions[currentIndex + 1].id
                : null;

            // DEBUG: Show what we're going to do next
            console.log(`Current ID: ${currentQuestion.id}, Next ID: ${nextID}`);

            if (nextID) {
                console.log(`Navigating to question ${nextID}`);
                // Direct navigation to next ID
                router.push(`/habits/${nextID}`);
            } else {
                console.log('Navigating to results page');
                router.push('/results');
            }
        }
    };

    const handleGoBack = () => {
        // Find the current question's position based on ID
        const allIds = habitsQuestions.map(q => q.id);
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
    const selectedLabel = currentQuestion.sliderOptions?.labels[selectedValue ? selectedValue - 1 : 0] || '';

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View
                    style={[
                        styles.progressBar,
                        { width: `${progress * 100}%` }
                    ]}
                />
            </View>

            {/* Debug button - show question indices */}
            <TouchableOpacity
                style={styles.debugButton}
                onPress={() => {
                    const questionInfo = habitsQuestions.map(
                        (q, i) => `Question ${i + 1}: ID=${q.id}, ${q.question.substring(0, 20)}...`
                    ).join('\n');
                    Alert.alert(
                        'Habit Questions',
                        `Current: ID=${currentQuestion.id}, Index=${currentIndex}\n\n${questionInfo}`
                    );
                }}
            >
                <Text style={styles.debugButtonText}>🐞</Text>
            </TouchableOpacity>

            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
            >
                <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>

            <View style={styles.scrollContent}>
                {/* Question */}
                <Text style={styles.question}>{currentQuestion.question}</Text>

                {/* Habit icons grid */}
                <View style={styles.iconsGrid}>
                    {currentQuestion.icons?.map((icon, index) => {
                        // Determine which icon to highlight based on current question ID
                        const iconNameToHighlight = {
                            1: 'Wake up early',
                            2: 'Run',
                            3: 'Gym workout',
                            4: 'Sit up',
                            5: 'Push up',
                            6: 'Drink water',
                            7: 'Screentime limit',
                            8: 'Cold shower'
                        }[currentQuestion.id] || '';

                        const isSelected = icon === iconNameToHighlight;

                        return (
                            <View key={index} style={[
                                styles.iconItem,
                                isSelected && styles.iconItemSelected
                            ]}>
                                <HabitIcon
                                    name={icon}
                                    selected={isSelected}
                                />
                                <Text style={[
                                    styles.iconLabel,
                                    isSelected && styles.iconLabelSelected
                                ]}>{icon}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Selected value label */}
                <Text style={styles.scaleValue}>{selectedLabel}</Text>

                {/* Custom slider */}
                <View
                    style={styles.sliderContainer}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                        const { locationX } = e.nativeEvent;
                        handleSliderChange(locationX);
                    }}
                    onResponderMove={(e) => {
                        const { locationX } = e.nativeEvent;
                        handleSliderChange(locationX);
                    }}
                >
                    <View style={styles.sliderTrack} />
                    <Animated.View
                        style={[styles.sliderThumb, { left: sliderPosition }]}
                    />
                </View>
            </View>

            {/* Footer with Confirm button */}
            <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
                <TouchableOpacity
                    style={[
                        styles.nextButton,
                        selectedValue === null && styles.nextButtonDisabled
                    ]}
                    onPress={handleConfirm}
                    disabled={selectedValue === null}
                >
                    <Text style={styles.nextButtonText}>
                        {isLastQuestion ? 'Finish' : 'Next'}
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
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    sliderTrack: {
        width: '100%',
        height: 2,
        backgroundColor: '#333',
        position: 'absolute',
    },
    sliderThumb: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#ff7300',
        position: 'absolute',
        top: 6,
        marginLeft: -14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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