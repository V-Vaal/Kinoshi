import React, { createContext, useContext, useState, ReactNode } from "react";

export type Strategie = "equilibree" | "sure" | "dynamique";

export interface UserContextType {
  address: string | null;
  strategie: Strategie;
  setStrategie: (s: Strategie) => void;
  montantInvesti: number;
  setMontantInvesti: (n: number) => void;
  isConnected: boolean;
  setIsConnected: (b: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [address] = useState<string | null>(null);
  const [strategie, setStrategie] = useState<Strategie>("equilibree");
  const [montantInvesti, setMontantInvesti] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  return (
    <UserContext.Provider value={{ address, strategie, setStrategie, montantInvesti, setMontantInvesti, isConnected, setIsConnected }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans un UserProvider");
  return ctx;
}; 