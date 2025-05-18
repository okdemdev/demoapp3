export interface HabitsQuestion {
  id: number;
  question: string;
  type: 'slider' | 'multiple_choice';
  options?: string[];
  emojis?: string[];
  icons?: string[]; // For icons like gym, run, etc.
  sliderOptions?: {
    min: number;
    max: number;
    labels: string[];
  };
}

export const habitsQuestions: HabitsQuestion[] = [
  {
    id: 1,
    question: 'What time usually do you wake up at right now?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: [
        '7AM or earlier',
        'Between 7 to 7:59 AM',
        'Between 8 to 8:59 AM',
        'Between 9 to 9:59 AM',
        '10AM or later',
      ],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 2,
    question: 'How much do you usually run in a week?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: [
        "I don't run",
        'Less than 5km',
        '5-10km',
        '10-20km',
        'More than 20km',
      ],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 3,
    question: 'How often do you go to the gym?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: [
        'Never',
        '1-2 times a month',
        '1-2 times a week',
        '3-4 times a week',
        '5+ times a week',
      ],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 4,
    question: 'How many sit-ups can you do in one set?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: ['None', '1-10', '11-20', '21-30', 'More than 30'],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 5,
    question: 'How many push-ups can you do in one set?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: ['None', '1-5', '6-10', '11-20', 'More than 20'],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 6,
    question: 'How many glasses of water do you drink daily?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: [
        'Less than 2',
        '2-4 glasses',
        '5-6 glasses',
        '7-8 glasses',
        'More than 8',
      ],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 7,
    question: 'How much daily screen time do you have?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: [
        'Less than 1 hour',
        '1-3 hours',
        '4-6 hours',
        '7-9 hours',
        'More than 9 hours',
      ],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
  {
    id: 8,
    question: 'How often do you take cold showers?',
    type: 'slider',
    sliderOptions: {
      min: 1,
      max: 5,
      labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Daily'],
    },
    icons: [
      'Wake up early',
      'Run',
      'Gym workout',
      'Sit up',
      'Push up',
      'Drink water',
      'Screentime',
      'Cold shower',
    ],
  },
];

export default habitsQuestions;
