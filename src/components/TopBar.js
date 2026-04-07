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
      <View style={[styles.searchBar, { backgroundColor: isDark ? theme.bg : '#F3F4F6', borderColor: theme.border }]}>
        <SearchIcon size={20} color={theme.subText} />
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
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
          {isDark ? <SunIcon size={22} color="#FFB800" /> : <MoonIcon size={22} color="#4B5563" />}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onNotificationPress}
          style={[styles.iconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
          <BellIcon size={22} color="#E60000" />
          {notificationCount > 0 && (
            <View style={[styles.badge, {borderColor: theme.cardBg}]}>
              <Text style={styles.badgeText}>{notificationCount > 9 ? '9+' : notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const BTN_SIZE = 40;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 0.5,
  },
  leftSlot: {
    marginRight: 4,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: BTN_SIZE,
    minHeight: BTN_SIZE,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: fs(14),
    fontWeight: '500',
    padding: 0,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#E60000',
    borderRadius: 10,
    minWidth: 18,
    minHeight: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: fs(9),
    fontWeight: '800',
  },
});

export default TopBar;

