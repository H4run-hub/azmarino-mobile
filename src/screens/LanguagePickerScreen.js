import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useLanguage} from '../context/LanguageContext';
import {fs} from '../utils/scale';

const LanguagePickerScreen = ({onFinish}) => {
  const {setLang} = useLanguage();

  const pick = (lang) => {
    setLang(lang);
    onFinish();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#FF0000" translucent={false} />
      <View style={styles.content}>
        <Text style={styles.logo}>🛍️</Text>
        <Text style={styles.title}>Azmarino</Text>
        <Text style={styles.subtitle}>Choose your language</Text>
        <Text style={styles.subtitleTi}>ቋንቋ ምረጽ</Text>

        <TouchableOpacity style={styles.langBtn} onPress={() => pick('ti')}>
          <Text style={styles.flag}>🇪🇷</Text>
          <Text style={styles.langText}>ትግርኛ</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.langBtn} onPress={() => pick('en')}>
          <Text style={styles.flag}>🇬🇧</Text>
          <Text style={styles.langText}>English</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#FF0000'},
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  logo: {fontSize: 80, marginBottom: 16},
  title: {
    fontSize: fs(32),
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: fs(18),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  subtitleTi: {
    fontSize: fs(18),
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 40,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginBottom: 16,
    width: '100%',
    maxWidth: 300,
  },
  flag: {fontSize: 32, marginRight: 16},
  langText: {
    fontSize: fs(20),
    fontWeight: 'bold',
    color: '#333',
  },
});

export default LanguagePickerScreen;
