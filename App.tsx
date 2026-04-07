import React, {useState, useEffect} from 'react';
import {View, BackHandler, Platform, Text, TextInput} from 'react-native';

// Disable system font scaling — prevents text from overflowing/disappearing with large phone fonts
if (Text.defaultProps == null) Text.defaultProps = {};
Text.defaultProps.maxFontSizeMultiplier = 1;
Text.defaultProps.allowFontScaling = false;
if (TextInput.defaultProps == null) TextInput.defaultProps = {};
TextInput.defaultProps.maxFontSizeMultiplier = 1;
TextInput.defaultProps.allowFontScaling = false;
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StripeProvider} from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CartProvider} from './src/context/CartContext';
import {ThemeProvider} from './src/context/ThemeContext';
import {NotificationsProvider} from './src/context/NotificationsContext';
import {LanguageProvider} from './src/context/LanguageContext';
import {RecentlyViewedProvider} from './src/context/RecentlyViewedContext';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import TrackOrderScreen from './src/screens/TrackOrderScreen';
import ProductDetailScreen from './src/screens/ProductDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import AboutUsScreen from './src/screens/AboutUsScreen';
import PoliciesScreen from './src/screens/PoliciesScreen';
import ChatSupportScreen from './src/screens/ChatSupportScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import OrderSuccessScreen from './src/screens/OrderSuccessScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import OrderHistoryScreen from './src/screens/OrderHistoryScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import CameraSearchScreen from './src/screens/CameraSearchScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import FlashSaleScreen from './src/screens/FlashSaleScreen';
import FlashSaleDetailScreen from './src/screens/FlashSaleDetailScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LanguagePickerScreen from './src/screens/LanguagePickerScreen';
import EmailVerificationScreen from './src/screens/EmailVerificationScreen';
import {logoutUser, getMe} from './src/services/api';
import SwipeBackView from './src/components/SwipeBackView';
import BottomTabBar from './src/components/BottomTabBar';
import {STRIPE_PUBLISHABLE_KEY} from './src/config/apiConfig';
import DataConsentModal from './src/components/DataConsentModal';

