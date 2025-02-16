import React, { createContext, useState, useContext } from 'react';

export interface SharedItem {
  id: string;
  uri: string;
  mimeType: string;
  timestamp: number;
  preview?: string;
}

interface SharedItemsContextType {
  items: SharedItem[];
  addItem: (item: SharedItem) => void;
  removeItem: (id: string) => void;
}

const SharedItemsContext = createContext<SharedItemsContextType | null>(null);

export function SharedItemsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SharedItem[]>([]);

  const addItem = (item: SharedItem) => {
    setItems(prev => [...prev, item]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <SharedItemsContext.Provider value={{ items, addItem, removeItem }}>
      {children}
    </SharedItemsContext.Provider>
  );
}

export function useSharedItems() {
  const context = useContext(SharedItemsContext);
  if (!context) {
    throw new Error('useSharedItems must be used within a SharedItemsProvider');
  }
  return context;
}
