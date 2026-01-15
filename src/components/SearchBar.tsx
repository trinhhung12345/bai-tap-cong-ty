import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type SearchBarProps = {
    placeholder?: string;
    onSearch: (query: string) => void;
    debounceMs?: number;
};

export const SearchBar = ({ placeholder = 'Tìm kiếm...', onSearch, debounceMs = 300 }: SearchBarProps) => {
    const [query, setQuery] = useState('');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        console.log(`🔍 SearchBar: User typing "${query}", clearing previous timeout`);
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            console.log(`🔍 SearchBar: Debounce ${debounceMs}ms completed, triggering search for "${query}"`);
            onSearch(query);
        }, debounceMs);

        return () => {
            console.log('🔍 SearchBar: Cleanup - clearing timeout');
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, onSearch, debounceMs]);

    return (
        <View style={styles.container}>
            <Ionicons name="search" size={20} color="#999" style={styles.icon} />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#999"
                value={query}
                onChangeText={setQuery}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 22,
        marginHorizontal: 16,
        marginVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
    },
});
