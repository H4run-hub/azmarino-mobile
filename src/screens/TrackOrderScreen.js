import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {trackOrder as trackOrderAPI} from '../services/api';
import {s, vs, fs} from '../utils/scale';

const TrackOrderScreen = ({navigation, user}) => {
  const {theme, isDark} = useTheme();
  const {t, language} = useLanguage();
  const [orderNumber, setOrderNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async () => {
    if (!orderNumber.trim()) return;
    setLoading(true);
    setError(null);
    setTrackingResult(null);
    try {
      const data = await trackOrderAPI(
        orderNumber.trim().toUpperCase(),
        user?.email || '',
      );
      if (data.success && data.order) {
        setTrackingResult(data.order);
      } else {
        setError(t('trackOrderError'));
      }
    } catch (err) {
      const msg = err.response?.data?.message || t('trackOrderError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !orderNumber.trim();

  // Determine which step is the "current" active step (last completed step)
  const getCurrentStepIndex = steps => {
    let last = -1;
    steps.forEach((s, i) => {
      if (s.completed) last = i;
    });
    return last;
  };

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
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('trackOrderTitle')}</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 30}}>

        {/* Search Box */}
        <View style={[styles.searchSection, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.sectionTitle, {color: theme.text}]}>{t('trackOrderSearch')}</Text>
          <Text style={[styles.sectionDesc, {color: theme.subText}]}>{t('trackOrderDesc')}</Text>

          {/* Order Number */}
          <TextInput
            style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: theme.border}]}
            placeholder={t('trackOrderPlaceholder')}
            placeholderTextColor={theme.subText}
            value={orderNumber}
            onChangeText={text => setOrderNumber(text.toUpperCase())}
            autoCapitalize="characters"
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>❌ {error}</Text>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => navigation.navigate('ChatSupport')}>
                <Text style={styles.helpButtonText}>{t('contactSupport')}</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.trackButton, isDisabled && styles.trackButtonDisabled]}
            onPress={handleTrack}
            disabled={isDisabled}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.trackButtonText}>{t('trackOrderBtn')}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Tracking Result */}
        {trackingResult && (
          <>
            {/* Status Card */}
            <View style={[styles.statusCard, {backgroundColor: theme.cardBg}]}>
              <View style={styles.statusHeader}>
                <Text style={[styles.orderNum, {color: theme.text}]}>
                  #{trackingResult.orderNumber}
                </Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>
                    {trackingResult.statusLabel || trackingResult.status}
                  </Text>
                </View>
              </View>

              {trackingResult.estimatedDelivery && (
                <View style={[styles.deliveryInfo, {borderBottomColor: theme.border}]}>
                  <Text style={[styles.deliveryLabel, {color: theme.subText}]}>
                    {t('estimatedDelivery')}
                  </Text>
                  <Text style={styles.deliveryValue}>
                    {trackingResult.estimatedDelivery}
                  </Text>
                </View>
              )}

              {trackingResult.total !== undefined && (
                <View style={styles.locationInfo}>
                  <Text style={styles.locationIcon}>💰</Text>
                  <Text style={[styles.locationText, {color: theme.text}]}>
                    €{parseFloat(trackingResult.total).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {/* Timeline */}
            {trackingResult.steps && trackingResult.steps.length > 0 && (() => {
              const currentIdx = getCurrentStepIndex(trackingResult.steps);
              return (
                <View style={[styles.timelineSection, {backgroundColor: theme.cardBg}]}>
                  <Text style={[styles.sectionTitle, {color: theme.text}]}>
                    {t('trackOrderHistory')}
                  </Text>
                  {trackingResult.steps.map((step, index) => {
                    const label =
                      language === 'en'
                        ? (step.titleEn || step.title)
                        : (step.title || step.titleEn);
                    const isLast = index === trackingResult.steps.length - 1;
                    const isCurrent = index === currentIdx;
                    return (
                      <View key={index} style={styles.timelineItem}>
                        <View style={styles.timelineLeft}>
                          <View style={[
                            styles.timelineDot,
                            step.completed && styles.timelineDotCompleted,
                            isCurrent && styles.timelineDotCurrent,
                          ]}>
                            {step.completed && (
                              <Text style={styles.checkmark}>✓</Text>
                            )}
                          </View>
                          {!isLast && (
                            <View style={[
                              styles.timelineLine,
                              step.completed && styles.timelineLineCompleted,
                            ]} />
                          )}
                        </View>
                        <View style={styles.timelineRight}>
                          <Text style={[
                            styles.timelineStatus,
                            {color: theme.text},
                            isCurrent && styles.timelineStatusCurrent,
                          ]}>
                            {label}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              );
            })()}

            {/* Items (if returned by backend) */}
            {trackingResult.items && trackingResult.items.length > 0 && (
              <View style={[styles.itemsSection, {backgroundColor: theme.cardBg}]}>
                <Text style={[styles.sectionTitle, {color: theme.text}]}>
                  📦 {t('items')}
                </Text>
                {trackingResult.items.map((item, index) => (
                  <View key={index} style={[styles.itemRow, {borderBottomColor: theme.border}]}>
                    <Text style={[styles.itemName, {color: theme.text}]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemMeta, {color: theme.subText}]}>
                      x{item.quantity} • €{parseFloat(item.price).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Help Section */}
            <View style={styles.helpCard}>
              <Text style={styles.helpTitle}>{t('needHelp')}</Text>
              <Text style={styles.helpText}>{t('needHelpText')}</Text>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => navigation.navigate('ChatSupport')}>
                <Text style={styles.contactButtonText}>{t('sendMessage')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16, borderBottomWidth: 1,
  },
  headerTitle: {fontSize: fs(20), fontWeight: 'bold'},
  content: {flex: 1},
  searchSection: {margin: 15, padding: 20, borderRadius: 12, elevation: 2},
  sectionTitle: {fontSize: fs(18), fontWeight: 'bold', marginBottom: 8},
  sectionDesc: {fontSize: fs(14), marginBottom: 15},
  input: {
    borderRadius: 10, padding: 14, fontSize: fs(16), marginBottom: 12,
    borderWidth: 1, fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#fff0f0', padding: 15, borderRadius: 10,
    marginBottom: 15, borderWidth: 1, borderColor: '#ffcccc',
  },
  errorText: {color: '#d32f2f', fontSize: fs(14), marginBottom: 10, fontWeight: '600'},
  helpButton: {backgroundColor: '#FF0000', padding: 10, borderRadius: 8, alignItems: 'center'},
  helpButtonText: {color: '#fff', fontSize: fs(13), fontWeight: 'bold'},
  trackButton: {backgroundColor: '#FF0000', padding: 16, borderRadius: 10, alignItems: 'center'},
  trackButtonDisabled: {backgroundColor: '#999'},
  trackButtonText: {color: '#fff', fontSize: fs(16), fontWeight: 'bold'},

  // Status card
  statusCard: {margin: 15, marginTop: 0, padding: 20, borderRadius: 12, elevation: 2},
  statusHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 15,
  },
  orderNum: {fontSize: fs(16), fontWeight: 'bold'},
  statusBadge: {
    backgroundColor: '#FF0000', paddingHorizontal: 12,
    paddingVertical: 6, borderRadius: 20,
  },
  statusBadgeText: {color: '#fff', fontSize: fs(12), fontWeight: 'bold'},
  deliveryInfo: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1,
  },
  deliveryLabel: {fontSize: fs(14)},
  deliveryValue: {fontSize: fs(14), fontWeight: 'bold', color: '#FF0000'},
  locationInfo: {flexDirection: 'row', alignItems: 'center'},
  locationIcon: {fontSize: fs(20), marginRight: 8},
  locationText: {fontSize: fs(14), fontWeight: '600'},

  // Timeline
  timelineSection: {margin: 15, marginTop: 0, padding: 20, borderRadius: 12, elevation: 2},
  timelineItem: {flexDirection: 'row', marginTop: 15},
  timelineLeft: {alignItems: 'center', marginRight: 15},
  timelineDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#e9ecef',
    borderWidth: 2, borderColor: '#999', alignItems: 'center', justifyContent: 'center',
  },
  timelineDotCompleted: {backgroundColor: '#27ae60', borderColor: '#27ae60'},
  timelineDotCurrent: {backgroundColor: '#FF0000', borderColor: '#FF0000'},
  checkmark: {color: '#fff', fontSize: fs(12), fontWeight: 'bold'},
  timelineLine: {width: 2, flex: 1, backgroundColor: '#e9ecef', marginTop: 4},
  timelineLineCompleted: {backgroundColor: '#27ae60'},
  timelineRight: {flex: 1, paddingBottom: 20},
  timelineStatus: {fontSize: fs(15), fontWeight: '600', marginBottom: 4},
  timelineStatusCurrent: {color: '#FF0000', fontWeight: 'bold'},

  // Items list
  itemsSection: {margin: 15, marginTop: 0, padding: 20, borderRadius: 12, elevation: 2},
  itemRow: {paddingVertical: 10, borderBottomWidth: 1},
  itemName: {fontSize: fs(14), fontWeight: '600', marginBottom: 2},
  itemMeta: {fontSize: fs(13)},

  // Help card
  helpCard: {
    backgroundColor: '#fff3f3', margin: 15, marginTop: 0, marginBottom: 30,
    padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#ffe0e0',
  },
  helpTitle: {fontSize: fs(16), fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8},
  helpText: {fontSize: fs(14), color: '#666', marginBottom: 15, lineHeight: fs(20)},
  contactButton: {backgroundColor: '#FF0000', padding: 12, borderRadius: 8, alignItems: 'center'},
  contactButtonText: {color: '#fff', fontSize: fs(14), fontWeight: 'bold'},
});

export default TrackOrderScreen;
