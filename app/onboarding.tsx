import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Logo component
const SunLogo = ({ size = 40 }) => (
    <Svg width={size} height={size / 2} viewBox="0 0 64 32" fill="none">
        <Path
            d="M32 0C24 0 16 8 16 16H48C48 8 40 0 32 0Z"
            fill="white"
        />
        <Path
            d="M16 16H8C8 24 16 32 16 32V16Z"
            fill="white"
        />
        <Path
            d="M48 16H56C56 24 48 32 48 32V16Z"
            fill="white"
        />
        <Path
            d="M20 16H24V32H20V16Z"
            fill="white"
        />
        <Path
            d="M28 16H32V32H28V16Z"
            fill="white"
        />
        <Path
            d="M36 16H40V32H36V16Z"
            fill="white"
        />
        <Path
            d="M44 16H48V32H44V16Z"
            fill="white"
        />
    </Svg>
);

// Ship illustration
const ShipIllustration = () => (
    <Svg width={240} height={120} viewBox="0 0 240 120" fill="none">
        <Path d="M140,60 L100,60 L120,40 Z" fill="#4285F4" /> {/* Blue hull */}
        <Path d="M160,60 L80,60 L85,50 L155,50 Z" fill="#FBBC05" /> {/* Yellow deck */}
        <Path d="M170,50 L170,60 L165,50 Z" fill="#FBBC05" /> {/* Yellow bow */}
        <Path d="M145,45 L145,50 L143,45 Z" fill="#EA4335" /> {/* Red flag */}
        <Path d="M80,60 L170,60" stroke="#000" strokeWidth="2" /> {/* Water line */}
        <Path d="M90,65 L160,65" stroke="#000" strokeWidth="1" opacity="0.5" /> {/* Wave 1 */}
        <Path d="M70,70 L180,70" stroke="#000" strokeWidth="1" opacity="0.3" /> {/* Wave 2 */}
        <Path d="M100,75 L150,75" stroke="#000" strokeWidth="1" opacity="0.2" /> {/* Wave 3 */}
        <Path d="M120,80 L130,80" stroke="#000" strokeWidth="1" opacity="0.1" /> {/* Wave 4 */}
        <Path d="M130,40 L150,60" stroke="#000" strokeWidth="2" /> {/* Mast */}
        <Path d="M110,60 L120,60 L130,60" stroke="#000" strokeWidth="2" strokeDasharray="5,5" /> {/* Deck detail */}
        <Path d="M90,20 L90,30 L110,30 L110,20" fill="#fff" opacity="0.7" /> {/* Cloud */}
        <Path d="M115,25 L115,35 L135,35 L135,25" fill="#fff" opacity="0.7" /> {/* Cloud */}
    </Svg>
);

// Planning illustration
const PlanningIllustration = () => (
    <Svg width={240} height={120} viewBox="0 0 240 120" fill="none">
        <Rect x="70" y="40" width="100" height="70" rx="5" fill="#FFFFFF" /> {/* Notebook */}
        <Path d="M80,50 L160,50" stroke="#DDD" strokeWidth="1" /> {/* Line */}
        <Path d="M80,60 L160,60" stroke="#DDD" strokeWidth="1" /> {/* Line */}
        <Path d="M80,70 L160,70" stroke="#DDD" strokeWidth="1" /> {/* Line */}
        <Path d="M80,80 L160,80" stroke="#DDD" strokeWidth="1" /> {/* Line */}
        <Path d="M80,90 L160,90" stroke="#DDD" strokeWidth="1" /> {/* Line */}
        <Path d="M90,50 L90,90" stroke="#DDD" strokeWidth="1" /> {/* Column */}
        <Path d="M110,40 L110,110" stroke="#DDD" strokeWidth="1" /> {/* Column */}
        <Path d="M90,75 L110,75 Q115,70 120,75 Q125,80 130,75" stroke="#34A853" strokeWidth="2" /> {/* Drawing */}
        <Path d="M150,60 L140,60 Q135,65 130,60" stroke="#4285F4" strokeWidth="2" /> {/* Drawing */}
        <Circle cx="120" cy="65" r="3" fill="#EA4335" /> {/* Dot */}
        <Circle cx="140" cy="85" r="3" fill="#FBBC05" /> {/* Dot */}
        <Path d="M155,40 L170,35 L165,50" fill="#FFC0CB" /> {/* Hand top right */}
        <Path d="M60,80 L75,70 L70,85" fill="#FFC0CB" /> {/* Hand bottom left */}
        <Path d="M165,35 L180,35 L175,45" fill="#4285F4" /> {/* Pen */}
    </Svg>
);

// Mountain illustration
const MountainIllustration = () => (
    <Svg width={240} height={120} viewBox="0 0 240 120" fill="none">
        <Path d="M70,100 L120,40 L170,100 Z" fill="#F5F5F5" /> {/* Mountain */}
        <Path d="M120,40 L130,60 L110,60 Z" fill="#FFFFFF" /> {/* Snow cap */}
        <Path d="M95,70 L105,60 L115,70 Z" fill="#FFFFFF" opacity="0.7" /> {/* Snow feature */}
        <Path d="M125,65 L135,55 L145,65 Z" fill="#FFFFFF" opacity="0.7" /> {/* Snow feature */}
        <Path d="M120,40 L120,30 L125,35 Z" fill="#E57373" /> {/* Flag */}
    </Svg>
);

