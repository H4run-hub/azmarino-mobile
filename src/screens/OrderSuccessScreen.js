import React, {useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, ScrollView, Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';

const OrderSuccessScreen = ({navigation, route}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const {trackingId, total, paymentMethod, itemCount} = route?.params || {};

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, tension: 60, friction: 6}),
      Animated.timing(fadeAnim, {toValue: 1, duration: 400, useNativeDriver: true}),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Animated success checkmark */}
        <Animated.View style={[styles.successCircleWrap, {transform: [{scale: scaleAnim}]}]}>
          <View style={styles.successCircleOuter}>
            <View style={styles.successCircleInner}>
              <Text style={styles.checkmarkText}>✓</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{opacity: fadeAnim, alignItems: 'center'}}>
          <Text style={[styles.successTitle, {color: theme.text}]}>{t('orderSuccessTitle')}</Text>
          <Text style={[styles.successSubtitle, {color: theme.subText}]}>{t('orderSuccessSubtitle')}</Text>
        </Animated.View>

        {/* Order details card */}
        <Animated.View style={[styles.detailsCard, {backgroundColor: theme.cardBg, opacity: fadeAnim}]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: theme.subText}]}>{t('orderNumLabel')}</Text>
            <Text style={[styles.detailValue, {color: '#FF0000'}]}>{trackingId}</Text>
          </View>
          <View style={[styles.separator, {backgroundColor: theme.border}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: theme.subText}]}>{t('orderItemsLabel')}</Text>
            <Text style={[styles.detailValue, {color: theme.text}]}>{itemCount} {t('itemSuffix')}</Text>
          </View>
          <View style={[styles.separator, {backgroundColor: theme.border}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: theme.subText}]}>{t('orderPaymentLabel')}</Text>
            <Text style={[styles.detailValue, {color: theme.text}]}>
              {paymentMethod === 'card' ? 'Credit/Debit Card' : 'PayPal'}
            </Text>
          </View>
          <View style={[styles.separator, {backgroundColor: theme.border}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: theme.subText}]}>{t('orderTotalLabel')}</Text>
            <Text style={[styles.detailValueBig, {color: theme.text}]}>€{total}</Text>
          </View>
          <View style={[styles.separator, {backgroundColor: theme.border}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: theme.subText}]}>{t('orderDeliveryLabel')}</Text>
            <Text style={[styles.detailValue, {color: '#27ae60'}]}>{t('freeDeliveryDays')}</Text>
          </View>
        </Animated.View>

        {/* Info tip */}
        <View style={[styles.tipBox, {backgroundColor: isDark ? 'rgba(39,174,96,0.1)' : '#f0fff4', borderColor: '#27ae60'}]}>
          <Text style={[styles.tipText, {color: theme.subText}]}>{t('successTip')}</Text>
        </View>

        {/* Action buttons */}
        <TouchableOpacity style={styles.trackButton} onPress={() => navigation.navigate('TrackOrder')}>
          <Text style={styles.trackButtonText}>🚚 {t('trackOrder')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ordersButton} onPress={() => navigation.navigate('OrderHistory')}>
          <Text style={styles.ordersButtonText}>📋 {t('orderHistory')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.homeButton, {borderColor: theme.border}]}
          onPress={() => navigation.resetStack('Home')}>
          <Text style={[styles.homeButtonText, {color: theme.text}]}>🏠 {t('backToHome')}</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {flexGrow: 1, alignItems: 'center', padding: 24, paddingTop: 50},
  successCircleWrap: {marginBottom: 28},
  successCircleOuter: {width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(39,174,96,0.15)', alignItems: 'center', justifyContent: 'center'},
  successCircleInner: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#27ae60',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#27ae60', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10,
  },
  checkmarkText: {color: '#fff', fontSize: 46, fontWeight: 'bold', lineHeight: 52},
  successTitle: {fontSize: 28, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'},
  successSubtitle: {fontSize: 16, lineHeight: 26, textAlign: 'center', marginBottom: 32},
  detailsCard: {
    width: '100%', maxWidth: 480, borderRadius: 16, padding: 20, marginBottom: 20,
    shadowColor: '#000', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12},
  separator: {height: 1},
  detailLabel: {fontSize: 14},
  detailValue: {fontSize: 15, fontWeight: '700'},
  detailValueBig: {fontSize: 22, fontWeight: 'bold'},
  tipBox: {width: '100%', maxWidth: 480, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24},
  tipText: {fontSize: 13, lineHeight: 22},
  trackButton: {width: '100%', maxWidth: 480, backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 12},
  trackButtonText: {color: '#fff', fontSize: 17, fontWeight: 'bold'},
  ordersButton: {width: '100%', maxWidth: 480, backgroundColor: '#2980b9', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12},
  ordersButtonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  homeButton: {width: '100%', maxWidth: 480, borderWidth: 1.5, padding: 16, borderRadius: 12, alignItems: 'center'},
  homeButtonText: {fontSize: 16, fontWeight: '600'},
});

export default OrderSuccessScreen;
