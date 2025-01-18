import React, { useRef } from 'react';
import { Typography, Button, Box } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Player } from '@lottiefiles/react-lottie-player';
import Footer from './Footer';
import Header from './Header';

function ThankYou() {
    const navigate = useNavigate();
    const location = useLocation();
    const { name } = location.state || {}; // Get the name from the location state
    const lottieRef = useRef(null);

    const handleGoHome = () => {
        window.location.href = 'https://cheshiretentco.co.uk/';
    };

    const handleNewQuote = () => {
        navigate('/');
    };

    const handleLottieComplete = () => {
        if (lottieRef.current) {
            lottieRef.current.pause();
        }
    };

    return (
        <div className="thank-you-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box className="thank-you-header">
                <Header />
            </Box>
            <div className="thank-you-content" style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: '20px',
                maxWidth: '600px',
                margin: '0 auto'
            }}>
                <Box sx={{ width: '300px', height: '300px', marginBottom: '20px' }}>
                    <Player
                        ref={lottieRef}
                        autoplay
                        keepLastFrame
                        src="https://lottie.host/15c4c69d-f5dc-44c1-8fe7-b9ca498bb702/RjQiTbXRD4.json"
                        style={{ width: '300px', height: '300px' }}
                        onComplete={handleLottieComplete}
                    />
                </Box>
                <Typography variant="h2" className="fs-60" style={{ marginBottom: '10px', textAlign: 'center' }}>
                    Thank You, {name || 'Valued Customer'}!
                </Typography>
                <Typography variant="body1" style={{ marginBottom: '20px', textAlign: 'center' }}>
                    We've received your quote request and will be in touch shortly.
                </Typography>
                <Box className="button-container" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button variant="contained" onClick={handleGoHome} className="main-button">
                        Go to Homepage
                    </Button>
                    <Button variant="contained" onClick={handleNewQuote} className="whiteButton">
                        Start a New Quote
                    </Button>
                </Box>
            </div>
            <Box className="thank-you-footer">
                <Footer />
            </Box>
        </div>
    );
}

export default ThankYou;
