import React, {useState, useEffect, useCallback, useMemo, useRef, memo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useNotifications} from '../context/NotificationsContext';
// Old local products removed — all products come from the API now
import {getProducts} from '../services/api';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {SearchIcon, CameraIcon} from '../components/Icons';
import TopBar from '../components/TopBar';
import {TAB_HEIGHT} from '../components/BottomTabBar';
import FlashSalesBanner from '../components/FlashSalesBanner';
import {HomeScreenSkeleton} from '../components/SkeletonLoader';
import {useRecentlyViewed} from '../context/RecentlyViewedContext';
import {lightTap, successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Priority order: clothing-first, electronics last
const CATEGORY_PRIORITY = [
  'men-clothing','women-clothing','kids-clothing','shoes','bags',
  'accessories','beauty','sports','home','electronics','other',
];

// Categories that count as "clothing-focused" for the default feed (80%)
const CLOTHING_FOCUSED_CATEGORIES = new Set([
  'men-clothing',
  'women-clothing',
  'kids-clothing',
  'shoes',
  'bags',
  'accessories',
]);

// Interleave products by category in priority order so clothing
// appears throughout the grid rather than only electronics at the top.
const interleaveByCategory = (products) => {
  const groups = {};
  products.forEach(p => {
    const cat = p.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(p);
  });
  // Shuffle within each group for variety
  Object.values(groups).forEach(arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  });
  const cats = [
    ...CATEGORY_PRIORITY.filter(c => groups[c]),
    ...Object.keys(groups).filter(c => !CATEGORY_PRIORITY.includes(c)),
  ];
  const indices = {};
  cats.forEach(c => { indices[c] = 0; });
  const result = [];
  let remaining = products.length;
  while (remaining > 0) {
    let added = 0;
    for (const cat of cats) {
      if (indices[cat] < (groups[cat]?.length ?? 0)) {
        result.push(groups[cat][indices[cat]++]);
        remaining--;
        added++;
      }
    }
    if (added === 0) break;
  }
  return result;
};

const ENDLESS_CHUNK = 20;

const getNumColumns = width => {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
};

// Ticker: Car enters, stops when fully shown, holds 3 sec, exits. 1 sec gap. 3 messages flip (3 sec each), then car.
const TICKER_ROW_HEIGHT = 32;
const SLIDE_DURATION = 320;
const CAR_ENTER_DURATION = 6000; // car drives in until fully shown
const CAR_HOLD_DURATION = 3000; // car + text stay visible 3 sec
const CAR_EXIT_DURATION = 800; // car exits left
const GAP_CAR_TO_TEXT = 1000; // 1 sec between car and flipping messages
const MSG_DISPLAY_DURATION = 3000; // each flipping message shows 3 sec

const CAR_TAGLINE = 'Azmarino.online always on time! · ኩሉ ጊዜ ኣብ ሳዓቱ!';

