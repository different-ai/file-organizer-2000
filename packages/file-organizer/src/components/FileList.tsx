import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSharedItems, SharedItem } from '../context/SharedItems';

export function FileList() {
  const { items } = useSharedItems();

  const renderItem = ({ item }: { item: SharedItem }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.uri.split('/').pop()}</Text>
      <Text style={styles.details}>Type: {item.mimeType}</Text>
      <Text style={styles.details}>
        Added: {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      ListEmptyComponent={() => (
        <Text style={styles.empty}>No shared files yet</Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  item: {
    backgroundColor: 'white',
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  empty: {
    textAlign: 'center',
    marginTop: 24,
    color: '#666',
  },
});
