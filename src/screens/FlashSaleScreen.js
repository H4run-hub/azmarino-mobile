import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {TAB_HEIGHT} from '../components/BottomTabBar';
import {getProducts} from '../services/api';
import {s, vs, fs} from '../utils/scale';
import {getFlashSaleEndTime, getTimeRemaining} from '../utils/flashSale';

const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const ENDLESS_CHUNK = 20;

const formatCount = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

const StarRow = ({rating, reviews, subTextColor}) => (
  <View style={cardStyles.starRow}>
    {[1, 2, 3, 4, 5].map(s => {
      const filled = rating >= s;
      const half = !filled && rating >= s - 0.5;
      return (
        <Icon
          key={s}
          name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
          size={10}
          color="#FFD700"
        />
      );
    })}
    <Text style={[cardStyles.reviewCount, {color: subTextColor}]}>{formatCount(reviews)}</Text>
  </View>
);

const FlashSaleScreen = ({navigation, route}) => {
  const {products = [], endTime: endTimeStr} = route?.params || {};
  const {addToCart} = useCart();
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const bottomPad = TAB_HEIGHT + Math.max(insets.bottom, 8);

  // Real countdown timer — uses end of day or passed endTime
  const [endTime] = useState(() => endTimeStr ? new Date(endTimeStr) : getFlashSaleEndTime());
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(endTime);
      setTimeLeft(remaining);
      if (remaining.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  // Flash sale categories (10+)
  const FLASH_CATEGORIES = useMemo(
    () => [
      {value: 'all', label: t('fsAll')},
      {value: 'men-clothing', label: t('fsMen')},
      {value: 'women-clothing', label: t('fsWomen')},
      {value: 'kids-clothing', label: t('fsKids')},
      {value: 'electronics', label: t('fsElectronics')},
      {value: 'shoes', label: t('fsShoes')},
      {value: 'accessories', label: t('fsAccessories')},
      {value: 'over50', label: t('fsOver50')},
      {value: 'under20', label: t('fsUnder20')},
      {value: 'bestseller', label: t('fsBestseller')},
      {value: 'newArrival', label: t('fsNewArrival')},
      {value: 'topRated', label: t('fsTopRated')},
    ],
    [t],
  );

  const [activeFilter, setActiveFilter] = useState('all');

  // All flash-sale products are ones with discount > 0
  const flashProducts = useMemo(() => {
    return products.filter(p => (p.discount || 0) > 0);
  }, [products]);

  // Filtered by category
  const filtered = useMemo(() => {
    if (activeFilter === 'all') return flashProducts;
    if (activeFilter === 'over50')
      return flashProducts.filter(p => p.discount >= 50);
    if (activeFilter === 'under20')
      return flashProducts.filter(p => p.priceNum < 20);
    if (activeFilter === 'bestseller')
      return flashProducts.filter(p => p.bestseller);
    if (activeFilter === 'newArrival')
      return flashProducts.filter(p => p.newArrival);
    if (activeFilter === 'topRated')
      return flashProducts.filter(p => p.rating >= 4.7);
    return flashProducts.filter(p => p.category === activeFilter);
  }, [flashProducts, activeFilter]);

  const [displayProducts, setDisplayProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    setDisplayProducts(filtered.slice());
  }, [filtered]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setDisplayProducts(shuffle(filtered).slice());
    setTimeout(() => setRefreshing(false), 600);
  }, [filtered]);

  const loadMore = useCallback(() => {
    if (filtered.length === 0) return;
    setDisplayProducts(prev => {
      const batch = shuffle(filtered)
        .slice(0, ENDLESS_CHUNK)
        .map((p, i) => ({...p, _listKey: `e-${prev.length + i}`}));
      return prev.concat(batch);
    });
  }, [filtered]);

  const numColumns = 2;
  const gap = 8;
  const hPad = 8;
  const CARD_WIDTH = (width - hPad * 2 - gap) / numColumns;
  const IMAGE_HEIGHT = CARD_WIDTH * 1.1;

  const renderProduct = ({item}) => {
    const showDiscount = (item.discount || 0) > 0;
    return (
      <TouchableOpacity
        style={[cardStyles.card, {backgroundColor: theme.cardBg, width: CARD_WIDTH}]}
        onPress={() => navigation.navigate('FlashSaleDetail', {product: item, endTime: endTime.toISOString()})}
        activeOpacity={0.93}>
        {/* Discount badge */}
        {showDiscount && (
          <View style={cardStyles.discountBadge}>
            <Text style={cardStyles.discountText}>-{item.discount}%</Text>
          </View>
        )}
        {/* Flash tag */}
        <View style={cardStyles.flashTag}>
          <Text style={cardStyles.flashTagText}>⚡ FLASH</Text>
        </View>
        <View style={[cardStyles.imageWrapper, {height: IMAGE_HEIGHT}]}>
          <FastImage source={{uri: item.image, priority: FastImage.priority.normal}} style={cardStyles.image} resizeMode={FastImage.resizeMode.cover} />
        </View>
        <View style={cardStyles.info}>
          <StarRow
            rating={item.rating}
            reviews={item.reviews}
            subTextColor={theme.subText}
          />
          <View style={cardStyles.priceRow}>
            <View style={cardStyles.priceBlock}>
              <Text style={cardStyles.price}>{item.price}</Text>
              {item.originalPrice && (
                <Text style={[cardStyles.originalPrice, {color: theme.subText}]}>
                  {item.originalPrice}
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={cardStyles.addBtn}
              onPress={() => addToCart({...item, quantity: 1, selected: true})}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
              <Icon name="cart-outline" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          {/* Stock bar */}
          <View style={cardStyles.stockBarWrap}>
            <View style={cardStyles.stockBarBg}>
              <View
                style={[
                  cardStyles.stockBarFill,
                  {width: `${Math.min(100, Math.max(15, 100 - item.stock))}%`},
                ]}
              />
            </View>
            <Text style={[cardStyles.stockLabel, {color: theme.subText}]}>
              {item.stock < 50 ? `🔥 ${item.stock} ${t('fsLeft')}` : t('fsSelling')}
            </Text>
          </View>
        </View>
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

      {/* Header with back button, title & timer */}
      <View style={[styles.header, {backgroundColor: '#FF0000'}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.backBtn}>
          <BackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>⚡ {t('fsPageTitle')}</Text>
          <View style={styles.timerRow}>
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>
                {String(timeLeft.hours).padStart(2, '0')}
              </Text>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </Text>
            </View>
            <Text style={styles.colon}>:</Text>
            <View style={styles.timeBox}>
              <Text style={styles.timeText}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>
        <View style={{width: 32}} />
      </View>

      {/* Promo banner */}
      <View style={[styles.promoBanner, isDark && {backgroundColor: 'rgba(255,152,0,0.15)'}]}>
        <Text style={[styles.promoText, isDark && {color: '#FFB74D'}]}>
          🔥 {t('fsPromo')}
        </Text>
      </View>

      {/* Category filter pills */}
      <View style={[styles.filterBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <FlatList
          horizontal
          data={FLASH_CATEGORIES}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          extraData={language}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.filterPill,
                {
                  backgroundColor:
                    activeFilter === item.value
                      ? '#FF0000'
                      : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : '#f5f5f5',
                  borderColor:
                    activeFilter === item.value ? '#FF0000' : theme.border,
                },
              ]}
              onPress={() => setActiveFilter(item.value)}>
              <Text
                style={[
                  styles.filterText,
                  {color: activeFilter === item.value ? '#fff' : theme.text},
                ]}
                numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Count */}
      <View style={[styles.countRow, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <Text style={[styles.countText, {color: theme.subText}]}>
          {filtered.length} {t('fsProducts')}
        </Text>
      </View>

      {/* Products grid */}
      <FlatList
        data={timeLeft.expired ? [] : displayProducts}
        renderItem={renderProduct}
        keyExtractor={item => item._listKey || item.id}
        numColumns={numColumns}
        columnWrapperStyle={{gap, paddingHorizontal: hPad}}
        contentContainerStyle={{paddingBottom: bottomPad, paddingTop: 4}}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={8}
        initialNumToRender={6}
        windowSize={5}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF0000']} tintColor="#FF0000" />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyText, {color: theme.subText}]}>
              {t('fsEmpty')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backBtn: {padding: 4},
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {
    fontSize: fs(18),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  timerRow: {flexDirection: 'row', alignItems: 'center'},
  timeBox: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  timeText: {color: '#fff', fontSize: fs(14), fontWeight: 'bold'},
  colon: {color: '#fff', fontSize: fs(16), fontWeight: 'bold', marginHorizontal: 3},
  promoBanner: {
    backgroundColor: '#FFF3CD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  promoText: {fontSize: fs(12), fontWeight: '700', color: '#856404'},
  filterBar: {borderBottomWidth: 1},
  filterList: {paddingHorizontal: 8, paddingVertical: 8, gap: 6},
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {fontSize: fs(10), fontWeight: '600'},
  countRow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  countText: {fontSize: fs(11), fontWeight: '600'},
  emptyWrap: {alignItems: 'center', paddingVertical: vs(60)},
  emptyIcon: {fontSize: fs(48), marginBottom: 8},
  emptyText: {fontSize: fs(14)},
});

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  image: {width: '100%', height: '100%'},
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 10,
  },
  discountText: {color: '#fff', fontSize: fs(11), fontWeight: 'bold'},
  flashTag: {
    position: 'absolute',
    top: 8,
    left: 0,
    backgroundColor: '#FF6600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 10,
  },
  flashTagText: {color: '#fff', fontSize: fs(9), fontWeight: 'bold'},
  info: {
    paddingHorizontal: 7,
    paddingTop: 5,
    paddingBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginBottom: 3,
  },
  reviewCount: {fontSize: fs(10), marginLeft: 2},
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  priceBlock: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  price: {fontSize: fs(15), fontWeight: 'bold', color: '#FF0000'},
  originalPrice: {
    fontSize: fs(10),
    textDecorationLine: 'line-through',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  stockBarWrap: {marginTop: 2},
  stockBarBg: {
    height: 4,
    backgroundColor: 'rgba(255,0,0,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  stockBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 2,
  },
  stockLabel: {fontSize: fs(9), marginTop: 2, fontWeight: '600'},
});

export default FlashSaleScreen;
