import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { HomeIcon, CartIcon, UserIcon } from './Icons';
import {s, vs, fs} from '../utils/scale';

const TAB_HEIGHT = 56;

/**
 * Bottom tab bar shown on all pages: Home, Cart, Profile.
 * Tapping a tab navigates directly to that screen (replaces stack) so users don't have to go back one by one.
 */
const BottomTabBar = ({ currentScreenName, onNavigate }) => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartItems } = useCart();

  const tabs = [
    { key: 'Home', icon: HomeIcon },
    { key: 'Cart', icon: CartIcon, badge: cartItems.length },
    { key: 'UserProfile', icon: UserIcon },
  ];

  // Modern safe area handling for iOS (Home Indicator)
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.glassBg,
          borderTopColor: theme.border,
          paddingBottom: bottomPadding,
          height: TAB_HEIGHT + bottomPadding,
        },
      ]}>
      {tabs.map(({ key, icon: Icon, badge }) => {
        const isActive = currentScreenName === key;
        return (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            onPress={() => {
              lightTap();
              onNavigate(key);
            }}
            activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Icon
                size={26}
                color={isActive ? '#E60000' : theme.subText}
              />
              {isActive && (
                <View style={[styles.activeIndicator, {backgroundColor: '#E60000'}]} />
              )}
              {badge > 0 && key === 'Cart' && (
                <View style={[styles.badge, {borderColor: theme.cardBg}]}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 0.5,
    // iOS shadow for the bar itself
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: TAB_HEIGHT,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  badge: {
    position: 'absolute',
    top: 2,
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

export default BottomTabBar;
export { TAB_HEIGHT };

