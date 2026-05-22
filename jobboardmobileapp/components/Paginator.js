import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from '../screens/Employers/Styles';

const Paginator = ({ page, totalPages, onGoTo }) => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
            acc.push(p);
            return acc;
        }, []);

    return (
        <View style={styles.paginatorWrap}>
            <TouchableOpacity
                style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
                onPress={() => onGoTo(page - 1)}
                disabled={page === 1}
            >
                <Text style={styles.pageBtnText}>‹</Text>
            </TouchableOpacity>

            {pages.map((p, idx) =>
                p === '...' ? (
                    <Text key={`dot-${idx}`} style={styles.pageDots}>…</Text>
                ) : (
                    <TouchableOpacity
                        key={p}
                        style={[styles.pageBtn, page === p && styles.pageBtnActive]}
                        onPress={() => onGoTo(p)}
                    >
                        <Text style={[styles.pageBtnText, page === p && styles.pageBtnTextActive]}>
                            {p}
                        </Text>
                    </TouchableOpacity>
                )
            )}

            <TouchableOpacity
                style={[styles.pageBtn, page === totalPages && styles.pageBtnDisabled]}
                onPress={() => onGoTo(page + 1)}
                disabled={page === totalPages}
            >
                <Text style={styles.pageBtnText}>›</Text>
            </TouchableOpacity>
        </View>
    );
};

export default Paginator;