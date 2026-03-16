import React, {useState} from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon, CheckIcon} from '../components/Icons';
import {s, vs, fs} from '../utils/scale';

const ForgotPasswordScreen = ({navigation}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    setEmailError('');
    if (!email.trim()) { setEmailError(t('errEmail')); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError(t('errEmailInvalid')); return; }
    setSent(true);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <BackIcon size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: theme.text}]}>{t('forgotPasswordTitle')}</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {!sent ? (
            <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
              <Text style={styles.iconLarge}>🔐</Text>
              <Text style={[styles.title, {color: theme.text}]}>{t('forgotPasswordQuestion')}</Text>
              <Text style={[styles.subtitle, {color: theme.subText}]}>{t('forgotPasswordInstruction')}</Text>

              <TextInput
                style={[styles.input, {backgroundColor: theme.bg, color: theme.text, borderColor: emailError ? '#FF0000' : theme.border}]}
                placeholder={t('forgotPasswordInputPlaceholder')}
                value={email}
                onChangeText={v => { setEmail(v); setEmailError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.subText}
              />
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>{t('sendLinkBtn')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { if (navigation.canGoBack()) navigation.goBack(); else navigation.navigate('Login'); }}
                style={styles.backLink}>
                <Text style={[styles.backLinkText, {color: theme.subText}]}>{t('backToLogin')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.card, {backgroundColor: theme.cardBg}]}>
              <View style={styles.successIconWrap}>
                <View style={styles.successCircle}>
                  <CheckIcon size={36} color="#fff" />
                </View>
              </View>
              <Text style={[styles.title, {color: theme.text}]}>{t('linkSentTitle')}</Text>
              <Text style={[styles.subtitle, {color: theme.subText}]}>
                {t('linkSentPrefix')}{'\n'}
                <Text style={{color: '#FF0000', fontWeight: 'bold'}}>{email}</Text>
                {'\n'}{t('linkSentSuffix')}
              </Text>

              <View style={[styles.tipBox, {backgroundColor: isDark ? 'rgba(255,0,0,0.08)' : '#fff9f9', borderColor: 'rgba(255,0,0,0.15)'}]}>
                <Text style={[styles.tipText, {color: theme.subText}]}>{t('spamTip')}</Text>
              </View>

              <TouchableOpacity style={styles.sendButton} onPress={() => { setSent(false); setEmail(''); }}>
                <Text style={styles.sendButtonText}>{t('tryAnotherEmail')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.goLoginButton, {borderColor: '#FF0000'}]} onPress={() => navigation.goBack()}>
                <Text style={styles.goLoginText}>{t('goToLogin')}</Text>
              </TouchableOpacity>
            </View>
          )}
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
  headerTitle: {fontSize: fs(18), fontWeight: 'bold'},
  content: {flexGrow: 1, padding: 24, alignItems: 'center', paddingTop: 40},
  card: {
    width: '100%', maxWidth: 480, borderRadius: 20, padding: 28, alignItems: 'center',
    shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  iconLarge: {fontSize: fs(60), marginBottom: 20},
  title: {fontSize: fs(22), fontWeight: 'bold', marginBottom: 12, textAlign: 'center'},
  subtitle: {fontSize: fs(15), lineHeight: fs(24), textAlign: 'center', marginBottom: 28},
  input: {width: '100%', borderRadius: 12, padding: 16, fontSize: fs(16), marginBottom: 4, borderWidth: 1},
  fieldError: {color: '#FF0000', fontSize: fs(12), marginBottom: 12, alignSelf: 'flex-start', marginLeft: 4},
  sendButton: {width: '100%', backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 16},
  sendButtonText: {color: '#fff', fontSize: fs(17), fontWeight: 'bold'},
  backLink: {paddingVertical: 8},
  backLinkText: {fontSize: fs(15)},
  successIconWrap: {marginBottom: 20},
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#27ae60',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#27ae60', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  tipBox: {width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 20},
  tipText: {fontSize: fs(13), lineHeight: fs(20)},
  goLoginButton: {width: '100%', borderWidth: 2, padding: 16, borderRadius: 12, alignItems: 'center'},
  goLoginText: {color: '#FF0000', fontSize: fs(16), fontWeight: 'bold'},
});

export default ForgotPasswordScreen;
