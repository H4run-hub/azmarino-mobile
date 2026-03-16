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
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {TAB_HEIGHT} from '../components/BottomTabBar';
import {getProducts, getReviews, submitReview} from '../services/api';
import {getColorLabel} from '../utils/colorMap';
import {useRecentlyViewed} from '../context/RecentlyViewedContext';
import {successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';
import {getFlashSaleEndTime, getTimeRemaining} from '../utils/flashSale';

// ─── Timer component ─────────────────────────────────────────────────────────
const CountdownTimer = ({endTimeStr}) => {
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

  return (
    <View style={timerStyles.row}>
      <View style={timerStyles.box}>
        <Text style={timerStyles.num}>{String(timeLeft.hours).padStart(2, '0')}</Text>
      </View>
      <Text style={timerStyles.colon}>:</Text>
      <View style={timerStyles.box}>
        <Text style={timerStyles.num}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
      </View>
      <Text style={timerStyles.colon}>:</Text>
      <View style={timerStyles.box}>
        <Text style={timerStyles.num}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
      </View>
    </View>
  );
};

const timerStyles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  box: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 26,
    alignItems: 'center',
  },
  num: {color: '#fff', fontSize: fs(12), fontWeight: 'bold'},
  colon: {color: '#fff', fontSize: fs(14), fontWeight: 'bold', marginHorizontal: 2},
});

// ─── Star row ────────────────────────────────────────────────────────────────
const StarRow = ({rating, size = 16}) => (
  <View style={{flexDirection: 'row'}}>
    {[1, 2, 3, 4, 5].map(star => (
      <Text key={star} style={{fontSize: size}}>
        {star <= Math.floor(rating) ? '⭐' : star - 0.5 <= rating ? '⭐' : '☆'}
      </Text>
    ))}
  </View>
);

const formatCount = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
};

// ─── Similar flash products card ─────────────────────────────────────────────
const SimilarStarRow = ({rating, reviews, subTextColor}) => (
  <View style={simStyles.starRow}>
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
    <Text style={[simStyles.reviewCount, {color: subTextColor}]}>{formatCount(reviews)}</Text>
  </View>
);