function App() {
  const [stack, setStack] = useState([{name: 'Home', params: null}]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [homeScrollKey, setHomeScrollKey] = useState(0);
  const [authChecked, setAuthChecked] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  // Check if user has chosen language and seen onboarding
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('azmarino_language_chosen'),
      AsyncStorage.getItem('azmarino_onboarded'),
    ]).then(([langChosen, onboarded]) => {
      if (!langChosen) setShowLanguagePicker(true);
      else if (!onboarded) setShowOnboarding(true);
      setOnboardingChecked(true);
    });
  }, []);

  const finishLanguagePicker = () => {
    AsyncStorage.setItem('azmarino_language_chosen', 'true');
    setShowLanguagePicker(false);
    setShowOnboarding(true);
  };

  const finishOnboarding = () => {
    AsyncStorage.setItem('azmarino_onboarded', 'true');
    setShowOnboarding(false);
  };

  // Restore login session and sync user from backend on app start
  useEffect(() => {
    AsyncStorage.getItem('azmarino_user').then(stored => {
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setUser(u);
          setIsLoggedIn(true);
        } catch {}
      }
      setAuthChecked(true);
    });
    // Refresh user from backend when we have a token (keeps profile/address in sync)
    AsyncStorage.getItem('azmarino_token').then(token => {
      if (token) {
        getMe().then(data => {
          if (data?.user) {
            setUser(data.user);
            AsyncStorage.setItem('azmarino_user', JSON.stringify(data.user));
          }
        }).catch(() => {});
      }
    });
  }, []);

  // Show data consent after login if not yet accepted
  useEffect(() => {
    if (isLoggedIn) {
      AsyncStorage.getItem('azmarino_data_consent').then(val => {
        if (!val) setShowConsent(true);
      });
    }
  }, [isLoggedIn]);

  const handleConsent = (accepted: boolean) => {
    if (accepted) {
      AsyncStorage.setItem('azmarino_data_consent', 'true');
    }
    setShowConsent(false);
  };

  const currentScreen = stack[stack.length - 1];

  const navigate = (screenName: string, params: any = null) => {
    setStack(prev => [...prev, {name: screenName, params}]);
  };

  const goBack = () => {
    setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
  };

  const resetStack = (screenName: string = 'Home', params: any = null) => {
    setStack([{name: screenName, params}]);
  };

  const canGoBack = () => stack.length > 1;

  // Android: hardware back / swipe — navigate back inside app instead of exiting
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBack = () => {
      if (stack.length > 1) {
        setStack(prev => (prev.length > 1 ? prev.slice(0, -1) : prev));
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [stack]);

  const handleLogin = (userData?: any) => {
    if (userData) setUser(userData);
    setIsLoggedIn(true);
    resetStack('Home');
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setIsLoggedIn(false);
    resetStack('Login');
  };

  // push is an alias for navigate — allows pushing the same screen with new params
  const push = (screenName: string, params: any = null) => {
    setStack(prev => [...prev, {name: screenName, params}]);
  };

  const navigation = {navigate, goBack, resetStack, canGoBack, push};

  const renderScreen = () => {
    const {name, params} = currentScreen;
    switch (name) {
      case 'Home':
        return <HomeScreen navigation={navigation} isLoggedIn={isLoggedIn} scrollToTopKey={homeScrollKey} />;
      case 'Cart':
        return <CartScreen navigation={navigation} isLoggedIn={isLoggedIn} />;
      case 'Notifications':
        return <NotificationsScreen navigation={navigation} />;
      case 'CameraSearch':
        return <CameraSearchScreen navigation={navigation} route={{params: params || {}}} />;
      case 'Settings':
        return (
          <SettingsScreen
            navigation={navigation}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
          />
        );
      case 'TrackOrder':
        return <TrackOrderScreen navigation={navigation} user={user} />;
      case 'ProductDetail':
        return <ProductDetailScreen navigation={navigation} route={{params}} />;
      case 'Login':
        return <LoginScreen navigation={navigation} onLogin={handleLogin} />;
      case 'Register':
        return <RegisterScreen navigation={navigation} onLogin={handleLogin} />;
      case 'EmailVerification':
        return <EmailVerificationScreen navigation={navigation} route={{params}} onLogin={handleLogin} />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'AboutUs':
        return <AboutUsScreen navigation={navigation} />;
      case 'Policies':
        return <PoliciesScreen navigation={navigation} />;
      case 'ChatSupport':
        return <ChatSupportScreen navigation={navigation} />;
      case 'Checkout':
        return <CheckoutScreen navigation={navigation} user={user} onUserUpdate={setUser} />;
      case 'OrderSuccess':
        return <OrderSuccessScreen navigation={navigation} route={{params}} />;
      case 'UserProfile':
        if (!isLoggedIn) return <LoginScreen navigation={navigation} onLogin={handleLogin} />;
        return (
          <UserProfileScreen
            navigation={navigation}
            isLoggedIn={isLoggedIn}
            onLogout={handleLogout}
            user={user}
            onUserUpdate={setUser}
          />
        );
      case 'OrderHistory':
        return <OrderHistoryScreen navigation={navigation} />;
      case 'FlashSale':
        return <FlashSaleScreen navigation={navigation} route={{params}} />;
      case 'FlashSaleDetail':
        return <FlashSaleDetailScreen navigation={navigation} route={{params}} />;
      default:
        return <HomeScreen navigation={navigation} isLoggedIn={isLoggedIn} />;
    }
  };

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.azmarino">
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <NotificationsProvider>
              <CartProvider>
                <RecentlyViewedProvider>
                {onboardingChecked && showLanguagePicker ? (
                  <LanguagePickerScreen onFinish={finishLanguagePicker} />
                ) : onboardingChecked && showOnboarding ? (
                  <OnboardingScreen onFinish={finishOnboarding} />
                ) : !authChecked ? (
                  <View style={{flex: 1, backgroundColor: '#fff'}} />
                ) : (
                  <View style={{flex: 1}}>
                    {showConsent && <DataConsentModal onAccept={() => handleConsent(true)} onDecline={() => handleConsent(false)} />}
                    <SwipeBackView
                      onSwipeBack={goBack}
                      enabled={stack.length > 1}>
                      {renderScreen()}
                    </SwipeBackView>
                    <BottomTabBar
                      currentScreenName={currentScreen.name}
                      onNavigate={(name) => {
                        if (name === 'Home') {
                          resetStack('Home');
                          setHomeScrollKey(k => k + 1);
                        } else {
                          setStack([{name: 'Home', params: null}, {name, params: null}]);
                        }
                      }}
                    />
                  </View>
                )}
              </RecentlyViewedProvider>
              </CartProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

export default App;
