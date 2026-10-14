import { styles } from '../styles/assetComponentStyles';
import React from 'react';
import { View, Text, Image } from 'react-native';

export default function AssetComponent() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icon.png')}
        style={styles.image}
      />
      <Text style={styles.text}>Dette billede kommer fra assets-mappen.</Text>
    </View>
  );
}
