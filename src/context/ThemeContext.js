import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#000000'); // Default color

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setThemeColor(data.themeColor || '#000000');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);