import { createContext, useContext } from "react";
import { Root } from "react-dom/client";
import FileOrganizer from "../..";

interface AppContextType {
  plugin: FileOrganizer;
  root: Root;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

export const usePlugin = (): FileOrganizer => {
  const { plugin } = useAppContext();
  return plugin;
};

export const useRoot = (): Root => {
  const { root } = useAppContext();
  return root;
};
