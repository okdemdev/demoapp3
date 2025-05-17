import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NoteIcon from '../assets/note-icon';
import { useGlobal } from '../lib/context/GlobalContext';
import quizQuestions from '../lib/quizQuestions';
import { getQuizData, saveQuizAnswer } from '../lib/quizStorage';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questionId = Number(id);
  const question = quizQuestions.find((q) => q.id === questionId);
  const [answer, setAnswer] = useState<string | number>('');
  const [isLoading, setIsLoading] = useState(true);
  const { updateQuizAnswer } = useGlobal();

  // Check if we're on the intro page (id=0)
  const isIntroPage = questionId === 0;
  // Check if we're on a message screen
  const isMessageScreen = question?.type === 'message';

  useEffect(() => {
    // Skip loading previous answer on intro page or message screens
    if (!isIntroPage && !isMessageScreen) {
      loadPreviousAnswer();
    } else {
      setIsLoading(false);
    }
  }, [isIntroPage, isMessageScreen, questionId]);

  const loadPreviousAnswer = async () => {
    const quizData = await getQuizData();
    if (quizData) {
      const previousAnswer = quizData.answers.find(
        (a) => a.questionId === questionId
      );
      if (previousAnswer) {
        setAnswer(previousAnswer.answer);
      } else {
        setAnswer(''); // Reset answer when moving to a new question
      }
    }
    setIsLoading(false);
  };

  if ((!question && !isIntroPage) || isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleNext = async () => {
    try {
      if (isIntroPage) {
        // If on intro page, just move to the first question
        router.push('/quiz/1');
        return;
      }

      // If it's a regular question (not a message screen), save the answer first
      if (!isMessageScreen && answer !== undefined && answer !== '') {
        // Save to both local storage and global context
        await Promise.all([
          saveQuizAnswer(questionId, answer),
          updateQuizAnswer(questionId, answer),
        ]);
      }

      // Then navigate to the next question
      if (questionId < quizQuestions.length) {
        router.push(`/quiz/${questionId + 1}`);
      } else {
        router.push('/onboarding');
      }
    } catch (error) {
      console.error('Error saving quiz answer:', error);
    }
  };

  const handleBack = () => {
    if (questionId > 1) {
      router.push(`/quiz/${questionId - 1}`);
    } else {
      // Go back to intro if on first question
      router.push('/quiz/0');
    }
  };

  // Render intro page content
  const renderIntroPage = () => {
    return (
      <View style={styles.introContainer}>
        <Text style={styles.introTitle}>
          Let's start by understanding more about your situation.
        </Text>

        <NoteIcon width={80} height={80} />

        <Text style={styles.introText}>Answer all questions honestly.</Text>

        <Text style={styles.introText}>
          We will use the answers to design a tailor-made life reset program for
          you.
        </Text>
      </View>
    );
  };

  // Render message screens (testimonial, encouragement, etc.)
  const renderMessageScreen = () => {
    if (!question?.messageContent) return null;

    const { title, text, emoji, testimonial } = question.messageContent;

    return (
      <View style={styles.messageContainer}>
        {emoji && <Text style={styles.messageEmoji}>{emoji}</Text>}

        {title && <Text style={styles.messageTitle}>{title}</Text>}

        {text &&
          text.map((line, index) => (
            <Text
              key={index}
              style={[
                styles.messageText,
                index === 1 && line.includes('315%')
                  ? styles.highlightedText
                  : {},
              ]}
            >
              {line}
            </Text>
          ))}

        {testimonial && (
          <View style={styles.testimonialCard}>
            <Text style={styles.testimonialName}>
              {testimonial.name}, {testimonial.age}
            </Text>
            <Text style={styles.testimonialText}>{testimonial.text}</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.starRating}>
                  ⭐
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderQuestionInput = () => {
    if (!question) return null;

    switch (question.type) {
      case 'scale':
        return (
          <View style={styles.scaleContainer}>
            <Slider
              style={styles.slider}
              minimumValue={question.scaleRange?.min || 1}
              maximumValue={question.scaleRange?.max || 10}
              step={1}
              value={Number(answer) || question.scaleRange?.min || 1}
              onValueChange={(value) => setAnswer(value)}
              minimumTrackTintColor="#ff7300"
              maximumTrackTintColor="#333"
              thumbTintColor="#ff7300"
            />
            <View style={styles.scaleLabels}>
              <Text style={styles.scaleLabel}>
                {question.scaleRange?.minLabel}
              </Text>
              <Text style={styles.scaleLabel}>
                {question.scaleRange?.maxLabel}
              </Text>
            </View>
            <Text style={styles.scaleValue}>
              {answer || question.scaleRange?.min}
            </Text>
          </View>
        );
      case 'multiple_choice':
        return (
          <View style={styles.optionsContainer}>
            {question.options?.map((option, index) => (
              <Pressable
                key={index}
                style={[
                  styles.optionButton,
                  answer === option && styles.optionButtonSelected,
                ]}
                onPress={() => setAnswer(option)}
              >
                {question.emojis && question.emojis[index] && (
                  <Text style={styles.optionEmoji}>
                    {question.emojis[index]}{' '}
                  </Text>
                )}
                <Text
                  style={[
                    styles.optionText,
                    answer === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </View>
        );
      case 'text':
        return (
          <TextInput
            style={styles.textInput}
            value={answer as string}
            onChangeText={setAnswer}
            placeholder="Type your answer here..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );
      default:
        return null;
    }
  };

  // Calculate progress percentage for the progress bar
  const calculateProgress = () => {
    if (isIntroPage) return 0;

    // Count regular questions only (not messages)
    const totalQuestions = quizQuestions.filter(
      (q) => q.type !== 'message'
    ).length;
    const questionsBefore = quizQuestions.filter(
      (q) => q.id < questionId && q.type !== 'message'
    ).length;

    return (questionsBefore / totalQuestions) * 100;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${calculateProgress()}%` }]}
        />
      </View>

      {/* Back Button - only show if not on intro */}
      {!isIntroPage && (
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          (isIntroPage || isMessageScreen) && styles.centeredContent,
        ]}
      >
        {isIntroPage ? (
          renderIntroPage()
        ) : isMessageScreen ? (
          renderMessageScreen()
        ) : (
          <>
            <Text style={styles.question}>{question?.question}</Text>
            {renderQuestionInput()}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={[
            styles.nextButton,
            !isMessageScreen && !isIntroPage && !answer
              ? styles.nextButtonDisabled
              : {},
          ]}
          onPress={handleNext}
          disabled={!isMessageScreen && !isIntroPage && !answer}
        >
          <Text style={styles.nextButtonText}>
            {isIntroPage
              ? 'Got it'
              : questionId === quizQuestions.length
              ? 'Finish'
              : isMessageScreen
              ? 'Continue'
              : 'Next'}
          </Text>
        </Pressable>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  question: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 40,
  },
  introContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  introTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 60,
  },
  introText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  messageEmoji: {
    fontSize: 48,
    marginBottom: 30,
  },
  messageTitle: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  highlightedText: {
    color: '#ff7300',
    fontWeight: 'bold',
  },
  testimonialCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginTop: 30,
    alignItems: 'center',
  },
  testimonialName: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  testimonialText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  starRating: {
    fontSize: 18,
    marginHorizontal: 2,
  },
  scaleContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  scaleLabel: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.7,
  },
  scaleValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '600',
    marginTop: 20,
  },
  optionsContainer: {
    gap: 16,
    width: '100%',
  },
  optionButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#ff7300',
    borderColor: '#ff7300',
  },
  optionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  optionEmoji: {
    fontSize: 20,
    marginRight: 4,
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    minHeight: 120,
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
