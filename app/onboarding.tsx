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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

// Logo component - updated with actual SVG
const SunLogo = ({ size = 40 }) => (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Circle cx="32" cy="28" r="16" fill="#FFFFFF" />
        <Path d="M16 32C16 32 20 40 32 40C44 40 48 32 48 32" stroke="white" strokeWidth="3" />
        <Path d="M12 38L16 32" stroke="white" strokeWidth="3" />
        <Path d="M52 38L48 32" stroke="white" strokeWidth="3" />
        <Path d="M22 48L26 42" stroke="white" strokeWidth="3" />
        <Path d="M42 48L38 42" stroke="white" strokeWidth="3" />
    </Svg>
);

// Ship illustration - represents being lost in a spiral
const ShipIllustration = () => (
    <Svg width={240} height={160} viewBox="0 0 240 160">
        <Defs>
            <LinearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.1" />
                <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0.4" />
            </LinearGradient>
        </Defs>

        {/* Spiral water waves */}
        <Path d="M20,80 Q60,40 120,80 T220,80" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" />
        <Path d="M20,100 Q70,60 120,100 T220,100" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" />
        <Path d="M20,120 Q80,80 120,120 T220,120" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />

        {/* Ship */}
        <G transform="translate(100, 60)">
            <Path d="M0,0 L30,0 L40,20 L-10,20 Z" fill="white" />
            <Rect x="10" y="-30" width="5" height="30" fill="white" />
            <Path d="M10,-30 L10,-10 L25,-20 Z" fill="white" />
            <Circle cx="5" cy="10" r="3" fill="#D32F2F" />
            <Circle cx="25" cy="10" r="3" fill="#D32F2F" />
        </G>

        {/* Spiral vortex */}
        <Path d="M120,120 Q140,110 130,90 Q120,70 100,80 Q80,90 100,100 Q120,110 110,120"
            stroke="white" strokeWidth="2" fill="none" strokeDasharray="4,2" />
    </Svg>
);

// Planning illustration - represents systems and plans
const PlanningIllustration = () => {
    // Pre-compute the calendar cells to avoid inline map functions in JSX
    const calendarCells = [];
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 7; col++) {
            const key = `${row}-${col}`;
            calendarCells.push(
                <React.Fragment key={key}>
                    <Rect
                        x={col * 20}
                        y={row * 14}
                        width="18"
                        height="12"
                        fill="rgba(255,255,255,0.3)"
                        stroke="#D32F2F"
                        strokeWidth="0.5"
                    />
                    {Math.random() > 0.7 && (
                        <Path
                            d={`M${col * 20 + 4},${row * 14 + 6} L${col * 20 + 14},${row * 14 + 6}`}
                            stroke="#D32F2F"
                            strokeWidth="1.5"
                        />
                    )}
                </React.Fragment>
            );
        }
    }

    return (
        <Svg width={240} height={160} viewBox="0 0 240 160">
            {/* Calendar/Planner */}
            <Rect x="40" y="30" width="160" height="100" fill="rgba(255,255,255,0.9)" rx="6" />
            <Rect x="40" y="30" width="160" height="20" fill="#D32F2F" rx="6" />

            {/* Calendar days */}
            <G transform="translate(50, 60)">
                {calendarCells}
            </G>

            {/* Pencil */}
            <G transform="translate(170, 100) rotate(-45)">
                <Rect x="0" y="0" width="40" height="8" fill="#FFB74D" />
                <Path d="M40,0 L50,4 L40,8 Z" fill="#795548" />
                <Rect x="-10" y="0" width="10" height="8" fill="#EC407A" />
                <Path d="M-10,0 L-15,4 L-10,8 Z" fill="#EC407A" />
            </G>
        </Svg>
    );
};

