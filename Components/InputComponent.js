import { styles } from '../styles/inputComponentStyles';
import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';

export default function InputComponent() {
  const [text, setText] = useState('');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Skriv noget:</Text>
      <TextInput
        style={styles.input}
        placeholder="Indtast tekst..."
        value={text}
        onChangeText={setText}
      />
      <Text style={styles.output}>Du skrev: {text || 'intet endnu'}</Text>
    </View>
  );
}
