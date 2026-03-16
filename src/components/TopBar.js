import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { SearchIcon, SunIcon, MoonIcon, BellIcon } from './Icons';
import {s, vs, fs} from '../utils/scale';

/**
 * Shared top navigation bar: optional left slot (e.g. back), search bar, notification, dark/light mode.
 * Used on all main screens so users always have search, notifications, and theme in one place.
 */
const TopBar = ({
  leftSlot,
  searchValue = '',
  onSearchChange,
  onSearchFocus,
  placeholder = 'Search...',
  searchRightSlot,
  notificationCount = 0,
  onNotificationPress,
}) => {
  const { theme, isDark, toggleTheme } = useTheme();
  const isSearchActive = typeof onSearchChange === 'function';

  return (
    <View style={[styles.bar, { backgroundColor: theme.cardBg, borderBottomColor: theme.border }]}>
      {leftSlot != null ? <View style={styles.leftSlot}>{leftSlot}</View> : null}
      <View style={[styles.searchBar, { backgroundColor: isDark ? theme.bg : '#f5f5f5', borderColor: theme.border }]}>
        <SearchIcon size={18} color={theme.subText} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder={placeholder}
          placeholderTextColor={theme.subText}
          value={searchValue}
          onChangeText={isSearchActive ? onSearchChange : undefined}
          onFocus={!isSearchActive && onSearchFocus ? onSearchFocus : undefined}
          editable={isSearchActive}
          selectTextOnFocus={!isSearchActive}
        />
        {searchRightSlot != null ? searchRightSlot : null}
      </View>
      <View style={styles.rightIcons}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNotificationPress}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
          <BellIcon size={20} color="#FF0000" />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BTN_SIZE = 36;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 5,
    borderBottomWidth: 1,
  },
  leftSlot: {
    marginRight: 0,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: BTN_SIZE,
    minHeight: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    paddingHorizontal: 10,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: fs(13),
    fontWeight: '400',
    padding: 0,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 4,
  },
  iconBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: fs(9),
    fontWeight: 'bold',
  },
});

export default TopBar;

