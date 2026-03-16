import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {
  BackIcon, ChevronRightIcon, NotificationIcon, ShieldIcon,
  InfoIcon, ChatIcon, TrackIcon,
} from '../components/Icons';
import {s, vs, fs} from '../utils/scale';

const SettingsScreen = ({navigation, onLogout, isLoggedIn}) => {
  const {theme, isDark, toggleTheme} = useTheme();
  const {t, language, toggleLanguage} = useLanguage();

  const [orderNotifs, setOrderNotifs] = useState(true);
  const [promoNotifs, setPromoNotifs] = useState(true);
  const [systemNotifs, setSystemNotifs] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [personalisedAds, setPersonalisedAds] = useState(false);

  const SectionTitle = ({title}) => (
    <Text style={[styles.sectionTitle, {color: theme.subText}]}>{title}</Text>
  );

  const ToggleRow = ({icon, label, sublabel, value, onValueChange}) => (
    <View style={[styles.row, {borderBottomColor: theme.border}]}>
      <View style={[styles.rowIcon, {backgroundColor: 'rgba(255,0,0,0.08)'}]}>
        {icon}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, {color: theme.text}]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, {color: theme.subText}]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{false: theme.border, true: 'rgba(255,0,0,0.35)'}}
        thumbColor={value ? '#FF0000' : (isDark ? '#888' : '#ccc')}
      />
    </View>
  );

  const LinkRow = ({icon, label, sublabel, onPress}) => (
    <TouchableOpacity
      style={[styles.row, {borderBottomColor: theme.border}]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.rowIcon, {backgroundColor: 'rgba(255,0,0,0.08)'}]}>
        {icon}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, {color: theme.text}]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSublabel, {color: theme.subText}]}>{sublabel}</Text> : null}
      </View>
      <ChevronRightIcon size={18} color={theme.subText} />
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
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('settingsTitle')}</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Appearance ─────────────────────── */}
        <SectionTitle title={t('sectionAppearance')} />
        <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
          <View style={[styles.row, {borderBottomColor: 'transparent'}]}>
            <View style={[styles.rowIcon, {backgroundColor: 'rgba(255,0,0,0.08)'}]}>
              <Text style={{fontSize: 20}}>{isDark ? '🌙' : '☀️'}</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, {color: theme.text}]}>{t('darkMode')}</Text>
              <Text style={[styles.rowSublabel, {color: theme.subText}]}>
                {isDark ? t('darkModeOn') : t('darkModeOff')}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{false: theme.border, true: 'rgba(255,0,0,0.35)'}}
              thumbColor={isDark ? '#FF0000' : '#ccc'}
            />
          </View>
        </View>

        {/* ── Language ───────────────────────── */}
        <SectionTitle title={t('sectionLanguage')} />
        <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
          <TouchableOpacity
            style={[styles.row, {borderBottomColor: 'transparent'}]}
            onPress={toggleLanguage}
            activeOpacity={0.7}>
            <View style={[styles.rowIcon, {backgroundColor: 'rgba(255,0,0,0.08)'}]}>
              <Text style={{fontSize: 20}}>🌍</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, {color: theme.text}]}>{t('language')}</Text>
              <Text style={[styles.rowSublabel, {color: theme.subText}]}>{t('languageSub')}</Text>
            </View>
            <View style={styles.langToggle}>
              <View style={[styles.langOption, language === 'ti' && styles.langOptionActive]}>
                <Text style={[styles.langOptionText, language === 'ti' && styles.langOptionTextActive]}>ትግ</Text>
              </View>
              <View style={[styles.langOption, language === 'en' && styles.langOptionActive]}>
                <Text style={[styles.langOptionText, language === 'en' && styles.langOptionTextActive]}>EN</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Notifications ──────────────────── */}
        <SectionTitle title={t('sectionNotifications')} />
        <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
          <ToggleRow
            icon={<Text style={{fontSize: 18}}>📦</Text>}
            label={t('orderNotifs')}
            sublabel={t('orderNotifsSub')}
            value={orderNotifs}
            onValueChange={setOrderNotifs}
          />
          <ToggleRow
            icon={<Text style={{fontSize: 18}}>🔥</Text>}
            label={t('promoNotifs')}
            sublabel={t('promoNotifsSub')}
            value={promoNotifs}
            onValueChange={setPromoNotifs}
          />
          <ToggleRow
            icon={<NotificationIcon size={20} color="#FF0000" />}
            label={t('systemNotifs')}
            sublabel={t('systemNotifsSub')}
            value={systemNotifs}
            onValueChange={setSystemNotifs}
          />
          <TouchableOpacity
            style={[styles.row, {borderBottomColor: 'transparent'}]}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}>
            <View style={[styles.rowIcon, {backgroundColor: 'rgba(255,0,0,0.08)'}]}>
              <NotificationIcon size={20} color="#FF0000" />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, {color: theme.text}]}>{t('viewAllNotifs')}</Text>
              <Text style={[styles.rowSublabel, {color: theme.subText}]}>{t('viewAllNotifsSub')}</Text>
            </View>
            <ChevronRightIcon size={18} color={theme.subText} />
          </TouchableOpacity>
        </View>

        {/* ── Privacy ────────────────────────── */}
        <SectionTitle title={t('sectionPrivacy')} />
        <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
          <ToggleRow
            icon={<ShieldIcon size={20} color="#FF0000" />}
            label={t('analytics')}
            sublabel={t('analyticsSub')}
            value={analyticsEnabled}
            onValueChange={setAnalyticsEnabled}
          />
          <ToggleRow
            icon={<Text style={{fontSize: 18}}>🎯</Text>}
            label={t('personalizedAds')}
            sublabel={t('personalizedAdsSub')}
            value={personalisedAds}
            onValueChange={setPersonalisedAds}
          />
          <LinkRow
            icon={<ShieldIcon size={20} color="#FF0000" />}
            label={t('privacyPolicy')}
            sublabel={t('privacyPolicySub')}
            onPress={() => navigation.navigate('Policies')}
          />
        </View>

        {/* ── Support ────────────────────────── */}
        <SectionTitle title={t('sectionSupport')} />
        <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
          <LinkRow
            icon={<ChatIcon size={20} color="#FF0000" />}
            label={t('saraAI')}
            sublabel={t('saraAISub')}
            onPress={() => navigation.navigate('ChatSupport')}
          />
          <LinkRow
            icon={<TrackIcon size={20} color="#FF0000" />}
            label={t('trackOrderSettings')}
            sublabel={t('trackOrderSettingsSub')}
            onPress={() => navigation.navigate('TrackOrder')}
          />
          <LinkRow
            icon={<InfoIcon size={20} color="#FF0000" />}
            label={t('aboutUsSettings')}
            sublabel={t('aboutUsSettingsSub')}
            onPress={() => navigation.navigate('AboutUs')}
          />
        </View>

        <View style={{height: 40}} />
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
  sectionTitle: {
    fontSize: fs(12), fontWeight: '700', letterSpacing: 0.8,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
    textTransform: 'uppercase',
  },
  card: {marginBottom: 2},
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  rowText: {flex: 1},
  rowLabel: {fontSize: fs(15), fontWeight: '600', marginBottom: 2},
  rowSublabel: {fontSize: fs(12), lineHeight: fs(16)},
  langToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF0000',
    overflow: 'hidden',
  },
  langOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  langOptionActive: {backgroundColor: '#FF0000'},
  langOptionText: {fontSize: fs(13), fontWeight: 'bold', color: '#FF0000'},
  langOptionTextActive: {color: '#fff'},
});

export default SettingsScreen;
