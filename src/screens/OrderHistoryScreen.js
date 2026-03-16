import React, {useState, useEffect, useCallback} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Image,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon, ChevronRightIcon, OrderIcon} from '../components/Icons';
import {getMyOrders, getOrdersByEmail} from '../services/api';
import {s, vs, fs} from '../utils/scale';

// Convert backend order format to the shape the UI expects
const normalizeOrder = (o) => ({
  id: o.orderNumber || o._id,
  date: o.createdAt || new Date().toISOString(),
  status: o.status,
  total: `€${parseFloat(o.total || 0).toFixed(2)}`,
  itemCount: o.items ? o.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0,
  items: (o.items || []).map(i => ({
    name: i.name,
    image: i.image || 'https://picsum.photos/seed/product/400/400',
    price: `€${parseFloat(i.price || 0).toFixed(2)}`,
    qty: i.quantity || 1,
    size: i.selectedSize || '',
    color: i.selectedColor || '',
  })),
});

const OrderHistoryScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      let data;
      // Try authenticated endpoint first
      try {
        data = await getMyOrders();
        if (data.success && Array.isArray(data.orders)) {
          setOrders(data.orders.map(normalizeOrder));
          return;
        }
      } catch {}

      // Fall back to email-based lookup for guest users
      const userStr = await AsyncStorage.getItem('azmarino_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.email) {
          data = await getOrdersByEmail(user.email);
          if (data.success && Array.isArray(data.orders)) {
            setOrders(data.orders.map(normalizeOrder));
            return;
          }
        }
      }

      // No API orders → show empty
      setOrders([]);
    } catch (err) {
      console.error('Fetch orders error:', err);
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const statusConfig = {
    delivered: {label: t('statusDelivered'), color: '#27ae60', bg: 'rgba(39,174,96,0.1)'},
    processing: {label: t('statusProcessing'), color: '#f39c12', bg: 'rgba(243,156,18,0.1)'},
    shipped:    {label: t('statusShipped'),    color: '#2980b9', bg: 'rgba(41,128,185,0.1)'},
    cancelled:  {label: t('statusCancelled'),  color: '#e74c3c', bg: 'rgba(231,76,60,0.1)'},
  };

  const filters = [
    {value: 'all',        label: t('filterAll')},
    {value: 'processing', label: t('filterProcessing')},
    {value: 'shipped',    label: t('filterShipped')},
    {value: 'delivered',  label: t('filterDelivered')},
    {value: 'cancelled',  label: t('filterCancelled')},
  ];

  const filteredOrders =
    activeFilter === 'all' ? orders : orders.filter(o => o.status === activeFilter);

  const toggleExpand = id => setExpandedOrder(expandedOrder === id ? null : id);

  const formatDate = dateStr => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'});
  };

  const renderOrder = ({item}) => {
    const status = statusConfig[item.status];
    const isExpanded = expandedOrder === item.id;

    return (
      <View style={[styles.orderCard, {backgroundColor: theme.cardBg, borderColor: isExpanded ? '#FF0000' : theme.border}]}>
        {/* Header Row */}
        <TouchableOpacity style={styles.orderHeader} onPress={() => toggleExpand(item.id)} activeOpacity={0.8}>
          <View style={styles.orderLeft}>
            <View style={styles.orderIconBox}>
              <OrderIcon size={20} color="#FF0000" />
            </View>
            <View>
              <Text style={[styles.orderId, {color: theme.text}]}>#{item.id}</Text>
              <Text style={[styles.orderDate, {color: theme.subText}]}>{formatDate(item.date)}</Text>
            </View>
          </View>
          <View style={styles.orderRight}>
            <View style={[styles.statusBadge, {backgroundColor: status.bg}]}>
              <Text style={[styles.statusText, {color: status.color}]}>{status.label}</Text>
            </View>
            <ChevronRightIcon size={18} color={theme.subText} rotated={isExpanded} />
          </View>
        </TouchableOpacity>

        {/* Summary Row */}
        <View style={[styles.orderSummary, {borderTopColor: theme.border}]}>
          <View style={styles.thumbnailStrip}>
            {item.items.slice(0, 3).map((product, idx) => (
              <Image
                key={idx}
                source={{uri: product.image}}
                style={[styles.thumbnail, idx > 0 && {marginLeft: -10}, {borderColor: theme.cardBg}]}
              />
            ))}
            {item.itemCount > 3 && (
              <View style={[styles.extraItems, {backgroundColor: theme.bg, borderColor: theme.border}]}>
                <Text style={[styles.extraItemsText, {color: theme.subText}]}>+{item.itemCount - 3}</Text>
              </View>
            )}
          </View>
          <View style={styles.orderMeta}>
            <Text style={[styles.itemCountText, {color: theme.subText}]}>{item.itemCount} {t('items')}</Text>
            <Text style={[styles.orderTotal, {color: theme.text}]}>{item.total}</Text>
          </View>
        </View>

        {/* Expanded Details */}
        {isExpanded && (
          <View style={[styles.expandedSection, {borderTopColor: theme.border}]}>
            <Text style={[styles.expandedTitle, {color: theme.text}]}>{t('orderDetails')}</Text>
            {item.items.map((product, idx) => (
              <View
                key={idx}
                style={[styles.productRow, idx < item.items.length - 1 && {borderBottomWidth: 1, borderBottomColor: theme.border}]}>
                <Image source={{uri: product.image}} style={styles.productImage} />
                <View style={styles.productInfo}>
                  <Text style={[styles.productName, {color: theme.text}]} numberOfLines={2}>{product.name}</Text>
                  <Text style={[styles.productSpecs, {color: theme.subText}]}>
                    {product.size && `${t('size')}: ${product.size}`}
                    {product.size && product.color && ' | '}
                    {product.color && `${t('color')}: ${product.color}`}
                  </Text>
                  <View style={styles.productPriceRow}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    <Text style={[styles.productQty, {color: theme.subText}]}>x{product.qty}</Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {item.status === 'delivered' && (
                <TouchableOpacity style={[styles.actionBtn, styles.reviewBtn]}>
                  <Text style={styles.reviewBtnText}>{t('writeReview')}</Text>
                </TouchableOpacity>
              )}
              {(item.status === 'processing' || item.status === 'shipped') && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.trackBtn]}
                  onPress={() => navigation.navigate('TrackOrder')}>
                  <Text style={styles.trackBtnText}>{t('trackBtn')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.actionBtn, styles.reorderBtn, {borderColor: theme.border}]}>
                <Text style={[styles.reorderBtnText, {color: theme.text}]}>{t('reorder')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('orderHistoryTitle')}</Text>
        <View style={{width: 28}} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <FlatList
          horizontal
          data={filters}
          keyExtractor={f => f.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[styles.filterPill, {
                backgroundColor: activeFilter === item.value ? '#FF0000' : (isDark ? 'rgba(255,255,255,0.08)' : '#f5f5f5'),
                borderColor: activeFilter === item.value ? '#FF0000' : theme.border,
              }]}
              onPress={() => setActiveFilter(item.value)}>
              <Text style={[styles.filterText, {color: activeFilter === item.value ? '#fff' : theme.text}]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrder}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF0000']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={[styles.emptyText, {color: theme.subText}]}>{t('noOrders')}</Text>
              <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('Home')}>
                <Text style={styles.shopNowText}>{t('startShopping')}</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
  filterBar: {paddingVertical: 12, borderBottomWidth: 1},
  filterList: {paddingHorizontal: 16, gap: 8},
  filterPill: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1},
  filterText: {fontSize: fs(13), fontWeight: '600'},
  listContent: {padding: 16, paddingBottom: 40},
  orderCard: {borderRadius: 14, borderWidth: 1.5, marginBottom: 14, overflow: 'hidden'},
  orderHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14},
  orderLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  orderIconBox: {width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,0,0,0.08)', alignItems: 'center', justifyContent: 'center'},
  orderId: {fontSize: fs(15), fontWeight: 'bold', marginBottom: 2},
  orderDate: {fontSize: fs(12)},
  orderRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  statusBadge: {paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20},
  statusText: {fontSize: fs(12), fontWeight: '700'},
  orderSummary: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1},
  thumbnailStrip: {flexDirection: 'row', alignItems: 'center'},
  thumbnail: {width: 40, height: 40, borderRadius: 8, borderWidth: 2, backgroundColor: '#f5f5f5'},
  extraItems: {width: 40, height: 40, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: -10},
  extraItemsText: {fontSize: fs(11), fontWeight: '700'},
  orderMeta: {alignItems: 'flex-end'},
  itemCountText: {fontSize: fs(12), marginBottom: 2},
  orderTotal: {fontSize: fs(18), fontWeight: 'bold'},
  expandedSection: {padding: 14, borderTopWidth: 1},
  expandedTitle: {fontSize: fs(14), fontWeight: 'bold', marginBottom: 12},
  productRow: {flexDirection: 'row', paddingVertical: 12},
  productImage: {width: 65, height: 65, borderRadius: 10, backgroundColor: '#f5f5f5'},
  productInfo: {flex: 1, marginLeft: 12, justifyContent: 'center'},
  productName: {fontSize: fs(14), fontWeight: '600', marginBottom: 4},
  productSpecs: {fontSize: fs(12), marginBottom: 6},
  productPriceRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  productPrice: {fontSize: fs(15), fontWeight: 'bold', color: '#FF0000'},
  productQty: {fontSize: fs(13)},
  actionButtons: {flexDirection: 'row', gap: 10, marginTop: 14},
  actionBtn: {flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center'},
  reviewBtn: {backgroundColor: '#FF0000'},
  reviewBtnText: {color: '#fff', fontSize: fs(13), fontWeight: '700'},
  trackBtn: {backgroundColor: '#2980b9'},
  trackBtnText: {color: '#fff', fontSize: fs(13), fontWeight: '700'},
  reorderBtn: {borderWidth: 1.5},
  reorderBtnText: {fontSize: fs(13), fontWeight: '700'},
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80},
  emptyContainer: {alignItems: 'center', paddingTop: 80},
  emptyIcon: {fontSize: fs(70), marginBottom: 16},
  emptyText: {fontSize: fs(18), fontWeight: '600', marginBottom: 24},
  shopNowBtn: {backgroundColor: '#FF0000', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12},
  shopNowText: {color: '#fff', fontSize: fs(16), fontWeight: 'bold'},
});

export default OrderHistoryScreen;