const TickerStrip = ({messages}) => {
  const {width} = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const carTranslateX = useRef(new Animated.Value(400)).current;
  const rotatingOpacity = useRef(new Animated.Value(0)).current;
  const carOpacity = useRef(new Animated.Value(1)).current;
  const cycleTimeoutRef = useRef(null);

  const runCarPhase = useCallback(() => {
    if (!messages?.length) return;
    carOpacity.setValue(1);
    rotatingOpacity.setValue(0);
    carTranslateX.setValue(width + 400);
    // 1) Car enters from right, stops when fully shown
    Animated.timing(carTranslateX, {
      toValue: 10,
      duration: CAR_ENTER_DURATION,
      useNativeDriver: true,
    }).start(() => {
      // 2) Hold 3 sec with car + text fully visible
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = setTimeout(() => {
        // 3) Car exits left
        Animated.timing(carTranslateX, {
          toValue: -400,
          duration: CAR_EXIT_DURATION,
          useNativeDriver: true,
        }).start(() => {
          // 4) 1 sec gap, then text phase
          if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
          cycleTimeoutRef.current = setTimeout(runTextPhase, GAP_CAR_TO_TEXT);
        });
      }, CAR_HOLD_DURATION);
    });
  }, [messages?.length, width, carTranslateX, carOpacity, rotatingOpacity]);

  const runTextPhaseStep = useCallback((step) => {
    if (step >= 3) {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = setTimeout(runCarPhase, GAP_CAR_TO_TEXT);
      return;
    }
    if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    cycleTimeoutRef.current = setTimeout(() => {
      Animated.timing(translateY, {
        toValue: -TICKER_ROW_HEIGHT,
        duration: SLIDE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        setIndex(i => (i + 1) % messages.length);
        translateY.setValue(TICKER_ROW_HEIGHT);
        Animated.timing(translateY, {
          toValue: 0,
          duration: SLIDE_DURATION,
          useNativeDriver: true,
        }).start(() => runTextPhaseStep(step + 1));
      });
    }, MSG_DISPLAY_DURATION);
  }, [messages?.length, translateY, runCarPhase]);

  const runTextPhase = useCallback(() => {
    if (!messages?.length) return;
    carOpacity.setValue(0);
    rotatingOpacity.setValue(1);
    setIndex(0);
    translateY.setValue(0);
    runTextPhaseStep(0);
  }, [messages?.length, carOpacity, rotatingOpacity, translateY, runTextPhaseStep]);

  useEffect(() => {
    if (!messages?.length) return;
    cycleTimeoutRef.current = setTimeout(runCarPhase, 400);
    return () => {
      if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    };
  }, [messages?.length, runCarPhase]);

  if (!messages?.length) return null;
  const current = messages[index];

  return (
    <View style={tickerStyles.wrap}>
      {/* Rotating messages – visible only during text phase */}
      <Animated.View style={[tickerStyles.clip, {opacity: rotatingOpacity}]}>
        <Animated.View
          style={[
            tickerStyles.textRow,
            { transform: [{ translateY }] },
          ]}>
          <Text style={tickerStyles.textEn} numberOfLines={1} ellipsizeMode="tail">{current.en}</Text>
          <Text style={tickerStyles.textSep}> · </Text>
          <Text style={tickerStyles.textTi} numberOfLines={1} ellipsizeMode="tail">{current.ti}</Text>
        </Animated.View>
      </Animated.View>
      {/* Car + tagline – visible only during car phase, moves right to left (forward) */}
      <Animated.View
        style={[
          tickerStyles.carWrap,
          {
            opacity: carOpacity,
            transform: [{ translateX: carTranslateX }],
          },
        ]}
        pointerEvents="none">
        <View style={tickerStyles.carRow}>
          <Text style={tickerStyles.carEmoji}>🚚</Text>
          <Text style={tickerStyles.carTagline}> — {CAR_TAGLINE} — </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const tickerStyles = StyleSheet.create({
  wrap: {
    minHeight: TICKER_ROW_HEIGHT,
    backgroundColor: '#FF0000',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.12)',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  clip: {
    minHeight: TICKER_ROW_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minHeight: TICKER_ROW_HEIGHT,
  },
  textEn: {
    flex: 1,
    fontSize: fs(11),
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: fs(18),
    textAlign: 'right',
  },
  textSep: {
    fontSize: fs(10),
    color: 'rgba(255,255,255,0.9)',
    marginHorizontal: 3,
    lineHeight: fs(18),
  },
  textTi: {
    flex: 1,
    fontSize: fs(11),
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: fs(18),
    textAlign: 'left',
  },
  carWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
  },
  carRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carEmoji: {
    fontSize: fs(16),
  },
  carTagline: {
    fontSize: fs(10),
    fontWeight: '700',
    color: '#ffffff',
    marginLeft: 4,
    lineHeight: fs(18),
    flexShrink: 1,
  },
});

