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
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { cartItems } = useCart();

  const tabs = [
    { key: 'Home', icon: HomeIcon },
    { key: 'Cart', icon: CartIcon, badge: cartItems.length },
    { key: 'UserProfile', icon: UserIcon },
  ];

  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBg,
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
            onPress={() => onNavigate(key)}
            activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Icon
                size={24}
                color={isActive ? '#FF0000' : theme.subText}
              />
              {badge > 0 && key === 'Cart' && (
                <View style={styles.badge}>
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
    paddingTop: 4,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#FF0000',
    borderRadius: 10,
    minWidth: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: fs(10),
    fontWeight: 'bold',
  },
});

export default BottomTabBar;
export { TAB_HEIGHT };

