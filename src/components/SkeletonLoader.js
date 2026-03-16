import React, {useEffect, useRef} from 'react';
import {View, Animated, StyleSheet, useWindowDimensions} from 'react-native';
import {useTheme} from '../context/ThemeContext';

const SkeletonBlock = ({width, height, borderRadius = 6, style}) => {
  const {isDark} = useTheme();
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(shimmer, {toValue: 0, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({inputRange: [0, 1], outputRange: [0.3, 0.7]});
  const bg = isDark ? '#333' : '#e0e0e0';

  return (
    <Animated.View
      style={[{width, height, borderRadius, backgroundColor: bg, opacity}, style]}
    />
  );
};

const ProductCardSkeleton = ({cardWidth, imageHeight}) => {
  const {theme, isDark} = useTheme();
  return (
    <View style={[skStyles.card, {width: cardWidth, backgroundColor: theme.cardBg}]}>
      <SkeletonBlock width={cardWidth} height={imageHeight} borderRadius={0} />
      <View style={skStyles.info}>
        <SkeletonBlock width={cardWidth * 0.5} height={8} style={{marginBottom: 6}} />
        <SkeletonBlock width={cardWidth * 0.6} height={16} style={{marginBottom: 4}} />
        <SkeletonBlock width={cardWidth * 0.35} height={10} />
      </View>
    </View>
  );
};

const HomeScreenSkeleton = () => {
  const {width} = useWindowDimensions();
  const {theme} = useTheme();
  const numCols = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const gap = 8;
  const hPad = 8;
  const cardW = (width - hPad * 2 - gap * (numCols - 1)) / numCols;
  const imgH = cardW * 1.1;
  const cards = Array.from({length: numCols * 3}, (_, i) => i);

  return (
    <View style={[skStyles.container, {backgroundColor: theme.bg}]}>
      {/* Banner skeleton */}
      <SkeletonBlock width={width - 16} height={100} borderRadius={10} style={{alignSelf: 'center', marginVertical: 8}} />
      {/* Grid skeleton */}
      <View style={skStyles.grid}>
        {cards.map(i => (
          <ProductCardSkeleton key={i} cardWidth={cardW} imageHeight={imgH} />
        ))}
      </View>
    </View>
  );
};

const skStyles = StyleSheet.create({
  container: {flex: 1, paddingHorizontal: 8},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8},
  card: {borderRadius: 10, overflow: 'hidden', marginBottom: 8},
  info: {paddingHorizontal: 7, paddingTop: 8, paddingBottom: 8},
});

export {SkeletonBlock, ProductCardSkeleton, HomeScreenSkeleton};
