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
import {lightTap, successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';

const UserProfileScreen = ({navigation, isLoggedIn, onLogout, user, onUserUpdate}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const {getUnreadCount} = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [ordersCount, setOrdersCount] = useState(0);
  const [inTransitCount, setInTransitCount] = useState(0);

  const unreadNotifs = getUnreadCount();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) return;
    getMyOrders()
      .then(data => {
        const orders = data.orders || [];
        setOrdersCount(orders.length);
        setInTransitCount(orders.filter(o => o.status === 'shipped').length);
      })
      .catch(() => {});
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
      successTap();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const menuItems = [
    {
      icon: <OrderIcon size={22} color="#E60000" />,
      label: t('myOrders'), sublabel: t('myOrdersSub'),
      onPress: () => navigation.navigate('OrderHistory'),
    },
    {
      icon: <TrackIcon size={22} color="#E60000" />,
      label: t('trackOrderMenu'), sublabel: t('trackOrderMenuSub'),
      onPress: () => navigation.navigate('TrackOrder'),
    },
    {
      icon: <BellIcon size={22} color="#E60000" />,
      label: t('notifications'), sublabel: t('notificationsSub'),
      onPress: () => navigation.navigate('Notifications'),
      badge: unreadNotifs > 0 ? unreadNotifs : null,
    },
    {
      icon: <ChatIcon size={22} color="#E60000" />,
      label: t('support'), sublabel: t('supportSub'),
      onPress: () => navigation.navigate('ChatSupport'),
    },
    {
      icon: <GearIcon size={22} color="#E60000" />,
      label: t('settings'), sublabel: t('settingsSub'),
      onPress: () => navigation.navigate('Settings'),
    },
    {
      icon: <ShieldIcon size={22} color="#E60000" />,
      label: t('policies'), sublabel: t('policiesSub'),
      onPress: () => navigation.navigate('Policies'),
    },
    {
      icon: <InfoIcon size={22} color="#E60000" />,
      label: t('aboutUsMenu'), sublabel: t('aboutUsMenuSub'),
      onPress: () => navigation.navigate('AboutUs'),
    },
  ];

  const editFields = [
    { label: t('editNameLabel'), value: name, onChange: setName },
    { label: t('editPhoneLabel'), value: phone, onChange: setPhone, opts: {keyboardType: 'phone-pad'} },
    { label: t('editAddressLabel'), value: address, onChange: setAddress },
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('profileTitle')}</Text>
        <TouchableOpacity onPress={() => { lightTap(); setIsEditing(!isEditing); setSaveError(null); }} style={styles.headerBtn}>
          {isEditing ? <CloseIcon size={24} color={theme.text} /> : <EditIcon size={24} color="#E60000" />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* Profile Card */}
        <View style={[styles.profileCard, {backgroundColor: theme.cardBg}]}>
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatarCircle, {backgroundColor: '#E60000'}]}>
              <Text style={styles.avatarInitials}>
                {(name || email || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
          </View>

          {!isEditing ? (
            <>
              <Text style={[styles.profileName, {color: theme.text}]}>{name || 'Azmarino User'}</Text>
              <Text style={[styles.profileEmail, {color: theme.subText}]}>{email}</Text>
              <View style={[styles.memberBadge, {backgroundColor: 'rgba(230, 0, 0, 0.05)', borderColor: 'rgba(230, 0, 0, 0.1)'}]}>
                <Text style={{color: '#E60000', fontSize: 12, fontWeight: '800'}}>PREMIUM MEMBER</Text>
              </View>
            </>
          ) : (
            <View style={styles.editForm}>
              {editFields.map(({label, value, onChange, opts = {}}) => (
                <View key={label} style={{marginBottom: 16}}>
                  <Text style={[styles.editLabel, {color: theme.subText}]}>{label}</Text>
                  <TextInput
                    style={[styles.editInput, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]}
                    value={value}
                    onChangeText={onChange}
                    {...opts}
                  />
                </View>
              ))}
              {saveError && <Text style={styles.saveError}>{saveError}</Text>}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('saveProfile')}</Text>}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {!isEditing && (
          <>
            <View style={[styles.statsRow, {backgroundColor: theme.cardBg}]}>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: '#E60000'}]}>{ordersCount}</Text>
                <Text style={[styles.statLabel, {color: theme.subText}]}>{t('ordersCount')}</Text>
              </View>
              <View style={[styles.statDivider, {backgroundColor: theme.border}]} />
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, {color: '#E60000'}]}>{inTransitCount}</Text>
                <Text style={[styles.statLabel, {color: theme.subText}]}>{t('inTransit')}</Text>
              </View>
            </View>

            <View style={[styles.menuSection, {backgroundColor: theme.cardBg}]}>
              {menuItems.map((item, index) => (
                <TouchableOpacity key={index} style={[styles.menuItem, index < menuItems.length - 1 && {borderBottomWidth: 0.5, borderBottomColor: theme.border}]} onPress={() => { lightTap(); item.onPress(); }}>
                  <View style={[styles.menuIconBox, {backgroundColor: 'rgba(230, 0, 0, 0.05)'}]}>{item.icon}</View>
                  <View style={{flex: 1}}>
                    <Text style={[styles.menuLabel, {color: theme.text}]}>{item.label}</Text>
                    <Text style={[styles.menuSublabel, {color: theme.subText}]}>{item.sublabel}</Text>
                  </View>
                  {item.badge && (
                    <View style={styles.menuBadge}><Text style={styles.menuBadgeText}>{item.badge}</Text></View>
                  )}
                  <ChevronRightIcon size={20} color={theme.subText} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={[styles.logoutBtn, {borderColor: '#E60000'}]} onPress={() => { lightTap(); setShowLogoutConfirm(true); }}>
              <LogoutIcon size={20} color="#E60000" />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
          </>
        )}

        {showLogoutConfirm && (
          <Modal transparent animationType="fade" visible={showLogoutConfirm}>
            <View style={styles.modalOverlay}>
              <View style={[styles.modalCard, {backgroundColor: theme.cardBg}]}>
                <Text style={[styles.modalTitle, {color: theme.text}]}>{t('logoutConfirm')}</Text>
                <View style={{flexDirection: 'row', gap: 12, marginTop: 24}}>
                  <TouchableOpacity style={[styles.modalBtn, {borderWidth: 1, borderColor: theme.border}]} onPress={() => setShowLogoutConfirm(false)}>
                    <Text style={{color: theme.text, fontWeight: '700'}}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#E60000'}]} onPress={onLogout}>
                    <Text style={{color: '#fff', fontWeight: '700'}}>{t('logoutBtn')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: fs(18), fontWeight: '800' },
  headerBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  profileCard: { alignItems: 'center', padding: 32, marginBottom: 12 },
  avatarWrapper: { marginBottom: 16 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#E60000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  avatarInitials: { color: '#fff', fontSize: fs(36), fontWeight: '900' },
  profileName: { fontSize: fs(24), fontWeight: '800', marginBottom: 4 },
  profileEmail: { fontSize: fs(14), fontWeight: '600' },
  memberBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 16 },
  editForm: { width: '100%' },
  editLabel: { fontSize: 12, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase' },
  editInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 16 },
  saveBtn: { backgroundColor: '#E60000', height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  saveError: { color: '#E60000', fontSize: 13, marginBottom: 12, textAlign: 'center', fontWeight: '600' },
  statsRow: { flexDirection: 'row', padding: 24, marginBottom: 12 },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: fs(24), fontWeight: '900', marginBottom: 4 },
  statLabel: { fontSize: fs(12), fontWeight: '700', textTransform: 'uppercase' },
  statDivider: { width: 1, height: '60%', alignSelf: 'center' },
  menuSection: { marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  menuIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { fontSize: fs(15), fontWeight: '700', marginBottom: 2 },
  menuSublabel: { fontSize: fs(12), fontWeight: '500' },
  menuBadge: { backgroundColor: '#E60000', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 },
  menuBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, margin: 16, height: 56, borderRadius: 16, borderWidth: 2 },
  logoutText: { fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalBtn: { flex: 1, height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }
});

export default UserProfileScreen;
