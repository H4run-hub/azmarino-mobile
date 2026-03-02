import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useCart} from '../context/CartContext';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BackIcon, PlusIcon, MinusIcon, CloseIcon, CheckIcon} from '../components/Icons';

const CartScreen = ({navigation}) => {
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

  const selectedCount = getSelectedCount();
  const allSelected = cartItems.length > 0 && selectedCount === cartItems.length;

  const renderCartItem = ({item}) => (
    <View style={[styles.cartItem, {backgroundColor: theme.cardBg}]}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, item.selected && styles.checkboxSelected]}
        onPress={() => toggleItemSelection(item.id)}>
        {item.selected && <CheckIcon size={16} color="#fff" />}
      </TouchableOpacity>

      {/* Product Info */}
      <TouchableOpacity
        style={styles.itemContent}
        onPress={() => navigation.navigate('ProductDetail', {product: item})}
        activeOpacity={0.7}>
        <Image source={{uri: item.image}} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, {color: theme.text}]} numberOfLines={2}>
            {item.name}
          </Text>
          {(item.selectedSize || item.selectedColor) && (
            <View style={styles.specsRow}>
              {item.selectedSize && (
                <Text style={[styles.specText, {color: theme.subText}]}>
                  {t('size')}: {item.selectedSize}
                </Text>
              )}
              {item.selectedColor && (
                <Text style={[styles.specText, {color: theme.subText}]}>
                  {item.selectedSize && ' | '}{t('color')}: {item.selectedColor}
                </Text>
              )}
            </View>
          )}
          <Text style={styles.itemPrice}>{item.price}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, -1)}>
              <MinusIcon size={16} color="#fff" />
            </TouchableOpacity>
            <Text style={[styles.quantity, {color: theme.text}]}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, 1)}>
              <PlusIcon size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>

      {/* Remove Button */}
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}>
        <CloseIcon size={20} color={theme.subText} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />
      
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>
          {t('cart')} ({cartItems.length})
        </Text>
        {cartItems.length > 0 && (
        <TouchableOpacity onPress={() => setShowClearConfirm(true)}>
        <Text style={styles.clearButton}>{t('clearAll')}</Text>
        </TouchableOpacity>
        )}
        {cartItems.length === 0 && <View style={{width: 80}} />}
      </View>

      {/* Inline clear-all confirmation — no Alert */}
      {showClearConfirm && (
        <View style={[styles.clearConfirmCard, {backgroundColor: theme.cardBg, borderColor: '#FF0000'}]}>
          <Text style={[styles.clearConfirmTitle, {color: theme.text}]}>{t('clearAllConfirm')}</Text>
          <Text style={[styles.clearConfirmSub, {color: theme.subText}]}>{t('clearAllSub')}</Text>
          <View style={styles.clearConfirmBtns}>
            <TouchableOpacity
              style={[styles.clearConfirmBtn, styles.clearCancelBtn, {borderColor: theme.border}]}
              onPress={() => setShowClearConfirm(false)}>
              <Text style={[styles.clearCancelText, {color: theme.text}]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.clearConfirmBtn, styles.clearYesBtn]}
              onPress={() => {clearCart(); setShowClearConfirm(false);}}>
              <Text style={styles.clearYesText}>{t('clearAll')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {cartItems.length === 0 ? (
        <View style={styles.emptyCart}>
          <Text style={styles.emptyCartIcon}>🛒</Text>
          <Text style={[styles.emptyCartText, {color: theme.subText}]}>{t('cartEmpty')}</Text>
          <TouchableOpacity
            style={styles.shopButton}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.shopButtonText}>{t('startShopping')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Select All / Deselect All */}
          <View style={[styles.selectionBar, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
            <TouchableOpacity
              style={styles.selectAllButton}
              onPress={allSelected ? deselectAll : selectAll}>
              <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
                {allSelected && <CheckIcon size={16} color="#fff" />}
              </View>
              <Text style={[styles.selectAllText, {color: theme.text}]}>
                {allSelected ? t('deselectAll') : t('selectAll')}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.selectedInfo, {color: theme.subText}]}>
              {selectedCount} {t('selected')}
            </Text>
          </View>

          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
          />

          {/* Footer */}
          <View style={[styles.footer, {backgroundColor: theme.cardBg, borderTopColor: theme.border, paddingBottom: insets.bottom + 16}]}>
            <View style={styles.totalContainer}>
              <View>
                <Text style={[styles.totalLabel, {color: theme.subText}]}>
                  {t('total')} ({selectedCount} {t('selected')}):
                </Text>
                <Text style={[styles.totalAmount, {color: theme.text}]}>
                  €{getSelectedTotal()}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.checkoutButton,
                selectedCount === 0 && styles.checkoutButtonDisabled,
              ]}
              onPress={() => {
                if (selectedCount > 0) {
                  navigation.navigate('Checkout');
                }
              }}
              disabled={selectedCount === 0}>
              <Text style={styles.checkoutButtonText}>
                {t('checkout')} ({selectedCount})
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    color: '#FF0000',
    fontSize: 13,
    fontWeight: '600',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  selectedInfo: {
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
  },
  listContainer: {
    padding: 15,
    paddingBottom: 20,
  },
  cartItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    marginLeft: 12,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  specText: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: '#FF0000',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantity: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyCartIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyCartText: {
    fontSize: 18,
    marginBottom: 30,
    fontWeight: '600',
  },
  shopButton: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },
  shopButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalContainer: {
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  checkoutButton: {
    backgroundColor: '#FF0000',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#FF0000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  clearConfirmCard: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  clearConfirmTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 4},
  clearConfirmSub: {fontSize: 13, marginBottom: 16},
  clearConfirmBtns: {flexDirection: 'row', gap: 12},
  clearConfirmBtn: {flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center'},
  clearCancelBtn: {borderWidth: 1.5},
  clearCancelText: {fontSize: 15, fontWeight: '600'},
  clearYesBtn: {backgroundColor: '#FF0000'},
  clearYesText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default CartScreen;
