import { useCallback, useEffect, useState } from 'react';
import { createPagerNavigator } from './navigation/PagerNavigator';
import { StatusBar } from 'expo-status-bar';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import LaunchScreen, { neyloSplash } from './Components/LaunchScreen';
import { neyloSymbol } from './Components/NeyloLogo';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import IncomeExpensesScreen from './screens/IncomeExpensesScreen';
import SettingsScreen from './screens/SettingsScreen';
import { FinanceProvider } from './context/FinanceContext';
import { colors, styles } from './styles/styles';
const Tab = createPagerNavigator();
const icons = {
  Home: 'grid-outline',
  'Income & Expenses': 'swap-horizontal-outline',
  Settings: 'settings-outline'
};
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    primary: colors.green,
    card: colors.surface,
    text: colors.ink,
    border: colors.border
  }
};
export default function App() {
  const [resourcesReady, setResourcesReady] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const handleDatabaseReady = useCallback(() => setDatabaseReady(true), []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      Font.loadAsync(Ionicons.font),
      Asset.loadAsync([neyloSymbol, neyloSplash]),
    ]).then(results => {
      for (const result of results) {
        if (result.status === 'rejected') console.warn('Startup asset could not load:', result.reason);
      }
      if (active) setResourcesReady(true);
    });
    return () => { active = false; };
  }, []);

  return <SafeAreaProvider>
    <StatusBar style="dark" />
    <LaunchScreen ready={resourcesReady && databaseReady}>
    <FinanceProvider onReady={handleDatabaseReady}>
    <NavigationContainer theme={theme}>
      <Tab.Navigator screenOptions={({
        route
      }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        tabBarIcon: ({
          color,
          size
        }) => <Ionicons name={icons[route.name]} size={size} color={color} />
      })}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Income & Expenses" component={IncomeExpensesScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
    </FinanceProvider>
    </LaunchScreen>
  </SafeAreaProvider>;
}
