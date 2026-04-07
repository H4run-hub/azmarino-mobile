import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Modal} from 'react-native';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';

const DataConsentModal = ({onAccept, onDecline}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.overlay}>
        <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
          <Text style={[styles.title, {color: theme.text}]}>
            {t('consentTitle')}
          </Text>
          <Text style={[styles.body, {color: theme.subText}]}>
            {t('consentBody')}
          </Text>
          <View style={styles.bullets}>
            <Text style={[styles.bullet, {color: theme.subText}]}>{t('consentBullet1')}</Text>
            <Text style={[styles.bullet, {color: theme.subText}]}>{t('consentBullet2')}</Text>
            <Text style={[styles.bullet, {color: theme.subText}]}>{t('consentBullet3')}</Text>
          </View>
          <Text style={[styles.note, {color: theme.subText}]}>
            {t('consentNote')}
          </Text>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Text style={styles.acceptText}>{t('consentAccept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
            <Text style={[styles.declineText, {color: theme.subText}]}>{t('consentDecline')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  bullets: {
    marginBottom: 12,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 4,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  acceptBtn: {
    backgroundColor: '#FF0000',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  acceptText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 14,
  },
});

export default DataConsentModal;