// Render filled + half stars
const formatCount = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

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
            size={fs(10)}
            color="#FFD700"
          />
        );
      })}
      <Text style={[cardStyles.reviewCount, {color: subTextColor}]}>
        {formatCount(reviews)}
      </Text>
    </View>
  );
};

// Map any category string from the backend to the app's known category values
const normalizeCategory = raw => {
  const c = (raw || '').toLowerCase().replace(/[\s_]+/g, '-');
  const map = {
    'men': 'men-clothing', 'mens': 'men-clothing', 'men-clothing': 'men-clothing',
    'male': 'men-clothing', 'menswear': 'men-clothing', 'men-clothes': 'men-clothing',
    'women': 'women-clothing', 'womens': 'women-clothing', 'women-clothing': 'women-clothing',
    'female': 'women-clothing', 'womenswear': 'women-clothing', 'ladies': 'women-clothing',
    'kids': 'kids-clothing', 'children': 'kids-clothing', 'kids-clothing': 'kids-clothing',
    'boys': 'kids-clothing', 'girls': 'kids-clothing', 'baby': 'kids-clothing',
    'electronics': 'electronics', 'tech': 'electronics', 'gadgets': 'electronics', 'phones': 'electronics',
    'shoes': 'shoes', 'footwear': 'shoes', 'sneakers': 'shoes', 'boots': 'shoes',
    'accessories': 'accessories', 'accessory': 'accessories', 'jewelry': 'accessories', 'watches': 'accessories',
    'bags': 'bags', 'handbags': 'bags', 'luggage': 'bags', 'backpacks': 'bags',
    'sports': 'sports', 'sport': 'sports', 'fitness': 'sports', 'gym': 'sports',
    'beauty': 'beauty', 'cosmetics': 'beauty', 'skincare': 'beauty', 'makeup': 'beauty',
    'home': 'home', 'homeware': 'home', 'furniture': 'home', 'kitchen': 'home',
    'fashion': 'women-clothing', 'clothing': 'women-clothing', 'apparel': 'women-clothing',
    'toys': 'kids-clothing', 'toy': 'kids-clothing', 'games': 'kids-clothing',
  };
  return map[c] || c || 'other';
};

// Normalize backend product format → mobile app format
// Handles various field names, missing fields, and MongoDB _id
const normalizeProduct = p => {
  const priceNum = parseFloat(p.price) || 0;
  const discount = Math.max(0, parseInt(p.discount, 10) || 0);
  let originalPriceNum = p.originalPrice != null ? parseFloat(p.originalPrice) : null;
  if (originalPriceNum == null && discount > 0 && discount < 100) {
    originalPriceNum = priceNum / (1 - discount / 100);
  }

  // Tigrinya name — try every field name the backend might use
  const tigrinyaName =
    p.tigrinya || p.nameTi || p.name_ti || p.nameEri ||
    p.nameTigrinya || p.tigrinyaname || p.name; // fallback to English

  // Descriptions
  const descEn = p.descriptionEn || p.description_en || p.description || '';
  const descTi =
    p.descriptionTi || p.description_ti || p.tigrinya_description ||
    p.descriptionTigrinya || ''; // empty means product detail will show descEn

  // Primary image + gallery
  const primaryImage =
    p.image ||
    (Array.isArray(p.images) && p.images[0]) ||
    (Array.isArray(p.gallery) && p.gallery[0]) ||
    'https://via.placeholder.com/400x400?text=No+Image';
  const imageList =
    Array.isArray(p.images) && p.images.length > 0 ? p.images :
    Array.isArray(p.gallery) && p.gallery.length > 0 ? p.gallery :
    [primaryImage];

  return {
    id: String(p.id || p._id),
    name: p.name || p.title || 'Product',
    tigrinya: tigrinyaName,
    descriptionEn: descEn,
    descriptionTi: descTi,
    description: descTi || descEn,
    price: `€${priceNum.toFixed(2)}`,
    originalPrice: originalPriceNum != null ? `€${originalPriceNum.toFixed(2)}` : null,
    priceNum,
    originalPriceNum: originalPriceNum ?? null,
    image: primaryImage,
    images: imageList,
    category: normalizeCategory(p.category),
    rating: Math.round((parseFloat(p.rating) || 4.5) * 10) / 10,
    reviews: parseInt(p.reviews, 10) || parseInt(p.reviewCount, 10) || 0,
    sizes: Array.isArray(p.sizes) ? p.sizes : [],
    colors: Array.isArray(p.colors) ? p.colors : [],
    stock: p.stock != null ? parseInt(p.stock, 10) : 99,
    discount,
    featured: !!(p.featured || p.isFeatured),
    newArrival: !!(p.newArrival || p.new_arrival || p.isNew),
    bestseller: !!(p.bestseller || p.best_seller || p.isBestseller),
    flashSale: !!(p.flashSale || p.flash_sale || p.isFlashSale),
    flashPrice: p.flashPrice ?? null,
  };
};

