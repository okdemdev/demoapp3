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

// Define slide content
const SLIDES = [
    {
        id: '1',
        title: 'Lack of discipline is spiral',
        description: 'The less disciplined you are, the less productive you are, the worse you feel. Realize you\'re in a spiral and escape it.',
        background: '#D32F2F', // Bright red
    },
    {
        id: '2',
        title: 'Motivation doesn\'t last',
        description: 'A system does. Rise creates a focused environment for you to overcome distraction and challenges, to rebuild your life.',
        background: '#D32F2F', // Bright red
    },
    {
        id: '3',
        title: 'It\'s not going to be easy',
        description: 'What you\'re about to do is not easy. You\'re going to miss tasks. But it\'s okay - every day is a new day. Our progress will tell.',
        background: '#D32F2F', // Bright red
    },
    {
        id: '4',
        title: 'The path to success',
        description: 'The life reset program is a scientific and systemic way to help you rebuild your discipline and motivation. We\'re here to help.',
        background: '#5C6BC0', // Purple for hope
        finalSlide: true
    }
];

interface SlideItem {
    id: string;
    title: string;
    description: string;
    background: string;
    finalSlide?: boolean;
}

export default function OnboardingScreen() {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList<SlideItem>>(null);

    const renderItem = ({ item }: { item: SlideItem }) => {
        return (
            <View style={[styles.slide, { width, backgroundColor: item.background }]}>
                <View style={styles.illustrationContainer}>
                    <Text style={styles.placeholder}>Illustration {item.id}</Text>
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
                            // Navigate to habits quiz after onboarding
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
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: '#D32F2F' }]}>
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
    placeholder: {
        fontSize: 20,
        color: 'rgba(255, 255, 255, 0.7)',
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