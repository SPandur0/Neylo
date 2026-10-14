import { styles } from '../styles/firstComponentStyles';
import React from 'react';
import { View, Text } from 'react-native';

export default function FirstComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>First Component</Text>
      <Text style={styles.text}>Dette er den første komponent i projektet.</Text>
    </View>
  );
}
