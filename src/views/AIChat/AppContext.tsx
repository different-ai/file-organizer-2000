import { createContext, useContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext<App | undefined>(undefined);

export const useApp = (): App => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};