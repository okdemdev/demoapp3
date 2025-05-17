export interface QuizQuestion {
  id: number;
  question: string;
  type: 'scale' | 'multiple_choice' | 'text' | 'message';
  options?: string[];
  emojis?: string[]; // Optional emojis for options
  messageType?: 'motivation' | 'testimonial' | 'encouragement';
  messageContent?: {
    title?: string;
    text?: string[];
    emoji?: string;
    stats?: string;
    testimonial?: {
      name: string;
      age: number;
      text: string;
    };
  };
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
    question: 'How old are you?',
    type: 'multiple_choice',
    options: [
      '13 to 17',
      '18 to 24',
      '25 to 34',
      '35 to 44',
      '45 to 54',
      '55 or above',
    ],
  },
  {
    id: 2,
    question: 'What is your gender?',
    type: 'multiple_choice',
    options: ['Male', 'Female', 'Other'],
  },
  {
    id: 3,
    question: 'How would you describe your current life?',
    type: 'multiple_choice',
    options: [
      "I'm satisfied with my life now",
      "I'm alright and want to self-improve",
      "I'm doing okay, not good or bad",
      "I'm often sad and rarely happy",
      "I'm at the lowest and need help",
    ],
    emojis: ['😊', '🙂', '👌', '😔', '😞'],
  },
  {
    id: 4,
    question: 'What is the biggest reason you want to reset your life?',
    type: 'multiple_choice',
    options: [
      'Fix my bad habits and discipline',
      'Improve my study and career',
      'Improve physical health and look',
      'Fix my broken mental health',
      'Overcome major life setbacks',
      'Win back my failed life',
    ],
    emojis: ['🛏️', '📚', '💪', '❤️‍🩹', '💔', '🏔️'],
  },
  {
    id: 5,
    type: 'message',
    question: '',
    messageType: 'testimonial',
    messageContent: {
      emoji: '🙌',
      title: "After 66 days, you'll overcome the setback.",
      text: [
        'The average Rise male members between 13 to 17 years old showed',
        '315% improvement in physical, mental well-being and focus',
        'after joining Rise.',
      ],
      testimonial: {
        name: 'Liam',
        age: 16,
        text: "Rise has been a game-changer for me. It's helped me stay focused on my goals and build better habits, even with school and sports. I feel more confident and organized every day.",
      },
    },
  },
  {
    id: 6,
    question: "What's the last time you were proud of yourself?",
    type: 'multiple_choice',
    options: [
      'Just today',
      'Few days ago',
      'Few weeks ago',
      'Few months ago',
      "Too long I can't remember",
    ],
  },
  {
    id: 7,
    question: 'What gets you out of bed every morning?',
    type: 'multiple_choice',
    options: [
      'Make money to support my needs',
      'To not get fired or expelled',
      'To provide for my family',
      'Achieve my goals and dreams',
      "I don't really know",
      'None of the above',
    ],
  },
  {
    id: 8,
    question: 'Would you say you are addicted to any one of the below?',
    type: 'multiple_choice',
    options: [
      'Smoking',
      'Vaping',
      'Fap',
      'Alcohol',
      'None of the above',
      'More than one of the above',
    ],
  },
  {
    id: 9,
    type: 'message',
    question: '',
    messageType: 'encouragement',
    messageContent: {
      title: "I'm proud of you for wanting to make changes.",
      emoji: '🔥',
      text: [
        'The first step is always to face your problems.',
        "Let's understand more about your challenges from a scientific way, and see how our life reset program can help.",
      ],
    },
  },
  {
    id: 10,
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
    id: 11,
    question: 'How often do you feel stressed or anxious?',
    type: 'multiple_choice',
    options: ['Rarely or never', 'Sometimes', 'Often', 'Almost always'],
  },
  {
    id: 12,
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
    id: 13,
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
    id: 14,
    question: "What's the biggest challenge you're currently facing?",
    type: 'text',
  },
  {
    id: 15,
    question: 'How often do you practice self-care activities?',
    type: 'multiple_choice',
    options: ['Never', 'Rarely', 'Sometimes', 'Regularly'],
  },
  {
    id: 16,
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
