import React, {useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useNotifications} from '../context/NotificationsContext';
import {
  EditIcon, LogoutIcon, BackIcon, ChevronRightIcon,
  OrderIcon, ChatIcon, TrackIcon,
  ShieldIcon, InfoIcon, CloseIcon,
  GearIcon, BellIcon,
} from '../components/Icons';
import {updateMe, getMyOrders} from '../services/api';
import {s, vs, fs} from '../utils/scale';

const UserProfileScreen = ({navigation, isLoggedIn, onLogout, user, onUserUpdate}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const {getUnreadCount} = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Editable fields — seeded from user prop
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');        // Email is display-only
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Order stats (shown in profile)
  const [ordersCount, setOrdersCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);

  const unreadNotifs = getUnreadCount();

  // Sync fields if user prop changes (e.g., after login)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  // Fetch real order stats on mount
  useEffect(() => {
    if (!isLoggedIn) return;
    getMyOrders()
      .then(data => {
        const orders = data.orders || [];
        setOrdersCount(orders.length);
        setInTransitCount(orders.filter(o => o.status === 'shipped').length);
      })
      .catch(() => {}); // Ignore errors — stats stay at 0
  }, [isLoggedIn]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const data = await updateMe({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      if (data.user && onUserUpdate) onUserUpdate(data.user);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    if (onLogout) onLogout();
  };

  const menuItems = [
    {
      icon: <OrderIcon size={22} color="#FF0000" />,
      label: t('myOrders'), sublabel: t('myOrdersSub'),
      onPress: () => navigation.navigate('OrderHistory'),
    },
    {
      icon: <TrackIcon size={22} color="#FF0000" />,
      label: t('trackOrderMenu'), sublabel: t('trackOrderMenuSub'),
      onPress: () => navigation.navigate('TrackOrder'),
    },
    {
      icon: <BellIcon size={22} color="#FF0000" />,
      label: t('notifications'), sublabel: t('notificationsSub'),
      onPress: () => navigation.navigate('Notifications'),
      badge: unreadNotifs > 0 ? unreadNotifs : null,
    },
    {
      icon: <ChatIcon size={22} color="#FF0000" />,
      label: t('support'), sublabel: t('supportSub'),
      onPress: () => navigation.navigate('ChatSupport'),
    },
    {
      icon: <GearIcon size={22} color="#FF0000" />,
      label: t('settings'), sublabel: t('settingsSub'),
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: <ShieldIcon size={22} color="#FF0000" />,
      label: t('policies'), sublabel: t('policiesSub'),
      onPress: () => navigation.navigate('Policies'),
    },
    {
      icon: <InfoIcon size={22} color="#FF0000" />,
      label: t('aboutUsMenu'), sublabel: t('aboutUsMenuSub'),
      onPress: () => navigation.navigate('AboutUs'),
    },
  ];

  const editFields = [
    {
      label: t('editNameLabel'), value: name,
      onChange: v => setName(v.replace(/[^\p{L}\s]/gu, '')),
    },
    {
      label: t('editPhoneLabel'), value: phone,
      onChange: setPhone,
      opts: {keyboardType: 'phone-pad'},
    },
    {
      label: t('editAddressLabel'), value: address,
      onChange: setAddress,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('profileTitle')}</Text>
        <TouchableOpacity onPress={() => { setIsEditing(!isEditing); setSaveError(null); }}>
          <EditIcon size={24} color="#FF0000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Avatar / Profile card */}
        <View style={[styles.profileCard, {backgroundColor: theme.cardBg}]}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {(name || email || '?')
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </Text>
            </View>
            {isEditing && (
              <TouchableOpacity style={styles.editAvatarBtn}>
                <EditIcon size={14} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          {!isEditing ? (
            <>
              <Text style={[styles.profileName, {color: theme.text}]}>
                {name || '—'}
              </Text>
              <Text style={[styles.profileEmail, {color: theme.subText}]}>{email}</Text>
              {phone ? (
                <Text style={[styles.profilePhone, {color: theme.subText}]}>{phone}</Text>
              ) : null}
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>{t('member')}</Text>
              </View>
            </>
          ) : (
            <View style={styles.editForm}>
              {/* Email is read-only */}
              <Text style={[styles.editLabel, {color: theme.subText}]}>{t('editEmailLabel')}</Text>
              <View style={[styles.editInputReadOnly, {backgroundColor: theme.border}]}>
                <Text style={[styles.editInputReadOnlyText, {color: theme.subText}]}>{email}</Text>
              </View>

              {editFields.map(({label, value, onChange, opts = {}}) => (
                <View key={label}>
                  <Text style={[styles.editLabel, {color: theme.subText}]}>{label}</Text>
                  <TextInput
                    style={[styles.editInput, {
                      backgroundColor: theme.bg,
                      color: theme.text,
                      borderColor: theme.border,
                    }]}
                    value={value}
                    onChangeText={onChange}
                    placeholderTextColor={theme.subText}
                    {...opts}
                  />
                </View>
              ))}

              {saveError && (
                <Text style={styles.saveError}>❌ {saveError}</Text>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}>
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{t('saveProfile')}</Text>
                }
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats row (without total spent) */}
        {!isEditing && (
          <View style={[styles.statsRow, {backgroundColor: theme.cardBg}]}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => navigation.navigate('OrderHistory')}>
              <Text style={[styles.statNumber, {color: theme.text}]}>{ordersCount}</Text>
              <Text style={[styles.statLabel, {color: theme.subText}]}>{t('ordersCount')}</Text>
            </TouchableOpacity>
            <View style={[styles.statDivider, {backgroundColor: theme.border}]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, {color: theme.text}]}>{inTransitCount}</Text>
              <Text style={[styles.statLabel, {color: theme.subText}]}>{t('inTransit')}</Text>
            </View>
          </View>
        )}

        {/* Menu items */}
        {!isEditing && (
          <View style={[styles.menuSection, {backgroundColor: theme.cardBg}]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  index < menuItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.border,
                  },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}>
                <View style={styles.menuIconBox}>{item.icon}</View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuLabel, {color: theme.text}]}>{item.label}</Text>
                  <Text style={[styles.menuSublabel, {color: theme.subText}]}>{item.sublabel}</Text>
                </View>
                {item.badge ? (
                  <View style={styles.menuBadge}>
                    <Text style={styles.menuBadgeText}>{item.badge > 9 ? '9+' : item.badge}</Text>
                  </View>
                ) : null}
                <ChevronRightIcon size={20} color={theme.subText} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Logout button */}
        {!isEditing && (
          <TouchableOpacity
            style={[styles.logoutBtn, {borderColor: '#FF0000'}]}
            onPress={() => setShowLogoutConfirm(true)}
            activeOpacity={0.8}>
            <LogoutIcon size={20} color="#FF0000" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        )}

        {/* Logout confirmation */}
        {showLogoutConfirm && (
          <View style={[styles.confirmCard, {backgroundColor: theme.cardBg, borderColor: '#FF0000'}]}>
            <Text style={[styles.confirmTitle, {color: theme.text}]}>{t('logoutConfirm')}</Text>
            <Text style={[styles.confirmSub, {color: theme.subText}]}>{t('logoutConfirmSub')}</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmCancel, {borderColor: theme.border}]}
                onPress={() => setShowLogoutConfirm(false)}>
                <CloseIcon size={16} color={theme.text} />
                <Text style={[styles.confirmCancelText, {color: theme.text}]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmLogout]}
                onPress={handleLogout}>
                <LogoutIcon size={16} color="#fff" />
                <Text style={styles.confirmLogoutText}>{t('logoutBtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: {fontSize: fs(20), fontWeight: 'bold'},

  // Profile card
  profileCard: {
    alignItems: 'center', paddingVertical: 30,
    paddingHorizontal: 20, marginBottom: 10,
  },
  avatarWrapper: {position: 'relative', marginBottom: 14},
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#FF0000',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF0000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  avatarInitials: {color: '#fff', fontSize: fs(32), fontWeight: 'bold', letterSpacing: 2},
  editAvatarBtn: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
    borderRadius: 14, backgroundColor: '#FF0000', alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  profileName: {fontSize: fs(22), fontWeight: 'bold', marginBottom: 4},
  profileEmail: {fontSize: fs(14), marginBottom: 2},
  profilePhone: {fontSize: fs(14), marginBottom: 12},
  memberBadge: {
    backgroundColor: 'rgba(255,0,0,0.1)', paddingHorizontal: 16,
    paddingVertical: 6, borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,0,0,0.3)', marginTop: 8,
  },
  memberBadgeText: {color: '#FF0000', fontSize: fs(13), fontWeight: '600'},

  // Edit form
  editForm: {width: '100%', marginTop: 10},
  editLabel: {fontSize: fs(13), fontWeight: '600', marginBottom: 6, marginTop: 4},
  editInput: {
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: fs(15), marginBottom: 12,
  },
  editInputReadOnly: {
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12,
  },
  editInputReadOnlyText: {fontSize: fs(15)},
  saveError: {color: '#d32f2f', fontSize: fs(14), marginBottom: 10, fontWeight: '600'},
  saveBtn: {
    backgroundColor: '#FF0000', paddingVertical: 14,
    borderRadius: 12, alignItems: 'center', marginTop: 6,
  },
  saveBtnDisabled: {backgroundColor: '#999'},
  saveBtnText: {color: '#fff', fontSize: fs(16), fontWeight: 'bold'},

  // Stats
  statsRow: {flexDirection: 'row', paddingVertical: 20, marginBottom: 10},
  statItem: {flex: 1, alignItems: 'center'},
  statNumber: {fontSize: fs(22), fontWeight: 'bold', marginBottom: 4},
  statLabel: {fontSize: fs(12), fontWeight: '500'},
  statDivider: {width: 1, height: '70%', alignSelf: 'center'},

  // Menu
  menuSection: {marginBottom: 10},
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  menuIconBox: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,0,0,0.08)', alignItems: 'center',
    justifyContent: 'center', marginRight: 14,
  },
  menuText: {flex: 1},
  menuLabel: {fontSize: fs(15), fontWeight: '600', marginBottom: 2},
  menuSublabel: {fontSize: fs(12)},
  menuBadge: {
    backgroundColor: '#FF0000', borderRadius: 10,
    paddingHorizontal: 7, paddingVertical: 2,
    minWidth: 20, alignItems: 'center', marginRight: 8,
  },
  menuBadgeText: {color: '#fff', fontSize: fs(11), fontWeight: 'bold'},

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, marginHorizontal: 20, paddingVertical: 16,
    borderRadius: 12, borderWidth: 2, marginTop: 4,
  },
  logoutText: {color: '#FF0000', fontSize: fs(16), fontWeight: 'bold'},

  // Logout confirm
  confirmCard: {
    marginHorizontal: 20, marginTop: 12, padding: 20,
    borderRadius: 14, borderWidth: 1.5,
  },
  confirmTitle: {fontSize: fs(17), fontWeight: 'bold', marginBottom: 8},
  confirmSub: {fontSize: fs(13), lineHeight: fs(20), marginBottom: 20},
  confirmButtons: {flexDirection: 'row', gap: 12},
  confirmBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10,
  },
  confirmCancel: {borderWidth: 1.5},
  confirmCancelText: {fontSize: fs(15), fontWeight: '600'},
  confirmLogout: {backgroundColor: '#FF0000'},
  confirmLogoutText: {color: '#fff', fontSize: fs(15), fontWeight: 'bold'},
});

export default UserProfileScreen;
