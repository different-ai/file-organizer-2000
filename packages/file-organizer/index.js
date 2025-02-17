// @ts-check
import 'expo-router/entry';
import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';

// Must be exported or Fast Refresh won't update the context
export function App() {
  return <ExpoRoot context={require.context('./app')} />;
}

registerRootComponent(App);