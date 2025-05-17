import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// Custom Sun Logo component
const SunLogo = ({ size = 64 }) => (
  <Svg width={size} height={size / 2} viewBox="0 0 64 32" fill="none">
    <Path d="M32 0C24 0 16 8 16 16H48C48 8 40 0 32 0Z" fill="white" />
    <Path d="M16 16H8C8 24 16 32 16 32V16Z" fill="white" />
    <Path d="M48 16H56C56 24 48 32 48 32V16Z" fill="white" />
    <Path d="M20 16H24V32H20V16Z" fill="white" />
    <Path d="M28 16H32V32H28V16Z" fill="white" />
    <Path d="M36 16H40V32H36V16Z" fill="white" />
    <Path d="M44 16H48V32H44V16Z" fill="white" />
  </Svg>
);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Typing effect state
  const phrases = [
    'Welcome to Rise.',
    'Ready to start your life reset journey?',
    'Your next 66 days will be the most transformative period of your life ever.',
  ];
  const [displayedText, setDisplayedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const typingTimerRef = useRef(null);

  // Simple animation to fade between screens
  const fadeToNextScreen = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        delay: 100,
      }),
    ]).start();
  };

  // Typing animation
  const startTypingAnimation = (text: string) => {
    let index = 0;
    setDisplayedText('');
    setTypingComplete(false);

    const typeChar = () => {
      if (index <= text.length) {
        // Use slice instead of appending to avoid missing characters
        setDisplayedText(text.slice(0, index));

        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); // Ignore errors

        index++;
        typingTimerRef.current = setTimeout(typeChar, 70) as any;
      } else {
        setTypingComplete(true);
        typingTimerRef.current = null;
      }
    };

    // Start typing after a short delay
    typingTimerRef.current = setTimeout(typeChar, 400) as any;
  };

  // Clean up any timers when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    };
  }, []);

  // Start typing animation when component mounts or screen changes
  useEffect(() => {
    startTypingAnimation(phrases[currentScreen]);
  }, [currentScreen]);

  // Handle continue button press
  const handleContinue = () => {
    // Clean up any existing animation
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    if (currentScreen < 2) {
      fadeToNextScreen();
      setTimeout(() => {
        setCurrentScreen((prevScreen) => prevScreen + 1);
      }, 300); // Wait for fade out before changing screen
    } else {
      // Navigate to quiz page - start with intro page
      console.log('Navigating to quiz');
      router.push('/quiz/0');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.bgGradient} />

      <Animated.View style={[styles.centeredContent, { opacity: fadeAnim }]}>
        {/* Logo/Icon */}
        <SunLogo size={64} />

        {/* Text with typing effect */}
        <Text style={styles.typingText}>{displayedText}</Text>

        {/* Card on third screen */}
        {currentScreen === 2 && (
          <View style={styles.cardPlaceholder}>
            <SunLogo size={32} />
            <Text style={styles.cardTitle}>66 days</Text>
            <Text style={styles.cardSubtitle}>life reset program</Text>

            <View style={styles.grid}>
              {Array(66)
                .fill(0)
                .map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.gridItem,
                      Math.random() > 0.7 ? styles.gridItemHighlighted : {},
                    ]}
                  />
                ))}
            </View>

            <Text style={styles.cardDate}>17 May 2025</Text>
          </View>
        )}

        {/* Continue Button - show when typing is complete */}
        {typingComplete && (
          <React.Fragment>
            <Pressable style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>
                {currentScreen < 2 ? 'Continue' : 'Start Now'}
              </Text>
            </Pressable>

            {currentScreen === 2 && (
              <Pressable
                style={[styles.button, styles.resultsButton]}
                onPress={() => router.push('/results')}
              >
                <Text style={styles.buttonText}>View Results</Text>
              </Pressable>
            )}
          </React.Fragment>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    position: 'relative',
  },
  bgGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    opacity: 0.95,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  typingText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 32,
    minHeight: 80,
  },
  cardPlaceholder: {
    width: 280,
    height: 380,
    borderRadius: 20,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#ffb347',
    fontWeight: '600',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
  },
  gridItem: {
    width: 16,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: 3,
    borderRadius: 2,
  },
  gridItemHighlighted: {
    backgroundColor: '#3a7bd5',
  },
  cardDate: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#ff7300',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resultsButton: {
    backgroundColor: '#3a7bd5',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
