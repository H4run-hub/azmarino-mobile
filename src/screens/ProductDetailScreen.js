import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {products} from '../data/products';
import {BackIcon, CartIcon, StarIcon} from '../components/Icons';

const ProductDetailScreen = ({navigation, route}) => {
  const {product} = route.params;
  const {addToCart} = useCart();
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const insets = useSafeAreaInsets();
  const {width} = useWindowDimensions();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const [colorError, setColorError] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const CARD_WIDTH = (width - 40) / 2;

  const validate = () => {
    let ok = true;
    if (product.sizes?.length > 0 && !selectedSize) {
      setSizeError(true);
      ok = false;
    }
    if (product.colors?.length > 0 && !selectedColor) {
      setColorError(true);
      ok = false;
    }
    return ok;
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    addToCart({
      ...product,
      id: `${product.id}-${Date.now()}`,
      originalId: product.id,
      quantity,
      selectedSize,
      selectedColor,
      selected: true,
    });
    // Inline success banner — no Alert
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  const handleBuyNow = () => {
    if (!validate()) return;
    addToCart({
      ...product,
      id: `${product.id}-${Date.now()}`,
      originalId: product.id,
      quantity,
      selectedSize,
      selectedColor,
      selected: true,
    });
    navigation.navigate('Cart');
  };

  const similarProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const renderSimilarProduct = ({item}) => (
    <TouchableOpacity
      style={[styles.similarCard, {width: CARD_WIDTH, backgroundColor: theme.cardBg}]}
      onPress={() => navigation.navigate('ProductDetail', {product: item})}
      activeOpacity={0.9}>
      <View style={styles.similarDiscountBadge}>
        <Text style={styles.similarDiscountText}>-{item.discount}%</Text>
      </View>
      <Image
        source={{uri: item.image}}
        style={[styles.similarImage, {height: CARD_WIDTH * 1.4}]}
      />
      <View style={styles.similarInfo}>
        <Text style={styles.similarPrice}>{item.price}</Text>
        <Text style={[styles.similarOriginalPrice, {color: theme.subText}]}>
          {item.originalPrice}
        </Text>
        <View style={styles.similarRating}>
          <StarIcon size={10} color="#FFD700" filled />
          <Text style={[styles.similarRatingText, {color: theme.subText}]}>
            {item.rating}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.bg}]}
      edges={['top']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#FF0000"
        translucent={false}
      />

      {/* Header — always red bg with white icons/text */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <BackIcon size={28} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('productDetail')}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
          <CartIcon size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Inline "Added to cart" banner — slides in, no Alert */}
      {addedToCart && (
        <View style={styles.addedBanner}>
          <Text style={styles.addedBannerText}>✅ {t('addedToCart')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.addedBannerLink}>{t('cart')} →</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView>
        {/* Image Gallery */}
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setSelectedImage(idx);
            }}
            scrollEventThrottle={16}>
            {product.images.map((img, index) => (
              <Image
                key={index}
                source={{uri: img}}
                style={[styles.mainImage, {width, height: width}]}
              />
            ))}
          </ScrollView>
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
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={[styles.infoSection, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.productName, {color: theme.text}]}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map(star => (
                <Text key={star} style={styles.star}>
                  {star <= Math.floor(product.rating) ? '⭐' : '☆'}
                </Text>
              ))}
            </View>
            <Text style={[styles.ratingText, {color: theme.subText}]}>
              {product.rating} ({product.reviews} {t('reviews')})
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price}</Text>
            <Text style={styles.originalPrice}>{product.originalPrice}</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>
                ኣቐንዕ €
                {(
                  parseFloat(product.originalPriceNum) -
                  parseFloat(product.priceNum)
                ).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Color Selection */}
        {product.colors?.length > 0 && (
          <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
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
                    {color}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Inline color error — no Alert */}
            {colorError && !selectedColor && (
              <Text style={styles.selectionError}>⚠️ {t('selectColor')}</Text>
            )}
          </View>
        )}

        {/* Size Selection */}
        {product.sizes?.length > 0 && (
          <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
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
            {/* Inline size error — no Alert */}
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
            {product.description}
          </Text>
        </View>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <View style={[styles.section, {backgroundColor: theme.bg}]}>
            <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('similarProducts')}</Text>
            <FlatList
              data={similarProducts}
              renderItem={renderSimilarProduct}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.similarRow}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={{height: 110}} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.cardBg,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 10,
          },
        ]}>
        <TouchableOpacity style={styles.addToCartButton} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>{t('addToCart')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyNowButton} onPress={handleBuyNow}>
          <Text style={styles.buyNowText}>{t('buyNow')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    backgroundColor: '#FF0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {color: '#ffffff', fontSize: 18, fontWeight: 'bold'},
  addedBanner: {
    backgroundColor: '#27ae60',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  addedBannerText: {color: '#fff', fontSize: 14, fontWeight: '700'},
  addedBannerLink: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  indicatorActive: {backgroundColor: '#fff', width: 24},
  discountBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#FF0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  discountText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  infoSection: {padding: 20, marginBottom: 8},
  productName: {fontSize: 20, fontWeight: 'bold', marginBottom: 10},
  ratingRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 15},
  stars: {flexDirection: 'row', marginRight: 8},
  star: {fontSize: 16},
  ratingText: {fontSize: 14},
  priceRow: {flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap'},
  price: {fontSize: 28, fontWeight: 'bold', color: '#FF0000', marginRight: 10},
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  saveBadge: {
    backgroundColor: '#fff3f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveText: {color: '#FF0000', fontSize: 13, fontWeight: 'bold'},
  section: {padding: 20, marginBottom: 8},
  sectionTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 12},
  optionGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  optionButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
  },
  sizeButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {borderColor: '#FF0000', backgroundColor: '#fff3f3'},
  optionText: {fontSize: 14, fontWeight: '600'},
  sizeText: {fontSize: 16, fontWeight: 'bold'},
  optionTextActive: {color: '#FF0000'},
  selectionError: {
    color: '#FF0000',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  quantityRow: {flexDirection: 'row', alignItems: 'center'},
  qtyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: {color: '#fff', fontSize: 22, fontWeight: 'bold', lineHeight: 26},
  qtyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: 'center',
  },
  stockText: {fontSize: 14, marginLeft: 10},
  description: {fontSize: 14, lineHeight: 22},
  similarRow: {justifyContent: 'space-between', marginBottom: 8},
  similarCard: {borderRadius: 10, overflow: 'hidden', marginBottom: 8, elevation: 3},
  similarDiscountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 10,
  },
  similarDiscountText: {color: '#fff', fontSize: 10, fontWeight: 'bold'},
  similarImage: {width: '100%', backgroundColor: '#f8f8f8'},
  similarInfo: {padding: 8},
  similarPrice: {fontSize: 15, fontWeight: 'bold', color: '#FF0000', marginBottom: 2},
  similarOriginalPrice: {fontSize: 11, textDecorationLine: 'line-through', marginBottom: 4},
  similarRating: {flexDirection: 'row', alignItems: 'center', gap: 3},
  similarRatingText: {fontSize: 11, fontWeight: '600'},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 15,
    gap: 10,
    borderTopWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  addToCartButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FF0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  addToCartText: {color: '#FF0000', fontSize: 16, fontWeight: 'bold'},
  buyNowButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buyNowText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
});

export default ProductDetailScreen;