// Success illustration
const SuccessIllustration = () => (
    <Svg width={240} height={120} viewBox="0 0 240 120" fill="none">
        <Rect x="70" y="90" width="100" height="10" fill="#E0E0E0" /> {/* Base */}
        <Rect x="80" y="80" width="80" height="10" fill="#E0E0E0" /> {/* Step 1 */}
        <Rect x="90" y="70" width="60" height="10" fill="#E57373" /> {/* Step 2 */}
        <Rect x="100" y="60" width="40" height="10" fill="#E57373" /> {/* Step 3 */}
        <Rect x="105" y="50" width="30" height="10" fill="#E57373" /> {/* Step 4 */}
        <Rect x="110" y="40" width="20" height="10" fill="#E57373" /> {/* Step 5 */}
        {/* Simple person */}
        <Circle cx="120" cy="30" r="8" fill="#333" /> {/* Head */}
        <Rect x="110" y="38" width="20" height="20" fill="#64B5F6" rx="5" /> {/* Body */}
        <Path d="M110,45 L100,55" stroke="#64B5F6" strokeWidth="5" /> {/* Left arm */}
        <Path d="M130,45 L140,55" stroke="#64B5F6" strokeWidth="5" /> {/* Right arm */}
        <Path d="M115,58 L115,75" stroke="#4CAF50" strokeWidth="5" /> {/* Left leg */}
        <Path d="M125,58 L125,75" stroke="#4CAF50" strokeWidth="5" /> {/* Right leg */}
        {/* Trophy */}
        <Circle cx="150" cy="60" r="6" fill="#FFFFFF" /> {/* Trophy top */}
        <Rect x="147" y="66" width="6" height="4" fill="#FFFFFF" /> {/* Trophy neck */}
        <Path d="M144,70 L156,70 L154,75 L146,75 Z" fill="#FFFFFF" /> {/* Trophy base */}
    </Svg>
);

// Define slide content
const SLIDES = [
    {
        id: '1',
        title: 'Lack of discipline is spiral',
        description: 'The less disciplined you are, the less productive you are, the worse you feel. Realize you\'re in a spiral and escape it.',
        background: '#D32F2F', // Bright red
        illustration: ShipIllustration
    },
    {
        id: '2',
        title: 'Motivation doesn\'t last',
        description: 'A system does. Rise creates a focused environment for you to overcome distraction and challenges, to rebuild your life.',
        background: '#D32F2F', // Bright red
        illustration: PlanningIllustration
    },
    {
        id: '3',
        title: 'It\'s not going to be easy',
        description: 'What you\'re about to do is not easy. You\'re going to miss tasks. But it\'s okay - every day is a new day. Our progress will tell.',
        background: '#D32F2F', // Bright red
        illustration: MountainIllustration
    },
    {
        id: '4',
        title: 'The path to success',
        description: 'The life reset program is a scientific and systemic way to help you rebuild your discipline and motivation. We\'re here to help.',
        background: '#5C6BC0', // Purple for hope
        illustration: SuccessIllustration,
        finalSlide: true
    }
];

interface SlideItem {
    id: string;
    title: string;
    description: string;
    background: string;
    illustration: React.FC;
    finalSlide?: boolean;
}

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList<SlideItem>>(null);

    const renderItem = ({ item }: { item: SlideItem }) => {
        const Illustration = item.illustration;

        return (
            <View style={[styles.slide, { width, backgroundColor: item.background }]}>
                <SunLogo size={64} />

                <View style={styles.illustrationContainer}>
                    <Illustration />
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>

                <View style={styles.dotContainer}>
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                { backgroundColor: currentIndex === index ? '#FFFFFF' : 'rgba(255, 255, 255, 0.4)' }
                            ]}
                        />
                    ))}
                </View>

                <Pressable
                    style={styles.button}
                    onPress={() => {
                        if (currentIndex < SLIDES.length - 1) {
                            flatListRef.current?.scrollToIndex({
                                index: currentIndex + 1,
                                animated: true
                            });
                        } else {
                            // Navigate to results on the last slide
                            router.push('/results');
                        }
                    }}
                >
                    <Text style={styles.buttonText}>
                        {item.finalSlide ? 'Got it' : 'Next'}
                    </Text>
                    {!item.finalSlide && <Text style={styles.buttonIcon}>→</Text>}
                </Pressable>
            </View>
        );
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        if (index !== currentIndex) {
            setCurrentIndex(index);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="light" />
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id}
                onMomentumScrollEnd={handleScroll}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    illustrationContainer: {
        height: 240,
        marginVertical: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
        lineHeight: 26,
        marginBottom: 40,
    },
    dotContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 5,
    },
    button: {
        backgroundColor: '#FFFFFF',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
        maxWidth: 360,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
    },
    buttonIcon: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000000',
        marginLeft: 8,
    },
}); 