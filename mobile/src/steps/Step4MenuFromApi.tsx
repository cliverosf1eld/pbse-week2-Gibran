// Step 4 · Meeting 8 — the same list, now from the deployed KANTIN backend.
// GET /v1/menu-items is public: no sign-in needed (see openapi.yaml).
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { API_BASE_URL } from '../config';

type MenuItem = { id: string; name: string; price: number; available: boolean };

export default function Step4MenuFromApi() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/menu-items`)
      .then(res => res.json())
      .then(body => setItems(body.items))
      .catch(() => setError('Tidak bisa menghubungi KANTIN.'));
  }, []);

  if (error) return <Text style={styles.message}>{error}</Text>;
  if (items === null) return <ActivityIndicator style={styles.message} />;

  return (
    <FlatList
      style={styles.list}
      data={items}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={[styles.name, !item.available && styles.off]}>{item.name}</Text>
          <Text>Rp {item.price.toLocaleString('id-ID')}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 60 },
  message: { marginTop: 120, textAlign: 'center' },
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#ddd' },
  name: { fontSize: 18, fontWeight: 'bold' },
  off: { color: '#999' },
});
