import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLanguage} from '../context/LanguageContext';
import {s, vs, fs} from '../utils/scale';

const SLIDES = [
  {
    id: '1',
    emoji: '🛍️',
    titleKey: 'onboardTitle1',
    descKey: 'onboardDesc1',
    bg: '#FF0000',
  },
  {
    id: '2',
    emoji: '⚡',
    titleKey: 'onboardTitle2',
    descKey: 'onboardDesc2',
    bg: '#FF6600',
  },
  {
    id: '3',
    emoji: '🚚',
    titleKey: 'onboardTitle3',
    descKey: 'onboardDesc3',
    bg: '#2E7D32',
  },
];

const OnboardingScreen = ({onFinish}) => {
  const {t} = useLanguage();
  const {width} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef();

  const currentBg = SLIDES[activeIndex].bg;

  const onScroll = e => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(idx);
  };

  const goNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({index: activeIndex + 1, animated: true});
    } else {
      onFinish();
    }
  };

  const renderSlide = ({item}) => (
    <View style={[styles.slide, {width, backgroundColor: item.bg}]}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.title}>{t(item.titleKey)}</Text>
      <Text style={styles.desc}>{t(item.descKey)}</Text>
    </View>
  );

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <View style={[styles.container, {backgroundColor: currentBg}]}>
      <StatusBar barStyle="light-content" backgroundColor={currentBg} translucent={false} />

      {/* Skip button — positioned below safe area */}
      {!isLast && (
        <TouchableOpacity
          style={[styles.skipBtn, {top: insets.top + 12}]}
          onPress={onFinish}>
          <Text style={styles.skipText}>{t('onboardSkip')}</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
        style={{marginTop: insets.top}}
      />

      {/* Bottom area: dots + button */}
      <View style={[styles.bottomArea, {backgroundColor: currentBg, paddingBottom: Math.max(insets.bottom, 30)}]}>
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                activeIndex === i && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={goNext}>
          <Text style={styles.nextText}>
            {isLast ? t('onboardGetStarted') : t('onboardNext')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  skipText: {color: '#fff', fontSize: fs(13), fontWeight: '600'},
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emoji: {fontSize: fs(80), marginBottom: 24},
  title: {
    fontSize: fs(26),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 14,
  },
  desc: {
    fontSize: fs(15),
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: fs(22),
  },
  bottomArea: {
    paddingTop: 16,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    backgroundColor: '#fff',
    width: 28,
  },
  nextBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
  },
  nextText: {
    fontSize: fs(16),
    fontWeight: 'bold',
    color: '#FF0000',
  },
});

export default OnboardingScreen;

