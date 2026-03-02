import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, Image, TouchableOpacity} from 'react-native';

const FlashSalesBanner = ({navigation, theme}) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 4,
    minutes: 23,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let {hours, minutes, seconds} = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }
        
        return {hours, minutes, seconds};
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const flashProducts = [
    {
      id: 'flash1',
      name: 'Wireless Earbuds',
      price: '€19.99',
      originalPrice: '€79.99',
      image: 'https://picsum.photos/seed/earbuds/300/300',
      discount: 75,
    },
    {
      id: 'flash2',
      name: 'Smart Watch',
      price: '€49.99',
      originalPrice: '€149.99',
      image: 'https://picsum.photos/seed/smartwatch/300/300',
      discount: 67,
    },
    {
      id: 'flash3',
      name: 'Phone Case',
      price: '€5.99',
      originalPrice: '€19.99',
      image: 'https://picsum.photos/seed/phonecase/300/300',
      discount: 70,
    },
  ];

  return (
    <View style={[styles.container, {backgroundColor: theme.cardBg}]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>⚡</Text>
          <Text style={styles.title}>ናይ ሰዓት ሽያጥ</Text>
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
        {flashProducts.map(product => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() => navigation.navigate('ProductDetail', {product})}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.discount}%</Text>
            </View>
            <Image source={{uri: product.image}} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={[styles.productName, {color: theme.text}]} numberOfLines={1}>
                {product.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{product.price}</Text>
                <Text style={styles.originalPrice}>{product.originalPrice}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
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
    backgroundColor: '#ffffff',
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
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 10,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
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
});

export default FlashSalesBanner;
