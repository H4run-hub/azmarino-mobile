import React, {useState} from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions,
  ActivityIndicator, Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../context/ThemeContext';
import {useLanguage} from '../context/LanguageContext';
import {BackIcon} from '../components/Icons';
import Icon from 'react-native-vector-icons/Ionicons';
import {registerUser} from '../services/api';
import {lightTap, successTap} from '../utils/haptics';
import {s, vs, fs} from '../utils/scale';

const RegisterScreen = ({navigation, onLogin}) => {
  const {theme, isDark} = useTheme();
  const {t} = useLanguage();
  const {width} = useWindowDimensions();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = t('errName');
    if (!email.trim()) e.email = t('errEmail');
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = t('errEmailInvalid');
    if (!phone.trim()) e.phone = t('errPhoneRequired');
    if (!password) e.password = t('errPasswordRequired');
    else if (password.length < 6) e.password = t('errPasswordTooShort');
    if (password !== confirmPassword) e.confirmPassword = t('errPasswordMismatch');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) { lightTap(); return; }
    setLoading(true);
    setApiError('');
    try {
      const data = await registerUser(name.trim(), email.trim(), phone.trim(), password);
      if (data?.user) {
        successTap();
        navigation.navigate('EmailVerification', {user: data.user});
      } else {
        setApiError(data?.message || 'Registration failed');
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

  const field = (key, label, placeholder, value, onChange, opts = {}) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, {color: theme.text}]}>{label}</Text>
      <TextInput
        style={[inputStyle, errors[key] ? {borderColor: '#E60000'} : null]}
        placeholder={placeholder}
        placeholderTextColor={theme.subText}
        value={value}
        onChangeText={v => {onChange(v); setErrors(prev => ({...prev, [key]: ''}));}}
        editable={!loading}
        {...opts}
      />
      {errors[key] ? <Text style={styles.fieldError}>{errors[key]}</Text> : null}
    </View>
  );

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
                {t('registerTitle') || 'Create Account'}
              </h1>
              <Text style={{fontSize: fs(16), color: theme.subText, fontWeight: '600'}}>
                {t('registerSub') || 'Join the Azmarino family'}
              </Text>
            </View>

            {apiError ? (
              <View style={[styles.errorBox, {backgroundColor: 'rgba(230, 0, 0, 0.05)', borderColor: 'rgba(230, 0, 0, 0.1)'}]}>
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.form}>
              {field('name', t('fullNameLabel') || 'Full Name', 'John Doe', name, setName)}
              {field('email', t('emailLabel') || 'Email Address', 'name@example.com', email, setEmail, {keyboardType: 'email-address', autoCapitalize: 'none'})}
              {field('phone', t('phoneLabel') || 'Phone Number', '+291...', phone, setPhone, {keyboardType: 'phone-pad'})}
              {field('password', t('passwordLabel') || 'Password', '••••••••', password, setPassword, {secureTextEntry: true})}
              {field('confirmPassword', t('confirmPasswordLabel') || 'Confirm Password', '••••••••', confirmPassword, setConfirmPassword, {secureTextEntry: true})}

              <TouchableOpacity
                style={[styles.mainBtn, loading && {opacity: 0.7}]}
                onPress={handleRegister}
                disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBtnText}>{t('registerBtn') || 'Sign Up'}</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={{color: theme.subText, fontSize: fs(15), fontWeight: '600'}}>{t('alreadyHaveAccount')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={{color: '#E60000', fontSize: fs(15), fontWeight: '800', marginLeft: 8}}>{t('loginLink')}</Text>
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
  container: { flex: 1 },
  header: { paddingHorizontal: 16, height: 50, justifyContent: 'center' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1 },
  content: { padding: 24 },
  welcomeSection: { alignItems: 'center', marginBottom: 40, marginTop: 10 },
  logoBadge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', shadowColor: '#E60000', shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.2, shadowRadius: 12, elevation: 5 },
  logoText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '800', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldError: { color: '#E60000', fontSize: 12, marginTop: 4, fontWeight: '600' },
  mainBtn: { backgroundColor: '#E60000', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20, shadowColor: '#E60000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  mainBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32 },
  errorBox: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  errorText: { color: '#E60000', fontSize: 14, textAlign: 'center', fontWeight: '700' }
});

export default RegisterScreen;
