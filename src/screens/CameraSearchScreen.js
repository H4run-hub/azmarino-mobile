import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../context/ThemeContext';
import {useCart} from '../context/CartContext';
import {useLanguage} from '../context/LanguageContext';
import {identifyProductFromImage} from '../services/claudeVision';
import {matchProducts} from '../services/productMatcher';
import {BackIcon, CartIcon} from '../components/Icons';

const getNumColumns = width => {
  if (width >= 900) return 4;
  if (width >= 600) return 3;
  return 2;
};

// ── Phases ────────────────────────────────────
// idle        → show camera / gallery buttons
// analyzing   → image picked, Claude is thinking
// results     → show matched products
// ─────────────────────────────────────────────

const CameraSearchScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {addToCart} = useCart();
  const {t} = useLanguage();
  const {width} = useWindowDimensions();

  const [phase, setPhase] = useState('idle'); // idle | analyzing | results
  const [previewUri, setPreviewUri] = useState(null);
  const [resultLabel, setResultLabel] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState([]);
  const [error, setError] = useState(null);

  const numColumns = getNumColumns(width);
  const gap = 8;
  const hPad = 12;
  const CARD_WIDTH = (width - hPad * 2 - gap * (numColumns - 1)) / numColumns;
  const IMAGE_HEIGHT = CARD_WIDTH * 1.1;

  const processImage = useCallback(async asset => {
    setPreviewUri(asset.uri);
    setPhase('analyzing');
    setError(null);

    try {
      const base64 = asset.base64;
      const mime = asset.type || 'image/jpeg';

      const visionResult = await identifyProductFromImage(base64, mime);
      const {results, label, isFallback: fallback} = matchProducts(visionResult);

      setResultLabel(label);
      setIsFallback(fallback);
      setMatchedProducts(results);
      setPhase('results');
    } catch (err) {
      console.error('Vision error:', err);
      setError(t('visionError'));
      setPhase('idle');
    }
  }, []);

  const openCamera = useCallback(async () => {
    // Android requires runtime camera permission
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: t('cameraPermTitle'),
            message: t('cameraPermMsg'),
            buttonPositive: t('cameraPermAllow'),
            buttonNegative: t('cameraPermDeny'),
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setError(t('cameraPermDenied'));
          return;
        }
      } catch (err) {
        setError(t('cameraPermError'));
        return;
      }
    }

    launchCamera(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
        saveToPhotos: false,
        presentationStyle: 'fullScreen',
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setError(`${t('cameraError')} ${response.errorMessage || response.errorCode}`);
          return;
        }
        const asset = response.assets?.[0];
        if (asset) processImage(asset);
      },
    );
  }, [processImage]);

  const openGallery = useCallback(() => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.8,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          setError(`${t('galleryError')} ${response.errorMessage || response.errorCode}`);
          return;
        }
        const asset = response.assets?.[0];
        if (asset) processImage(asset);
      },
    );
  }, [processImage]);

  const reset = () => {
    setPhase('idle');
    setPreviewUri(null);
    setMatchedProducts([]);
    setResultLabel('');
    setError(null);
  };

  // ── Product card (same style as HomeScreen) ──
  const renderProduct = ({item}) => (
    <TouchableOpacity
      style={[cardStyles.card, {backgroundColor: theme.cardBg, width: CARD_WIDTH}]}
      onPress={() => navigation.navigate('ProductDetail', {product: item})}
      activeOpacity={0.93}>
      <View style={[cardStyles.imageWrapper, {height: IMAGE_HEIGHT}]}>
        <Image source={{uri: item.image}} style={cardStyles.image} />
        <View style={cardStyles.discountBadge}>
          <Text style={cardStyles.discountText}>-{item.discount}%</Text>
        </View>
      </View>
      <View style={cardStyles.info}>
        {/* Stars */}
        <View style={cardStyles.starRow}>
          {[1, 2, 3, 4, 5].map(s => (
            <Icon
              key={s}
              name={
                item.rating >= s
                  ? 'star'
                  : item.rating >= s - 0.5
                  ? 'star-half'
                  : 'star-outline'
              }
              size={10}
              color="#FFD700"
            />
          ))}
          <Text style={[cardStyles.reviewCount, {color: theme.subText}]}>
            {item.reviews}
          </Text>
        </View>
        {/* Price row */}
        <View style={cardStyles.priceRow}>
          <View style={cardStyles.priceBlock}>
            <Text style={cardStyles.price}>{item.price}</Text>
            <Text style={[cardStyles.sold, {color: theme.subText}]}>
              {item.reviews} sold
            </Text>
          </View>
          <TouchableOpacity
            style={cardStyles.addBtn}
            onPress={() => addToCart({...item, quantity: 1, selected: true})}
            hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}>
            <Icon name="cart-outline" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[cardStyles.rrp, {color: theme.subText}]}>
          RRP <Text style={cardStyles.rrpStrike}>{item.originalPrice}</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bg}
        translucent={false}
      />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('cameraSearchTitle')}</Text>
        {phase === 'results' ? (
          <TouchableOpacity onPress={reset}>
            <Icon name="refresh-outline" size={24} color="#FF0000" />
          </TouchableOpacity>
        ) : (
          <View style={{width: 28}} />
        )}
      </View>

      {/* ── IDLE: pick source ─────────────────── */}
      {phase === 'idle' && (
        <View style={styles.idleContainer}>
          {/* Camera viewfinder illustration */}
          <View style={[styles.viewfinder, {borderColor: '#FF0000'}]}>
            <Icon name="scan-outline" size={80} color="rgba(255,0,0,0.25)" />
          </View>

          {/* Error message if previous attempt failed */}
          {error && (
            <View style={[styles.errorBanner, {backgroundColor: 'rgba(255,0,0,0.08)', borderColor: '#FF0000'}]}>
              <Icon name="alert-circle-outline" size={16} color="#FF0000" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.sourceBtn, styles.sourceBtnPrimary]}
              onPress={openCamera}
              activeOpacity={0.85}>
              <Icon name="camera" size={26} color="#fff" />
              <Text style={styles.sourceBtnPrimaryText}>{t('cameraBtn')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sourceBtn, styles.sourceBtnSecondary, {borderColor: theme.border, backgroundColor: theme.cardBg}]}
              onPress={openGallery}
              activeOpacity={0.85}>
              <Icon name="images-outline" size={26} color="#FF0000" />
              <Text style={[styles.sourceBtnSecondaryText, {color: theme.text}]}>{t('galleryBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── ANALYZING: spinner + preview ─────── */}
      {phase === 'analyzing' && (
        <View style={styles.analyzingContainer}>
          {previewUri && (
            <Image
              source={{uri: previewUri}}
              style={[styles.previewImage, {borderColor: theme.border}]}
              resizeMode="cover"
            />
          )}
          <View style={styles.analyzingBox}>
            <ActivityIndicator size="large" color="#FF0000" />
            <Text style={[styles.analyzingTitle, {color: theme.text}]}>{t('analyzing')}</Text>
            <Text style={[styles.analyzingSubtitle, {color: theme.subText}]}>{t('analyzingSub')}</Text>
          </View>
        </View>
      )}

      {/* ── RESULTS ──────────────────────────── */}
      {phase === 'results' && (
        <>
          {/* Results header banner */}
          <View style={[styles.resultsBanner, {backgroundColor: isDark ? 'rgba(255,0,0,0.08)' : '#fff5f5', borderBottomColor: theme.border}]}>
            {previewUri && (
              <Image source={{uri: previewUri}} style={styles.thumbImage} />
            )}
            <View style={styles.resultsBannerText}>
              <Text style={[styles.identifiedLabel, {color: theme.text}]}>
                <Icon name="scan" size={13} color="#FF0000" />
                {'  '}
                {resultLabel}
              </Text>
              <Text style={[styles.resultsSublabel, {color: theme.subText}]}>
                {isFallback
                  ? t('noExactMatch')
                  : `${matchedProducts.length} ${t('resultsFound')}`}
              </Text>
            </View>
            <TouchableOpacity onPress={reset} style={styles.rescanBtn}>
              <Icon name="refresh" size={18} color="#FF0000" />
            </TouchableOpacity>
          </View>

          <FlatList
            key={numColumns}
            data={matchedProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id}
            numColumns={numColumns}
            columnWrapperStyle={numColumns > 1 ? [styles.row, {gap}] : null}
            contentContainerStyle={[styles.grid, {paddingHorizontal: hPad}]}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

// ── Card styles (mirrors HomeScreen) ──────────
const cardStyles = StyleSheet.create({
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
  imageWrapper: {width: '100%', overflow: 'hidden', backgroundColor: '#f5f5f5'},
  image: {width: '100%', height: '100%', resizeMode: 'cover'},
  discountBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#FF0000', paddingHorizontal: 7,
    paddingVertical: 3, borderRadius: 5,
  },
  discountText: {color: '#fff', fontSize: 11, fontWeight: 'bold'},
  info: {paddingHorizontal: 7, paddingTop: 5, paddingBottom: 6},
  starRow: {flexDirection: 'row', alignItems: 'center', gap: 1, marginBottom: 3},
  reviewCount: {fontSize: 10, marginLeft: 2},
  priceRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2},
  priceBlock: {flexDirection: 'row', alignItems: 'baseline', gap: 4, flexShrink: 1},
  price: {fontSize: 17, fontWeight: 'bold', color: '#FF0000'},
  sold: {fontSize: 10},
  addBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#FF0000', alignItems: 'center',
    justifyContent: 'center', elevation: 4, flexShrink: 0,
  },
  rrp: {fontSize: 10},
  rrpStrike: {textDecorationLine: 'line-through', fontSize: 10},
});

// ── Screen styles ──────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: {fontSize: 20, fontWeight: 'bold'},

  // Idle
  idleContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  viewfinder: {
    width: 200, height: 200, borderRadius: 24,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, gap: 12,
  },
  viewfinderText: {fontSize: 13, textAlign: 'center'},
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 10, padding: 12,
    marginBottom: 16, width: '100%',
  },
  errorText: {color: '#FF0000', fontSize: 13, flex: 1},
  tipText: {fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 32},
  btnRow: {flexDirection: 'row', gap: 14, width: '100%'},
  sourceBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 14, gap: 8,
  },
  sourceBtnPrimary: {
    backgroundColor: '#FF0000',
    shadowColor: '#FF0000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  sourceBtnPrimaryText: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
  sourceBtnSecondary: {borderWidth: 1.5},
  sourceBtnSecondaryText: {fontSize: 15, fontWeight: '600'},

  // Analyzing
  analyzingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  previewImage: {
    width: 180, height: 180, borderRadius: 16,
    borderWidth: 2, marginBottom: 32,
  },
  analyzingBox: {alignItems: 'center', gap: 12},
  analyzingTitle: {fontSize: 18, fontWeight: 'bold'},
  analyzingSubtitle: {fontSize: 14, textAlign: 'center'},

  // Results
  resultsBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, gap: 12,
  },
  thumbImage: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  resultsBannerText: {flex: 1},
  identifiedLabel: {fontSize: 14, fontWeight: 'bold', marginBottom: 2},
  resultsSublabel: {fontSize: 12},
  rescanBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  grid: {paddingTop: 10, paddingBottom: 30},
  row: {marginBottom: 8},
});

export default CameraSearchScreen;
