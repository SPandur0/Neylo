import { Image } from 'react-native';

export const neyloSymbol = require('../assets/branding/neylo-symbol.png');

export default function NeyloLogo({ size = 32 }) {
  return <Image source={neyloSymbol} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="Neylo" />;
}
