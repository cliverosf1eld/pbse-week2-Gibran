// Step 1 · Meeting 8 — change the text, save, and watch your phone update.
import { StyleSheet, Text, View } from 'react-native';

export default function Step1Hello() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Halo, KANTIN!</Text>
      <Text>Saya Rizky, dan ini aplikasi mobile pertama saya.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 28, fontWeight: 'bold' },
});
