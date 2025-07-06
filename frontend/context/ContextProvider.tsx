import React, { ReactNode } from "react";
import { LangProvider } from "./LangContext";
import { UIProvider } from "./UIContext";
import { UserProvider } from "./UserContext";
import { VaultProvider } from "./VaultContext";

export const ContextProvider = ({ children }: { children: ReactNode }) => (
  <LangProvider>
    <UIProvider>
      <UserProvider>
        <VaultProvider>
          {children}
        </VaultProvider>
      </UserProvider>
    </UIProvider>
  </LangProvider>
); 