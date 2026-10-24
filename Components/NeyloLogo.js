// Denne komponent viser appens logo i forskellige størrelser uden at ændre selve branddesignet.
import { squareSize } from '../styles/dynamicStyles';
import { Image } from 'react-native';

export const neyloSymbol = require('../assets/branding/neylo-symbol.png');

export default function NeyloLogo({ size = 32 }) {
  return <Image source={neyloSymbol} style={squareSize(size)} resizeMode="contain" accessibilityLabel="Neylo" />;
}
