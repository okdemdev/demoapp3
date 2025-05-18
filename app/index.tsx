import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Gyroscope } from 'expo-sensors';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

// New Rising Sun Logo
const RisingSunLogo = ({ size = 64, glowing = false }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
    <Defs>
      {glowing && (
        <RadialGradient id="glowGradient" cx="32" cy="32" r="32" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FF7300" stopOpacity="0.8" />
          <Stop offset="1" stopColor="#FF7300" stopOpacity="0" />
        </RadialGradient>
      )}
    </Defs>

    {glowing && <Circle cx="32" cy="32" r="32" fill="url(#glowGradient)" />}

    <Circle cx="32" cy="28" r="16" fill="#FF7300" />
    <Path d="M16 32C16 32 20 40 32 40C44 40 48 32 48 32" stroke="white" strokeWidth="3" />
    <Path d="M12 38L16 32" stroke="white" strokeWidth="3" />
    <Path d="M52 38L48 32" stroke="white" strokeWidth="3" />
    <Path d="M22 48L26 42" stroke="white" strokeWidth="3" />
    <Path d="M42 48L38 42" stroke="white" strokeWidth="3" />
  </Svg>
);

// Grid component for the card
const RetroGrid = ({ width, height }: { width: number, height: number }) => (
  <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.gridSvg}>
    <Defs>
      <SvgLinearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <Stop offset="0%" stopColor="#f0f" stopOpacity="0.1" />
        <Stop offset="100%" stopColor="#ff7300" stopOpacity="0.5" />
      </SvgLinearGradient>
    </Defs>

    {/* Horizontal lines */}
    {Array.from({ length: 15 }).map((_, i) => (
      <Path
        key={`h-${i}`}
        d={`M0 ${(i + 1) * (height / 15)} H${width}`}
        stroke="url(#gridGradient)"
        strokeWidth="1"
      />
    ))}

    {/* Vertical lines */}
    {Array.from({ length: 10 }).map((_, i) => (
      <Path
        key={`v-${i}`}
        d={`M${(i + 1) * (width / 10)} 0 V${height}`}
        stroke="url(#gridGradient)"
        strokeWidth="1"
      />
    ))}
  </Svg>
);

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const [currentScreen, setCurrentScreen] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { width: screenWidth } = Dimensions.get('window');

  // Animation values for 3D card effect
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const cardRotateX = useRef(new Animated.Value(0)).current;
  const cardRotateY = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const [subscriptionGyro, setSubscriptionGyro] = useState(null);

  // Background animation
  const gradientPosition = useRef(new Animated.Value(0)).current;
  const sunrisePosition = useRef(new Animated.Value(-50)).current;

  // Typing effect state
  const phrases = [
    'Welcome to I.R.I.S.E.',
    'Ready to transform your life?',
    'We\'ve created your personal invitation to change.',
  ];
  const [displayedText, setDisplayedText] = useState('');
  const [typingComplete, setTypingComplete] = useState(false);
  const typingTimerRef = useRef(null);

  // Start background animations
  useEffect(() => {
    // Animate gradient
    Animated.loop(
      Animated.timing(gradientPosition, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();

    // Animate sunrise
    Animated.timing(sunrisePosition, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Subscribe to gyroscope for 3D card effect
  useEffect(() => {
    if (currentScreen === 2) {
      // Set up gyroscope for 3D effect
      const subscription = Gyroscope.addListener((data) => {
        setGyroData(data);
        // Map gyroscope data to rotation values (limited range)
        const maxRotation = 10;
        cardRotateX.setValue(Math.min(Math.max(-maxRotation, data.x * 5), maxRotation));
        cardRotateY.setValue(Math.min(Math.max(-maxRotation, data.y * 5), maxRotation));
      });

      // Use as any to avoid TypeScript errors with the subscription
      setSubscriptionGyro(subscription as any);

      Gyroscope.setUpdateInterval(100); // Update every 100ms

      // Animate card entrance
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }

    return () => {
      if (subscriptionGyro) {
        // Use a try-catch block to safely call remove
        try {
          if (typeof subscriptionGyro.remove === 'function') {
            subscriptionGyro.remove();
          }
        } catch (error) {
          console.log('Error removing gyroscope subscription', error);
        }
      }
    };
  }, [currentScreen]);

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

  // Typing animation - faster now (40ms instead of 70ms)
  const startTypingAnimation = (text: string) => {
    let index = 0;
    setDisplayedText('');
    setTypingComplete(false);

    const typeChar = () => {
      if (index <= text.length) {
        // Use slice instead of appending to avoid missing characters
        setDisplayedText(text.slice(0, index));

        // Trigger haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { }); // Ignore errors

        index++;
        typingTimerRef.current = setTimeout(typeChar, 40) as any; // Faster typing
      } else {
        setTypingComplete(true);
        typingTimerRef.current = null;
      }
    };

    // Start typing after a short delay
    typingTimerRef.current = setTimeout(typeChar, 200) as any; // Shorter delay
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

      {/* Animated background */}
      <Animated.View style={[
        styles.bgAnimated,
        {
          transform: [
            {
              translateY: gradientPosition.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -200]
              })
            }
          ]
        }
      ]}>
        <LinearGradient
          colors={['#111', '#300', '#f70', '#f0f']}
          style={styles.fullSize}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Grid overlay */}
      <View style={styles.gridOverlay}>
        <RetroGrid width={screenWidth} height={screenWidth * 1.5} />
      </View>

      <Animated.View style={[styles.centeredContent, { opacity: fadeAnim }]}>
        {/* Logo/Icon with glow effect */}
        <Animated.View style={[
          styles.logoContainer,
          {
            transform: [
              { translateY: sunrisePosition }
            ]
          }
        ]}>
          <RisingSunLogo size={100} glowing={true} />
        </Animated.View>

        {/* Text with typing effect */}
        <Text style={styles.typingText}>{displayedText}</Text>

        {/* Card on third screen */}
        {currentScreen === 2 && (
          <Animated.View
            style={[
              styles.cardContainer,
              {
                transform: [
                  { perspective: 800 },
                  {
                    rotateX: cardRotateX.interpolate({
                      inputRange: [-10, 10],
                      outputRange: ['10deg', '-10deg']
                    })
                  },
                  {
                    rotateY: cardRotateY.interpolate({
                      inputRange: [-10, 10],
                      outputRange: ['-10deg', '10deg']
                    })
                  },
                  { scale: cardScale }
                ]
              }
            ]}
          >
            <LinearGradient
              colors={['#f0f', '#90f', '#70f', '#00f']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              {/* Retro sun */}
              <View style={styles.retroSunContainer}>
                <LinearGradient
                  colors={['#FF7300', '#f70', '#f0f']}
                  style={styles.retroSun}
                />
                <View style={styles.retroSunStripe} />
                <View style={[styles.retroSunStripe, { top: 10 }]} />
                <View style={[styles.retroSunStripe, { top: 20 }]} />
              </View>

              <View style={styles.cardContentContainer}>
                <RisingSunLogo size={40} />
                <Text style={styles.cardTitle}>66 days</Text>
                <Text style={styles.cardSubtitle}>life reset program</Text>

                <View style={styles.invitationBadge}>
                  <Text style={styles.invitationText}>PERSONAL INVITATION</Text>
                </View>

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
                <Text style={styles.cardId}>#176353</Text>
                <Text style={styles.cardOwner}>ADMIT ONE</Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Continue Button - show when typing is complete */}
        {typingComplete && (
          <React.Fragment>
            <Pressable style={styles.button} onPress={handleContinue}>
              <Text style={styles.buttonText}>
                {currentScreen < 2 ? 'Continue' : 'Start Now'}
              </Text>
            </Pressable>

            {currentScreen === 0 && (
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
    overflow: 'hidden',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  bgAnimated: {
    ...StyleSheet.absoluteFillObject,
    height: '200%', // Extra height for animation
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  gridSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 50,
  },
  logoContainer: {
    marginBottom: 20,
  },
  typingText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 32,
    minHeight: 80,
    textShadowColor: 'rgba(255, 115, 0, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  cardContainer: {
    width: 280,
    height: 380,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#f0f',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 15,
  },
  cardGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardContentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  retroSunContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retroSun: {
    width: 150,
    height: 75,
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
  },
  retroSunStripe: {
    position: 'absolute',
    width: 150,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardTitle: {
    fontSize: 32,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 60, // Space for sun
    marginBottom: 4,
    textShadowColor: 'rgba(255, 115, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  cardSubtitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 24,
    textShadowColor: 'rgba(255, 0, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    margin: 3,
    borderRadius: 2,
  },
  gridItemHighlighted: {
    backgroundColor: '#FF7300',
    shadowColor: '#FF7300',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
  cardDate: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  cardId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
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
    marginTop: 20,
  },
  resultsButton: {
    backgroundColor: '#90f',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  invitationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
    marginTop: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ rotate: '-3deg' }],
  },
  invitationText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardOwner: {
    fontSize: 12,
    color: '#fff',
    marginTop: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 8,
  },
});
