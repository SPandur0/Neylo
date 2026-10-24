// Denne fil styrer visning af skærmene i detalje-navigationen, så én skærm kan være aktiv og de øvrige skjult.
import { StyleSheet } from 'react-native';

export const detailNavigationStyles = StyleSheet.create({
  container: { flex: 1 },
  page: { flex: 1 },
  hidden: { display: 'none' },
});
