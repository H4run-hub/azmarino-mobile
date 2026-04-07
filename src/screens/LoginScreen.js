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
import {lightTap, successTap} from '../utils/haptics';
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
    if (!validate()) { lightTap(); return; }
    setLoading(true);
    setApiError('');
    try {
      const data = await loginUser(email.trim(), password);
      if (data?.user) {
        successTap();
        if (onLogin) onLogin(data.user);
      } else {
        setApiError(data?.message || 'Login failed');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: theme.cardBg,
    color: theme.text,
    borderColor: theme.border,
    borderRadius: 16,
    padding: 16,
    fontSize: fs(16),
    borderWidth: 1.5,
    marginBottom: 4,
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.bg}]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackIcon size={24} color={theme.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.welcomeSection}>
              <View style={[styles.logoBadge, {backgroundColor: '#E60000'}]}>
                <Text style={styles.logoText}>A</Text>
              </View>
              <h1 style={{fontSize: fs(28), fontWeight: '900', color: theme.text, marginTop: 24, marginBottom: 8}}>
                {t('welcomeBack') || 'Welcome Back'}
              </h1>
              <Text style={{fontSize: fs(16), color: theme.subText, fontWeight: '600'}}>
                {t('loginSub') || 'Sign in to your account'}
              </Text>
            </View>

            {apiError ? (
              <View style={[styles.errorBox, {backgroundColor: 'rgba(230, 0, 0, 0.05)', borderColor: 'rgba(230, 0, 0, 0.1)'}]}>
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: theme.text}]}>{t('emailLabel') || 'Email'}</Text>
                <TextInput
                  style={[inputStyle, emailError ? {borderColor: '#E60000'} : null]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.subText}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
                {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={[styles.label, {color: theme.text}]}>{t('passwordLabel') || 'Password'}</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={{color: '#E60000', fontSize: 13, fontWeight: '700'}}>{t('forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  style={[inputStyle, passwordError ? {borderColor: '#E60000'} : null]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.subText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!loading}
                />
                {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.mainBtn, loading && {opacity: 0.7}]}
                onPress={handleLogin}
                disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{t('signIn') || 'Sign In'}</Text>}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.line, {backgroundColor: theme.border}]} />
                <Text style={{marginHorizontal: 16, color: theme.subText, fontWeight: '700'}}>{t('or')}</Text>
                <View style={[styles.line, {backgroundColor: theme.border}]} />
              </View>

              <TouchableOpacity style={[styles.socialBtn, {borderColor: theme.border}]} onPress={() => Alert.alert('Coming Soon')}>
                <Icon name="logo-google" size={20} color="#DB4437" />
                <Text style={[styles.socialBtnText, {color: theme.text}]}>Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={{color: theme.subText, fontSize: fs(15), fontWeight: '600'}}>{t('noAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={{color: '#E60000', fontSize: fs(15), fontWeight: '800', marginLeft: 8}}>{t('registerLink')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, height: 50, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1 },
  content: { padding: 24 },
  welcomeSection: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  logoBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#E60000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldError: { color: '#E60000', fontSize: 12, marginTop: 4, fontWeight: '600' },
  mainBtn: { backgroundColor: '#E60000', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 12, shadowColor: '#E60000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 32 },
  line: { flex: 1, height: 1 },
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 56, borderRadius: 16, borderWidth: 1.5 },
  socialBtnText: { fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  errorBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  errorText: { color: '#E60000', fontSize: 14, textAlign: 'center', fontWeight: '700' }
});

export default LoginScreen;
