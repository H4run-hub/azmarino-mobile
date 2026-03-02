import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useStripe} from '@stripe/stripe-react-native';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {createPaymentIntent, createOrder} from '../services/api';

const CheckoutScreen = ({navigation, user}) => {
  const {getSelectedItems, getSelectedTotal, removeSelectedItems} = useCart();
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const insets = useSafeAreaInsets();
  const {initPaymentSheet, presentPaymentSheet} = useStripe();

  const selectedItems = getSelectedItems();
  const total = getSelectedTotal();

  const [fullName, setFullName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Luxembourg');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = t('errFullName');
    if (!phone.trim()) e.phone = t('errPhone');
    else if (phone.replace(/\D/g, '').length < 8) e.phone = t('errPhoneShort');
    if (!address.trim()) e.address = t('errAddress');
    if (!city.trim()) e.city = t('errCity');
    if (!country.trim()) e.country = t('errCountry');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Build parsed items — strip € prefix from price strings
      const parsedItems = selectedItems.map(item => ({
        productId: String(item.id || 'unknown'),
        name: item.name,
        price: parseFloat(String(item.price).replace(/[^0-9.]/g, '')),
        quantity: item.quantity || 1,
        image: item.image || '',
        selectedSize: item.selectedSize || '',
        selectedColor: item.selectedColor || '',
      }));

      const subtotal = parsedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const shippingCost = subtotal <= 50 ? 5.99 : 0;
      const totalAmount = subtotal + shippingCost;

      const orderEmail = user?.email || `guest-${Date.now()}@azmarino.online`;
      const shippingInfo = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      };

      // ── Step 1: Create PaymentIntent on the backend ────────────────────────
      const intentData = await createPaymentIntent(parsedItems, orderEmail, shippingInfo);
      if (!intentData.success || !intentData.clientSecret) {
        throw new Error(intentData.message || 'Failed to initialize payment');
      }

      // ── Step 2: Initialize Stripe Payment Sheet ────────────────────────────
      const {error: initError} = await initPaymentSheet({
        paymentIntentClientSecret: intentData.clientSecret,
        merchantDisplayName: 'Azmarino',
        style: isDark ? 'alwaysDark' : 'alwaysLight',
        defaultBillingDetails: {
          name: fullName.trim(),
          email: orderEmail,
          phone: phone.trim(),
          address: {
            city: city.trim(),
            country: country.trim().substring(0, 2).toUpperCase(),
          },
        },
      });
      if (initError) throw new Error(initError.message);

      // ── Step 3: Present Payment Sheet ─────────────────────────────────────
      const {error: presentError} = await presentPaymentSheet();
      if (presentError) {
        // User cancelled — silently return
        if (presentError.code === 'Canceled') {
          setSubmitting(false);
          return;
        }
        throw new Error(presentError.message);
      }

      // ── Step 4: Payment confirmed — create order in DB ─────────────────────
      const orderData = {
        email: orderEmail,
        userId: user?._id || user?.id || null,
        items: parsedItems,
        shippingAddress: shippingInfo,
        subtotal: parseFloat(subtotal.toFixed(2)),
        shippingCost: parseFloat(shippingCost.toFixed(2)),
        total: parseFloat(totalAmount.toFixed(2)),
        paymentMethod: 'stripe',
      };

      const data = await createOrder(orderData);

      if (data.success) {
        removeSelectedItems();
        navigation.resetStack('OrderSuccess', {
          trackingId: data.order.orderNumber,
          total: `€${parseFloat(totalAmount).toFixed(2)}`,
          paymentMethod: 'stripe',
          itemCount: selectedItems.length,
        });
      } else {
        throw new Error(data.message || 'Failed to create order');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'ትእዛዝ ምሕዛዝ ኣይተኻእለን። ደሓር ጀርቡ።';
      Alert.alert('ጌጋ', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const errText = key =>
    errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />

      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('checkoutTitle')}</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.content}>

        {/* Order Summary */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('orderSummary')}</Text>
          {selectedItems.map(item => (
            <View key={item.id} style={styles.orderItemContainer}>
              <View style={styles.orderItemRow}>
                <Text style={[styles.orderItemName, {color: theme.text}]} numberOfLines={1}>
                  {item.name} x{item.quantity}
                </Text>
                <Text style={styles.orderItemPrice}>
                  €{(parseFloat(String(item.price).replace(/[^0-9.]/g, '')) * item.quantity).toFixed(2)}
                </Text>
              </View>
              {(item.selectedSize || item.selectedColor) && (
                <Text style={[styles.orderItemSpecs, {color: theme.subText}]}>
                  {item.selectedSize && `${t('size')}: ${item.selectedSize}`}
                  {item.selectedSize && item.selectedColor && ' | '}
                  {item.selectedColor && `${t('color')}: ${item.selectedColor}`}
                </Text>
              )}
            </View>
          ))}
          <View style={[styles.dividerLine, {backgroundColor: theme.border}]} />
          <View style={styles.orderItemRow}>
            <Text style={[styles.orderTotalLabel, {color: theme.text}]}>{t('total')}:</Text>
            <Text style={styles.orderTotalPrice}>€{total}</Text>
          </View>
        </View>

        {/* Shipping Address */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('shippingAddress')}</Text>

          <TextInput
            style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: errors.fullName ? '#FF0000' : theme.border}]}
            placeholder={`${t('fullName')} *`}
            placeholderTextColor={theme.subText}
            value={fullName}
            onChangeText={v => {setFullName(v); setErrors(p => ({...p, fullName: ''}));}}
          />
          {errText('fullName')}

          <TextInput
            style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: errors.phone ? '#FF0000' : theme.border}]}
            placeholder={`${t('phone')} (+352...) *`}
            placeholderTextColor={theme.subText}
            value={phone}
            onChangeText={v => {setPhone(v.replace(/[^+\d]/g, '')); setErrors(p => ({...p, phone: ''}));}}
            keyboardType="phone-pad"
            maxLength={20}
          />
          {errText('phone')}

          <TextInput
            style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: errors.address ? '#FF0000' : theme.border}]}
            placeholder={`${t('address')} *`}
            placeholderTextColor={theme.subText}
            value={address}
            onChangeText={v => {setAddress(v); setErrors(p => ({...p, address: ''}));}}
            multiline
          />
          {errText('address')}

          <View style={styles.row}>
            <View style={{flex: 1}}>
              <TextInput
                style={[styles.inputHalf, {backgroundColor: theme.bg, color: theme.text, borderColor: errors.city ? '#FF0000' : theme.border}]}
                placeholder={`${t('city')} *`}
                placeholderTextColor={theme.subText}
                value={city}
                onChangeText={v => {setCity(v); setErrors(p => ({...p, city: ''}));}}
              />
              {errText('city')}
            </View>
            <View style={{flex: 1}}>
              <TextInput
                style={[styles.inputHalf, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]}
                placeholder={t('postalCode')}
                placeholderTextColor={theme.subText}
                value={postalCode}
                onChangeText={v => setPostalCode(v.replace(/\D/g, ''))}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
          </View>

          <TextInput
            style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: errors.country ? '#FF0000' : theme.border}]}
            placeholder={`${t('country')} *`}
            placeholderTextColor={theme.subText}
            value={country}
            onChangeText={v => {setCountry(v); setErrors(p => ({...p, country: ''}));}}
          />
          {errText('country')}
        </View>

        {/* Payment Info */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('paymentMethod')}</Text>
          <View style={styles.stripeNote}>
            <Text style={styles.stripeIcon}>💳</Text>
            <View style={{flex: 1}}>
              <Text style={[styles.stripeTitle, {color: theme.text}]}>
                Visa, Mastercard, Apple Pay
              </Text>
              <Text style={[styles.stripeSub, {color: theme.subText}]}>
                Secured by Stripe 🔒
              </Text>
            </View>
          </View>
        </View>

        {/* Delivery Info */}
        <View style={[styles.infoBox, {
          backgroundColor: isDark ? 'rgba(255,0,0,0.08)' : '#fff9f9',
          borderColor: theme.border,
        }]}>
          <Text style={[styles.infoTitle, {color: theme.text}]}>{t('deliveryInfo')}</Text>
          <Text style={[styles.infoText, {color: theme.subText}]}>{t('deliveryInfoText')}</Text>
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, {
        backgroundColor: theme.cardBg,
        borderTopColor: theme.border,
        paddingBottom: insets.bottom + 16,
      }]}>
        <View style={styles.footerTotal}>
          <Text style={[styles.footerLabel, {color: theme.subText}]}>{t('totalPayment')}</Text>
          <Text style={[styles.footerAmount, {color: theme.text}]}>€{total}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderButton, submitting && {backgroundColor: '#ccc'}]}
          onPress={handlePlaceOrder}
          disabled={submitting}>
          {submitting
            ? <ActivityIndicator color="#fff" size="large" />
            : <Text style={styles.placeOrderText}>{t('placeOrder')}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: {fontSize: 20, fontWeight: 'bold'},
  content: {flex: 1},
  section: {padding: 20, marginBottom: 10},
  sectionTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},

  // Order summary
  orderItemContainer: {marginBottom: 12},
  orderItemRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  orderItemName: {fontSize: 14, flex: 1, marginRight: 10},
  orderItemSpecs: {fontSize: 12, marginTop: 4},
  orderItemPrice: {fontSize: 14, fontWeight: '600', color: '#FF0000'},
  dividerLine: {height: 1, marginVertical: 15},
  orderTotalLabel: {fontSize: 16, fontWeight: 'bold'},
  orderTotalPrice: {fontSize: 20, fontWeight: 'bold', color: '#FF0000'},

  // Inputs
  input: {borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 4, borderWidth: 1},
  inputHalf: {borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 4, borderWidth: 1},
  fieldError: {color: '#FF0000', fontSize: 12, marginBottom: 10, marginLeft: 4},
  row: {flexDirection: 'row', gap: 10},

  // Stripe note
  stripeNote: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#FF0000',
    backgroundColor: 'rgba(255,0,0,0.04)',
  },
  stripeIcon: {fontSize: 28, marginRight: 14},
  stripeTitle: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  stripeSub: {fontSize: 13},

  // Info box
  infoBox: {margin: 20, padding: 16, borderRadius: 12, borderWidth: 1},
  infoTitle: {fontSize: 15, fontWeight: 'bold', marginBottom: 8},
  infoText: {fontSize: 14, lineHeight: 24},

  // Footer
  footer: {
    padding: 20, borderTopWidth: 1,
    shadowColor: '#000', shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 5,
  },
  footerTotal: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 15,
  },
  footerLabel: {fontSize: 15},
  footerAmount: {fontSize: 28, fontWeight: 'bold'},
  placeOrderButton: {
    backgroundColor: '#FF0000', padding: 18,
    borderRadius: 12, alignItems: 'center',
  },
  placeOrderText: {color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.5},
});

export default CheckoutScreen;
