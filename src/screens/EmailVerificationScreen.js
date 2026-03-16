import React, {useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {verifyEmail, resendVerification} from '../services/api';
import {fs} from '../utils/scale';

const EmailVerificationScreen = ({navigation, route, onLogin}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const user = route?.params?.user;
  const email = user?.email || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError(t('verifyError'));
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await verifyEmail(code.trim());
      setSuccess(t('verifySuccess'));
      setTimeout(() => {
        if (onLogin) onLogin(user);
      }, 800);
    } catch (err) {
      const msg = err.response?.data?.message || t('verifyError');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    try {
      await resendVerification();
      setSuccess(t('resendSuccess'));
      setResendCooldown(60);
    } catch (err) {
      const msg = err.response?.data?.message || t('verifyError');
      setError(msg);
    }
  };

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.resetStack('Home');
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
          <TouchableOpacity onPress={handleBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <BackIcon size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: theme.text}]}>{t('verifyEmailTitle')}</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <Text style={styles.envelope}>{'📧'}</Text>

            <Text style={[styles.title, {color: theme.text}]}>{t('verifyEmailTitle')}</Text>
            <Text style={[styles.message, {color: theme.subText}]}>{t('verifyEmailMsg')}</Text>

            <Text style={[styles.emailLabel, {color: theme.subText}]}>{t('codeSentTo')}</Text>
            <Text style={[styles.emailValue, {color: theme.text}]}>{email}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            ) : null}

            <TextInput
              ref={inputRef}
              style={[styles.codeInput, {backgroundColor: theme.cardBg, color: theme.text, borderColor: error ? '#FF0000' : theme.border}]}
              placeholder={t('verifyCodePlaceholder')}
              value={code}
              onChangeText={v => { setCode(v.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              placeholderTextColor={theme.subText}
              editable={!loading}
              autoFocus
            />

            <TouchableOpacity
              style={[styles.verifyButton, loading && {backgroundColor: '#ccc'}]}
              onPress={handleVerify}
              disabled={loading || code.length !== 6}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.verifyButtonText}>{t('verifyBtn')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, resendCooldown > 0 && {opacity: 0.5}]}
              onPress={handleResend}
              disabled={resendCooldown > 0}>
              <Text style={[styles.resendText, {color: '#FF0000'}]}>
                {resendCooldown > 0
                  ? t('resendCooldown').replace('SECONDS', String(resendCooldown))
                  : t('resendCode')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {flexGrow: 1, padding: 20},
  content: {alignItems: 'center', paddingTop: 40},
  envelope: {fontSize: fs(60), marginBottom: 20},
  title: {fontSize: fs(24), fontWeight: 'bold', marginBottom: 12},
  message: {fontSize: fs(15), textAlign: 'center', marginBottom: 20, paddingHorizontal: 20},
  emailLabel: {fontSize: fs(13), marginBottom: 4},
  emailValue: {fontSize: fs(16), fontWeight: '600', marginBottom: 24},
  codeInput: {
    width: '80%', borderRadius: 12, padding: 18, fontSize: fs(28),
    fontWeight: 'bold', letterSpacing: 12, borderWidth: 1, marginBottom: 20,
  },
  verifyButton: {
    backgroundColor: '#FF0000', paddingVertical: 18, paddingHorizontal: 60,
    borderRadius: 12, alignItems: 'center', marginBottom: 20, width: '80%',
  },
  verifyButtonText: {color: '#fff', fontSize: fs(18), fontWeight: 'bold'},
  resendButton: {padding: 12},
  resendText: {fontSize: fs(15), fontWeight: '600'},
  errorBox: {
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#FF0000',
    borderRadius: 8, padding: 12, marginBottom: 16, width: '80%',
  },
  errorText: {color: '#FF0000', fontSize: fs(14), textAlign: 'center', fontWeight: '600'},
  successBox: {
    backgroundColor: '#f0fff4', borderWidth: 1, borderColor: '#38a169',
    borderRadius: 8, padding: 12, marginBottom: 16, width: '80%',
  },
  successText: {color: '#38a169', fontSize: fs(14), textAlign: 'center', fontWeight: '600'},
});

export default EmailVerificationScreen;
