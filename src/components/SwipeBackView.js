import React, {useRef} from 'react';
import {Animated, PanResponder, useWindowDimensions} from 'react-native';

const EDGE_WIDTH = 30; // swipe must start within 30px of left edge
const SWIPE_THRESHOLD = 80; // minimum distance to trigger back
const VELOCITY_THRESHOLD = 0.4; // or fast enough velocity

const SwipeBackView = ({onSwipeBack, enabled = true, children}) => {
  const {width} = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!enabled) return false;
        // Only capture if starting from left edge and moving right
        return (
          evt.nativeEvent.pageX < EDGE_WIDTH &&
          gestureState.dx > 5 &&
          Math.abs(gestureState.dy) < Math.abs(gestureState.dx)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
          opacity.setValue(1 - gestureState.dx / width * 0.4);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (
          gestureState.dx > SWIPE_THRESHOLD ||
          gestureState.vx > VELOCITY_THRESHOLD
        ) {
          // Animate out then go back
          Animated.timing(translateX, {
            toValue: width,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateX.setValue(0);
            opacity.setValue(1);
            if (onSwipeBack) onSwipeBack();
          });
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 10,
          }).start();
          Animated.spring(opacity, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        opacity.setValue(1);
      },
    }),
  ).current;

  return (
    <Animated.View
      style={{flex: 1, transform: [{translateX}], opacity}}
      {...panResponder.panHandlers}>
      {children}
    </Animated.View>
  );
};

export default SwipeBackView;
