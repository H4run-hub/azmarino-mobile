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
} from 'react-native';
import FastImage from 'react-native-fast-image';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {BackIcon, ShareIcon} from '../components/Icons';
import BackBar from '../components/BackBar';
import {TAB_HEIGHT} from '../components/BottomTabBar';
import {useNotifications} from '../context/NotificationsContext';
import {getProducts, getReviews, submitReview} from '../services/api';
import {getColorLabel} from '../utils/colorMap';
import {useRecentlyViewed} from '../context/RecentlyViewedContext';
import {successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';

// ─── Format large numbers (e.g. 1234 → "1.2k") ─────────────────────────────
const formatCount = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};


// ─── Shuffle helper ──────────────────────────────────────────────────────────
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Ionicons star row (matches HomeScreen) ──────────────────────────────────
const StarRowIon = ({rating, reviewCount, subTextColor}) => (
  <View style={simCardStyles.starRow}>
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
    <Text style={[simCardStyles.reviewCount, {color: subTextColor}]}>
      {formatCount(reviewCount)}
    </Text>
  </View>
);

// ──────────────────────────────────────────────────────────────────────────────

const ProductDetailScreen = ({navigation, route}) => {
  const {product} = route.params;
  const {addToCart} = useCart();
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const {getUnreadCount} = useNotifications();
  const {addToRecentlyViewed} = useRecentlyViewed();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const tabBarBottom = TAB_HEIGHT + Math.max(insets.bottom, 8);
  const bottomBarHeight = 64; // matches bar height (16px padding + buttons) so no gap

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const flatListRef = useRef();
  const imageScrollRef = useRef();
  const imageIndexRef = useRef(0);
  const reviewsSectionY = useRef(0);
  const colorSectionY = useRef(0);
  const sizeSectionY = useRef(0);

  // Reset scroll + selection when product changes (user tapped a similar product)
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setSizeError(false);
    setColorError(false);
    imageIndexRef.current = 0;
    // Delay scroll reset so refs are attached after FlatList re-mounts
    setTimeout(() => {
      imageScrollRef.current?.scrollToOffset({offset: 0, animated: false});
      flatListRef.current?.scrollToOffset({offset: 0, animated: false});
    }, 100);
  }, [product.id]);

  // Track recently viewed
  useEffect(() => {
    addToRecentlyViewed(product);
  }, [product.id]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} — ${product.price} ${product.originalPrice ? `(was ${product.originalPrice})` : ''}\nhttps://azmarino.online/product/${product.id}`,
      });
    } catch {}
  };

  // Real reviews from API
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
    setReviewMsg('');
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

  // Similar products pool: fetched from API
  const [similarPool, setSimilarPool] = useState([]);
  const [displaySimilar, setDisplaySimilar] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts({limit: 50, category: product.category});
        const raw = Array.isArray(data) ? data : (data?.products || data?.data || []);
        const filtered = raw.filter(p => String(p._id || p.id) !== String(product._id || product.id));
        if (!cancelled) {
          const pool = shuffle(filtered);
          setSimilarPool(pool);
          setDisplaySimilar(pool.slice(0, 8).map((p, i) => ({...p, _listKey: `s-${i}`})));
        }
      } catch (err) {
        if (__DEV__) console.warn('Failed to fetch similar products:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [product._id, product.id, product.category]);

  const loadMoreSimilar = useCallback(() => {
    if (similarPool.length === 0) return;
    setDisplaySimilar(prev => {
      const batch = shuffle(similarPool).slice(0, 8).map((p, i) => ({
        ...p,
        _listKey: `e-${prev.length + i}`,
      }));
      return prev.concat(batch);
    });
  }, [similarPool]);

  const validate = () => {
    let ok = true;
    let scrollTarget = null;
    if (product.colors?.length > 0 && !selectedColor) {
      setColorError(true);
      ok = false;
      if (!scrollTarget && colorSectionY.current > 0) scrollTarget = colorSectionY.current;
    }
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      ok = false;
      if (!scrollTarget && sizeSectionY.current > 0) scrollTarget = sizeSectionY.current;
    }
    // Scroll to the first error section so user sees what's missing
    if (!ok && scrollTarget && flatListRef.current) {
      flatListRef.current.scrollToOffset({offset: scrollTarget - 10, animated: true});
    }
    return ok;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    successTap();
    addToCart({
      ...product,
      originalId: product.id,
      quantity,
      selectedSize,
      selectedColor,
      selected: true,
    });
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    successTap();
    addToCart({
      ...product,
      originalId: product.id,
      quantity,
      selectedSize,
      selectedColor,
      selected: true,
    });
    navigation.navigate('Cart');
  };

  const scrollToReviews = () => {
    if (flatListRef.current && reviewsSectionY.current > 0) {
      flatListRef.current.scrollToOffset({offset: reviewsSectionY.current - 10, animated: true});
    }
  };

  const handleSeeAllProducts = () => {
    navigation.resetStack('Home');
  };

  const handleSimilarProduct = (similarProduct) => {
    navigation.push('ProductDetail', {product: similarProduct});
  };

  // Emoji star row (for reviews section)
  const renderStars = (rating, size = 16) => (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map(star => (
        <Text key={star} style={{fontSize: size}}>
          {star <= Math.floor(rating) ? '⭐' : star - 0.5 <= rating ? '⭐' : '☆'}
        </Text>
      ))}
    </View>
  );

  // Similar products card dimensions (matches HomeScreen)
  const simGap = 8;
  const simHPad = 8;
  const SIM_CARD_WIDTH = (width - simHPad * 2 - simGap) / 2;
  const SIM_IMAGE_HEIGHT = SIM_CARD_WIDTH * 1.1;

  // Render a similar product card (same style as HomeScreen)
  const renderSimilarCard = ({item}) => (
    <TouchableOpacity
      style={[simCardStyles.card, {backgroundColor: theme.cardBg, width: SIM_CARD_WIDTH}]}
      onPress={() => handleSimilarProduct(item)}
      activeOpacity={0.93}>
      <View style={[simCardStyles.imageWrapper, {height: SIM_IMAGE_HEIGHT}]}>
        <FastImage source={{uri: item.image, priority: FastImage.priority.low}} style={simCardStyles.image} resizeMode={FastImage.resizeMode.cover} />
      </View>
      <View style={simCardStyles.info}>
        <StarRowIon rating={item.rating} reviewCount={item.reviews} subTextColor={theme.subText} />
        <View style={simCardStyles.priceRow}>
          <View style={simCardStyles.priceBlock}>
            <Text style={simCardStyles.price}>{item.price}</Text>
            <Text style={[simCardStyles.sold, {color: theme.subText}]}>
              {formatCount(item.reviews)} {t('sold')}
            </Text>
          </View>
          <TouchableOpacity
            style={simCardStyles.addBtn}
            onPress={() => addToCart({...item, quantity: 1, selected: true})}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Icon name="cart-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Image gallery carousel (standalone to avoid FlatList header remount) ──
  const renderGalleryImage = useCallback(({item: img}) => (
    <FastImage
      source={{uri: img, priority: FastImage.priority.high}}
      style={{width, height: width, backgroundColor: '#f5f5f5'}}
      resizeMode={FastImage.resizeMode.cover}
    />
  ), [width]);

  const onGalleryScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (imageIndexRef.current !== idx) {
      imageIndexRef.current = idx;
      setSelectedImage(idx);
    }
  }, [width]);

  const galleryKeyExtractor = useCallback((_, index) => `img-${index}`, []);

  // ─── All product detail content rendered as FlatList header ────────────────
  const ListHeader = useMemo(() => (
    <View>
      {/* Image Gallery */}
      <View style={styles.imageSection}>
        <FlatList
          ref={imageScrollRef}
          data={product.images || [product.image || 'https://via.placeholder.com/400x400?text=No+Image']}
          renderItem={renderGalleryImage}
          keyExtractor={galleryKeyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onGalleryScroll}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({length: width, offset: width * index, index})}
          initialScrollIndex={0}
        />
        <View style={styles.imageIndicators}>
          {(product.images || [product.image || 'https://via.placeholder.com/400x400?text=No+Image']).map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                selectedImage === index && styles.indicatorActive,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Product Info */}
      <View style={[styles.infoSection, {backgroundColor: theme.cardBg}]}>
        <Text style={[styles.productName, {color: theme.text}]}>
          {language === 'ti' ? (product.tigrinya || product.name) : product.name}
        </Text>

        <TouchableOpacity
          style={styles.ratingRow}
          onPress={scrollToReviews}
          activeOpacity={0.6}>
          {renderStars(product.rating)}
          <Text style={[styles.ratingText, {color: theme.subText}]}>
            {Number(product.rating).toFixed(1)} ({formatCount(product.reviews)} {t('reviews')})
          </Text>
          <Text style={styles.ratingArrow}>▼</Text>
        </TouchableOpacity>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.price}</Text>
          {product.originalPrice != null && <Text style={styles.originalPrice}>{product.originalPrice}</Text>}
        </View>
      </View>

      {/* Color Selection */}
      {product.colors?.length > 0 && (
        <View
          style={[styles.section, {backgroundColor: theme.cardBg}]}
          onLayout={e => { colorSectionY.current = e.nativeEvent.layout.y; }}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('selectColor')}:</Text>
          <View style={styles.optionGrid}>
            {product.colors.map(color => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.optionButton,
                  {borderColor: colorError && !selectedColor ? '#FF0000' : theme.border},
                  selectedColor === color && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setSelectedColor(color);
                  setColorError(false);
                }}>
                <Text
                  style={[
                    styles.optionText,
                    {color: theme.text},
                    selectedColor === color && styles.optionTextActive,
                  ]}>
                  {getColorLabel(color, t)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {colorError && !selectedColor && (
            <Text style={styles.selectionError}>⚠️ {t('selectColor')}</Text>
          )}
        </View>
      )}

      {/* Size Selection */}
      {product.sizes?.length > 0 && (
        <View
          style={[styles.section, {backgroundColor: theme.cardBg}]}
          onLayout={e => { sizeSectionY.current = e.nativeEvent.layout.y; }}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('selectSize')}:</Text>
          <View style={styles.optionGrid}>
            {product.sizes.map(size => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.sizeButton,
                  {borderColor: sizeError && !selectedSize ? '#FF0000' : theme.border},
                  selectedSize === size && styles.optionButtonActive,
                ]}
                onPress={() => {
                  setSelectedSize(size);
                  setSizeError(false);
                }}>
                <Text
                  style={[
                    styles.sizeText,
                    {color: theme.text},
                    selectedSize === size && styles.optionTextActive,
                  ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {sizeError && !selectedSize && (
            <Text style={styles.selectionError}>⚠️ {t('selectSize')}</Text>
          )}
        </View>
      )}

      {/* Quantity */}
      <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('quantity')}:</Text>
        <View style={styles.quantityRow}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.max(1, quantity - 1))}>
            <Text style={styles.qtyBtnText}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.qtyValue, {color: theme.text}]}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}>
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
          <Text style={[styles.stockText, {color: theme.subText}]}>
            ({product.stock} {t('inStock')})
          </Text>
        </View>
      </View>

      {/* Description */}
      <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('description')}:</Text>
        <Text style={[styles.description, {color: theme.subText}]}>
          {language === 'ti'
            ? (product.descriptionTi || product.descTi || product.description)
            : (product.descriptionEn || product.description)}
        </Text>
      </View>

      {/* Reviews Section */}
      <View
        style={[styles.section, {backgroundColor: theme.cardBg}]}
        onLayout={e => {
          reviewsSectionY.current = e.nativeEvent.layout.y;
        }}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('reviewsSectionTitle')}
        </Text>

        <View style={styles.ratingSummary}>
          <View style={styles.ratingSummaryLeft}>
            <Text style={[styles.bigRating, {color: theme.text}]}>{Number(product.rating).toFixed(1)}</Text>
            <Text style={[styles.outOf5, {color: theme.subText}]}>{t('outOf5')}</Text>
          </View>
          <View style={styles.ratingSummaryRight}>
            {renderStars(product.rating, 20)}
            <Text style={[styles.totalReviews, {color: theme.subText}]}>
              {formatCount(product.reviews)} {t('reviewsCount')}
            </Text>
          </View>
        </View>

        {/* Write Review button */}
        <TouchableOpacity
          style={[styles.writeReviewBtn, {borderColor: '#FF0000'}]}
          onPress={() => setShowWriteReview(prev => !prev)}>
          <Text style={styles.writeReviewBtnText}>{t('writeReview')}</Text>
        </TouchableOpacity>

        {reviewMsg ? (
          <Text style={[styles.reviewMsg, {color: reviewMsg.includes('Thank') || reviewMsg.includes('ነቶ') ? '#27ae60' : '#FF0000'}]}>
            {reviewMsg}
          </Text>
        ) : null}

        {/* Write Review form */}
        {showWriteReview && (
          <View style={[styles.writeReviewForm, {borderColor: theme.border}]}>
            <Text style={[styles.tapToRate, {color: theme.subText}]}>{t('tapToRate')}</Text>
            <View style={styles.reviewStarsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                  <Text style={{fontSize: 28}}>{star <= reviewRating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.reviewInput, {backgroundColor: theme.cardBg, color: theme.text, borderColor: theme.border}]}
              placeholder={t('reviewPlaceholder')}
              placeholderTextColor={theme.subText}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[styles.submitReviewBtn, (reviewRating === 0 || !reviewComment.trim() || reviewSubmitting) && {opacity: 0.5}]}
              onPress={handleSubmitReview}
              disabled={reviewRating === 0 || !reviewComment.trim() || reviewSubmitting}>
              {reviewSubmitting
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.submitReviewText}>{t('submitReview')}</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Review list */}
        {reviews.length > 0 ? (
          reviews.map(review => (
            <View key={review.id} style={[styles.reviewCard, {borderColor: theme.border}]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerAvatarText}>
                      {review.name.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.reviewerName, {color: theme.text}]}>
                      {review.name}
                    </Text>
                    {review.verified && (
                      <Text style={styles.verifiedBadge}>
                        ✓ {t('verifiedPurchase')}
                      </Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.reviewDate, {color: theme.subText}]}>
                  {review.date}
                </Text>
              </View>
              <View style={styles.reviewStarsRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <Text key={star} style={{fontSize: 14}}>
                    {star <= review.rating ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
              <Text style={[styles.reviewComment, {color: theme.text}]}>
                {review.comment}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.noReviews, {color: theme.subText}]}>
            {t('noReviewsYet')}
          </Text>
        )}
      </View>

      {/* Similar Products title */}
      {displaySimilar.length > 0 && (
        <View style={{paddingTop: 12, paddingHorizontal: simHPad, paddingBottom: 8}}>
          <Text style={[styles.sectionTitle, {color: theme.text, marginBottom: 0}]}>
            {t('similarProducts')}
          </Text>
        </View>
      )}
    </View>
  ), [product, selectedImage, selectedSize, selectedColor, quantity, sizeError, colorError, theme, language, t, width, displaySimilar.length]);

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.bg}]}
      edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />

      <View style={[styles.headerBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} style={styles.headerBtn}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{flex: 1}} />
        <TouchableOpacity onPress={handleShare} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} style={styles.headerBtn}>
          <ShareIcon size={22} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Single FlatList: header = product detail, data = similar products */}
      <FlatList
        key={product.id}
        ref={flatListRef}
        data={displaySimilar}
        renderItem={renderSimilarCard}
        keyExtractor={item => item._listKey || item.id}
        numColumns={2}
        columnWrapperStyle={{gap: simGap}}
        contentContainerStyle={{paddingBottom: bottomBarHeight}}
        ListHeaderComponent={<>{ListHeader}</>}
        onEndReached={loadMoreSimilar}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.seeAllRow, {backgroundColor: theme.cardBg, borderColor: theme.border}]}
            onPress={handleSeeAllProducts}
            activeOpacity={0.7}>
            <Text style={[styles.seeAllText, {color: theme.text}]}>{t('seeAllProducts')}</Text>
            <Text style={styles.seeAllArrow}>→</Text>
          </TouchableOpacity>
        }
      />

      {/* Bottom Action Bar — more padding so buttons have space on all sides */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.cardBg,
            borderTopColor: theme.border,
            bottom: 0,
            paddingVertical: 10,
            paddingHorizontal: 12,
          },
        ]}>
        <TouchableOpacity style={[styles.addToCartButton, {borderColor: '#FF0000', backgroundColor: theme.cardBg}]} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>{t('addToCart')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>{t('buyNow')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Similar product card styles (matches HomeScreen exactly) ────────────────
const simCardStyles = StyleSheet.create({
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
  reviewCount: {
    fontSize: fs(10),
    marginLeft: 2,
    lineHeight: fs(16),
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
    fontSize: fs(15),
    fontWeight: 'bold',
    color: '#FF0000',
    lineHeight: fs(22),
  },
  sold: {
    fontSize: fs(10),
    lineHeight: fs(16),
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
});

// ─── Main styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  headerBtn: {padding: 4},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {fontSize: fs(17), fontWeight: 'bold', flex: 1, flexShrink: 1, textAlign: 'center', marginHorizontal: 8, lineHeight: fs(24)},
  imageSection: {position: 'relative'},
  mainImage: {backgroundColor: '#f5f5f5'},
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginHorizontal: 4,
  },
  indicatorActive: {backgroundColor: '#fff', width: 24},
  infoSection: {padding: 14, marginBottom: 4},
  productName: {fontSize: fs(13), fontWeight: '500', marginBottom: vs(6), lineHeight: fs(20)},
  ratingRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  stars: {flexDirection: 'row', marginRight: 8},
  ratingText: {fontSize: fs(13), lineHeight: fs(20)},
  ratingArrow: {
    fontSize: fs(12),
    color: '#FF0000',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  priceRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'},
  price: {fontSize: fs(26), fontWeight: 'bold', color: '#FF0000', marginRight: 10, lineHeight: fs(34)},
  originalPrice: {
    fontSize: fs(16),
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
    lineHeight: fs(22),
  },
  section: {padding: s(12), marginBottom: 4},
  sectionTitle: {fontSize: fs(14), fontWeight: 'bold', marginBottom: vs(6), flexShrink: 0, lineHeight: fs(20)},
  optionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 5},
  optionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
  },
  sizeButton: {
    minWidth: 40,
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {borderColor: '#FF0000', backgroundColor: '#fff3f3'},
  optionText: {fontSize: fs(12), fontWeight: '600', lineHeight: fs(18)},
  sizeText: {fontSize: fs(14), fontWeight: 'bold', lineHeight: fs(20)},
  optionTextActive: {color: '#FF0000'},
  selectionError: {
    color: '#FF0000',
    fontSize: fs(12),
    fontWeight: '600',
    marginTop: 6,
    lineHeight: fs(18),
  },
  quantityRow: {flexDirection: 'row', alignItems: 'center'},
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {color: '#fff', fontSize: fs(18), fontWeight: 'bold', lineHeight: fs(22)},
  qtyValue: {
    fontSize: fs(16),
    fontWeight: 'bold',
    marginHorizontal: 14,
    minWidth: 26,
    textAlign: 'center',
  },
  stockText: {fontSize: fs(12), marginLeft: 8, lineHeight: fs(18)},
  description: {fontSize: fs(14), lineHeight: fs(22)},

  // Reviews
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,0,0,0.04)',
    borderRadius: 4,
    padding: 4,
    marginBottom: 2,
  },
  ratingSummaryLeft: {
    alignItems: 'center',
    marginRight: 20,
  },
  bigRating: {
    fontSize: fs(18),
    fontWeight: 'bold',
    lineHeight: fs(24),
  },
  outOf5: {
    fontSize: fs(11),
    marginTop: 2,
    lineHeight: fs(18),
  },
  ratingSummaryRight: {
    flex: 1,
  },
  totalReviews: {
    fontSize: fs(10),
    marginTop: 4,
    lineHeight: fs(16),
  },
  reviewCard: {
    borderTopWidth: 1,
    paddingTop: 1,
    paddingBottom: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 17,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  reviewerAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: fs(10),
  },
  reviewerName: {
    fontSize: fs(14),
    fontWeight: '600',
    lineHeight: fs(20),
  },
  verifiedBadge: {
    fontSize: fs(9),
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 1,
    lineHeight: fs(16),
  },
  reviewDate: {
    fontSize: fs(10),
    lineHeight: fs(16),
  },
  reviewStarsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  reviewComment: {
    fontSize: fs(11),
    lineHeight: fs(20),
  },
  noReviews: {
    fontSize: fs(14),
    textAlign: 'center',
    paddingVertical: 20,
    lineHeight: fs(20),
  },
  writeReviewBtn: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewBtnText: {
    color: '#FF0000',
    fontSize: fs(14),
    fontWeight: '700',
  },
  reviewMsg: {
    fontSize: fs(13),
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  writeReviewForm: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  tapToRate: {
    fontSize: fs(12),
    marginBottom: 6,
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: fs(14),
    minHeight: 80,
    textAlignVertical: 'top',
    marginTop: 10,
    marginBottom: 12,
  },
  submitReviewBtn: {
    backgroundColor: '#FF0000',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitReviewText: {
    color: '#fff',
    fontSize: fs(15),
    fontWeight: 'bold',
  },

  // Bottom bar — sits directly above tab bar (no gap; tab bar's borderTop is the line)
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  addToCartButton: {
    flex: 1,
    borderWidth: 1.5,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {color: '#FF0000', fontSize: fs(13), fontWeight: '700', lineHeight: fs(20)},
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {color: '#fff', fontSize: fs(13), fontWeight: '700'},
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  seeAllText: {fontSize: fs(15), fontWeight: '600'},
  seeAllArrow: {fontSize: fs(18), color: '#FF0000', marginLeft: 6, fontWeight: 'bold'},
  similarInfo: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
});

export default ProductDetailScreen;