const HomeScreen = ({navigation, isLoggedIn, scrollToTopKey}) => {
  const mainListRef = useRef(null);

  // Scroll to top when Home tab is tapped while already on Home
  useEffect(() => {
    if (scrollToTopKey > 0 && mainListRef.current) {
      mainListRef.current.scrollToOffset({offset: 0, animated: true});
    }
  }, [scrollToTopKey]);

  const {addToCart, cartItems} = useCart();
  const {theme, isDark, toggleTheme} = useTheme();
  const {getUnreadCount} = useNotifications();
  const {t, language} = useLanguage();
  const {recentlyViewed} = useRecentlyViewed();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [products, setProducts] = useState([]);
  const [interleavedProducts, setInterleavedProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [displayProducts, setDisplayProducts] = useState([]);
  const [networkFailed, setNetworkFailed] = useState(false);

  // ── Personalized recommendations based on recently viewed categories ──
  const recommendations = useMemo(() => {
    if (recentlyViewed.length === 0) return [];
    const viewedIds = new Set(recentlyViewed.map(p => p.id));
    // Count category frequency from recently viewed
    const catCount = {};
    recentlyViewed.forEach(p => {
      const cat = p.category || 'other';
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    // Sort categories by view frequency
    const sortedCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    // Pick products from preferred categories that user hasn't viewed
    const recs = [];
    for (const cat of sortedCats) {
      const catProducts = products.filter(p => p.category === cat && !viewedIds.has(p.id));
      const shuffled = [...catProducts].sort(() => Math.random() - 0.5);
      recs.push(...shuffled.slice(0, 4));
      if (recs.length >= 10) break;
    }
    // Fill remaining with top-rated products not viewed
    if (recs.length < 10) {
      const remaining = products
        .filter(p => !viewedIds.has(p.id) && !recs.find(r => r.id === p.id))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0));
      recs.push(...remaining.slice(0, 10 - recs.length));
    }
    return recs.slice(0, 10);
  }, [recentlyViewed, products]);

  const pageRef = React.useRef(1);
  const hasMoreRef = React.useRef(true);
  const loadingMoreRef = React.useRef(false);

  const fetchProducts = useCallback(async (reset = true) => {
    setNetworkFailed(false);
    if (reset) {
      pageRef.current = 1;
      hasMoreRef.current = true;
    }
    try {
      const data = await getProducts({limit: 40, page: pageRef.current});

      let raw = null;
      if (Array.isArray(data)) {
        raw = data;
      } else if (Array.isArray(data?.products) && data.products.length > 0) {
        raw = data.products;
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        raw = data.data;
      } else if (Array.isArray(data?.items) && data.items.length > 0) {
        raw = data.items;
      }

      if (raw && raw.length > 0) {
        const normalized = raw.map(normalizeProduct);
        if (reset) {
          setProducts(normalized);
          setInterleavedProducts(interleaveByCategory(normalized));
        } else {
          setProducts(prev => {
            const merged = [...prev, ...normalized];
            setInterleavedProducts(interleaveByCategory(merged));
            return merged;
          });
        }
        hasMoreRef.current = (data.page || 1) < (data.totalPages || 1);
      } else if (reset) {
        hasMoreRef.current = false;
      }
    } catch (err) {
      setNetworkFailed(true);
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
    }
  }, []);

  const fetchNextPage = useCallback(() => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    pageRef.current += 1;
    fetchProducts(false);
  }, [fetchProducts]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const filteredProducts = useMemo(() => {
    // For 'all' with no search — 80% clothing, 20% other
    if (selectedCategory === 'all' && !searchQuery) {
      const clothing = interleavedProducts.filter(p => CLOTHING_FOCUSED_CATEGORIES.has(p.category));
      const other = interleavedProducts.filter(p => !CLOTHING_FOCUSED_CATEGORIES.has(p.category));
      const result = [];
      let ci = 0, oi = 0;
      while (ci < clothing.length || oi < other.length) {
        for (let i = 0; i < 4 && ci < clothing.length; i++) result.push(clothing[ci++]);
        if (oi < other.length) result.push(other[oi++]);
      }
      return result;
    }

    // For specific categories or search — filter from full products array
    return products.filter(product => {
      let matchesCategory = true;
      if (selectedCategory === 'all') {
        matchesCategory = true;
      } else if (selectedCategory === 'new') {
        matchesCategory = !!product.newArrival;
      } else if (selectedCategory === 'sale') {
        matchesCategory = (product.discount || 0) > 0;
      } else {
        matchesCategory = product.category === selectedCategory;
      }
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, interleavedProducts, selectedCategory, searchQuery]);

  useEffect(() => {
    setDisplayProducts(filteredProducts.slice());
  }, [filteredProducts]);

  const loadMoreProducts = useCallback(() => {
    if (hasMoreRef.current) {
      fetchNextPage();
    } else if (filteredProducts.length > 0) {
      setDisplayProducts(prev => {
        const batch = shuffle(filteredProducts).slice(0, ENDLESS_CHUNK).map((p, i) => ({
          ...p,
          _listKey: `e-${prev.length + i}`,
        }));
        return prev.concat(batch);
      });
    }
  }, [filteredProducts, fetchNextPage]);

  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPad = TAB_HEIGHT + Math.max(insets.bottom, 8);

  const baseCategories = [
    {value: 'all', labelKey: 'catAll'},
    {value: 'men-clothing', labelKey: 'catMen'},
    {value: 'women-clothing', labelKey: 'catWomen'},
    {value: 'kids-clothing', labelKey: 'catKids'},
    {value: 'electronics', labelKey: 'catElectronics'},
    {value: 'shoes', labelKey: 'catShoes'},
    {value: 'accessories', labelKey: 'catAccessories'},
    {value: 'bags', labelKey: 'catBags'},
    {value: 'sports', labelKey: 'catSports'},
    {value: 'beauty', labelKey: 'catBeauty'},
    {value: 'home', labelKey: 'catHome'},
    {value: 'new', labelKey: 'catNew'},
    {value: 'sale', labelKey: 'catSale'},
  ];

  // Build category pills dynamically from products so any new backend
  // categories appear automatically, while keeping a stable, clothing-first
  // base order for the main ones.
  const categories = useMemo(() => {
    const known = new Set(baseCategories.map(c => c.value));
    const extrasSet = new Set(
      products
        .map(p => p.category)
        .filter(cat => cat && !known.has(cat) && cat !== 'other'),
    );

    const extras = Array.from(extrasSet).map(cat => ({
      value: cat,
      // Fallback label: capitalise raw category if we don't have a translation key.
      label: cat
        .split(/[-_]/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' '),
    }));

    return [
      // Base categories with translated labels
      ...baseCategories.map(c => ({value: c.value, label: t(c.labelKey)})),
      // Any additional categories coming from backend data
      ...extras,
    ];
  }, [products, t]);
  const numColumns = getNumColumns(width);
  const gap = 8;
  const hPad = 8;
  const CARD_WIDTH = (width - hPad * 2 - gap * (numColumns - 1)) / numColumns;
  const IMAGE_HEIGHT = CARD_WIDTH * 1.1; // ~80% of card visual

  const unreadNotifs = getUnreadCount();

  const renderProduct = ({item}) => (
    <TouchableOpacity
      style={[cardStyles.card, {backgroundColor: theme.cardBg, width: CARD_WIDTH}]}
      onPress={() => navigation.navigate('ProductDetail', {product: item})}
      activeOpacity={0.93}>

      {/* ── Image (80% of card) ──────────────── */}
      <View style={[cardStyles.imageWrapper, {height: IMAGE_HEIGHT}]}>
        <FastImage
          source={{uri: item.image, priority: FastImage.priority.normal}}
          style={cardStyles.image}
          resizeMode={FastImage.resizeMode.cover}
        />
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
              {item.reviews} {t('sold')}
            </Text>
          </View>
          <TouchableOpacity
            style={cardStyles.addBtn}
            onPress={() => { successTap(); addToCart({...item, quantity: 1, selected: true}); }}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Icon name="cart-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

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

      {/* Top bar: search, notification, theme only */}
      <TopBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder={t('searchPlaceholder')}
        searchRightSlot={
          <TouchableOpacity style={styles.cameraButton} onPress={() => navigation.navigate('CameraSearch', { products })}>
            <CameraIcon size={20} />
          </TouchableOpacity>
        }
        notificationCount={unreadNotifs}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <TickerStrip
          messages={[
            { en: t('ticker1En'), ti: t('ticker1Ti') },
            { en: t('ticker2En'), ti: t('ticker2Ti') },
            { en: t('ticker3En'), ti: t('ticker3Ti') },
          ]}
        />

      {networkFailed && (
        <View style={[styles.networkBanner, {backgroundColor: isDark ? 'rgba(255,100,100,0.2)' : '#fff0f0', borderColor: '#c00'}]}>
          <Text style={styles.networkBannerText}>{t('networkError')}</Text>
        </View>
      )}

      {/* Category Pills — small, many */}
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
                ]}
                numberOfLines={1}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Products Grid */}
      {initialLoading ? (
        <HomeScreenSkeleton />
      ) : (
        <FlatList
          ref={mainListRef}
          key={numColumns}
          data={displayProducts}
          renderItem={renderProduct}
          keyExtractor={item => item._listKey || item.id}
          onEndReached={loadMoreProducts}
          onEndReachedThreshold={0.4}
          numColumns={numColumns}
          columnWrapperStyle={numColumns > 1 ? [styles.row, {gap}] : null}
          contentContainerStyle={[styles.gridContainer, {paddingHorizontal: hPad, paddingBottom: bottomPad}]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={8}
          initialNumToRender={6}
          windowSize={5}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF0000']} tintColor="#FF0000" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, {color: theme.subText}]}>{t('noProducts')}</Text>
            </View>
          }
          ListHeaderComponent={
            <>
              <FlashSalesBanner
                navigation={navigation}
                theme={theme}
                products={products.filter(p => (p.discount || 0) > 0)}
                allProducts={products}
              />
              {recentlyViewed.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={[styles.recentTitle, {color: theme.text}]}>
                    🕐 {t('recentlyViewed')}
                  </Text>
                  <FlatList
                    horizontal
                    data={recentlyViewed}
                    keyExtractor={item => `rv-${item.id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingHorizontal: 8, gap: 8}}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[styles.recentCard, {backgroundColor: theme.cardBg}]}
                        onPress={() => navigation.navigate('ProductDetail', {product: item})}
                        activeOpacity={0.9}>
                        <FastImage source={{uri: item.image, priority: FastImage.priority.low}} style={styles.recentImage} resizeMode={FastImage.resizeMode.cover} />
                        <Text style={[styles.recentPrice, {color: theme.text}]} numberOfLines={1}>{item.price}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
              {recommendations.length > 0 && (
                <View style={styles.recentSection}>
                  <Text style={[styles.recentTitle, {color: theme.text}]}>
                    ✨ {t('recommendedForYou')}
                  </Text>
                  <FlatList
                    horizontal
                    data={recommendations}
                    keyExtractor={item => `rec-${item.id}`}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingHorizontal: 8, gap: 8}}
                    renderItem={({item}) => (
                      <TouchableOpacity
                        style={[styles.recCard, {backgroundColor: theme.cardBg}]}
                        onPress={() => navigation.navigate('ProductDetail', {product: item})}
                        activeOpacity={0.9}>
                        <FastImage source={{uri: item.image, priority: FastImage.priority.low}} style={styles.recImage} resizeMode={FastImage.resizeMode.cover} />
                        <View style={styles.recInfo}>
                          <Text style={[styles.recName, {color: theme.text}]} numberOfLines={2}>
                            {language === 'en' ? item.name : (item.tigrinya || item.name)}
                          </Text>
                          <Text style={styles.recPrice}>{item.price}</Text>
                          {item.originalPrice && (
                            <Text style={[styles.recOriginal, {color: theme.subText}]}>
                              {item.originalPrice}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ── Recently viewed styles ─────────────────────────────────────
// (included in styles below via StyleSheet reference — we add to main styles)

// ── Card styles ───────────────────────────────────────────────
const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#E60000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  discountText: {color: '#fff', fontSize: fs(11), fontWeight: '800'},
  info: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
  },
  name: {
    fontSize: fs(13),
    fontWeight: '600',
    lineHeight: fs(18),
    marginBottom: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: fs(11),
    marginLeft: 4,
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
    fontSize: fs(17),
    fontWeight: '800',
    color: '#E60000',
  },
  sold: {
    fontSize: fs(11),
    fontWeight: '500',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E60000',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E60000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    flexShrink: 0,
  },
  rrp: {
    fontSize: fs(11),
  },
  rrpStrike: {
    textDecorationLine: 'line-through',
    fontSize: fs(11),
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
  searchInput: {flex: 1, fontSize: fs(14), padding: 0},
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
    top: -2,
    right: -2,
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
  badgeText: {color: '#fff', fontSize: fs(10), fontWeight: 'bold'},
  networkBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  networkBannerText: {fontSize: fs(12), color: '#c00', textAlign: 'center'},
  categoryBar: {paddingVertical: 4, borderBottomWidth: 1},
  categoryList: {paddingHorizontal: 8, gap: 4},
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryText: {fontSize: fs(10), fontWeight: '600', lineHeight: fs(16), flexShrink: 0},
  gridContainer: {paddingTop: 6, paddingBottom: 12},
  row: {marginBottom: 6},
  emptyContainer: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60},
  emptyText: {fontSize: fs(16), fontWeight: '500'},
  recentSection: {paddingTop: 10, paddingBottom: 6},
  recentTitle: {fontSize: fs(15), fontWeight: 'bold', lineHeight: fs(22), paddingHorizontal: s(12), marginBottom: vs(8)},
  recentCard: {
    width: 80,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  recentImage: {width: 80, height: 80},
  recentPrice: {fontSize: fs(11), fontWeight: '700', lineHeight: fs(18), textAlign: 'center', paddingVertical: vs(4)},
  recCard: {
    width: 130,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  recImage: {width: 130, height: 130},
  recInfo: {paddingHorizontal: s(6), paddingVertical: vs(5)},
  recName: {fontSize: fs(11), fontWeight: '500', lineHeight: fs(18), marginBottom: vs(3)},
  recPrice: {fontSize: fs(14), fontWeight: 'bold', color: '#FF0000'},
  recOriginal: {fontSize: fs(10), textDecorationLine: 'line-through'},
});

export default HomeScreen;
