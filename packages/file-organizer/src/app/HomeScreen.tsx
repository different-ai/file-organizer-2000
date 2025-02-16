import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import ShareMenu from 'react-native-share-menu';
import { useSharedItems } from '../context/SharedItems';
import { FileList } from '../components/FileList';

export function HomeScreen() {
  const { addItem } = useSharedItems();

  useEffect(() => {
    const handleShare = (item: { data: string; mimeType: string } | null) => {
      if (!item) return;
      
      addItem({
        id: Date.now().toString(),
        uri: item.data,
        mimeType: item.mimeType,
        timestamp: Date.now(),
      });
    };

    ShareMenu.getInitialShare(handleShare);
    const subscription = ShareMenu.addNewShareListener(handleShare);

    return () => {
      subscription.remove();
    };
  }, [addItem]);

  return (
    <View style={styles.container}>
      <FileList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
