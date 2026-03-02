import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useNotifications} from '../context/NotificationsContext';
import {products as fallbackProducts} from '../data/products';
import {getProducts} from '../services/api';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  SearchIcon,
  CameraIcon,
  CartIcon,
  UserIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
} from '../components/Icons';

const getNumColumns = width => {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
};

// Render filled + half stars
const StarRow = ({rating, reviews, subTextColor}) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={cardStyles.starRow}>
      {stars.map(s => {
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
      <Text style={[cardStyles.reviewCount, {color: subTextColor}]}>
        {reviews}
      </Text>
    </View>
  );
};

// Normalize backend product format to match mobile format
const normalizeProduct = p => ({
  id: String(p.id || p._id),
  name: p.name,
  tigrinya: p.name,
  price: `€${parseFloat(p.price).toFixed(2)}`,
  originalPrice: p.originalPrice ? `€${parseFloat(p.originalPrice).toFixed(2)}` : null,
  priceNum: parseFloat(p.price),
  originalPriceNum: p.originalPrice ? parseFloat(p.originalPrice) : null,
  description: p.description || '',
  image: p.image || 'https://picsum.photos/seed/product/400/400',
  images: p.images || [p.image],
  category: p.category || 'other',
  rating: p.rating || 4.5,
  reviews: p.reviews || 0,
  sizes: p.sizes || [],
  colors: p.colors || [],
  stock: p.stock || 99,
  discount: p.discount || 0,
  featured: p.featured || false,
  newArrival: p.newArrival || false,
  bestseller: p.bestseller || false,
});

const HomeScreen = ({navigation, isLoggedIn}) => {
  const {addToCart, cartItems} = useCart();
  const {theme, isDark, toggleTheme} = useTheme();
  const {getUnreadCount} = useNotifications();
  const {t} = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState(fallbackProducts);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await getProducts({limit: 100});
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products.map(normalizeProduct));
      }
    } catch {
      // keep fallback products
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const {width} = useWindowDimensions();

  const categories = [
    {value: 'all', label: t('catAll')},
    {value: 'men-clothing', label: t('catMen')},
    {value: 'women-clothing', label: t('catWomen')},
    {value: 'kids-clothing', label: t('catKids')},
    {value: 'electronics', label: t('catElectronics')},
    {value: 'shoes', label: t('catShoes')},
    {value: 'accessories', label: t('catAccessories')},
  ];
  const numColumns = getNumColumns(width);
  const gap = 8;
  const hPad = 8;
  const CARD_WIDTH = (width - hPad * 2 - gap * (numColumns - 1)) / numColumns;
  const IMAGE_HEIGHT = CARD_WIDTH * 1.1; // ~80% of card visual

  const cartCount = cartItems.length;
  const unreadNotifs = getUnreadCount();

  const filteredProducts = products.filter(product => {
    const matchesCategory =
      selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderProduct = ({item}) => (
    <TouchableOpacity
      style={[cardStyles.card, {backgroundColor: theme.cardBg, width: CARD_WIDTH}]}
      onPress={() => navigation.navigate('ProductDetail', {product: item})}
      activeOpacity={0.93}>

      {/* ── Image (80% of card) ──────────────── */}
      <View style={[cardStyles.imageWrapper, {height: IMAGE_HEIGHT}]}>
        <Image
          source={{uri: item.image}}
          style={cardStyles.image}
        />
        {/* Discount badge */}
        <View style={cardStyles.discountBadge}>
          <Text style={cardStyles.discountText}>-{item.discount}%</Text>
        </View>
      </View>

      {/* ── Info below image ─────────────────── */}
      <View style={cardStyles.info}>
        {/* Stars */}
        <StarRow
          rating={item.rating}
          reviews={item.reviews}
          subTextColor={theme.subText}
        />

        {/* Price row + add to cart */}
        <View style={cardStyles.priceRow}>
          <View style={cardStyles.priceBlock}>
            <Text style={cardStyles.price}>{item.price}</Text>
            <Text style={[cardStyles.sold, {color: theme.subText}]}>
              {item.reviews} sold
            </Text>
          </View>
          <TouchableOpacity
            style={cardStyles.addBtn}
            onPress={() => addToCart({...item, quantity: 1, selected: true})}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Icon name="cart-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* RRP */}
        <Text style={[cardStyles.rrp, {color: theme.subText}]}>
          RRP{' '}
          <Text style={cardStyles.rrpStrike}>{item.originalPrice}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <Image source={require('../assets/logo.png')} style={styles.headerLogo} resizeMode="contain" />
        <View style={[styles.searchBar, {backgroundColor: isDark ? theme.bg : '#f5f5f5', borderColor: theme.border}]}>
          <SearchIcon size={18} color={theme.subText} />
          <TextInput
            style={[styles.searchInput, {color: theme.text}]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={theme.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => navigation.navigate('CameraSearch')}>
            <CameraIcon size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.iconBtn, {backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}]}>
            {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={[styles.iconBtn, {backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}]}>
            <BellIcon size={20} color="#FF0000" />
            {unreadNotifs > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Cart')}
            style={[styles.iconBtn, {backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}]}>
            <CartIcon size={20} />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('UserProfile')}
            style={[styles.iconBtn, {backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}]}>
            <UserIcon size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Pills */}
      <View style={[styles.categoryBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                {
                  backgroundColor:
                    selectedCategory === item.value
                      ? '#FF0000'
                      : isDark
                      ? 'rgba(255,255,255,0.1)'
                      : '#f5f5f5',
                  borderColor:
                    selectedCategory === item.value ? '#FF0000' : theme.border,
                },
              ]}
              onPress={() => setSelectedCategory(item.value)}>
              <Text
                style={[
                  styles.categoryText,
                  {color: selectedCategory === item.value ? '#fff' : theme.text},
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Products Grid */}
      {initialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0000" />
        </View>
      ) : (
        <FlatList
          key={numColumns}
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={item => item.id}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? [styles.row, {gap}] : null}
          contentContainerStyle={[styles.gridContainer, {paddingHorizontal: hPad}]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF0000']} tintColor="#FF0000" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: theme.subText}]}>{t('noProducts')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ── Card styles ───────────────────────────────────────────────
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
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  discountText: {color: '#fff', fontSize: 11, fontWeight: 'bold'},
  info: {
    paddingHorizontal: 7,
    paddingTop: 5,
    paddingBottom: 6,
  },
  name: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    marginBottom: 3,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginBottom: 3,
  },
  reviewCount: {
    fontSize: 10,
    marginLeft: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    flexShrink: 1,
  },
  price: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  sold: {
    fontSize: 10,
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF0000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
    flexShrink: 0,
  },
  rrp: {
    fontSize: 10,
  },
  rrpStrike: {
    textDecorationLine: 'line-through',
    fontSize: 10,
  },
});

// ── Screen / layout styles ────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1},
  loadingContainer: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  headerLogo: {width: 36, height: 36, borderRadius: 8},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {flex: 1, fontSize: 14, padding: 0},
  cameraButton: {padding: 2},
  headerIcons: {flexDirection: 'row', gap: 4},
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  badgeText: {color: '#fff', fontSize: 9, fontWeight: 'bold'},
  categoryBar: {paddingVertical: 10, borderBottomWidth: 1},
  categoryList: {paddingHorizontal: 12, gap: 8},
  categoryPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {fontSize: 13, fontWeight: '600'},
  gridContainer: {paddingTop: 8, paddingBottom: 20},
  row: {marginBottom: 8},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: 16, fontWeight: '500'},
});

export default HomeScreen;
