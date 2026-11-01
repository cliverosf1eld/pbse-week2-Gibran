// Step 3 · Meeting 8 — a list on screen. The data is typed in by hand, for now.
import { FlatList, StyleSheet, Text, View } from 'react-native';

type MenuItem = { id: string; name: string; price: number };

const MENU: MenuItem[] = [
  { id: 'mi_nasgor01', name: 'Nasi goreng', price: 18000 },
  { id: 'mi_ayam0002', name: 'Ayam bakar', price: 25000 },
  { id: 'mi_soto0003', name: 'Soto ayam', price: 20000 },
];

export default function Step3Menu() {
  return (
    <FlatList
      style={styles.list}
      data={MENU}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>Rp {item.price.toLocaleString('id-ID')}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { marginTop: 60 },
  row: { padding: 16, borderBottomWidth: 1, borderColor: '#ddd' },
  name: { fontSize: 18, fontWeight: 'bold' },
});
