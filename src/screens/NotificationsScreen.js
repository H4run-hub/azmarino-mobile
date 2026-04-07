import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useNotifications} from '../context/NotificationsContext';
import {BackIcon, CloseIcon, CheckIcon} from '../components/Icons';
import {s, vs, fs} from '../utils/scale';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
};

const TYPE_COLORS = {
  order: {bg: 'rgba(41,128,185,0.12)', border: '#2980b9', dot: '#2980b9'},
  promo: {bg: 'rgba(255,0,0,0.08)', border: '#FF0000', dot: '#FF0000'},
  system: {bg: 'rgba(39,174,96,0.1)', border: '#27ae60', dot: '#27ae60'},
};



const NotificationsScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const {notifications, markAsRead, markAllAsRead, deleteNotification, clearAll, getUnreadCount, fetchNotifications} = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  // Refresh on mount
  React.useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);
  const FILTER_OPTIONS = [
    {value: 'all', label: t('filterAllNotifs')},
    {value: 'order', label: t('filterOrders')},
    {value: 'promo', label: t('filterPromos')},
    {value: 'system', label: t('filterSystem')},
  ];
  const [activeFilter, setActiveFilter] = useState('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const unreadCount = getUnreadCount();

  const filtered =
    activeFilter === 'all'
      ? notifications
      : notifications.filter(n => n.type === activeFilter);

  const renderItem = ({item}) => {
    const colors = TYPE_COLORS[item.type] || TYPE_COLORS.system;
    return (
      <TouchableOpacity
        style={[
          styles.notifCard,
          {
            backgroundColor: item.read
              ? theme.cardBg
              : isDark
              ? colors.bg
              : colors.bg,
            borderLeftColor: item.read ? theme.border : colors.border,
          },
        ]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.8}>

        {/* Unread dot */}
        {!item.read && (
          <View style={[styles.unreadDot, {backgroundColor: colors.dot}]} />
        )}

        {/* Icon bubble */}
        <View style={[styles.iconBubble, {backgroundColor: colors.bg, borderColor: colors.border}]}>
          <Text style={styles.iconText}>{item.icon}</Text>
        </View>

        {/* Content */}
        <View style={styles.notifContent}>
          <Text
            style={[
              styles.notifTitle,
              {color: theme.text},
              !item.read && styles.notifTitleUnread,
            ]}>
            {item.titleKey ? t(item.titleKey) : (language === 'ti' && item.titleTi ? item.titleTi : item.title)}
          </Text>
          <Text style={[styles.notifBody, {color: theme.subText}]} numberOfLines={2}>
            {item.bodyKey ? t(item.bodyKey) : (language === 'ti' && item.bodyTi ? item.bodyTi : item.body)}
          </Text>
          <Text style={[styles.notifTime, {color: theme.subText}]}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => deleteNotification(item.id)}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <CloseIcon size={16} color={theme.subText} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: theme.text}]}>{t('notificationsTitle')}</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {notifications.length > 0 ? (
          <TouchableOpacity onPress={() => setShowClearConfirm(true)}>
            <Text style={styles.clearAllText}>{t('clearAllNotifs')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{width: 60}} />
        )}
      </View>

      {/* Mark all read banner */}
      {unreadCount > 0 && (
        <TouchableOpacity
          style={[styles.markAllBanner, {backgroundColor: isDark ? 'rgba(255,0,0,0.08)' : '#fff9f9', borderBottomColor: theme.border}]}
          onPress={markAllAsRead}>
          <CheckIcon size={14} color="#FF0000" />
          <Text style={styles.markAllText}>{unreadCount} {t('unreadPrefix')} {t('markAllRead')}</Text>
        </TouchableOpacity>
      )}

      {/* Filter tabs */}
      <View style={[styles.filterBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        {FILTER_OPTIONS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterTab,
              activeFilter === f.value && styles.filterTabActive,
              {borderColor: activeFilter === f.value ? '#FF0000' : theme.border},
            ]}
            onPress={() => setActiveFilter(f.value)}>
            <Text
              style={[
                styles.filterTabText,
                {color: activeFilter === f.value ? '#FF0000' : theme.subText},
              ]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Clear all confirm — inline, no Alert */}
      {showClearConfirm && (
        <View style={[styles.confirmCard, {backgroundColor: theme.cardBg, borderColor: '#FF0000'}]}>
          <Text style={[styles.confirmTitle, {color: theme.text}]}>{t('clearAllNotifsConfirm')}</Text>
          <View style={styles.confirmBtns}>
            <TouchableOpacity
              style={[styles.confirmBtn, {borderColor: theme.border}]}
              onPress={() => setShowClearConfirm(false)}>
              <Text style={[styles.confirmCancelText, {color: theme.text}]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, styles.confirmYesBtn]}
              onPress={() => {clearAll(); setShowClearConfirm(false);}}>
              <Text style={styles.confirmYesText}>{t('delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={[styles.emptyTitle, {color: theme.text}]}>{t('noNotifications')}</Text>
          <Text style={[styles.emptySubtitle, {color: theme.subText}]}>{t('noNotificationsSub')}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF0000']} tintColor="#FF0000" />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, {backgroundColor: theme.border}]} />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerCenter: {flexDirection: 'row', alignItems: 'center', gap: 8},
  headerTitle: {fontSize: fs(20), fontWeight: 'bold'},
  headerBadge: {
    backgroundColor: '#FF0000',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  headerBadgeText: {color: '#fff', fontSize: fs(11), fontWeight: 'bold'},
  clearAllText: {color: '#FF0000', fontSize: fs(13), fontWeight: '600'},
  markAllBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  markAllText: {color: '#FF0000', fontSize: fs(13), fontWeight: '600', flex: 1},
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTabActive: {backgroundColor: 'rgba(255,0,0,0.06)'},
  filterTabText: {fontSize: fs(12), fontWeight: '600'},
  confirmCard: {
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  confirmTitle: {fontSize: fs(15), fontWeight: 'bold', marginBottom: 12},
  confirmBtns: {flexDirection: 'row', gap: 10},
  confirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmCancelText: {fontSize: fs(14), fontWeight: '600'},
  confirmYesBtn: {backgroundColor: '#FF0000', borderColor: '#FF0000'},
  confirmYesText: {color: '#fff', fontSize: fs(14), fontWeight: 'bold'},
  listContent: {paddingVertical: 8, paddingBottom: 40},
  separator: {height: 1, marginHorizontal: 16},
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 18,
    left: 4,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
    flexShrink: 0,
  },
  iconText: {fontSize: fs(20)},
  notifContent: {flex: 1, marginRight: 8},
  notifTitle: {fontSize: fs(14), fontWeight: '600', marginBottom: 4, lineHeight: fs(20)},
  notifTitleUnread: {fontWeight: 'bold'},
  notifBody: {fontSize: fs(13), lineHeight: fs(19), marginBottom: 6},
  notifTime: {fontSize: fs(11)},
  deleteBtn: {paddingTop: 2},
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {fontSize: fs(64), marginBottom: 16},
  emptyTitle: {fontSize: fs(20), fontWeight: 'bold', marginBottom: 8},
  emptySubtitle: {fontSize: fs(14), textAlign: 'center', lineHeight: fs(22)},
});

export default NotificationsScreen;
