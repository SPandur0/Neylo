import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFinances } from '../context/FinanceContext';
import { PageHeader, Icon, ActionButton } from '../Components/FinanceUI';
import { styles, colors } from '../styles/styles';

export default function SettingsScreen() {
  const { name, updateName, nameError } = useFinances();
  const [notifications, setNotifications] = useState(false);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView style={styles.grow} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <PageHeader eyebrow="DINE PRÆFERENCER" title="Settings" />
          <View style={styles.entryCard}>
            <View style={styles.inline}>
              <View style={[styles.smallIcon, styles.green]}><Icon name="person-outline" size={19} /></View>
              <Text style={styles.sectionTitle}>Profile</Text>
            </View>
            <Text style={styles.inputLabel}>Name</Text>
            <View><TextInput
              accessibilityLabel="Name"
              style={styles.entryInput}
              value={name}
              onChangeText={updateName}
              placeholder="Dit navn"
              maxLength={60}
              autoCapitalize="words"
            /></View>
            {nameError && <><Text accessibilityRole="alert" style={styles.error}>Dit navn kunne ikke gemmes.</Text><ActionButton label="Prøv igen" onPress={() => updateName(name)} /></>}
          </View>
          <View style={styles.entryCard}>
            <View style={styles.inline}>
              <View style={[styles.smallIcon, styles.lavender]}><Icon name="options-outline" size={19} /></View>
              <Text style={styles.sectionTitle}>Preferences</Text>
            </View>
            <View style={styles.between}>
              <Text style={styles.inputLabel}>Currency</Text>
              <Text style={styles.rowTitle}>DKK</Text>
            </View>
            <View style={styles.between}>
              <View style={styles.grow}>
                <Text style={styles.inputLabel}>Notifications</Text>
                <Text style={styles.rowMeta}>{notifications ? 'On' : 'Off'} · Kun demo</Text>
              </View>
              <Switch
                accessibilityLabel="Notifications (demo)"
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.border, true: colors.green }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
