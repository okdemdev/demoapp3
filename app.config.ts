import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'LifeGuide',
  slug: 'lifeguide',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1a1a1a',
  },
  extra: {
    openaiApiKey: process.env.OPENAI_API_KEY,
  },
  plugins: ['expo-router'],
});
