import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';
import defaultLogo from '../assets/logo.png';
import { useLocation } from 'react-router-dom';

function Header() {
    const [logoUrl, setLogoUrl] = useState(null);
    const [logoSize, setLogoSize] = useState(50);
    const [invertLogo, setInvertLogo] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.logoUrl && data.logoUrl !== '') {
                    setLogoUrl(data.logoUrl);
                } else {
                    setLogoUrl(defaultLogo);
                }
                const newLogoSize = data.logoSize || 50;
                setLogoSize(newLogoSize);
                setInvertLogo(data.invertLogo || false);
            } else {
                setLogoUrl(defaultLogo);
            }
        }, (error) => {
            console.error('Error fetching design settings:', error);
        });

        return () => unsubscribe();
    }, []);

    const redirectToCheshireTentCo = () => {
        window.location.href = 'https://cheshiretentco.co.uk/';
    }

    const isDashboard = location.pathname === '/';

    if (!logoUrl) {
        return null;
    }

    return (
        <div 
            onClick={redirectToCheshireTentCo} 
            style={{ 
                textAlign: 'left',
                paddingLeft: isDashboard ? '20px' : '0',
                width: '100%',
                maxWidth: '300px',
            }}
            className={`logo-container ${isDashboard ? 'dashboard-header' : ''}`}
        >
            <img 
                src={logoUrl} 
                alt="Logo" 
                style={{
                    width: `${logoSize}%`,
                    height: 'auto',
                    maxWidth: '100%',
                    filter: invertLogo ? 'invert(1)' : 'none'
                }}
                className='cursor-pointer header-logo'
                onError={(e) => {
                    console.error('Error loading image:', e.target.src);
                    e.target.src = defaultLogo;
                }} 
            />
        </div>
    )
}

export default Header;