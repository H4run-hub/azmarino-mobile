import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import FastImage from 'react-native-fast-image';
import {useLanguage} from '../context/LanguageContext';
import {s, vs, fs} from '../utils/scale';
import {getFlashSaleEndTime, getTimeRemaining} from '../utils/flashSale';

const FlashSalesBanner = ({navigation, theme, products, allProducts}) => {
  const {t, language} = useLanguage();
  const [endTime] = useState(() => getFlashSaleEndTime());
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(endTime));

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeRemaining(endTime);
      setTimeLeft(remaining);
      if (remaining.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  // Use real discounted products from the database
  const flashProducts = useMemo(() => {
    // products prop = already filtered for discount > 0
    const source = (products && products.length > 0) ? products : (allProducts || []);
    // Sort by highest discount, take top 10
    const sorted = [...source]
      .filter(p => (p.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0))
      .slice(0, 10);
    // If no discounted products, pick random products as "flash deals"
    if (sorted.length === 0 && allProducts && allProducts.length > 0) {
      return allProducts.slice(0, 6);
    }
    return sorted;
  }, [products, allProducts]);

  if (flashProducts.length === 0 || timeLeft.expired) return null;

  return (
    <View style={[styles.container, {backgroundColor: theme.cardBg}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.title}>{t('flashSaleTitle').replace('⚡ ', '')}</Text>
        </View>
        <View style={styles.timerContainer}>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{String(timeLeft.hours).padStart(2, '0')}</Text>
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{String(timeLeft.minutes).padStart(2, '0')}</Text>
          </View>
          <Text style={styles.colon}>:</Text>
          <View style={styles.timeBox}>
            <Text style={styles.timeText}>{String(timeLeft.seconds).padStart(2, '0')}</Text>
          </View>
        </View>
      </View>

      {/* Products */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.productsContainer}>
        {flashProducts.map((product, idx) => (
          <TouchableOpacity
            key={product.id || `flash-${idx}`}
            style={[styles.productCard, {backgroundColor: theme.cardBg}]}
            onPress={() => navigation.navigate('ProductDetail', {product})}>
            {(product.discount || 0) > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{product.discount}%</Text>
              </View>
            )}
            <FastImage
              source={{uri: product.image, priority: FastImage.priority.normal}}
              style={styles.productImage}
              resizeMode={FastImage.resizeMode.cover}
            />
            <View style={styles.productInfo}>
              <Text style={[styles.productName, {color: theme.text}]} numberOfLines={2}>
                {language === 'ti' ? (product.tigrinya || product.nameTi || product.name) : product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{product.price}</Text>
                {product.originalPrice && (
                  <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {/* See All button */}
        <TouchableOpacity
          style={styles.seeAllBtn}
          onPress={() => navigation.navigate('FlashSale', {products: flashProducts, endTime: endTime.toISOString()})}>
          <Text style={styles.seeAllText}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    paddingVertical: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeBox: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 32,
    alignItems: 'center',
  },
  timeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  colon: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  productsContainer: {
    paddingHorizontal: 15,
  },
  productCard: {
    width: 140,
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
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
  discountText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  productImage: {
    width: '100%',
    height: 140,
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF0000',
  },
  originalPrice: {
    fontSize: 11,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  seeAllBtn: {
    width: 50,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  seeAllText: {
    fontSize: 32,
    color: '#FF0000',
    fontWeight: 'bold',
  },
});

export default FlashSalesBanner;
