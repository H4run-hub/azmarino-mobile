import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BackIcon, PlusIcon, MinusIcon, CloseIcon, CheckIcon} from '../components/Icons';
import {lightTap, successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';

const CartScreen = ({navigation, isLoggedIn}) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleItemSelection,
    selectAll,
    deselectAll,
    getSelectedTotal,
    getSelectedCount,
  } = useCart();
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const insets = useSafeAreaInsets();
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showConsentModal, setShowConsentModal] = React.useState(false);

  const selectedCount = getSelectedCount();
  const allSelected = cartItems.length > 0 && selectedCount === cartItems.length;

  const renderCartItem = ({item}) => (
    <View style={[styles.cartItem, {backgroundColor: theme.cardBg, borderColor: theme.border}]}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, item.selected && {backgroundColor: '#E60000', borderColor: '#E60000'}]}
        onPress={() => { lightTap(); toggleItemSelection(item.id); }}>
        {item.selected && <CheckIcon size={12} color="#fff" />}
      </TouchableOpacity>

      <View style={styles.itemContent}>
        <TouchableOpacity 
          onPress={() => navigation.navigate('ProductDetail', {product: item})}
          style={styles.imageContainer}>
          <FastImage source={{uri: item.image}} style={styles.itemImage} resizeMode="cover" />
        </TouchableOpacity>
        
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, {color: theme.text}]} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>{item.price}</Text>
            {item.selectedSize || item.selectedColor ? (
              <Text style={{fontSize: fs(10), color: theme.subText}}>
                {item.selectedSize} {item.selectedColor}
              </Text>
            ) : null}
          </View>

          <View style={styles.qtyRow}>
            <View style={[styles.qtyContainer, {backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'}]}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => { lightTap(); updateQuantity(item.id, -1); }}>
                <MinusIcon size={12} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.qtyText, {color: theme.text}]}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => { lightTap(); updateQuantity(item.id, 1); }}>
                <PlusIcon size={12} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => { lightTap(); removeFromCart(item.id); }}>
              <CloseIcon size={16} color={theme.subText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <BackIcon size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
          {t('cart')} <Text style={{color: '#E60000'}}>({cartItems.length})</Text>
        </Text>
        <TouchableOpacity onPress={() => setShowClearConfirm(true)} style={styles.headerIcon}>
          <Text style={{color: '#E60000', fontWeight: '700', fontSize: fs(12)}}>{t('clearAll')}</Text>
        </TouchableOpacity>
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <View style={[styles.emptyIconContainer, {backgroundColor: theme.cardBg}]}>
            <Text style={{fontSize: 64}}>🛒</Text>
          </View>
          <Text style={[styles.emptyCartText, {color: theme.text}]}>{t('cartEmpty')}</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopButtonText}>{t('startShopping')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Selection Bar */}
          <View style={[styles.selectionBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
            <TouchableOpacity
              style={styles.selectAll}
              onPress={() => { lightTap(); allSelected ? deselectAll() : selectAll(); }}>
              <View style={[styles.checkbox, allSelected && {backgroundColor: '#E60000', borderColor: '#E60000'}]}>
                {allSelected && <CheckIcon size={12} color="#fff" />}
              </View>
              <Text style={[styles.selectAllText, {color: theme.text}]}>
                {allSelected ? t('deselectAll') : t('selectAll')}
              </Text>
            </TouchableOpacity>
            <Text style={{fontSize: fs(12), color: theme.subText, fontWeight: '600'}}>
              {selectedCount} {t('selected')}
            </Text>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer */}
          <View style={[styles.footer, {backgroundColor: theme.cardBg, borderTopColor: theme.border, paddingBottom: insets.bottom + 12}]}>
            <View style={styles.totalRow}>
              <View>
                <Text style={{fontSize: fs(12), color: theme.subText, fontWeight: '600'}}>{t('total')}</Text>
                <Text style={{fontSize: fs(24), fontWeight: '900', color: theme.text}}>€{getSelectedTotal()}</Text>
              </View>
              <TouchableOpacity
                style={[styles.checkoutBtn, selectedCount === 0 && {backgroundColor: '#ccc'}]}
                disabled={selectedCount === 0}
                onPress={async () => {
                  if (!isLoggedIn) { setShowLoginModal(true); return; }
                  const consent = await AsyncStorage.getItem('azmarino_data_consent');
                  if (!consent) { setShowConsentModal(true); return; }
                  successTap();
                  navigation.navigate('Checkout');
                }}>
                <Text style={styles.checkoutBtnText}>{t('checkout')} ({selectedCount})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Modals handled similarly but styled with theme */}
      <Modal visible={showClearConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, {backgroundColor: theme.cardBg}]}>
            <Text style={[styles.modalTitle, {color: theme.text}]}>{t('clearAllConfirm')}</Text>
            <View style={{flexDirection: 'row', gap: 12, width: '100%', marginTop: 24}}>
              <TouchableOpacity style={[styles.modalBtn, {borderWidth: 1, borderColor: theme.border}]} onPress={() => setShowClearConfirm(false)}>
                <Text style={{color: theme.text, fontWeight: '700'}}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, {backgroundColor: '#E60000'}]} onPress={() => {clearCart(); setShowClearConfirm(false); successTap();}}>
                <Text style={{color: '#fff', fontWeight: '700'}}>{t('clearAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLoginModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, {justifyContent: 'flex-end'}]}>
          <View style={[styles.modalContent, {backgroundColor: theme.cardBg}]}>
            <Text style={[styles.modalTitle, {color: theme.text, fontSize: 24}]}>{t('loginRequired')}</Text>
            <Text style={{color: theme.subText, textAlign: 'center', marginBottom: 32}}>{t('loginRequiredMsg')}</Text>
            <TouchableOpacity style={styles.largeBtn} onPress={() => {setShowLoginModal(false); navigation.navigate('Login');}}>
              <Text style={styles.largeBtnText}>{t('loginBtn')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowLoginModal(false)} style={{padding: 16}}><Text style={{color: theme.subText, fontWeight: '600'}}>{t('cancel')}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, borderBottomWidth: 0.5 },
  headerTitle: { fontSize: fs(18), fontWeight: '800' },
  headerIcon: { width: 60, alignItems: 'center' },
  selectionBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  selectAll: { flexDirection: 'row', alignItems: 'center' },
  selectAllText: { fontSize: fs(14), fontWeight: '700', marginLeft: 10 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  cartItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 20, marginBottom: 16, borderWeight: 1 },
  itemContent: { flex: 1, flexDirection: 'row', marginLeft: 12 },
  imageContainer: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', backgroundColor: '#F3F4F6' },
  itemImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemName: { fontSize: fs(14), fontWeight: '700' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: fs(16), fontWeight: '800', color: '#E60000' },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 2 },
  qtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  qtyText: { width: 30, textAlign: 'center', fontSize: 16, fontWeight: '800' },
  removeBtn: { padding: 4 },
  footer: { paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 0.5 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  checkoutBtn: { backgroundColor: '#E60000', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, minWidth: 160, alignItems: 'center' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptyCart: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIconContainer: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 32, elevation: 2 },
  emptyCartText: { fontSize: 20, fontWeight: '800', marginBottom: 40 },
  shopButton: { backgroundColor: '#E60000', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 20 },
  shopButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 24, padding: 32, alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  modalBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalContent: { padding: 32, borderTopLeftRadius: 32, borderTopRightRadius: 32, alignItems: 'center', width: '100%' },
  largeBtn: { width: '100%', height: 56, borderRadius: 16, backgroundColor: '#E60000', alignItems: 'center', justifyContent: 'center' },
  largeBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});

export default CartScreen;
