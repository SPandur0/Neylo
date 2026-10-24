// Denne komponent viser brugerens initialer i en lille cirkel, så profilnavnet kan vises uden et stort billede.
import { Text, View } from 'react-native';
import { useFinances } from '../context/FinanceContext';
import { profileInitial } from '../data/profile';
import { styles } from '../styles/styles';

export default function ProfileAvatar() {
  const { name } = useFinances();
  return <View style={styles.avatar} accessibilityLabel={name.trim() || 'Neylo'}>
    <Text style={styles.avatarText}>{profileInitial(name)}</Text>
  </View>;
}
