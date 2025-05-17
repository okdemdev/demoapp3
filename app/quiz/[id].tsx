import Slider from '@react-native-community/slider';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { quizQuestions } from '../data/quizQuestions';
import { getQuizData, saveQuizAnswer } from '../utils/quizStorage';

export default function QuizScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const questionId = Number(id);
  const question = quizQuestions.find((q) => q.id === questionId);
  const [answer, setAnswer] = useState<string | number>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPreviousAnswer();
  }, []);

  const loadPreviousAnswer = async () => {
    const quizData = await getQuizData();
    if (quizData) {
      const previousAnswer = quizData.answers.find(
        (a) => a.questionId === questionId
      );
      if (previousAnswer) {
        setAnswer(previousAnswer.answer);
      }
    }
    setIsLoading(false);
  };

  if (!question || isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const handleNext = async () => {
    if (answer !== '') {
      await saveQuizAnswer(questionId, answer);
      if (questionId < quizQuestions.length) {
        router.push(`/quiz/${questionId + 1}`);
      } else {
        router.push('/results');
      }
    }
  };

  const renderQuestionInput = () => {
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
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#000000"
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.progress}>
          Question {questionId} of {quizQuestions.length}
        </Text>
        <Text style={styles.question}>{question.question}</Text>
        {renderQuestionInput()}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <Pressable
          style={[styles.nextButton, !answer && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!answer}
        >
          <Text style={styles.nextButtonText}>
            {questionId === quizQuestions.length ? 'Finish' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  progress: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 20,
    opacity: 0.7,
  },
  question: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 30,
  },
  scaleContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
    fontSize: 24,
    fontWeight: '600',
    marginTop: 10,
  },
  optionsContainer: {
    gap: 10,
  },
  optionButton: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
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
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  nextButton: {
    backgroundColor: '#007AFF',
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
