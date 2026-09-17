import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

export const neyloSplash = require('../assets/branding/neylo-splash.png');

// Run before the first render so the OS launch screen cannot disappear early.
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(console.warn);
  // The matching React overlay performs the fade on every platform.
  SplashScreen.setOptions({ fade: false });
}

export default function LaunchScreen({ ready, children }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(true);
  const [imageReady, setImageReady] = useState(false);
  const [layoutReady, setLayoutReady] = useState(false);
  const [nativeHidden, setNativeHidden] = useState(Platform.OS === 'web');

  useEffect(() => {
    if (!imageReady || !layoutReady || nativeHidden) return;
    let active = true;
    // Hand off only after the branded overlay has an image and a layout.
    SplashScreen.hideAsync().catch(console.warn).finally(() => {
      if (active) setNativeHidden(true);
    });
    return () => { active = false; };
  }, [imageReady, layoutReady, nativeHidden]);

  useEffect(() => {
    if (!ready || !imageReady || !layoutReady || !nativeHidden) return;
    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start(({ finished }) => {
      if (finished) setVisible(false);
    });
    return () => animation.stop();
  }, [ready, imageReady, layoutReady, nativeHidden, opacity]);

  return <View style={launchStyles.root}>
    <View style={launchStyles.root} accessibilityElementsHidden={visible} importantForAccessibility={visible ? 'no-hide-descendants' : 'auto'}>
      {children}
    </View>
    {visible && <Animated.View
      style={[launchStyles.overlay, { opacity }]}
      onLayout={() => setLayoutReady(true)}
      accessibilityViewIsModal
    >
      <Image
        source={neyloSplash}
        style={launchStyles.artwork}
        resizeMode="contain"
        fadeDuration={0}
        onLoadEnd={() => setImageReady(true)}
        accessibilityLabel="Neylo. Make tomorrow make sense."
      />
    </Animated.View>}
  </View>;
}

const launchStyles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fefcfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: { width: 360, maxWidth: '100%', aspectRatio: 1 },
});
