// Step 2 · Meeting 8 — state: a value that, when it changes, redraws the screen.
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function Step2Counter() {
  const [portions, setPortions] = useState(0);

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Nasi goreng</Text>
      <Text style={styles.count}>{portions} porsi</Text>
      <Button title="Tambah" onPress={() => setPortions(portions + 1)} />
      <Button title="Kurangi" onPress={() => setPortions(Math.max(0, portions - 1))} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  count: { fontSize: 48 },
});
