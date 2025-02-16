import React from 'react';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '../auth/tokenCache';
import { SharedItemsProvider } from '../context/SharedItems';
import { AppNavigator } from '../navigation/AppNavigator';

const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;

export default function App() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <SharedItemsProvider>
        <AppNavigator />
      </SharedItemsProvider>
    </ClerkProvider>
  );
}
