import React, {useState, useRef, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  FlatList,
  Share,
  TextInput,
  ActivityIndicator,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FastImage from 'react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {BackIcon, ShareIcon} from '../components/Icons';
import {TAB_HEIGHT} from '../components/BottomTabBar';
import {useNotifications} from '../context/NotificationsContext';
import {getProducts, getReviews, submitReview} from '../services/api';
import {getColorLabel} from '../utils/colorMap';
import {useRecentlyViewed} from '../context/RecentlyViewedContext';
import {lightTap, successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';

const formatCount = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const StarRowIon = ({rating, reviewCount, subTextColor}) => (
  <View style={simCardStyles.starRow}>
    {[1, 2, 3, 4, 5].map(s => {
      const filled = rating >= s;
      const half = !filled && rating >= s - 0.5;
      return (
        <Icon
          key={s}
          name={filled ? 'star' : half ? 'star-half' : 'star-outline'}
          size={fs(10)}
          color="#FFB800"
        />
      );
    })}
    <Text style={[simCardStyles.reviewCount, {color: subTextColor}]}>
      {formatCount(reviewCount)}
    </Text>
  </View>
);

const ProductDetailScreen = ({navigation, route}) => {
  const {product} = route.params;
  const {addToCart} = useCart();
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const {getUnreadCount} = useNotifications();
  const {addToRecentlyViewed} = useRecentlyViewed();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const bottomBarHeight = 80 + insets.bottom;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const flatListRef = useRef();
  const imageScrollRef = useRef();
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setSizeError(false);
    setColorError(false);
    setTimeout(() => {
      imageScrollRef.current?.scrollToOffset({offset: 0, animated: false});
      flatListRef.current?.scrollToOffset({offset: 0, animated: false});
    }, 100);
  }, [product.id]);

  useEffect(() => {
    addToRecentlyViewed(product);
  }, [product.id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} — ${product.price}\nhttps://azmarino.online/product/${product.id}`,
      });
    } catch {}
  };

  const [reviews, setReviews] = useState([]);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    if (product?.id) {
      getReviews(product.id).then(data => {
        if (data?.reviews) setReviews(data.reviews);
      }).catch(() => {});
    }
  }, [product?.id]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      const data = await submitReview(product.id, reviewRating, reviewComment.trim());
      if (data?.review) {
        setReviews(prev => [data.review, ...prev]);
        setShowWriteReview(false);
        setReviewRating(0);
        setReviewComment('');
        setReviewMsg(t('reviewThankYou'));
      }
    } catch (err) {
      setReviewMsg(err.response?.data?.message || t('verifyError'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const [similarPool, setSimilarPool] = useState([]);
  const [displaySimilar, setDisplaySimilar] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts({limit: 20, category: product.category});
        const raw = Array.isArray(data) ? data : (data?.products || data?.data || []);
        const filtered = raw.filter(p => String(p._id || p.id) !== String(product._id || product.id));
        if (!cancelled) {
          const pool = shuffle(filtered);
          setSimilarPool(pool);
          setDisplaySimilar(pool.slice(0, 10));
        }
      } catch (err) {}
    })();
    return () => { cancelled = true; };
  }, [product.id]);

  const handleAddToCart = async () => {
    const token = await AsyncStorage.getItem('azmarino_token');
    if (!token) { setShowLoginModal(true); return; }
    if (product.sizes?.length > 0 && !selectedSize) { setSizeError(true); lightTap(); return; }
    if (product.colors?.length > 0 && !selectedColor) { setColorError(true); lightTap(); return; }
    successTap();
    addToCart({ ...product, originalId: product.id, quantity, selectedSize, selectedColor, selected: true });
  };

  const handleBuyNow = async () => {
    const token = await AsyncStorage.getItem('azmarino_token');
    if (!token) { setShowLoginModal(true); return; }
    if (product.sizes?.length > 0 && !selectedSize) { setSizeError(true); lightTap(); return; }
    if (product.colors?.length > 0 && !selectedColor) { setColorError(true); lightTap(); return; }
    successTap();
    addToCart({ ...product, originalId: product.id, quantity, selectedSize, selectedColor, selected: true });
    navigation.navigate('Cart');
  };

  const renderSimilarCard = ({item}) => (
    <TouchableOpacity
      style={[simCardStyles.card, {backgroundColor: theme.cardBg, width: (width - 32) / 2}]}
      onPress={() => navigation.push('ProductDetail', {product: item})}
      activeOpacity={0.9}>
      <FastImage source={{uri: item.image}} style={{width: '100%', height: 180}} resizeMode="cover" />
      <View style={{padding: 10}}>
        <Text style={{color: theme.text, fontSize: fs(12), fontWeight: '600'}} numberOfLines={1}>{item.name}</Text>
        <Text style={{color: '#E60000', fontSize: fs(14), fontWeight: '800', marginTop: 4}}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const ListHeader = useMemo(() => (
    <View>
      {/* Image Gallery */}
      <View style={{width, height: width, backgroundColor: '#f5f5f5'}}>
        <FlatList
          ref={imageScrollRef}
          data={product.images || [product.image]}
          renderItem={({item}) => <FastImage source={{uri: item}} style={{width, height: width}} resizeMode="cover" />}
          keyExtractor={(_, i) => `img-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setSelectedImage(Math.round(e.nativeEvent.contentOffset.x / width))}
        />
        <View style={styles.imageIndicators}>
          {(product.images || [product.image]).map((_, i) => (
            <View key={i} style={[styles.indicator, selectedImage === i && {backgroundColor: '#E60000', width: 20}]} />
          ))}
        </View>
      </View>

      {/* Info Section */}
      <View style={{padding: 20, backgroundColor: theme.cardBg}}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
          <View style={{flex: 1}}>
            <Text style={{fontSize: fs(22), fontWeight: '800', color: theme.text, marginBottom: 8}}>
              {language === 'ti' ? (product.tigrinya || product.name) : product.name}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
              <StarRowIon rating={product.rating} reviewCount={product.reviews} subTextColor={theme.subText} />
              <Text style={{fontSize: fs(12), color: '#10B981', fontWeight: '700'}}>✓ {t('inStock')}</Text>
            </View>
          </View>
        </View>

        <View style={{flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 20}}>
          <Text style={{fontSize: fs(32), fontWeight: '900', color: '#E60000'}}>{product.price}</Text>
          {product.originalPrice && (
            <Text style={{fontSize: fs(18), color: theme.subText, textDecorationLine: 'line-through'}}>{product.originalPrice}</Text>
          )}
        </View>
      </View>

      {/* Options */}
      <View style={{padding: 20, backgroundColor: theme.cardBg, borderTopWidth: 1, borderTopColor: theme.border}}>
        {product.colors?.length > 0 && (
          <View style={{marginBottom: 24}}>
            <Text style={{fontSize: fs(14), fontWeight: '800', color: theme.text, marginBottom: 12, textTransform: 'uppercase'}}>{t('selectColor')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap: 12}}>
              {product.colors.map(c => (
                <TouchableOpacity 
                  key={c} 
                  onPress={() => {setSelectedColor(c); setColorError(false); lightTap();}}
                  style={[styles.colorCircle, {backgroundColor: c.toLowerCase()}, selectedColor === c && {borderColor: '#E60000', borderWidth: 3}]} 
                />
              ))}
            </ScrollView>
            {colorError && <Text style={{color: '#E60000', fontSize: 12, marginTop: 4}}>⚠️ {t('selectColor')}</Text>}
          </View>
        )}

        {product.sizes?.length > 0 && (
          <View style={{marginBottom: 24}}>
            <Text style={{fontSize: fs(14), fontWeight: '800', color: theme.text, marginBottom: 12, textTransform: 'uppercase'}}>{t('selectSize')}</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
              {product.sizes.map(s => (
                <TouchableOpacity 
                  key={s} 
                  onPress={() => {setSelectedSize(s); setSizeError(false); lightTap();}}
                  style={[styles.sizePill, {backgroundColor: theme.bg, borderColor: theme.border}, selectedSize === s && {backgroundColor: '#E60000', borderColor: '#E60000'}]}
                >
                  <Text style={{fontSize: fs(14), fontWeight: '700', color: selectedSize === s ? '#fff' : theme.text}}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {sizeError && <Text style={{color: '#E60000', fontSize: 12, marginTop: 4}}>⚠️ {t('selectSize')}</Text>}
          </View>
        )}

        <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Text style={{fontSize: fs(14), fontWeight: '800', color: theme.text, textTransform: 'uppercase'}}>{t('quantity')}</Text>
          <View style={styles.qtyContainer}>
            <TouchableOpacity onPress={() => {setQuantity(Math.max(1, quantity - 1)); lightTap();}} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>-</Text></TouchableOpacity>
            <Text style={{width: 40, textAlign: 'center', fontSize: 18, fontWeight: '800', color: theme.text}}>{quantity}</Text>
            <TouchableOpacity onPress={() => {setQuantity(quantity + 1); lightTap();}} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={{padding: 20, backgroundColor: theme.cardBg, borderTopWidth: 1, borderTopColor: theme.border}}>
        <Text style={{fontSize: fs(16), fontWeight: '800', color: theme.text, marginBottom: 12}}>{t('description')}</Text>
        <Text style={{fontSize: fs(14), color: theme.subText, lineHeight: 22}}>
          {language === 'ti' ? (product.descriptionTi || product.description) : (product.descriptionEn || product.description)}
        </Text>
      </View>

      {/* Reviews */}
      <View style={{padding: 20, backgroundColor: theme.cardBg, borderTopWidth: 1, borderTopColor: theme.border}}>
        <Text style={{fontSize: fs(16), fontWeight: '800', color: theme.text, marginBottom: 20}}>{t('reviewsSectionTitle')} ({reviews.length})</Text>
        {reviews.slice(0, 3).map((r, i) => (
          <View key={i} style={{marginBottom: 16, paddingBottom: 16, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: theme.border}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
              <Text style={{fontWeight: '700', color: theme.text}}>{r.name}</Text>
              <Text style={{color: '#FFB800'}}>{'★'.repeat(r.rating)}</Text>
            </View>
            <Text style={{color: theme.subText, fontSize: 13}}>{r.comment}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowWriteReview(true)}>
          <Text style={{color: '#E60000', fontWeight: '700'}}>{t('writeReview')}</Text>
        </TouchableOpacity>
      </View>

      {/* Similar title */}
      {displaySimilar.length > 0 && (
        <View style={{padding: 20}}>
          <Text style={{fontSize: fs(18), fontWeight: '800', color: theme.text}}>{t('similarProducts')}</Text>
        </View>
      )}
    </View>
  ), [product, selectedImage, selectedSize, selectedColor, quantity, sizeError, colorError, theme, language, t, width, reviews, displaySimilar.length]);

  return (
    <View style={{flex: 1, backgroundColor: theme.bg}}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} transparent backgroundColor="transparent" />
      
      {/* Floating Header */}
      <Animated.View style={[styles.floatingHeader, {backgroundColor: theme.cardBg, opacity: headerOpacity, paddingTop: insets.top}]}>
        <Text style={{fontSize: 16, fontWeight: '800', color: theme.text, flex: 1, textAlign: 'center'}} numberOfLines={1}>
          {language === 'ti' ? (product.tigrinya || product.name) : product.name}
        </Text>
      </Animated.View>

      <View style={[styles.backShareRow, {top: insets.top + 10}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconCircle}><BackIcon size={24} color={theme.text} /></TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.iconCircle}><ShareIcon size={22} color={theme.text} /></TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={displaySimilar}
        renderItem={renderSimilarCard}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{gap: 12, paddingHorizontal: 16}}
        contentContainerStyle={{paddingBottom: bottomBarHeight + 20}}
        ListHeaderComponent={ListHeader}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {y: scrollY}}}], {useNativeDriver: true})}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Bar */}
      <View style={[styles.stickyBottom, {paddingBottom: insets.bottom + 12}]}>
        <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
          <Text style={{color: '#E60000', fontWeight: '800', fontSize: 16}}>{t('addToCart')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuyNow}>
          <Text style={{color: '#fff', fontWeight: '800', fontSize: 16}}>{t('buyNow')}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, {backgroundColor: theme.cardBg}]}>
            <Text style={[styles.modalTitle, {color: theme.text}]}>{t('loginRequired')}</Text>
            <Text style={{color: theme.subText, textAlign: 'center', marginBottom: 24}}>{t('loginRequiredMsg')}</Text>
            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => {setShowLoginModal(false); navigation.navigate('Login');}}>
              <Text style={styles.modalPrimaryBtnText}>{t('loginBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLoginModal(false)} style={{padding: 12}}><Text style={{color: theme.subText}}>{t('cancel')}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const simCardStyles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  reviewCount: { fontSize: fs(10), marginLeft: 4 }
});

const styles = StyleSheet.create({
  floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, height: 90, zIndex: 10, justifyContent: 'center', paddingHorizontal: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  backShareRow: { position: 'absolute', left: 16, right: 16, zIndex: 11, flexDirection: 'row', justifyContent: 'space-between' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  imageIndicators: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 20, left: 0, right: 0, gap: 6 },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(0,0,0,0.05)' },
  sizePill: { minWidth: 50, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 4 },
  qtyBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  qtyBtnText: { fontSize: 20, fontWeight: '800', color: '#111827' },
  secondaryBtn: { width: '100%', height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#E60000', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  stickyBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', shadowColor: '#000', shadowOffset: {width: 0, height: -4}, shadowOpacity: 0.03, shadowRadius: 8, elevation: 10 },
  cartBtn: { flex: 1, height: 54, borderRadius: 14, borderWidth: 2, borderColor: '#E60000', alignItems: 'center', justifyContent: 'center' },
  buyBtn: { flex: 1, height: 54, borderRadius: 14, backgroundColor: '#E60000', alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { padding: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32, alignItems: 'center' },
  modalTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12 },
  modalPrimaryBtn: { width: '100%', height: 56, borderRadius: 16, backgroundColor: '#E60000', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalPrimaryBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default ProductDetailScreen;
