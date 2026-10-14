import { borderColorStyle, textColorStyle } from '../styles/dynamicStyles';
import { styles } from '../styles/propsComponentStyles';
import React from 'react';
import { View, Text } from 'react-native';

export default function PropsComponent({ title, subtitle, color = '#2563eb' }) {
  return (
    <View style={[styles.card, borderColorStyle(color)]}>
      <Text style={[styles.title, textColorStyle(color)]}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}
