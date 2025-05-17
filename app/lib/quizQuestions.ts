export interface QuizQuestion {
  id: number;
  question: string;
  type: 'scale' | 'multiple_choice' | 'text';
  options?: string[];
  scaleRange?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: 'How would you rate your overall mental well-being right now?',
    type: 'scale',
    scaleRange: {
      min: 1,
      max: 10,
      minLabel: 'Very Poor',
      maxLabel: 'Excellent',
    },
  },
  {
    id: 2,
    question: 'How often do you feel stressed or anxious?',
    type: 'multiple_choice',
    options: ['Rarely or never', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: 3,
    question: 'How many hours of sleep do you typically get each night?',
    type: 'multiple_choice',
    options: [
      'Less than 5 hours',
      '5-6 hours',
      '7-8 hours',
      'More than 8 hours',
    ],
  },
  {
    id: 4,
    question: 'How would you rate your current physical activity level?',
    type: 'scale',
    scaleRange: {
      min: 1,
      max: 10,
      minLabel: 'Very Sedentary',
      maxLabel: 'Very Active',
    },
  },
  {
    id: 5,
    question: "What's the biggest challenge you're currently facing?",
    type: 'text',
  },
  {
    id: 6,
    question: 'How often do you practice self-care activities?',
    type: 'multiple_choice',
    options: ['Never', 'Rarely', 'Sometimes', 'Regularly'],
  },
  {
    id: 7,
    question: 'How would you rate your social connections and support system?',
    type: 'scale',
    scaleRange: {
      min: 1,
      max: 10,
      minLabel: 'Very Isolated',
      maxLabel: 'Very Connected',
    },
  },
];

export default quizQuestions;
