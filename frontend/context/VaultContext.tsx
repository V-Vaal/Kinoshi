import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface VaultContextType {
  totalAssets: number | null;
  previewDeposit: ((amount: number) => Promise<number>) | null;
  deposit: ((amount: number) => Promise<void>) | null;
  redeem: ((shares: number) => Promise<void>) | null;
  withdraw: ((amount: number) => Promise<void>) | null;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider = ({ children }: { children: ReactNode }) => {
  const [totalAssets, setTotalAssets] = useState<number | null>(null);

  // Placeholders pour les appels smart contract
  const previewDeposit = useCallback(async (amount: number) => {
    return amount;
  }, []);
  const deposit = useCallback(async (amount: number) => {}, []);
  const redeem = useCallback(async (shares: number) => {}, []);
  const withdraw = useCallback(async (amount: number) => {}, []);

  return (
    <VaultContext.Provider value={{ totalAssets, previewDeposit, deposit, redeem, withdraw }}>
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = () => {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault doit être utilisé dans un VaultProvider");
  return ctx;
}; 