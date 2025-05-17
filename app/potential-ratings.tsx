import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlobal } from './lib/context/GlobalContext';

type MetricKey = 'wisdom' | 'strength' | 'focus' | 'confidence' | 'discipline';

// Icons for each metric
const METRIC_ICONS: Record<MetricKey, string> = {
    wisdom: 'brain-outline',
    strength: 'barbell-outline',
    focus: 'eye-outline',
    confidence: 'sunny-outline',
    discipline: 'lock-closed-outline',
};

// Improvement amounts for each metric
const IMPROVEMENT_AMOUNTS: Record<MetricKey, number> = {
    wisdom: 40,
    strength: 40,
    focus: 37,
    confidence: 37,
    discipline: 37,
};

export default function PotentialRatingsScreen() {
    const insets = useSafeAreaInsets();
    const { updateSubscription } = useGlobal();
    const params = useLocalSearchParams<{ metrics: string }>();

    // Parse the metrics data from params
    let currentMetrics: Record<MetricKey, number> = {
        wisdom: 0,
        strength: 0,
        focus: 0,
        confidence: 0,
        discipline: 0,
    };

    try {
        if (params.metrics) {
            currentMetrics = JSON.parse(params.metrics);
        }
    } catch (error) {
        console.error('Error parsing metrics:', error);
    }

    // Calculate potential metrics (capped at 100)
    const potentialMetrics: Record<MetricKey, number> = {
        wisdom: 0,
        strength: 0,
        focus: 0,
        confidence: 0,
        discipline: 0
    };

    Object.keys(currentMetrics).forEach((key) => {
        const metricKey = key as MetricKey;
        const currentValue = currentMetrics[metricKey];
        const improvement = IMPROVEMENT_AMOUNTS[metricKey];
        potentialMetrics[metricKey] = Math.min(100, Math.round(currentValue + improvement));
    });

    // Calculate overall scores
    const currentOverall = Math.round(
        Object.values(currentMetrics).reduce((sum, value) => sum + value, 0) /
        Object.keys(currentMetrics).length
    );

    const potentialOverall = Math.round(
        Object.values(potentialMetrics).reduce((sum, value) => sum + value, 0) /
        Object.keys(potentialMetrics).length
    );

    const overallImprovement = potentialOverall - currentOverall;

    const handleSubscribe = async () => {
        await updateSubscription(true);
        router.replace('/plan');
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar style="dark" />
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <Text style={styles.title}>Potential Rating</Text>

                    <Text style={styles.subtitle}>
                        Based on your information, we believe you could reach{' '}
                        <Text style={styles.highlight}>{potentialOverall} potential rating</Text>{' '}
                        by completing a customised life reset program.
                    </Text>

                    {/* Overall potential score card */}
                    <View style={[styles.scoreCard, { backgroundColor: '#F37335' }]}>
                        <View style={styles.scoreHeader}>
                            <Ionicons name="star" size={24} color="#fff" />
                            <Text style={styles.scoreLabel}>Overall</Text>
                        </View>
                        <View style={styles.scoreValueContainer}>
                            <Text style={styles.scoreValue}>{potentialOverall}</Text>
                            <Text style={styles.improvement}>(+{overallImprovement})</Text>
                        </View>
                        <View style={styles.scoreBarContainer}>
                            <View style={[styles.scoreBar, { width: `${Math.min(100, potentialOverall)}%` }]} />
                        </View>
                    </View>

                    {/* Individual metrics cards */}
                    <View style={styles.metricsGrid}>
                        {Object.entries(potentialMetrics).map(([key, value]) => {
                            const metricKey = key as MetricKey;
                            const improvement = value - currentMetrics[metricKey];

                            return (
                                <View key={key} style={styles.scoreCard}>
                                    <View style={styles.scoreHeader}>
                                        <Ionicons
                                            name={METRIC_ICONS[metricKey] as any}
                                            size={24}
                                            color="#000"
                                        />
                                        <Text style={[styles.scoreLabel, { color: '#000' }]}>
                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </Text>
                                    </View>
                                    <View style={styles.scoreValueContainer}>
                                        <Text style={[styles.scoreValue, { color: '#000' }]}>{value}</Text>
                                        <Text style={styles.improvement}>(+{improvement})</Text>
                                    </View>
                                    <View style={[styles.scoreBarContainer, { backgroundColor: '#E5E5E5' }]}>
                                        <View
                                            style={[
                                                styles.scoreBar,
                                                {
                                                    width: `${Math.min(100, value)}%`,
                                                    backgroundColor: '#4CAF50'
                                                }
                                            ]}
                                        />
                                    </View>
                                </View>
                            );
                        })}
                    </View>

                    <Pressable style={styles.ctaButton} onPress={handleSubscribe}>
                        <Text style={styles.ctaButtonText}>Start Your Reset Program</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 24,
        lineHeight: 22,
    },
    highlight: {
        fontWeight: 'bold',
        color: '#000',
    },
    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    scoreCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        width: '48%',
        borderWidth: 3,
        borderColor: '#000',
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    scoreLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 8,
    },
    scoreValueContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#fff',
    },
    improvement: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginLeft: 4,
        marginBottom: 8,
    },
    scoreBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    scoreBar: {
        height: '100%',
        backgroundColor: '#fff',
    },
    ctaButton: {
        backgroundColor: '#000',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
}); 