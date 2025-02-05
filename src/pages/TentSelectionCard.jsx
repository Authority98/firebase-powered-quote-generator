import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Box } from '@mui/material';
import { IoAdd } from 'react-icons/io5';
import ImageLightbox from '../components/ImageLightbox';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CollectionsIcon from '@mui/icons-material/Collections';

const TentSelectionCard = ({ product, onShortlist, selectedExtras, extrasInfo, itemQuantities, onQuantityChange, generalTextColor, formData }) => {
    const theme = useTheme();
    const [secondaryColor, setSecondaryColor] = useState('#00A0AB');
    const [shortlistStatus, setShortlistStatus] = useState({});
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [slides, setSlides] = useState([]);
    const [showRecommended, setShowRecommended] = useState(true);

    useEffect(() => {
        console.log('TentSelectionCard re-rendered');
        console.log('Current itemQuantities:', itemQuantities);
        console.log('Current selectedExtras:', selectedExtras);
    }, [product, selectedExtras, itemQuantities]);

    useEffect(() => {
        if (extrasInfo && Object.keys(extrasInfo).length > 0) {
            const defaultQuantities = {};
            Object.keys(extrasInfo).forEach(extraId => {
                const extra = extrasInfo[extraId];
                if (extra.display === 'Toggle Switch' && extra.qty) {
                    defaultQuantities[extraId] = extra.qty;
                }
            });
            onQuantityChange(defaultQuantities);
        }
    }, [extrasInfo, onQuantityChange]);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.secondaryColor) {
                    setSecondaryColor(data.secondaryColor);
                    document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
                }
                setShowRecommended(data.showRecommended !== false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (product) {
            const newSlides = [];
            if (product.featuredImage) {
                newSlides.push({ src: product.featuredImage });
            }
            if (Array.isArray(product.additionalImages)) {
                product.additionalImages.forEach(img => newSlides.push({ src: img }));
            }
            setSlides(newSlides);
            console.log('Slides set:', newSlides);
        }
    }, [product]);

    const handleLocalQuantityChange = (itemId, value) => {
        console.log(`TentSelectionCard: handleLocalQuantityChange called for item ${itemId} with value ${value}`);
        onQuantityChange(itemId, value);
    };

    if (!product) {
        return <Typography>No products available.</Typography>;
    }

    const handleImageClick = () => {
        setLightboxIndex(0);
        setLightboxOpen(true);
    };

    const handleShortlist = (product) => {
        if (!product) {
            console.error('Product is undefined');
            return;
        }

        const totalPrice = calculateTotalPrice(product);
        const shortlistedProduct = { 
            ...product, 
            totalPrice,
            inventories: product.inventories ? product.inventories.map(inv => ({
                ...inv,
                qty: inv.type === "Multiple" ? (itemQuantities[inv.id] || inv.qty || 0) : 1
            })) : []
        };

        // Include all extras, not just selected ones
        const productExtras = Object.keys(extrasInfo).map(extraId => {
            const extra = extrasInfo[extraId];
            return {
                id: extraId,
                name: extra.name,
                qty: itemQuantities[extraId] || extra.qty || 0,
                price: extra.price || 0,
                display: extra.display,
                leftText: extra.leftText,
                rightText: extra.rightText,
                qtyText: extra.qtyText,
                selected: selectedExtras[extraId] || false,
                defaultSelected: extra.display === 'Toggle Switch' ? (selectedExtras[extraId] || false) : undefined
            };
        });

        shortlistedProduct.extras = productExtras;

        onShortlist(shortlistedProduct);

        // Update shortlist status
        setShortlistStatus(prev => ({
            ...prev,
            [product.id]: 'ShortListed'
        }));
    };

    const calculateTotalPrice = (product) => {
        if (!product) return 0;

        let total = Number(product.price) || 0;

        console.log(`Calculating price for ${product.name}:`);
        console.log(`Base price: ${total}`);

        // Add price for included items
        if (Array.isArray(product.included)) {
            product.included.forEach(item => {
                const itemPrice = Number(item.price) || 0;
                total += itemPrice;
                console.log(`Added ${itemPrice} for included item: ${item.item}`);
            });
        }

        // Add price for inventories if they exist
        if (Array.isArray(product.inventories)) {
            product.inventories.forEach(inv => {
                if (inv && inv.type === "Multiple") {
                    const quantity = itemQuantities[inv.id] || 0;
                    const inventoryPrice = Number(inv.price || 0) * quantity;
                    total += inventoryPrice;
                    console.log(`Added ${inventoryPrice} for inventory ${inv.id}`);
                } else if (inv && inv.type === "Single" && inv.default) {
                    const inventoryPrice = Number(inv.price || 0);
                    total += inventoryPrice;
                    console.log(`Added ${inventoryPrice} for default single inventory ${inv.id}`);
                }
            });
        }

        // Include selected extras in the total price
        if (selectedExtras && extrasInfo) {
            Object.keys(extrasInfo).forEach(extraId => {
                const extra = extrasInfo[extraId];
                if (extra) {
                    const quantity = itemQuantities[extraId] || extra.defaultQty || extra.qty || 0;
                    if (extra.display === 'Toggle Switch') {
                        // For Toggle Switch, use priceRight when selected, priceLeft when not selected
                        const price = selectedExtras[extraId] ? 
                            Number(extra.priceRight || extra.price || 0) : 
                            Number(extra.priceLeft || extra.price || 0);
                        const extraPrice = price * quantity;
                        total += extraPrice;
                        console.log(`Added ${extraPrice} for toggle switch extra ${extraId} (${selectedExtras[extraId] ? 'right' : 'left'} price)`);
                    } else if (extra.display === 'QTY') {
                        // For QTY, always consider the quantity
                        const extraPrice = Number(extra.price || 0) * quantity;
                        total += extraPrice;
                        console.log(`Added ${extraPrice} for QTY extra ${extraId}`);
                    } else if (selectedExtras[extraId]) {
                        // For other types, only add if selected
                        const extraPrice = Number(extra.price || 0) * (quantity || 1);
                        total += extraPrice;
                        console.log(`Added ${extraPrice} for selected extra ${extraId}`);
                    }
                }
            });
        }

        console.log(`Final total price: ${total}`);
        return total;
    };

    const renderExtras = (product) => {
        console.log('TentSelectionCard: Rendering extras for product:', product);
        console.log('TentSelectionCard: Selected extras:', selectedExtras);
        console.log('TentSelectionCard: Extras info:', extrasInfo);
        console.log('TentSelectionCard: Item quantities:', itemQuantities);

        if (!extrasInfo) return null;

        const extrasToDisplay = Object.keys(extrasInfo).filter(extraId => 
            extrasInfo[extraId].display === 'Toggle Switch' || 
            extrasInfo[extraId].display === 'QTY' || // Add this line to include QTY extras
            (selectedExtras && selectedExtras[extraId])
        );

        return (
            <div style={{ marginBottom: '2px' }}>
                <Typography variant="subtitle1" style={{ 
                    marginBottom: '0', 
                    fontSize: '0.9rem', 
                    lineHeight: 1 
                }}>
                    Selected Extras:
                </Typography>
                {extrasToDisplay.length > 0 ? (
                    <ul style={{ 
                        listStyleType: 'none', 
                        padding: 0, 
                        margin: 0,
                        marginTop: '1px'
                    }}>
                        {extrasToDisplay.map((extraId) => {
                            const extra = extrasInfo[extraId];
                            if (!extra) return null;

                            let displayText = extra.name;
                            if (extra.display === 'Toggle Switch') {
                                const qtyText = extra.qtyText || 'QTY';
                                const qty = itemQuantities[extraId] || extra.qty || 0;
                                const toggleText = selectedExtras[extraId] ? extra.rightText : extra.leftText;
                                displayText = `${qtyText}: ${qty} ${toggleText}`;
                            } else if (extra.display === 'QTY') {
                                const qty = itemQuantities[extraId] || 0;
                                displayText = `${extra.name}: ${qty}`;
                            } else if (extra.display === 'Checkbox' && selectedExtras[extraId]) {
                                displayText = extra.name;
                            } else {
                                return null;
                            }

                            return (
                                <li key={extraId} style={{ 
                                    fontSize: '0.9rem',
                                    color: '#4a4a4a',
                                    marginBottom: '1px',
                                    paddingLeft: '12px',
                                    position: 'relative',
                                    lineHeight: '1.2'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '4px',
                                        height: '4px',
                                        borderRadius: '50%',
                                        backgroundColor: '#007bff',
                                        display: 'inline-block',
                                        marginRight: '6px'
                                    }}></span>
                                    {displayText}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <Typography style={{ 
                        fontSize: '0.9rem', 
                        color: '#4a4a4a', 
                        marginTop: '1px',
                        lineHeight: 1 
                    }}>
                        No extras selected
                    </Typography>
                )}
            </div>
        );
    };

    // Add this new function to create a colored SVG
    const createColoredSvg = (path) => (
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d={path} fill={generalTextColor} />
        </svg>
    );

    // Define the path for the plus icon
    
    const productTypes = product ? Object.entries(product) : [];

    const renderProductImage = (product) => (
        <Box 
            sx={{ 
                position: 'relative',
                cursor: 'pointer',
                height: '220px',
                overflow: 'hidden',
                borderTopLeftRadius: '20px',
                borderTopRightRadius: '20px',
                '&:hover::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: `${secondaryColor}80`,
                    transition: 'background-color 0.3s ease',
                },
            }}
            onClick={handleImageClick}
        >
            <CardMedia
                component="img"
                alt={product.name}
                image={product.featuredImage}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                }}
            />
            {slides.length > 1 && (
                <Box
                    sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        color: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        backdropFilter: 'blur(2px)',
                    }}
                >
                    <CollectionsIcon sx={{ fontSize: '1rem', marginRight: '4px' }} />
                    {slides.length}
                </Box>
            )}
        </Box>
    );

    const renderIncluded = (product) => {
        if (!product.included || product.included.length === 0) return null;

        return (
            <div style={{ marginBottom: '10px' }}>
                <Typography variant="subtitle1" style={{ 
                    marginBottom: '0',
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    color: generalTextColor,
                    lineHeight: 1
                }}>
                    Included:
                </Typography>
                <ul style={{ 
                    listStyleType: 'disc', 
                    padding: '0 0 0 20px', 
                    margin: 0,
                    marginTop: '1px'
                }}>
                    {product.included.map((item, index) => (
                        <li key={index} style={{ 
                            fontSize: '0.9rem',
                            color: generalTextColor,
                            marginBottom: '1px',
                            lineHeight: 1.2
                        }}>
                            <span style={{ verticalAlign: 'middle' }}>{item.item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const isRecommended = () => {
        if (!showRecommended) return false;

        const totalGuests = Number(formData.totalGuests) || 0;
        const requiredSeats = Number(formData.seats) || 0;
        const guestsCapacity = Number(product.guestsCapacity) || 0;
        const seatingCapacity = Number(product.seatingCapacity) || 0;

        const isWithinGuestRange = Math.abs(guestsCapacity - totalGuests) <= totalGuests * 0.1;
        const isWithinSeatingRange = Math.abs(seatingCapacity - requiredSeats) <= requiredSeats * 0.1;

        return isWithinGuestRange || isWithinSeatingRange;
    };

    const recommended = isRecommended();

    console.log(`Product ${product.name} is recommended:`, recommended);
    console.log('General Text Color:', generalTextColor);

    return (
        <Box className="tentSelectionCardWrapper" sx={{ 
            height: '100%',
            width: '420px',
        }}>
            <Box sx={{ 
                padding: recommended ? '3px' : '0',
                backgroundColor: recommended ? secondaryColor : 'transparent',
                borderRadius: '25px',
                height: '100%',
                width: '100%',
            }}>
                <Card 
                    className="tentSelectionCardBody" 
                    sx={{ 
                        borderRadius: '22px',
                        backgroundColor: recommended ? '#F5F5F5' : '#FFFFFF',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%',
                        padding: recommended ? '10px' : '0',
                    }}
                >
                    <Box 
                        sx={{ 
                            position: 'relative',
                            cursor: 'pointer',
                            height: '220px',
                            overflow: 'hidden',
                            borderRadius: '12px',
                            '&:hover::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: `${secondaryColor}80`,
                                transition: 'background-color 0.3s ease',
                            },
                        }}
                        onClick={handleImageClick}
                    >
                        <CardMedia
                            component="img"
                            alt={product.name}
                            image={product.featuredImage}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center',
                            }}
                        />
                        {slides.length > 1 && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                    color: 'rgba(0, 0, 0, 0.7)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '0.75rem',
                                    backdropFilter: 'blur(2px)',
                                }}
                            >
                                <CollectionsIcon sx={{ fontSize: '1rem', marginRight: '4px' }} />
                                {slides.length}
                            </Box>
                        )}
                    </Box>
                    <CardContent className='tentSekectionCardContent' sx={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '12px',
                        padding: '20px !important',
                        flexGrow: 1,
                    }}>
                        <Typography gutterBottom variant="h3" className='fs-35' component="div">
                            {product.name}
                        </Typography>
                        <Typography className='cardContentNumber'>
                            {product.size}
                        </Typography>
                        {renderIncluded(product)}
                        {renderExtras(product)}
                        <div className='tentSekectionCardFooter'>
                            <div>
                                <Typography className='price'>
                                    {new Intl.NumberFormat('en-GB').format(Math.round(calculateTotalPrice(product)))}
                                </Typography>
                                <Typography className='priceDescription'>
                                    Inc. VAT & Insurance, Exc. Delivery
                                </Typography>
                            </div>
                            <Button
                                type="submit"
                                variant='contained'
                                color="secondary"
                                className='main-button'
                                startIcon={<IoAdd size={24} style={{ color: secondaryColor }} />}
                                onClick={() => handleShortlist(product)}
                            >
                                {shortlistStatus[product.id] || 'ShortList'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </Box>
            {recommended && (
                <Box 
                    className="recommendationText"
                    sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: secondaryColor,
                        padding: '8px 10px',
                        width: '100%',
                        marginTop: '6px',
                    }}
                >
                    <Typography 
                        variant="subtitle1" 
                        sx={{ 
                            fontWeight: 'bold',
                            display: 'inline',
                            fontSize: '0.9rem',
                            lineHeight: '1',
                        }}
                    >
                        <span style={{ marginRight: '5px' }}>&#9733;</span>
                        Recommended based on your event details
                    </Typography>
                </Box>
            )}
            <ImageLightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={slides}
                index={lightboxIndex}
            />
        </Box>
    );
};

export default TentSelectionCard;
