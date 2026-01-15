import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

export const UserSkeleton = () => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        console.log('🦴 UserSkeleton: Starting shimmer animation');
        const startShimmer = () => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(shimmerAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start(() => {
                console.log('🦴 UserSkeleton: Shimmer loop completed');
            });
        };

        startShimmer();

        return () => {
            console.log('🦴 UserSkeleton: Cleaning up shimmer animation');
            shimmerAnim.stopAnimation();
        };
    }, [shimmerAnim]);

    const shimmerTranslateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-200, 200],
    });

    const SkeletonView = ({ style }: { style: any }) => (
        <View style={[style]}>
            <Animated.View
                style={[
                    styles.shimmerOverlay,
                    {
                        transform: [{ translateX: shimmerTranslateX }],
                    },
                ]}
            />
        </View>
    );

    return (
        <View style={styles.card}>
            <SkeletonView style={styles.cardImage} />
            <SkeletonView style={styles.cardTitle} />
            <SkeletonView style={styles.cardSubtitle} />
            <SkeletonView style={styles.cardJob} />
            <View style={styles.actionButtons}>
                <SkeletonView style={styles.actionButton} />
                <SkeletonView style={styles.actionButton} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardImage: {
        width: 100,
        height: 100,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#e0e0e0',
        overflow: 'hidden',
    },
    cardTitle: {
        width: 120,
        height: 16,
        marginBottom: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    cardSubtitle: {
        width: 100,
        height: 14,
        marginBottom: 4,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    cardJob: {
        width: 80,
        height: 12,
        marginBottom: 12,
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    actionButton: {
        width: 40,
        height: 40,
        backgroundColor: '#e0e0e0',
        borderRadius: 20,
        overflow: 'hidden',
    },
    shimmerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});
