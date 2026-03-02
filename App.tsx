import React, {useState, useEffect} from 'react';
import {View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {StripeProvider} from '@stripe/stripe-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {CartProvider} from './src/context/CartContext';
import {ThemeProvider} from './src/context/ThemeContext';
import {NotificationsProvider} from './src/context/NotificationsContext';
import {LanguageProvider} from './src/context/LanguageContext';
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
import {logoutUser} from './src/services/api';

// Stripe publishable key — update this if you get a new key from Stripe dashboard
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51I0YRcHzx0Dmj32eAAGksDJeKA18gXUPU4oY8bz7KGzeGqbNnhmtUYak1rcpfs4K1WHfKrrpEYzbZEtYuAkqJMJO08uMqnJAG';

function App() {
  const [stack, setStack] = useState([{name: 'Home', params: null}]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Restore login session from AsyncStorage on app start
  useEffect(() => {
    AsyncStorage.getItem('azmarino_user').then(stored => {
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setUser(u);
          setIsLoggedIn(true);
        } catch {}
      }
    });
  }, []);

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

  const navigation = {navigate, goBack, resetStack, canGoBack};

  const renderScreen = () => {
    const {name, params} = currentScreen;
    switch (name) {
      case 'Home':
        return <HomeScreen navigation={navigation} isLoggedIn={isLoggedIn} />;
      case 'Cart':
        return <CartScreen navigation={navigation} />;
      case 'Notifications':
        return <NotificationsScreen navigation={navigation} />;
      case 'CameraSearch':
        return <CameraSearchScreen navigation={navigation} />;
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
      case 'ForgotPassword':
        return <ForgotPasswordScreen navigation={navigation} />;
      case 'AboutUs':
        return <AboutUsScreen navigation={navigation} />;
      case 'Policies':
        return <PoliciesScreen navigation={navigation} />;
      case 'ChatSupport':
        return <ChatSupportScreen navigation={navigation} />;
      case 'Checkout':
        return <CheckoutScreen navigation={navigation} user={user} />;
      case 'OrderSuccess':
        return <OrderSuccessScreen navigation={navigation} route={{params}} />;
      case 'UserProfile':
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
                <View style={{flex: 1}}>{renderScreen()}</View>
              </CartProvider>
            </NotificationsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </StripeProvider>
  );
}

export default App;
