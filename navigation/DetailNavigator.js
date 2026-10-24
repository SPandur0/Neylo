// Denne navigator viser skærme i en stak, så brugeren kan åbne detaljerne for en opsparing og derefter gå tilbage igen.
import { View } from 'react-native';
import { createNavigatorFactory, StackRouter, useNavigationBuilder } from '@react-navigation/native';
import { detailNavigationStyles as styles } from '../styles/detailNavigationStyles';

function DetailNavigator(props) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);
  return <NavigationContent>
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const focused = index === state.index;
        return <View
          key={route.key}
          style={[styles.page, !focused && styles.hidden]}
          pointerEvents={focused ? 'auto' : 'none'}
          accessibilityElementsHidden={!focused}
          importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
        >
          {descriptors[route.key].render()}
        </View>;
      })}
    </View>
  </NavigationContent>;
}

export const createDetailNavigator = createNavigatorFactory(DetailNavigator);
