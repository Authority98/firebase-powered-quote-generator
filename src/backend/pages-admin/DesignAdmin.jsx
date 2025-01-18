import React, { useState, useEffect } from 'react';
import { Typography, Paper, TextField, Button, Box, Select, MenuItem, FormControl, Grid, FormControlLabel, Switch } from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase-admin';
import { onSnapshot } from 'firebase/firestore';

const hexToRgb = (hex) => {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
};

// Add this function at the top of your component or in a utility file
const calculateTextColorInvert = (color) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? 0 : 1;
};

const DesignAdmin = () => {
  const [logo, setLogo] = useState(null);
  const [themeColor, setThemeColor] = useState('#FFFFFF');
  const [buttonColor, setButtonColor] = useState('#D2C4C0');
  const [secondaryColor, setSecondaryColor] = useState('#D2C4C0');
  const [currentLogo, setCurrentLogo] = useState('');
  const [previewLogo, setPreviewLogo] = useState('');
  const [fonts] = useState(['Playfair Display', 'FSAlbert', 'Arial', 'Helvetica', 'Times New Roman', 'Courier']);
  const [headingSettings, setHeadingSettings] = useState({
    h1: { fontFamily: 'FSAlbert', googleFont: false },
    h2: { fontFamily: 'FSAlbert', googleFont: false },
    h3: { fontFamily: 'FSAlbert', googleFont: false },
  });
  const [headingColors, setHeadingColors] = useState({
    h1: '#000000',
    h2: '#000000',
    h3: '#000000',
  });
  const [generalTextColor, setGeneralTextColor] = useState('#FFFFFF');
  const [showRecommended, setShowRecommended] = useState(true);
  const [invertLogo, setInvertLogo] = useState(false);

  useEffect(() => {
    fetchDesignSettings();

    const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setThemeColor(data.themeColor || '#FFFFFF');
        setButtonColor(data.buttonColor || '#D2C4C0');
        setSecondaryColor(data.secondaryColor || '#D2C4C0');
        setCurrentLogo(data.logoUrl || '');
        if (data.headingSettings) {
          setHeadingSettings(data.headingSettings);
        }
        if (data.headingColors) {
          setHeadingColors(data.headingColors);
          document.documentElement.style.setProperty('--h1-color', data.headingColors.h1);
          document.documentElement.style.setProperty('--h2-color', data.headingColors.h2);
          document.documentElement.style.setProperty('--h3-color', data.headingColors.h3);
        }
        if (data.generalTextColor) {
          setGeneralTextColor(data.generalTextColor);
          document.documentElement.style.setProperty('--general-text-color', data.generalTextColor);
          document.documentElement.style.setProperty('--general-text-color-invert', calculateTextColorInvert(data.generalTextColor));
          document.documentElement.style.setProperty('--general-text-color-rgb', hexToRgb(data.generalTextColor));
        }
        setShowRecommended(data.showRecommended !== false);
        setInvertLogo(data.invertLogo || false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchDesignSettings = async () => {
    const designDoc = await getDoc(doc(db, 'settings', 'design'));
    if (designDoc.exists()) {
      const data = designDoc.data();
      setThemeColor(data.themeColor || '#FFFFFF');
      setButtonColor(data.buttonColor || '#D2C4C0');
      setSecondaryColor(data.secondaryColor || '#D2C4C0');
      setCurrentLogo(data.logoUrl || '');
      setHeadingSettings(data.headingSettings || {
        h1: { fontFamily: 'FSAlbert', googleFont: false },
        h2: { fontFamily: 'FSAlbert', googleFont: false },
        h3: { fontFamily: 'FSAlbert', googleFont: false },
      });
      setHeadingColors(data.headingColors || {
        h1: '#000000',
        h2: '#000000',
        h3: '#000000',
      });
      setGeneralTextColor(data.generalTextColor || '#FFFFFF');
      setShowRecommended(data.showRecommended !== false);
      setInvertLogo(data.invertLogo || false);
    }
  };

  const handleLogoChange = (e) => {
    if (e.target.files[0]) {
      setLogo(e.target.files[0]);
      setPreviewLogo(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveLogo = async () => {
    try {
      if (currentLogo) {
        const storageRef = ref(storage, `design/logo`);
        await deleteObject(storageRef);

        await setDoc(doc(db, 'settings', 'design'), {
          themeColor,
          buttonColor,
          logoUrl: '',
        });

        setCurrentLogo('');
        setPreviewLogo('');
        setLogo(null);
        alert('Logo removed successfully!');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Failed to remove logo. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      let logoUrl = currentLogo;

      if (logo) {
        const storageRef = ref(storage, `design/logo`);
        await uploadBytes(storageRef, logo);
        logoUrl = await getDownloadURL(storageRef);
      }

      const designData = {
        themeColor,
        buttonColor,
        secondaryColor,
        logoUrl,
        headingSettings,
        headingColors,
        generalTextColor,
        showRecommended,
        invertLogo,
      };

      await setDoc(doc(db, 'settings', 'design'), designData);

      setCurrentLogo(logoUrl);
      setPreviewLogo('');
      setLogo(null);
      
      document.documentElement.style.setProperty('--general-text-color', generalTextColor);
      document.documentElement.style.setProperty('--general-text-color-invert', calculateTextColorInvert(generalTextColor));

      alert('Design settings saved successfully!');
    } catch (error) {
      console.error('Error saving design settings:', error);
      alert('Failed to save design settings. Please try again.');
    }
  };

  const handleHeadingChange = (heading, value) => {
    setHeadingSettings(prev => ({
      ...prev,
      [heading]: { 
        fontFamily: value,
        googleFont: value === 'Playfair Display' // Set to true if Playfair Display is selected
      }
    }));
  };

  const handleHeadingColorChange = (heading, value) => {
    setHeadingColors(prev => ({
      ...prev,
      [heading]: value
    }));
  };

  const loadGoogleFonts = (fonts) => {
    fonts.forEach(font => {
      if (font === 'Playfair Display') {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css?family=${font.replace(' ', '+')}`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Design Settings
      </Typography>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Logo
            </Typography>
            <input
              accept="image/*"
              type="file"
              onChange={handleLogoChange}
              style={{ display: 'none' }}
              id="logo-upload"
            />
            <label htmlFor="logo-upload">
              <Button variant="contained" component="span">
                Upload New Logo
              </Button>
            </label>
            {(previewLogo || currentLogo) && (
              <Box sx={{ mt: 2 }}>
                <img 
                  src={previewLogo || currentLogo} 
                  alt="Logo" 
                  style={{ 
                    maxWidth: '200px',
                    filter: invertLogo ? 'invert(1)' : 'none'
                  }} 
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={invertLogo}
                      onChange={(e) => setInvertLogo(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Invert Logo Colors"
                  sx={{ display: 'block', mt: 1 }}
                />
                <Button 
                  variant="outlined" 
                  color="secondary" 
                  onClick={handleRemoveLogo}
                  sx={{ mt: 1, display: 'block' }}
                >
                  Remove Logo
                </Button>
              </Box>
            )}
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              Background Color
            </Typography>
            <TextField
              fullWidth
              type="text"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              placeholder="#FFFFFF"
              size="small"
              sx={{ mt: 0 }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              Button Color
            </Typography>
            <TextField
              fullWidth
              type="text"
              value={buttonColor}
              onChange={(e) => setButtonColor(e.target.value)}
              placeholder="#D2C4C0"
              size="small"
              sx={{ mt: 0 }}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              Secondary Color
            </Typography>
            <TextField
              fullWidth
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              placeholder="#D2C4C0"
              size="small"
              sx={{ mt: 0 }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          {['h1', 'h2', 'h3'].map((heading) => (
            <Box key={heading} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                {heading.toUpperCase()} Font Family
              </Typography>
              <FormControl fullWidth size="small" sx={{ mt: 0 }}>
                <Select
                  value={headingSettings[heading].fontFamily}
                  onChange={(e) => handleHeadingChange(heading, e.target.value)}
                  renderValue={(selected) => (
                    <Box component="span" sx={{ fontFamily: selected }}>
                      {selected}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  {fonts.map((font) => (
                    <MenuItem 
                      key={font} 
                      value={font}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold', mt: 2 }}>
                {heading.toUpperCase()} Color
              </Typography>
              <TextField
                fullWidth
                type="text"
                value={headingColors[heading]}
                onChange={(e) => handleHeadingColorChange(heading, e.target.value)}
                placeholder="#000000"
                size="small"
                sx={{ mt: 0 }}
              />
            </Box>
          ))}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 'bold' }}>
              General Text Color
            </Typography>
            <TextField
              fullWidth
              type="text"
              value={generalTextColor}
              onChange={(e) => setGeneralTextColor(e.target.value)}
              placeholder="#FFFFFF"
              size="small"
              sx={{ mt: 0 }}
            />
          </Box>
        </Grid>
      </Grid>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Features
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showRecommended}
              onChange={(e) => setShowRecommended(e.target.checked)}
              color="primary"
            />
          }
          label="Show Recommended Products"
        />
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          When enabled, products that match the user's requirements will be highlighted as recommended.
        </Typography>
      </Box>
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Button variant="contained" onClick={handleSave} size="large">
          Save Design Settings
        </Button>
      </Box>
    </Paper>
  );
};

export default DesignAdmin;