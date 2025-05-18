import { AVPlaybackSource } from 'expo-av';

export interface VideoTheme {
  id: string;
  keywords: string[];
  title: string;
  description: string;
  assetPath: AVPlaybackSource;
}

export const VIDEO_THEMES: VideoTheme[] = [
  {
    id: 'motivation',
    keywords: [
      'motivation',
      'inspire',
      'journey',
      'begin',
      'start',
      'path',
      'future',
      'success',
      'achieve',
      'goals',
      'victory',
      'triumph',
      'accomplish',
    ],
    title: 'Motivational Journey',
    description:
      'A scenic mountain path at sunrise, symbolizing the beginning of a journey',
    assetPath: require('../../assets/videos/motivation.mp4'),
  },
  {
    id: 'growth',
    keywords: [
      'growth',
      'progress',
      'development',
      'improvement',
      'advance',
      'forward',
      'organic',
      'natural',
      'life',
      'change',
    ],
    title: 'Personal Growth',
    description:
      'Time-lapse of natural growth symbolizing personal development',
    assetPath: require('../../assets/videos/growth.mp4'),
  },
  {
    id: 'mindfulness',
    keywords: [
      'mindfulness',
      'meditation',
      'peace',
      'calm',
      'focus',
      'mental',
      'mind',
      'balance',
      'harmony',
      'stability',
      'center',
    ],
    title: 'Mental Clarity',
    description: 'Peaceful meditation scene with calming nature elements',
    assetPath: require('../../assets/videos/mindfulness.mp4'),
  },
  {
    id: 'strength',
    keywords: [
      'strength',
      'power',
      'exercise',
      'fitness',
      'workout',
      'strong',
      'physical',
      'health',
      'energy',
      'vitality',
    ],
    title: 'Physical Strength',
    description: 'Athletic training montage showing dedication and strength',
    assetPath: require('../../assets/videos/strength.mp4'),
  },
  {
    id: 'connection',
    keywords: [
      'connection',
      'social',
      'community',
      'together',
      'team',
      'relationship',
      'support',
      'communication',
      'collaboration',
      'unity',
    ],
    title: 'Social Connection',
    description: 'People connecting and supporting each other',
    assetPath: require('../../assets/videos/connection.mp4'),
  },
];

export function findBestMatchingVideo(script: string): VideoTheme {
  const scriptLower = script.toLowerCase();

  // Count keyword matches for each theme
  const matchCounts = VIDEO_THEMES.map((theme) => ({
    theme,
    matches: theme.keywords.filter((keyword) => scriptLower.includes(keyword))
      .length,
  }));

  // Sort by number of matches (descending)
  matchCounts.sort((a, b) => b.matches - a.matches);

  // Return the theme with the most matches, or the first theme if no matches
  return matchCounts[0].matches > 0 ? matchCounts[0].theme : VIDEO_THEMES[0];
}
