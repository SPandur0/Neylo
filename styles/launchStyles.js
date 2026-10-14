import { StyleSheet } from 'react-native';

export const launchStyles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fefcfa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artwork: { width: 360, maxWidth: '100%', aspectRatio: 1 },
});
