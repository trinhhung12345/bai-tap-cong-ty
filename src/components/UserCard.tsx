import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User } from '../navigation/index';
import { useUsersStore } from '../store/store';

type UserCardProps = {
    user: User;
    onPress: (userId: number) => void;
};

export const UserCard = React.memo(({ user, onPress }: UserCardProps) => {
    const { reactions, isLiking, toggleReaction } = useUsersStore();

    const userReaction = reactions.get(user.id);

    console.log(`👤 UserCard: Rendered for user ${user.first_name} ${user.last_name} (ID: ${user.id}), reaction: ${userReaction || 'none'}`);

    const handleLike = () => {
        console.log(`👍 Like button pressed for user ${user.id}`);
        toggleReaction(user.id, 'like');
    };

    const handleDislike = () => {
        console.log(`👎 Dislike button pressed for user ${user.id}`);
        toggleReaction(user.id, 'dislike');
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onPress(user.id)}
        >
            <Image source={{ uri: user.profile_picture }} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{`${user.first_name} ${user.last_name}`}</Text>
            <Text style={styles.cardSubtitle}>{user.email}</Text>
            <Text style={styles.cardJob}>{user.job}</Text>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, isLiking && styles.actionButtonDisabled]}
                    onPress={handleLike}
                    disabled={isLiking}
                >
                    {isLiking ? (
                        <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                        <Ionicons
                            name={userReaction === 'like' ? "thumbs-up" : "thumbs-up-outline"}
                            size={24}
                            color={userReaction === 'like' ? "#4CAF50" : "#666"}
                        />
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionButton, isLiking && styles.actionButtonDisabled]}
                    onPress={handleDislike}
                    disabled={isLiking}
                >
                    {isLiking ? (
                        <ActivityIndicator size="small" color="#F44336" />
                    ) : (
                        <Ionicons
                            name={userReaction === 'dislike' ? "thumbs-down" : "thumbs-down-outline"}
                            size={24}
                            color={userReaction === 'dislike' ? "#F44336" : "#666"}
                        />
                    )}
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

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
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    cardJob: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
        marginBottom: 12,
        fontStyle: 'italic',
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
    },
    actionButton: {
        padding: 8,
    },
    actionButtonDisabled: {
        opacity: 0.6,
    },
});
