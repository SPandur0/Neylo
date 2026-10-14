import { opacityStyle } from '../styles/dynamicStyles';
import { styles } from '../styles/buttonComponentStyles';
import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export default function ButtonComponent() {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          opacityStyle(pressed ? 0.8 : 1),
        ]}
        onPress={() => setCount((prev) => prev + 1)}
      >
        <Text style={styles.buttonText}>Klik her</Text>
      </Pressable>

      <Text style={styles.counter}>Trykket: {count} gange</Text>
    </View>
  );
}
