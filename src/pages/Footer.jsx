import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';

function Footer() {
    const [generalTextColor, setGeneralTextColor] = useState('#FFFFFF');

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.generalTextColor) {
                    setGeneralTextColor(data.generalTextColor);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const linkStyle = {
        fontFamily: 'var(--h3-font-family)',
        color: generalTextColor,
        textDecoration: 'none',
        fontWeight: 'normal' // Explicitly set font weight to normal
    };

    return (
        <div className="footer-content">
            <Typography component="a" href="https://cheshiretentco.co.uk/contact/" className='fs-16' style={linkStyle}>Contact</Typography>
            <Typography component="a" href="mailto:hello@thecheshiretentco.co.uk" className='fs-16' style={linkStyle}>hello@thecheshiretentco.co.uk</Typography>
            <Typography component="a" href="tel:08000469757" className='fs-16' style={linkStyle}>08000469757</Typography>
            <Typography component={Link} to="/login" className='fs-16' style={linkStyle}>Admin Login</Typography>
        </div>
    )
}

export default Footer
