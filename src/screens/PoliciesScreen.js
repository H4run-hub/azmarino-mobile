import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon, ChevronRightIcon} from '../components/Icons';
import {s, vs, fs} from '../utils/scale';

const PoliciesScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [expandedSection, setExpandedSection] = useState({});

  const getPolicies = () => [
    {
      id: 'terms', icon: '📋', color: '#2980b9',
      title: t('policyTermsTitle'), subtitle: t('policyTermsSubtitle'),
      content: [
        {heading: t('policyTermsH1'), body: t('policyTermsB1')},
        {heading: t('policyTermsH2'), body: t('policyTermsB2')},
        {heading: t('policyTermsH3'), body: t('policyTermsB3')},
        {heading: t('policyTermsH4'), body: t('policyTermsB4')},
        {heading: t('policyTermsH5'), body: t('policyTermsB5')},
      ],
    },
    {
      id: 'privacy', icon: '🔒', color: '#8e44ad',
      title: t('policyPrivacyTitle'), subtitle: t('policyPrivacySubtitle'),
      content: [
        {heading: t('policyPrivacyH1'), body: t('policyPrivacyB1')},
        {heading: t('policyPrivacyH2'), body: t('policyPrivacyB2')},
        {heading: t('policyPrivacyH3'), body: t('policyPrivacyB3')},
        {heading: t('policyPrivacyH4'), body: t('policyPrivacyB4')},
        {heading: t('policyPrivacyH5'), body: t('policyPrivacyB5')},
      ],
    },
    {
      id: 'returns', icon: '↩️', color: '#27ae60',
      title: t('policyReturnsTitle'), subtitle: t('policyReturnsSubtitle'),
      content: [
        {heading: t('policyReturnsH1'), body: t('policyReturnsB1')},
        {heading: t('policyReturnsH2'), body: t('policyReturnsB2')},
        {heading: t('policyReturnsH3'), body: t('policyReturnsB3')},
        {heading: t('policyReturnsH4'), body: t('policyReturnsB4')},
      ],
    },
    {
      id: 'shipping', icon: '🚚', color: '#e67e22',
      title: t('policyShippingTitle'), subtitle: t('policyShippingSubtitle'),
      content: [
        {heading: t('policyShippingH1'), body: t('policyShippingB1')},
        {heading: t('policyShippingH2'), body: t('policyShippingB2')},
        {heading: t('policyShippingH3'), body: t('policyShippingB3')},
        {heading: t('policyShippingH4'), body: t('policyShippingB4')},
      ],
    },
    {
      id: 'conduct', icon: '🤝', color: '#FF0000',
      title: t('policyConductTitle'), subtitle: t('policyConductSubtitle'),
      content: [
        {heading: t('policyConductH1'), body: t('policyConductB1')},
        {heading: t('policyConductH2'), body: t('policyConductB2')},
        {heading: t('policyConductH3'), body: t('policyConductB3')},
        {heading: t('policyConductH4'), body: t('policyConductB4')},
      ],
    },
  ];

  const policies = getPolicies();

  const togglePolicy = id => {
    setExpandedPolicy(expandedPolicy === id ? null : id);
    setExpandedSection({});
  };

  const toggleSection = (policyId, sectionIdx) => {
    const key = `${policyId}-${sectionIdx}`;
    setExpandedSection(prev => ({...prev, [key]: !prev[key]}));
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />

      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackIcon size={28} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {color: theme.text}]}>{t('policiesHeaderTitle')}</Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Intro banner */}
        <View style={[styles.introBanner, {backgroundColor: 'rgba(255,0,0,0.06)', borderColor: 'rgba(255,0,0,0.15)'}]}>
          <Text style={styles.introIcon}>⚖️</Text>
          <Text style={[styles.introTitle, {color: theme.text}]}>{t('policiesIntroTitle')}</Text>
          <Text style={[styles.introSub, {color: theme.subText}]}>{t('policiesIntroSub')}</Text>
          <Text style={[styles.lastUpdated, {color: theme.subText}]}>{t('policiesLastUpdated')}</Text>
        </View>

        {/* Policy Cards */}
        {policies.map(policy => {
          const isOpen = expandedPolicy === policy.id;
          return (
            <View
              key={policy.id}
              style={[styles.policyCard, {backgroundColor: theme.cardBg, borderColor: isOpen ? policy.color : theme.border}]}>
              <TouchableOpacity style={styles.policyHeader} onPress={() => togglePolicy(policy.id)} activeOpacity={0.8}>
                <View style={[styles.policyIconBox, {backgroundColor: `${policy.color}18`}]}>
                  <Text style={styles.policyIconText}>{policy.icon}</Text>
                </View>
                <View style={styles.policyMeta}>
                  <Text style={[styles.policyTitle, {color: theme.text}]}>{policy.title}</Text>
                  <Text style={[styles.policySubtitle, {color: policy.color}]}>{policy.subtitle}</Text>
                </View>
                <ChevronRightIcon size={20} color={theme.subText} rotated={isOpen} />
              </TouchableOpacity>

              {isOpen && (
                <View style={[styles.sectionsContainer, {borderTopColor: theme.border}]}>
                  {policy.content.map((section, idx) => {
                    const key = `${policy.id}-${idx}`;
                    const sectionOpen = expandedSection[key];
                    return (
                      <View
                        key={idx}
                        style={[styles.sectionItem, idx < policy.content.length - 1 && {borderBottomWidth: 1, borderBottomColor: theme.border}]}>
                        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(policy.id, idx)} activeOpacity={0.7}>
                          <View style={[styles.sectionDot, {backgroundColor: policy.color}]} />
                          <Text style={[styles.sectionHeading, {color: theme.text}]}>{section.heading}</Text>
                          <ChevronRightIcon size={16} color={theme.subText} rotated={sectionOpen} />
                        </TouchableOpacity>
                        {sectionOpen && (
                          <Text style={[styles.sectionBody, {color: theme.subText, borderLeftColor: policy.color}]}>
                            {section.body}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}

        {/* Contact footer */}
        <View style={[styles.contactCard, {backgroundColor: theme.cardBg, borderColor: theme.border}]}>
          <Text style={[styles.contactTitle, {color: theme.text}]}>{t('policiesContactTitle')}</Text>
          <Text style={[styles.contactBody, {color: theme.subText}]}>{t('policiesContactBody')}</Text>
          <View style={styles.contactRow}>
            <Text style={[styles.contactItem, {color: theme.text}]}>{t('policiesContactEmail')}</Text>
          </View>
          <TouchableOpacity style={styles.chatBtn} onPress={() => navigation.navigate('ChatSupport')}>
            <Text style={styles.chatBtnText}>{t('policiesContactChat')}</Text>
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
  introBanner: {margin: 16, marginBottom: 8, padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center'},
  introIcon: {fontSize: fs(40), marginBottom: 10},
  introTitle: {fontSize: fs(18), fontWeight: 'bold', marginBottom: 8, textAlign: 'center'},
  introSub: {fontSize: fs(13), lineHeight: fs(20), textAlign: 'center', marginBottom: 10},
  lastUpdated: {fontSize: fs(12), fontWeight: '500'},
  policyCard: {marginHorizontal: 16, marginBottom: 10, borderRadius: 14, borderWidth: 1.5, overflow: 'hidden'},
  policyHeader: {flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12},
  policyIconBox: {width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  policyIconText: {fontSize: fs(22)},
  policyMeta: {flex: 1},
  policyTitle: {fontSize: fs(15), fontWeight: 'bold', marginBottom: 2},
  policySubtitle: {fontSize: fs(12), fontWeight: '600'},
  sectionsContainer: {borderTopWidth: 1, paddingVertical: 4},
  sectionItem: {paddingHorizontal: 16},
  sectionHeader: {flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 10},
  sectionDot: {width: 8, height: 8, borderRadius: 4, flexShrink: 0},
  sectionHeading: {flex: 1, fontSize: fs(14), fontWeight: '600'},
  sectionBody: {fontSize: fs(13), lineHeight: fs(21), paddingBottom: 14, paddingLeft: 18, borderLeftWidth: 2, marginLeft: 3},
  contactCard: {margin: 16, marginBottom: 8, padding: 20, borderRadius: 14, borderWidth: 1},
  contactTitle: {fontSize: fs(17), fontWeight: 'bold', marginBottom: 8},
  contactBody: {fontSize: fs(13), lineHeight: fs(20), marginBottom: 14},
  contactRow: {marginBottom: 14},
  contactItem: {fontSize: fs(14), fontWeight: '600', marginBottom: 4},
  chatBtn: {backgroundColor: '#FF0000', paddingVertical: 14, borderRadius: 12, alignItems: 'center'},
  chatBtnText: {color: '#fff', fontSize: fs(15), fontWeight: 'bold'},
});

export default PoliciesScreen;
