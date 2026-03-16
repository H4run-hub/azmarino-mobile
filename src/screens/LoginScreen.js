import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import Icon from 'react-native-vector-icons/Ionicons';
import {loginUser} from '../services/api';
import {s, vs, fs} from '../utils/scale';

const LoginScreen = ({navigation, onLogin}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleBack = () => navigation.resetStack('Home');

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setApiError('');
    if (!email.trim()) { setEmailError(t('errEmail')); valid = false; }
    else if (!/\S+@\S+\.\S+/.test(email)) { setEmailError(t('errEmailInvalid')); valid = false; }
    if (!password) { setPasswordError(t('errPassword')); valid = false; }
    else if (password.length < 6) { setPasswordError(t('errPasswordShort')); valid = false; }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const data = await loginUser(email.trim(), password);
      // API returns { token, user } on success; success flag may or may not be present
      if (data?.user) {
        if (onLogin) onLogin(data.user);
      } else {
        setApiError(data?.message || 'Login failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'ምስ ሰርቨር ምትሕሓዝ ኣይተኻእለን';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.bg} translucent={false} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={[styles.header, {backgroundColor: theme.cardBg, borderBottomColor: theme.border}]}>
          <TouchableOpacity onPress={handleBack} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <BackIcon size={28} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {color: theme.text}]}>{t('loginTitle')}</Text>
          <View style={{width: 40}} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, isTablet && styles.scrollContentTablet]}
          keyboardShouldPersistTaps="handled">

          <View style={[styles.formCard, isTablet && styles.formCardTablet, {backgroundColor: isTablet ? theme.cardBg : 'transparent'}]}>

            <View style={styles.logoSection}>
              <Text style={styles.appName}>{t('appName')}</Text>
              <Text style={[styles.welcomeText, {color: theme.subText}]}>{t('welcomeBack')}</Text>
            </View>

            <View style={styles.form}>
              {apiError ? (
                <View style={styles.apiErrorBox}>
                  <Text style={styles.apiErrorText}>{apiError}</Text>
                </View>
              ) : null}

              <TextInput
                style={[styles.input, {backgroundColor: theme.cardBg, color: theme.text, borderColor: emailError ? '#FF0000' : theme.border}]}
                placeholder={t('emailPlaceholder')}
                value={email}
                onChangeText={v => {setEmail(v); setEmailError(''); setApiError('');}}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={theme.subText}
                editable={!loading}
              />
              {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

              <TextInput
                style={[styles.input, {backgroundColor: theme.cardBg, color: theme.text, borderColor: passwordError ? '#FF0000' : theme.border}]}
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChangeText={v => {setPassword(v); setPasswordError(''); setApiError('');}}
                secureTextEntry
                placeholderTextColor={theme.subText}
                editable={!loading}
              />
              {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.forgotPassword}>{t('forgotPassword')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && {backgroundColor: '#ccc'}]}
                onPress={handleLogin}
                disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.loginButtonText}>{t('loginBtn')}</Text>}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, {backgroundColor: theme.border}]} />
                <Text style={[styles.dividerText, {color: theme.subText}]}>{t('or')}</Text>
                <View style={[styles.dividerLine, {backgroundColor: theme.border}]} />
              </View>

              <TouchableOpacity
                style={[styles.socialButton, {backgroundColor: theme.cardBg, borderColor: theme.border}]}
                onPress={() => Alert.alert(t('comingSoonTitle'), t('comingSoonSub'))}>
                <View style={styles.socialButtonInner}>
                  <Icon name="logo-google" size={20} color="#DB4437" />
                  <Text style={[styles.socialButtonText, {color: theme.text}]}>{t('loginGoogle')}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.socialButton, {backgroundColor: '#1877F2', borderColor: '#1877F2'}]}
                onPress={() => Alert.alert(t('comingSoonTitle'), t('comingSoonSub'))}>
                <View style={styles.socialButtonInner}>
                  <Icon name="logo-facebook" size={20} color="#fff" />
                  <Text style={[styles.socialButtonText, {color: '#fff'}]}>{t('loginFacebook')}</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.aboutButton} onPress={() => navigation.navigate('AboutUs')}>
              <Text style={[styles.aboutButtonText, {color: theme.subText}]}>{t('aboutUs')}</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={[styles.footerText, {color: theme.subText}]}>{t('noAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>{t('registerLink')}</Text>
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
  headerTitle: {fontSize: fs(20), fontWeight: 'bold'},
  scrollContent: {flexGrow: 1, padding: 20},
  scrollContentTablet: {alignItems: 'center', paddingVertical: 40},
  formCard: {width: '100%'},
  formCardTablet: {
    maxWidth: 500, borderRadius: 20, padding: 32,
    shadowColor: '#000', shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
  },
  logoSection: {alignItems: 'center', marginTop: 20, marginBottom: 36, width: '100%', paddingHorizontal: 20},
  logo: {width: 90, height: 90, marginBottom: 12},
  appName: {fontSize: fs(32), fontWeight: 'bold', color: '#FF0000', marginBottom: 8},
  welcomeText: {fontSize: fs(16), textAlign: 'center'},
  form: {marginBottom: 16},
  input: {borderRadius: 12, padding: 16, fontSize: fs(16), marginBottom: 4, borderWidth: 1},
  fieldError: {color: '#FF0000', fontSize: fs(12), marginBottom: 10, marginLeft: 4},
  forgotPassword: {color: '#FF0000', fontSize: fs(14), textAlign: 'right', marginBottom: 20, marginTop: 6, fontWeight: '600'},
  loginButton: {backgroundColor: '#FF0000', padding: 18, borderRadius: 12, alignItems: 'center', marginBottom: 20},
  loginButtonText: {color: '#fff', fontSize: fs(18), fontWeight: 'bold'},
  divider: {flexDirection: 'row', alignItems: 'center', marginVertical: 16},
  dividerLine: {flex: 1, height: 1},
  dividerText: {marginHorizontal: 15, fontSize: fs(14)},
  socialButton: {padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12, borderWidth: 1},
  socialButtonInner: {flexDirection: 'row', alignItems: 'center', gap: 10},
  socialButtonText: {fontSize: fs(16), fontWeight: '600'},
  aboutButton: {marginTop: 16, marginBottom: 8, alignItems: 'center'},
  aboutButtonText: {fontSize: fs(14), textDecorationLine: 'underline'},
  footer: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16},
  footerText: {fontSize: fs(15)},
  registerLink: {fontSize: fs(15), color: '#FF0000', fontWeight: 'bold'},
  apiErrorBox: {backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#FF0000', borderRadius: 8, padding: 12, marginBottom: 12},
  apiErrorText: {color: '#FF0000', fontSize: fs(14), textAlign: 'center', fontWeight: '600'},
});

export default LoginScreen;