// Mountain illustration - represents challenges
const MountainIllustration = () => (
    <Svg width={240} height={160} viewBox="0 0 240 160">
        {/* Sky */}
        <Rect x="0" y="0" width="240" height="160" fill="none" />

        {/* Mountains */}
        <Path d="M0,120 L60,40 L120,120 Z" fill="rgba(255,255,255,0.3)" />
        <Path d="M60,120 L120,20 L180,120 Z" fill="rgba(255,255,255,0.5)" />
        <Path d="M120,120 L180,60 L240,120 Z" fill="rgba(255,255,255,0.2)" />

        {/* Snow caps */}
        <Path d="M60,40 L70,50 L50,50 Z" fill="white" />
        <Path d="M120,20 L135,40 L105,40 Z" fill="white" />
        <Path d="M180,60 L190,70 L170,70 Z" fill="white" />

        {/* Path with obstacles */}
        <Path d="M30,120 C40,115 50,118 60,120 C70,122 80,115 90,120 C100,125 110,118 120,120 C130,122 140,115 150,120 C160,125 170,118 180,120 C190,122 200,115 210,120"
            stroke="white" strokeWidth="2" fill="none" />

        {/* Person climbing */}
        <G transform="translate(100, 90)">
            <Circle cx="0" cy="0" r="5" fill="white" /> {/* Head */}
            <Path d="M0,5 L0,15" stroke="white" strokeWidth="2" /> {/* Body */}
            <Path d="M0,8 L-5,12" stroke="white" strokeWidth="2" /> {/* Left arm */}
            <Path d="M0,8 L5,12" stroke="white" strokeWidth="2" /> {/* Right arm */}
            <Path d="M0,15 L-5,25" stroke="white" strokeWidth="2" /> {/* Left leg */}
            <Path d="M0,15 L5,25" stroke="white" strokeWidth="2" /> {/* Right leg */}
        </G>

        {/* Flag at summit */}
        <G transform="translate(120, 20)">
            <Path d="M0,0 L0,20" stroke="white" strokeWidth="2" />
            <Path d="M0,0 L10,5 L0,10" fill="white" />
        </G>
    </Svg>
);

// Success illustration - represents hope and success
const SuccessIllustration = () => {
    // Pre-compute the light rays to avoid inline map in JSX
    const lightRays = [];
    for (let i = 0; i < 8; i++) {
        const x = 120 + 50 * Math.cos(i * Math.PI / 4);
        const y = 80 + 50 * Math.sin(i * Math.PI / 4);
        lightRays.push(
            <Path
                key={`ray-${i}`}
                d={`M120,80 L${x},${y}`}
                stroke="white"
                strokeWidth="2"
                strokeDasharray="2,3"
            />
        );
    }

    // Pre-compute the celebration particles
    const particles = [];
    for (let i = 0; i < 15; i++) {
        const cx = 120 + 80 * Math.random() - 40;
        const cy = 80 + 80 * Math.random() - 40;
        const r = 1 + Math.random() * 2;
        particles.push(
            <Circle
                key={`particle-${i}`}
                cx={cx}
                cy={cy}
                r={r}
                fill="white"
            />
        );
    }

    return (
        <Svg width={240} height={160} viewBox="0 0 240 160">
            {/* Background glow */}
            <Circle cx="120" cy="80" r="60" fill="rgba(255,255,255,0.1)" />
            <Circle cx="120" cy="80" r="40" fill="rgba(255,255,255,0.2)" />

            {/* Sun/Star */}
            <Circle cx="120" cy="80" r="25" fill="#FFFFFF" />

            {/* Light rays */}
            {lightRays}

            {/* Person with arms raised */}
            <G transform="translate(120, 130)">
                <Circle cx="0" cy="-15" r="6" fill="white" /> {/* Head */}
                <Path d="M0,-9 L0,5" stroke="white" strokeWidth="3" /> {/* Body */}
                <Path d="M0,-5 L-15,-15" stroke="white" strokeWidth="2" /> {/* Left arm up */}
                <Path d="M0,-5 L15,-15" stroke="white" strokeWidth="2" /> {/* Right arm up */}
                <Path d="M0,5 L-7,20" stroke="white" strokeWidth="3" /> {/* Left leg */}
                <Path d="M0,5 L7,20" stroke="white" strokeWidth="3" /> {/* Right leg */}
            </G>

            {/* Celebration particles */}
            {particles}
        </Svg>
    );
};

// Define slide content
const SLIDES = [
    {
        id: '1',
        title: 'Lack of discipline is a spiral',
        description: 'The less disciplined you are, the less productive you are, the worse you feel. Realize you\'re in a spiral and escape it.',
        background: '#D32F2F', // Bright red
        illustration: ShipIllustration
    },
    {
        id: '2',
        title: 'Motivation doesn\'t last',
        description: 'A system does. I.R.I.S.E. creates a focused environment for you to overcome distraction and challenges, to rebuild your life.',
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

    // Get current slide for background color
    const currentSlide = SLIDES[currentIndex];

    const renderItem = ({ item }: { item: SlideItem }) => {
        const Illustration = item.illustration;

        return (
            <View style={[styles.slide, { width }]}>
                <View style={styles.logoContainer}>
                    <SunLogo size={64} />
                </View>

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
                                {
                                    backgroundColor:
                                        currentIndex === index
                                            ? '#FFFFFF'
                                            : 'rgba(255, 255, 255, 0.4)',
                                },
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
                            // Navigate to habits quiz with the first question
                            router.push('/habits/1');
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
        <View style={[
            styles.container,
            { backgroundColor: currentSlide.background }
        ]}>
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
                contentContainerStyle={{ paddingTop: insets.top }}
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
    },
    logoContainer: {
        marginTop: 40,
        marginBottom: 20,
    },
    illustrationContainer: {
        height: 160,
        marginBottom: 30,
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