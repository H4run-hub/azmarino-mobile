import React from 'react';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {s, vs, fs} from '../utils/scale';

const AboutUsScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();

  const values = [
    {icon: '✓', title: t('aboutValue1Title'), text: t('aboutValue1Text')},
    {icon: '✓', title: t('aboutValue2Title'), text: t('aboutValue2Text')},
    {icon: '✓', title: t('aboutValue3Title'), text: t('aboutValue3Text')},
    {icon: '✓', title: t('aboutValue4Title'), text: t('aboutValue4Text')},
  ];

  const features = [
    {icon: '🌍', title: t('aboutFeature1Title'), text: t('aboutFeature1Text')},
    {icon: '💰', title: t('aboutFeature2Title'), text: t('aboutFeature2Text')},
    {icon: '🚚', title: t('aboutFeature3Title'), text: t('aboutFeature3Text')},
    {icon: '🔒', title: t('aboutFeature4Title'), text: t('aboutFeature4Text')},
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('aboutHeaderTitle')}</Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView style={styles.content}>
        {/* Header Section */}
        <View style={[styles.headerSection, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.mainTitle, {color: theme.text}]}>{t('aboutHeaderTitle')}</Text>
          <Text style={[styles.subtitle, {color: theme.subText}]}>{t('aboutHeaderSub')}</Text>
        </View>

        {/* Mission */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={styles.sectionTitle}>{t('aboutMissionTitle')}</Text>
          <Text style={[styles.sectionText, {color: theme.text}]}>{t('aboutMissionText')}</Text>
        </View>

        {/* Vision */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={styles.sectionTitle}>{t('aboutVisionTitle')}</Text>
          <Text style={[styles.sectionText, {color: theme.text}]}>{t('aboutVisionText')}</Text>
        </View>

        {/* Values */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={styles.sectionTitle}>{t('aboutValuesTitle')}</Text>
          {values.map((v, i) => (
            <View key={i} style={styles.valueItem}>
              <Text style={styles.valueIcon}>{v.icon}</Text>
              <View style={styles.valueContent}>
                <Text style={[styles.valueTitle, {color: theme.text}]}>{v.title}</Text>
                <Text style={[styles.valueText, {color: theme.subText}]}>{v.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Why Choose Us */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={styles.sectionTitle}>{t('aboutWhyTitle')}</Text>
          {features.map((f, i) => (
            <View
              key={i}
              style={[styles.featureBox, {
                backgroundColor: isDark ? 'rgba(255,0,0,0.1)' : '#fff3f3',
                borderColor: isDark ? 'rgba(255,0,0,0.3)' : '#ffe0e0',
              }]}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureTitle, {color: theme.text}]}>{f.title}</Text>
              <Text style={[styles.featureText, {color: theme.subText}]}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={[styles.section, {backgroundColor: theme.cardBg}]}>
          <Text style={styles.sectionTitle}>{t('aboutContactTitle')}</Text>
          <Text style={[styles.contactDescription, {color: theme.subText}]}>{t('aboutContactDesc')}</Text>
          <View style={[styles.contactInfoBox, {backgroundColor: isDark ? 'rgba(255,0,0,0.08)' : '#fff9f9', borderColor: theme.border}]}>
            <Text style={[styles.contactLabel, {color: theme.subText}]}>{t('aboutEmailLabel')}</Text>
            <Text style={[styles.contactValue, {color: theme.text}]}>support@azmarino.online</Text>
          </View>
          <TouchableOpacity style={styles.chatButton} onPress={() => navigation.navigate('ChatSupport')}>
            <Text style={styles.chatButtonText}>{t('aboutChatBtn')}</Text>
          </TouchableOpacity>
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
  content: {flex: 1},
  headerSection: {alignItems: 'center', padding: 30, marginBottom: 10},
  mainTitle: {fontSize: fs(32), fontWeight: 'bold', marginBottom: 10},
  subtitle: {fontSize: fs(16), textAlign: 'center', lineHeight: fs(24)},
  section: {padding: 25, marginBottom: 10},
  sectionTitle: {fontSize: fs(22), fontWeight: 'bold', color: '#FF0000', marginBottom: 15},
  sectionText: {fontSize: fs(16), lineHeight: fs(26)},
  valueItem: {flexDirection: 'row', marginBottom: 20, alignItems: 'flex-start'},
  valueIcon: {fontSize: fs(24), color: '#27ae60', marginRight: 15},
  valueContent: {flex: 1},
  valueTitle: {fontSize: fs(18), fontWeight: 'bold', marginBottom: 5},
  valueText: {fontSize: fs(15), lineHeight: fs(22)},
  featureBox: {padding: 20, borderRadius: 12, marginBottom: 15, alignItems: 'center', borderWidth: 1},
  featureIcon: {fontSize: fs(40), marginBottom: 10},
  featureTitle: {fontSize: fs(18), fontWeight: 'bold', marginBottom: 8},
  featureText: {fontSize: fs(14), textAlign: 'center', lineHeight: fs(20)},
  contactDescription: {fontSize: fs(15), marginBottom: 20, lineHeight: fs(22), textAlign: 'center'},
  contactInfoBox: {padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1},
  contactLabel: {fontSize: fs(14), fontWeight: '600', marginBottom: 6},
  contactValue: {fontSize: fs(16), fontWeight: 'bold'},
  chatButton: {backgroundColor: '#FF0000', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 15},
  chatButtonText: {color: '#fff', fontSize: fs(16), fontWeight: 'bold'},
});

export default AboutUsScreen;
