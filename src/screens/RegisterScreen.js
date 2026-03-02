import React, {useState} from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions,
  ActivityIndicator, Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import {registerUser} from '../services/api';

const RegisterScreen = ({navigation, onLogin}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.resetStack('Home');
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = t('errName');
    if (!email.trim()) e.email = t('errEmail');
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = t('errEmailInvalid');
    if (!phone.trim()) e.phone = t('errPhoneRequired');
    else if (phone.replace(/\D/g, '').length < 8) e.phone = t('errPhoneTooShort');
    if (!password) e.password = t('errPasswordRequired');
    else if (password.length < 6) e.password = t('errPasswordTooShort');
    if (!confirmPassword) e.confirmPassword = t('errConfirmPassword');
    else if (password !== confirmPassword) e.confirmPassword = t('errPasswordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const data = await registerUser(name.trim(), email.trim(), phone.trim(), password);
      if (data.success) {
        if (onLogin) onLogin(data.user);
      } else {
        setApiError(data.message || 'Registration failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'ምስ ሰርቨር ምትሕሓዝ ኣይተኻእለን';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (key, placeholder, value, onChange, opts = {}) => (
    <>
      <TextInput
        style={[styles.input, {backgroundColor: theme.cardBg, color: theme.text, borderColor: errors[key] ? '#FF0000' : theme.border}]}
        placeholder={placeholder}
        value={value}
        onChangeText={v => {onChange(v); setErrors(prev => ({...prev, [key]: ''}));}}
        placeholderTextColor={theme.subText}
        {...opts}
      />
      {errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
          <TouchableOpacity onPress={handleBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <BackIcon size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: theme.text}]}>{t('registerTitle')}</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
          keyboardShouldPersistTaps="handled">

          <View style={[styles.formCard, isTablet && styles.formCardTablet, {backgroundColor: isTablet ? theme.cardBg : 'transparent'}]}>

            <View style={styles.logoSection}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.appName}>{t('appName')}</Text>
              <Text style={[styles.welcomeText, {color: theme.subText}]}>{t('createAccount')}</Text>
            </View>

            <View style={styles.form}>
              {apiError ? (
                <View style={styles.apiErrorBox}>
                  <Text style={styles.apiErrorText}>{apiError}</Text>
                </View>
              ) : null}

              {field('name', t('fullNamePlaceholder'), name, setName, {editable: !loading})}
              {field('email', t('emailPlaceholder'), email, setEmail, {keyboardType: 'email-address', autoCapitalize: 'none', editable: !loading})}
              {field('phone', t('phonePlaceholder'), phone, setPhone, {keyboardType: 'phone-pad', editable: !loading})}
              {field('password', t('passwordPlaceholder'), password, setPassword, {secureTextEntry: true, editable: !loading})}
              {field('confirmPassword', t('confirmPasswordPlaceholder'), confirmPassword, setConfirmPassword, {secureTextEntry: true, editable: !loading})}

              <TouchableOpacity
                style={[styles.registerButton, loading && {backgroundColor: '#ccc'}]}
                onPress={handleRegister}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.registerButtonText}>{t('registerBtn')}</Text>}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, {backgroundColor: theme.border}]} />
                <Text style={[styles.dividerText, {color: theme.subText}]}>{t('or')}</Text>
                <View style={[styles.dividerLine, {backgroundColor: theme.border}]} />
              </View>

              <TouchableOpacity style={[styles.socialButton, {backgroundColor: theme.cardBg, borderColor: theme.border}]}>
                <Text style={[styles.socialButtonText, {color: theme.text}]}>{t('registerGoogle')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.socialButton, {backgroundColor: theme.cardBg, borderColor: theme.border}]}>
                <Text style={[styles.socialButtonText, {color: theme.text}]}>{t('registerFacebook')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.aboutButton} onPress={() => navigation.navigate('AboutUs')}>
              <Text style={[styles.aboutButtonText, {color: theme.subText}]}>{t('aboutUs')}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, {color: theme.subText}]}>{t('hasAccount')}</Text>
              <TouchableOpacity onPress={() => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.navigate('Login');
              }}>
                <Text style={styles.loginLink}>{t('loginLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{height: 40}} />
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
  headerTitle: {fontSize: 20, fontWeight: 'bold'},
  scrollContent: {flexGrow: 1, padding: 20},
  scrollContentTablet: {alignItems: 'center', paddingVertical: 40},
  formCard: {width: '100%'},
  formCardTablet: {
    maxWidth: 500, borderRadius: 20, padding: 32,
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  logoSection: {alignItems: 'center', marginTop: 16, marginBottom: 28},
  logo: {width: 80, height: 80, marginBottom: 10},
  appName: {fontSize: 28, fontWeight: 'bold', color: '#FF0000', marginBottom: 8},
  welcomeText: {fontSize: 15},
  form: {marginBottom: 16},
  input: {borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 4, borderWidth: 1},
  fieldError: {color: '#FF0000', fontSize: 12, marginBottom: 10, marginLeft: 4},
  registerButton: {
    backgroundColor: '#FF0000', padding: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 8, marginBottom: 20,
  },
  registerButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  divider: {flexDirection: 'row', alignItems: 'center', marginVertical: 16},
  dividerLine: {flex: 1, height: 1},
  dividerText: {marginHorizontal: 15, fontSize: 14},
  socialButton: {padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1},
  socialButtonText: {fontSize: 16, fontWeight: '600'},
  aboutButton: {marginTop: 12, marginBottom: 8, alignItems: 'center'},
  aboutButtonText: {fontSize: 14, textDecorationLine: 'underline'},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16},
  footerText: {fontSize: 15},
  loginLink: {fontSize: 15, color: '#FF0000', fontWeight: 'bold'},
  apiErrorBox: {backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#FF0000', borderRadius: 8, padding: 12, marginBottom: 12},
  apiErrorText: {color: '#FF0000', fontSize: 14, textAlign: 'center', fontWeight: '600'},
});

export default RegisterScreen;
