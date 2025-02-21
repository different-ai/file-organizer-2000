import { ExpoRoot } from 'expo-router';
import { View } from 'react-native';
import "./global.css"


export function App() {
  const ctx = require.context('./app');
  return (
    <View style={{ flex: 1 }}>
      <ExpoRoot context={ctx} />
    </View>
  );
}

export default App; 