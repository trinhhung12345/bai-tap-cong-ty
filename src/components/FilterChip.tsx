import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';

type FilterChipProps = {
    label: string;
    isActive: boolean;
    onPress: () => void;
};

export const FilterChip = ({ label, isActive, onPress }: FilterChipProps) => {
    return (
        <TouchableOpacity
            style={[styles.chip, isActive && styles.activeChip]}
            onPress={onPress}
        >
            <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: '#fff',
        marginHorizontal: 4,
    },
    activeChip: {
        backgroundColor: '#2196F3',
        borderColor: '#2196F3',
    },
    label: {
        fontSize: 14,
        color: '#666',
    },
    activeLabel: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
