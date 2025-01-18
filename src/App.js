import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Routes, Route, useLocation } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './backend/firebase-admin';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './css/variables.css';
import './css/App.css';
import './css/TentSelection.css';
import './css/QuoteDetails.css';
import './css/ThankYou.css';
import Dashboard from './pages/Dashboard';
import TentSelection from './pages/TentSelection';
import QuoteDetails from './pages/QuoteDetails';
import ThankYou from './pages/ThankYou';
import AdminRoutes from './backend/components-admin/AdminRoutes';
import LoginAdmin from './backend/pages-admin/LoginAdmin';

function App() {
  const [themeColor, setThemeColor] = useState('#FFFFFF');
  const [buttonColor, setButtonColor] = useState('#00A5AE');
  const [secondaryColor, setSecondaryColor] = useState('#00A0AB');
  const [headingSettings, setHeadingSettings] = useState({
    h1: { fontFamily: 'FSAlbert', googleFont: false },
    h2: { fontFamily: 'FSAlbert', googleFont: false },
    h3: { fontFamily: 'FSAlbert', googleFont: false },
  });
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setThemeColor(data.themeColor || '#FFFFFF');
        setButtonColor(data.buttonColor || '#00A5AE');
        setSecondaryColor(data.secondaryColor || '#00A0AB');
        setHeadingSettings(data.headingSettings || {
          h1: { fontFamily: 'FSAlbert', googleFont: false },
          h2: { fontFamily: 'FSAlbert', googleFont: false },
          h3: { fontFamily: 'FSAlbert', googleFont: false },
        });
        document.documentElement.style.setProperty('--theme-color', data.themeColor || '#FFFFFF');
        document.documentElement.style.setProperty('--button-color', data.buttonColor || '#00A5AE');
        document.documentElement.style.setProperty('--secondary-color', data.secondaryColor || '#00A0AB');
      }
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching design settings:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Load Google Fonts dynamically if needed
    const googleFonts = Object.values(headingSettings).filter(setting => setting.googleFont);
    if (googleFonts.length > 0) {
      const fontFamilies = googleFonts.map(font => font.fontFamily.replace(' ', '+')).join('|');
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css?family=${fontFamilies}&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }, [headingSettings]);

  const frontendTheme = createTheme({
    palette: {
      primary: {
        main: buttonColor,
      },
      secondary: {
        main: secondaryColor,
      },
      background: {
        paper: buttonColor,
      },
    },
    typography: {
      fontFamily: "'FSAlbert', sans-serif",
    },
  });

  const adminTheme = createTheme(); // Default theme for admin

  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/login';

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider>
      <MuiThemeProvider theme={isAdminRoute ? adminTheme : frontendTheme}>
        <CssBaseline />
        <div style={{ 
          backgroundColor: isAdminRoute ? 'inherit' : themeColor, 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Routes>
            {/* Frontend Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/tent" element={<TentSelection />} />
            <Route path="/quote-details" element={<QuoteDetails />} />
            <Route path="/thankyou" element={<ThankYou />} />

            {/* Admin Routes */}
            <Route path="/login" element={<LoginAdmin />} />
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Routes>
        </div>
      </MuiThemeProvider>
    </ThemeProvider>
  );
}

export default App;