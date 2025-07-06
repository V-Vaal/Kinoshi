import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import fr from "../lib/i18n/fr.json";
import en from "../lib/i18n/en.json";

type Lang = "fr" | "en";

type Translations = typeof fr;

export interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Translations) => string;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export const LangProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("fr");
  const translations = lang === "fr" ? fr : en;
  const t = useCallback((key: keyof Translations) => {
    return translations[key] || key;
  }, [translations]);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang doit être utilisé dans un LangProvider");
  return ctx;
}; 