// ─── Shuffle ─────────────────────────────────────────────────────────────────
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Main Screen ─────────────────────────────────────────────────────────────
const FlashSaleDetailScreen = ({navigation, route}) => {
  const {product, endTime: passedEndTime} = route?.params || {};
  const {addToCart} = useCart();
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const {addToRecentlyViewed} = useRecentlyViewed();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();
  const bottomBarHeight = 64;
  const flatListRef = useRef();
  const colorSectionY = useRef(0);
  const sizeSectionY = useRef(0);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `⚡ ${product.name} — ${product.price} (was ${product.originalPrice}) — ${product.discount}% OFF!\nhttps://azmarino.online/product/${product.id}`,
      });
    } catch {}
  };

  // Reset scroll + selection when product changes (user tapped another deal)
  useEffect(() => {
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQuantity(1);
    setSizeError(false);
    setColorError(false);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({offset: 0, animated: false});
    }
    if (fsImageListRef.current) {
      fsImageListRef.current.scrollToOffset({offset: 0, animated: false});
    }
    fsImageIndexRef.current = 0;
  }, [product.id]);

  // Track recently viewed
  useEffect(() => {
    addToRecentlyViewed(product);
  }, [product.id]);

  // Flash sale products for "more deals" section — fetched from API
  const [flashDeals, setFlashDeals] = useState([]);
  const [displayDeals, setDisplayDeals] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProducts({limit: 50});
        const raw = Array.isArray(data) ? data : (data?.products || data?.data || []);
        const others = raw.filter(p => String(p._id || p.id) !== String(product._id || product.id) && (p.discount || 0) > 0);
        if (!cancelled) {
          const deals = shuffle(others);
          setFlashDeals(deals);
          setDisplayDeals(deals.slice(0, 8).map((p, i) => ({...p, _listKey: `fd-${i}`})));
        }
      } catch (err) {
        if (__DEV__) console.warn('Failed to fetch flash deals:', err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [product._id, product.id]);

  const loadMoreDeals = useCallback(() => {
    if (flashDeals.length === 0) return;
    setDisplayDeals(prev => {
      const batch = shuffle(flashDeals)
        .slice(0, 8)
        .map((p, i) => ({...p, _listKey: `fd-${prev.length + i}`}));
      return prev.concat(batch);
    });
  }, [flashDeals]);

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

  const savings = useMemo(() => {
    if (product.originalPriceNum && product.priceNum) {
      return (product.originalPriceNum - product.priceNum).toFixed(2);
    }
    return null;
  }, [product]);

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

  const simGap = 8;
  const simHPad = 8;
  const SIM_CARD_WIDTH = (width - simHPad * 2 - simGap) / 2;
  const SIM_IMAGE_HEIGHT = SIM_CARD_WIDTH * 1.1;

  const renderDealCard = ({item}) => (
    <TouchableOpacity
      style={[simStyles.card, {backgroundColor: theme.cardBg, width: SIM_CARD_WIDTH}]}
      onPress={() => navigation.push('FlashSaleDetail', {product: item, endTime: passedEndTime})}
      activeOpacity={0.93}>
      {(item.discount || 0) > 0 && (
        <View style={simStyles.badge}>
          <Text style={simStyles.badgeText}>-{item.discount}%</Text>
        </View>
      )}
      <View style={simStyles.flashTag}>
        <Text style={simStyles.flashTagText}>⚡</Text>
      </View>
      <View style={[simStyles.imageWrap, {height: SIM_IMAGE_HEIGHT}]}>
        <FastImage source={{uri: item.image, priority: FastImage.priority.low}} style={simStyles.image} resizeMode={FastImage.resizeMode.cover} />
      </View>
      <View style={simStyles.info}>
        <SimilarStarRow
          rating={item.rating}
          reviews={item.reviews}
          subTextColor={theme.subText}
        />
        <View style={simStyles.priceRow}>
          <View style={simStyles.priceBlock}>
            <Text style={simStyles.price}>{item.price}</Text>
            {item.originalPrice && (
              <Text style={[simStyles.origPrice, {color: theme.subText}]}>
                {item.originalPrice}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={simStyles.addBtn}
            onPress={() => addToCart({...item, quantity: 1, selected: true})}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Icon name="cart-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Image gallery helpers ──────────────────────────────────────────────────
  const fsImageIndexRef = useRef(0);
  const fsImageListRef = useRef();
  const renderFsGalleryImage = useCallback(({item: img}) => (
    <FastImage
      source={{uri: img, priority: FastImage.priority.high}}
      style={{width, height: width * 0.9, backgroundColor: '#f5f5f5'}}
      resizeMode={FastImage.resizeMode.cover}
    />
  ), [width]);
  const onFsGalleryScroll = useCallback((e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    if (fsImageIndexRef.current !== idx) {
      fsImageIndexRef.current = idx;
      setSelectedImage(idx);
    }
  }, [width]);
  const fsGalleryKey = useCallback((_, index) => `fsimg-${index}`, []);

  // ─── ListHeader: all product detail content ──────────────────────────────────
  const ListHeader = useMemo(() => (
    <View>
      {/* Flash sale top banner */}
      <View style={styles.flashBanner}>
        <View style={styles.flashBannerLeft}>
          <Text style={styles.flashBannerTitle}>⚡ {t('fsDetailBanner')}</Text>
          {product.discount > 0 && (
            <View style={styles.discountChip}>
              <Text style={styles.discountChipText}>-{product.discount}%</Text>
            </View>
          )}
        </View>
        <CountdownTimer endTimeStr={passedEndTime} />
      </View>

      {/* Image Gallery */}
      <View style={styles.imageSection}>
        <FlatList
          ref={fsImageListRef}
          data={product.images}
          renderItem={renderFsGalleryImage}
          keyExtractor={fsGalleryKey}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onFsGalleryScroll}
          decelerationRate="fast"
          getItemLayout={(_, index) => ({length: width, offset: width * index, index})}
          initialScrollIndex={0}
        />
        <View style={styles.imageIndicators}>
          {product.images.map((_, index) => (
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

      {/* Savings banner — dark mode aware */}
      {savings && (
        <View style={[styles.savingsBanner, isDark && {backgroundColor: 'rgba(46,125,50,0.15)'}]}>
          <Text style={styles.savingsIcon}>💰</Text>
          <Text style={[styles.savingsText, isDark && {color: '#81C784'}]}>
            {t('fsSavePrefix')}{savings}{t('fsSaveSuffix')}
          </Text>
        </View>
      )}

      {/* Product Info */}
      <View style={[styles.infoSection, {backgroundColor: theme.cardBg}]}>
        <View style={styles.nameRow}>
          <Text style={[styles.productName, {color: theme.text}]}>
            {language === 'ti' ? (product.tigrinya || product.name) : product.name}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <StarRow rating={product.rating} size={16} />
          <Text style={[styles.ratingText, {color: theme.subText}]}>
            {Number(product.rating).toFixed(1)} ({formatCount(product.reviews)} {t('reviews')})
          </Text>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.flashPrice}>{product.price}</Text>
          {product.originalPrice != null && (
            <Text style={styles.originalPrice}>{product.originalPrice}</Text>
          )}
          {product.discount > 0 && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>-{product.discount}%</Text>
            </View>
          )}
        </View>

        {/* Stock urgency bar */}
        <View style={styles.urgencyRow}>
          <View style={styles.urgencyBarBg}>
            <View
              style={[
                styles.urgencyBarFill,
                {width: `${Math.min(100, Math.max(15, 100 - product.stock))}%`},
              ]}
            />
          </View>
          <Text style={[styles.urgencyText, {color: theme.subText}]}>
            {product.stock < 50
              ? `🔥 ${product.stock} ${t('fsLeft')}`
              : `📦 ${product.stock} ${t('inStock')}`}
          </Text>
        </View>
      </View>

      {/* Color Selection */}
      {product.colors?.length > 0 && (
        <View
          style={[styles.section, {backgroundColor: theme.cardBg}]}
          onLayout={e => {
            colorSectionY.current = e.nativeEvent.layout.y;
          }}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>
            {t('selectColor')}:
          </Text>
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
          onLayout={e => {
            sizeSectionY.current = e.nativeEvent.layout.y;
          }}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>
            {t('selectSize')}:
          </Text>
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

      {/* Flash deal perks */}
      <View style={[styles.perksCard, {backgroundColor: theme.cardBg}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('fsPerksTitle')}
        </Text>
        <View style={styles.perkRow}>
          <Text style={styles.perkIcon}>🚚</Text>
          <Text style={[styles.perkText, {color: theme.text}]}>{t('fsPerkShipping')}</Text>
        </View>
        <View style={styles.perkRow}>
          <Text style={styles.perkIcon}>🔒</Text>
          <Text style={[styles.perkText, {color: theme.text}]}>{t('fsPerkSecure')}</Text>
        </View>
        <View style={styles.perkRow}>
          <Text style={styles.perkIcon}>↩️</Text>
          <Text style={[styles.perkText, {color: theme.text}]}>{t('fsPerkReturn')}</Text>
        </View>
        <View style={styles.perkRow}>
          <Text style={styles.perkIcon}>⚡</Text>
          <Text style={[styles.perkText, {color: theme.text}]}>{t('fsPerkFlash')}</Text>
        </View>
      </View>

      {/* Description */}
      <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('description')}:
        </Text>
        <Text style={[styles.description, {color: theme.subText}]}>
          {language === 'en' && product.descriptionEn ? product.descriptionEn : product.description}
        </Text>
      </View>

      {/* Reviews */}
      <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
        <Text style={[styles.sectionTitle, {color: theme.text}]}>
          {t('reviewsSectionTitle')}
        </Text>
        <View style={styles.ratingSummary}>
          <View style={styles.ratingSummaryLeft}>
            <Text style={[styles.bigRating, {color: theme.text}]}>{Number(product.rating).toFixed(1)}</Text>
            <Text style={[styles.outOf5, {color: theme.subText}]}>{t('outOf5')}</Text>
          </View>
          <View style={styles.ratingSummaryRight}>
            <StarRow rating={product.rating} size={20} />
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
          <Text style={[styles.reviewMsgText, {color: reviewMsg.includes('Thank') || reviewMsg.includes('ነቶ') ? '#27ae60' : '#FF0000'}]}>
            {reviewMsg}
          </Text>
        ) : null}

        {showWriteReview && (
          <View style={[styles.writeReviewForm, {borderColor: theme.border}]}>
            <Text style={[{fontSize: fs(12), color: theme.subText, marginBottom: 6}]}>{t('tapToRate')}</Text>
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

        {reviews.length > 0 ? (
          reviews.map(review => (
            <View key={review.id} style={[styles.reviewCard, {borderColor: theme.border}]}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerAvatarText}>{review.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text style={[styles.reviewerName, {color: theme.text}]}>{review.name}</Text>
                    {review.verified && (
                      <Text style={styles.verifiedBadge}>✓ {t('verifiedPurchase')}</Text>
                    )}
                  </View>
                </View>
                <Text style={[styles.reviewDate, {color: theme.subText}]}>{review.date}</Text>
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
          <Text style={[{fontSize: fs(14), textAlign: 'center', paddingVertical: 20, color: theme.subText}]}>
            {t('noReviewsYet')}
          </Text>
        )}
      </View>

      {/* More Flash Deals title */}
      {displayDeals.length > 0 && (
        <View style={styles.moreDealsHeader}>
          <Text style={styles.moreDealsTitle}>⚡ {t('fsMoreDeals')}</Text>
        </View>
      )}
    </View>
  ), [product, selectedImage, selectedSize, selectedColor, quantity, sizeError, colorError, theme, language, t, width, passedEndTime, reviews, showWriteReview, reviewRating, reviewComment, reviewSubmitting, reviewMsg]);

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.bg}]}
      edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF0000"
        translucent={false}
      />

      {/* Red header bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.backBtn}>
          <BackIcon size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>⚡ {t('fsDetailTitle')}</Text>
        <TouchableOpacity onPress={handleShare} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} style={styles.backBtn}>
          <Icon name="share-social-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <FlatList
        ref={flatListRef}
        data={displayDeals}
        renderItem={renderDealCard}
        keyExtractor={item => item._listKey || item.id}
        numColumns={2}
        columnWrapperStyle={{gap: simGap}}
        contentContainerStyle={{paddingBottom: bottomBarHeight}}
        ListHeaderComponent={<>{ListHeader}</>}
        onEndReached={loadMoreDeals}
        onEndReachedThreshold={0.4}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom action bar */}
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
        <TouchableOpacity
          style={[styles.addToCartButton, {borderColor: '#FF0000', backgroundColor: theme.cardBg}]}
          onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>{t('addToCart')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>⚡ {t('buyNow')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Similar deal card styles ────────────────────────────────────────────────
const simStyles = StyleSheet.create({
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
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    zIndex: 10,
  },
  badgeText: {color: '#fff', fontSize: fs(11), fontWeight: 'bold'},
  flashTag: {
    position: 'absolute',
    top: 8,
    left: 0,
    backgroundColor: '#FF6600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 10,
  },
  flashTagText: {color: '#fff', fontSize: fs(10), fontWeight: 'bold'},
  imageWrap: {width: '100%', overflow: 'hidden', backgroundColor: '#f5f5f5'},
  image: {width: '100%', height: '100%', resizeMode: 'cover'},
  info: {paddingHorizontal: 7, paddingTop: 5, paddingBottom: 6},
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
    marginBottom: 2,
  },
  priceBlock: {
    flexDirection: 'column',
    flexShrink: 1,
  },
  price: {fontSize: fs(17), fontWeight: 'bold', color: '#FF0000'},
  origPrice: {fontSize: fs(10), textDecorationLine: 'line-through'},
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

// ─── Main styles ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF0000',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  backBtn: {padding: 4},
  headerTitle: {
    fontSize: fs(16),
    fontWeight: 'bold',
    color: '#fff',
  },
  flashBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  flashBannerLeft: {flexDirection: 'row', alignItems: 'center', gap: 8},
  flashBannerTitle: {
    fontSize: fs(14),
    fontWeight: 'bold',
    color: '#fff',
  },
  discountChip: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  discountChipText: {
    fontSize: fs(12),
    fontWeight: 'bold',
    color: '#000',
  },
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
  indicatorActive: {backgroundColor: '#FF0000', width: 24},
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  savingsIcon: {fontSize: fs(16)},
  savingsText: {
    fontSize: fs(13),
    fontWeight: '700',
    color: '#2E7D32',
  },
  infoSection: {padding: 14, marginBottom: 4},
  nameRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  productName: {fontSize: fs(20), fontWeight: 'bold', flex: 1, lineHeight: fs(30)},
  ratingRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  ratingText: {fontSize: fs(14), marginLeft: 8},
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  flashPrice: {
    fontSize: fs(30),
    fontWeight: 'bold',
    color: '#FF0000',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: fs(18),
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  saveBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  saveBadgeText: {color: '#fff', fontSize: fs(12), fontWeight: 'bold'},
  urgencyRow: {marginTop: 4},
  urgencyBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,0,0,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  urgencyBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    borderRadius: 3,
  },
  urgencyText: {fontSize: fs(11), marginTop: 4, fontWeight: '600'},
  section: {padding: 12, marginBottom: 4},
  sectionTitle: {fontSize: fs(14), fontWeight: 'bold', marginBottom: 6},
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
  optionText: {fontSize: fs(12), fontWeight: '600'},
  sizeText: {fontSize: fs(14), fontWeight: 'bold'},
  optionTextActive: {color: '#FF0000'},
  selectionError: {color: '#FF0000', fontSize: fs(12), fontWeight: '600', marginTop: 6},
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
  stockText: {fontSize: fs(12), marginLeft: 8},
  perksCard: {padding: 12, marginBottom: 4},
  perkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  perkIcon: {fontSize: fs(16)},
  perkText: {fontSize: fs(13), fontWeight: '500'},
  description: {fontSize: fs(14), lineHeight: fs(22)},
  moreDealsHeader: {
    paddingTop: 12,
    paddingHorizontal: 8,
    paddingBottom: 8,
    backgroundColor: '#FF0000',
    marginTop: 4,
  },
  moreDealsTitle: {
    fontSize: fs(16),
    fontWeight: 'bold',
    color: '#fff',
  },
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
  addToCartText: {color: '#FF0000', fontSize: fs(13), fontWeight: '700'},
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyNowText: {color: '#fff', fontSize: fs(13), fontWeight: '700'},
  // ─── Review styles ────────────────────────────────────────────────────────
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
    gap: 16,
  },
  ratingSummaryLeft: {alignItems: 'center'},
  bigRating: {fontSize: fs(36), fontWeight: 'bold'},
  outOf5: {fontSize: fs(12), marginTop: 2},
  ratingSummaryRight: {flex: 1},
  totalReviews: {fontSize: fs(12), marginTop: 4},
  reviewCard: {
    borderTopWidth: 1,
    paddingVertical: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerInfo: {flexDirection: 'row', alignItems: 'center', gap: 10},
  reviewerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerAvatarText: {color: '#fff', fontSize: fs(16), fontWeight: 'bold'},
  reviewerName: {fontSize: fs(13), fontWeight: '700'},
  verifiedBadge: {fontSize: fs(10), color: '#2E7D32', fontWeight: '600', marginTop: 1},
  reviewDate: {fontSize: fs(11)},
  reviewStarsRow: {flexDirection: 'row', marginBottom: 6},
  reviewComment: {fontSize: fs(13), lineHeight: fs(24)},
  writeReviewBtn: {
    borderWidth: 1.5, borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginBottom: 12,
  },
  writeReviewBtnText: {color: '#FF0000', fontSize: fs(14), fontWeight: '700'},
  reviewMsgText: {fontSize: fs(13), textAlign: 'center', marginBottom: 10, fontWeight: '600'},
  writeReviewForm: {borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14},
  reviewInput: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: fs(14),
    minHeight: 80, textAlignVertical: 'top', marginTop: 10, marginBottom: 12,
  },
  submitReviewBtn: {
    backgroundColor: '#FF0000', paddingVertical: 12, borderRadius: 10, alignItems: 'center',
  },
  submitReviewText: {color: '#fff', fontSize: fs(15), fontWeight: 'bold'},
});

export default FlashSaleDetailScreen;

