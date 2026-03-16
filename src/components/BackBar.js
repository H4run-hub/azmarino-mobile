import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { BackIcon } from './Icons';

/**
 * Minimal top bar with back button only. Used on screens other than Home (no search/header).
 */
const BackBar = ({ onPress }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
      <TouchableOpacity
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.btn}>
        <BackIcon size={24} color={theme.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  btn: {
    padding: 4,
  },
});

export default BackBar;
