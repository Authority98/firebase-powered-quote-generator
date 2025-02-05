import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Grid, Drawer, Button, useMediaQuery, useTheme, Typography, Box, IconButton } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { IoAdd } from 'react-icons/io5';
import seatedIcon from '../assets/icon-seated.svg';
import locationIcon from '../assets/icon-location.svg';
import guestIcon from '../assets/icon-guests.svg';
import arrowRight from "../assets/arrow-right.svg";
import TentSelectionExtras from './TentSelectionExtras';
import TentSelectionCard from './TentSelectionCard';
import Footer from './Footer';
import Header from './Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, getDocs, query, where, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';

function TentSelection() {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [secondaryColor, setSecondaryColor] = useState('#00A0AB');
    const [generalTextColor, setGeneralTextColor] = useState('#FFFFFF');
    const [headingColors, setHeadingColors] = useState({
        h1: '#000000',
        h2: '#000000',
        h3: '#000000',
    });

    const { formData: initialFormData, selectedTypes: initialSelectedTypes,
        types: initialTypes, products: initialProducts,
        additionalItems: initialAdditionalItems,
        selectedCardId: initialSelectedCardId,
        selectedProduct: initialSelectedProduct,
        seatCount: initialSeatCount,
    } = location.state || {};

    const [seatCount, setSeatCount] = useState(initialSeatCount || 0);
    const [selectedTypes, setSelectedTypes] = useState(initialSelectedTypes || []);
    const [types, setTypes] = useState(initialTypes || []);
    const [products, setProducts] = useState(initialProducts || {});
    const [shortlistedItems, setShortlistedItems] = useState([]);
    const [additionalItems, setAdditionalItems] = useState(initialAdditionalItems || []);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedCardId, setSelectedCardId] = useState(initialSelectedCardId || null);
    const [selectedProduct, setSelectedProduct] = useState(initialSelectedProduct || null);
    const [itemQuantities, setItemQuantities] = useState({});
    const [selectedExtras, setSelectedExtras] = useState({});
    const [extrasInfo, setExtrasInfo] = useState({});
    const [extras, setExtras] = useState([]);
    const [formData, setFormData] = useState(initialFormData || {
        seats: '',
        date: '',
        totalGuests: '',
        venuePost: ''
    });

    const [containerRefs, setContainerRefs] = useState({});
    const [isInitialized, setIsInitialized] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [extrasLoaded, setExtrasLoaded] = useState(false);

    useEffect(() => {
        if (products && typeof products === 'object' && Object.keys(products).length > 0) {
            const refs = Object.keys(products).reduce((acc, typeId) => {
                acc[typeId] = React.createRef();
                return acc;
            }, {});
            setContainerRefs(refs);
        } else {
            setContainerRefs({});
        }
    }, [products]);

    const scrollLeft = (typeId) => {
        if (containerRefs[typeId] && containerRefs[typeId].current) {
            const container = containerRefs[typeId].current;
            const scrollAmount = window.innerWidth <= 900 ? container.offsetWidth : 300;
            container.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const scrollRight = (typeId) => {
        if (containerRefs[typeId] && containerRefs[typeId].current) {
            const container = containerRefs[typeId].current;
            const scrollAmount = window.innerWidth <= 900 ? container.offsetWidth : 300;
            container.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const fetchTypes = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'types'));
            const fetchedTypes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedTypes.sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
            setTypes(fetchedTypes);
        } catch (error) {
            console.error('Error fetching types:', error);
        }
    };

    const homePage = () => {
        navigate("/")
    }

    useEffect(() => {
        if (selectedTypes.length > 0) {
            selectedTypes.forEach(typeId => fetchProducts(typeId));
        }
    }, [selectedTypes, formData.totalGuests, formData.seats]);

    const fetchProducts = async (typeId) => {
        try {
            const q = query(collection(db, 'products'), where("type", "==", typeId));
            const querySnapshot = await getDocs(q);
            const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            console.log('Products before sorting:', fetchedProducts.map(p => ({ name: p.name, priority: p.priority })));

            // Filter products based on user input
            const filteredProducts = fetchedProducts.filter(product => {
                const guestsCapacity = Number(product.guestsCapacity) || 0;
                const seatingCapacity = Number(product.seatingCapacity) || 0;
                const totalGuests = Number(formData.totalGuests) || 0;
                const requiredSeats = Number(formData.seats) || 0;

                // If seating requirement is specified, it must be met
                if (requiredSeats > 0 && seatingCapacity < requiredSeats) {
                    return false;
                }

                // Then check guest capacity
                return totalGuests === 0 || guestsCapacity >= totalGuests;
            });

            // Sort products by priority (lowest first)
            filteredProducts.sort((a, b) => {
                const priorityA = Number(a.priority) || 0;
                const priorityB = Number(b.priority) || 0;
                return priorityA - priorityB; // Changed this line
            });

            console.log('Products after sorting:', filteredProducts.map(p => ({ name: p.name, priority: p.priority })));

            if (filteredProducts.length > 0) {
                setProducts(prevProducts => ({
                    ...prevProducts,
                    [typeId]: { type: types.find(t => t.id === typeId)?.name, products: filteredProducts },
                }));
            } else {
                setProducts(prevProducts => {
                    const newProducts = { ...prevProducts };
                    delete newProducts[typeId];
                    return newProducts;
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const updateAdditionalItems = (products) => {
        const inventories = Object.values(products).flatMap(category => category.products || [])
            .flatMap(product => product.inventories || []);
        
        const uniqueItems = inventories.reduce((acc, inventory) => {
            if (!acc.some(item => item.id === inventory.id)) {
                acc.push({
                    id: inventory.id,
                    name: inventory.name,
                    checked: inventory.default,
                    shape: inventory.shape,
                    price: inventory.price,
                    type: inventory.type,
                    info_text: inventory.info_text,
                    qty: inventory.default ? 1 : 0,
                    display: inventory.display,
                    qtyText: inventory.qtyText,
                    leftText: inventory.leftText,
                    rightText: inventory.rightText,
                });
            }
            return acc;
        }, []);

        console.log('Updated additionalItems:', uniqueItems);
        setAdditionalItems(uniqueItems);
    };

    const handleCheckboxChange = (id) => {
        setSelectedTypes(prevSelected => {
            if (prevSelected.includes(id)) {
                const updatedSelectedTypes = prevSelected.filter(typeId => typeId !== id);
                setProducts(prevProducts => {
                    const updatedProducts = { ...prevProducts };
                    delete updatedProducts[id];
                    updateAdditionalItems(updatedProducts);
                    return updatedProducts;
                });
                return updatedSelectedTypes;
            } else {
                fetchProducts(id);
                return [...prevSelected, id];
            }
        });
    };

    const handleAdditionalItemChange = (updatedItems) => {
        console.log('Updating additionalItems:', updatedItems);
        setAdditionalItems(updatedItems);

        setProducts(prevProducts => {
            const updatedProducts = { ...prevProducts };
            Object.keys(updatedProducts).forEach(typeId => {
                if (updatedProducts[typeId].products) {
                    updatedProducts[typeId].products = updatedProducts[typeId].products.map(product => ({
                        ...product,
                        inventories: (product.inventories || []).map(inventory => {
                            const updatedItem = updatedItems.find(item => item.id === inventory.id);
                            return updatedItem ? { ...inventory, default: updatedItem.checked, qty: updatedItem.qty || 0 } : inventory;
                        })
                    }));
                }
            });
            return updatedProducts;
        });

        setItemQuantities(prev => {
            const newQuantities = { ...prev };
            updatedItems.forEach(item => {
                newQuantities[item.id] = item.qty || 0;
            });
            return newQuantities;
        });
    };

    const calculateTotalPrice = useCallback((product) => {
        if (!product) return 0;

        let total = Number(product.price) || 0;

        if (Array.isArray(product.inventories)) {
            product.inventories.forEach(inv => {
                if (inv && inv.type === "Multiple") {
                    const quantity = itemQuantities[inv.id] || 0;
                    total += Number(inv.price || 0) * quantity;
                } else if (inv && inv.type === "Single" && inv.default) {
                    total += Number(inv.price || 0);
                }
            });
        }

        // Include selected extras in the total price
        if (product.extras) {
            product.extras.forEach(extra => {
                const quantity = itemQuantities[extra.id] || extra.qty || 0;
                if (extra.display === 'Toggle Switch') {
                    // For Toggle Switch, use priceRight when selected, priceLeft when not selected
                    const price = selectedExtras[extra.id] ? 
                        Number(extra.priceRight || extra.price || 0) : 
                        Number(extra.priceLeft || extra.price || 0);
                    total += price * quantity;
                } else if (selectedExtras[extra.id]) {
                    // For other types, only add if selected
                    total += Number(extra.price || 0) * (quantity || 1);
                }
            });
        }

        return total;
    }, [itemQuantities, selectedExtras]);

    const handleQuantityChange = useCallback((itemId, value) => {
        console.log(`TentSelection: Updating quantity for item ${itemId} to ${value}`);
        setItemQuantities(prev => {
            const newQuantities = {
                ...prev,
                [itemId]: value
            };
            console.log('Updated itemQuantities:', newQuantities);
            return newQuantities;
        });
    }, []);

    useEffect(() => {
        console.log('Products after update:', products);
    }, [products]);

    const handleShapeChange = (itemName, toggleToNextShape) => {
        setProducts(prevProducts => {
            const updatedProducts = { ...prevProducts };

            Object.keys(updatedProducts).forEach(typeId => {
                updatedProducts[typeId] = {
                    ...updatedProducts[typeId],
                    products: updatedProducts[typeId].products.map(product => ({
                        ...product,
                        inventories: product.inventories.map(inventory => {
                            if (inventory.name === itemName) {
                                const newShape =
                                    inventory.shape === 'Rect' || inventory.shape === 'Round'
                                        ? toggleToNextShape ? 'Round' : 'Rect'
                                        : toggleToNextShape ? 'Chairs' : 'Benches';

                                return {
                                    ...inventory,
                                    shape: newShape
                                };
                            }
                            return inventory;
                        })
                    }))
                };
            });

            return updatedProducts;
        });

        setAdditionalItems(prevItems =>
            prevItems.map(item =>
                item.name === itemName
                    ? {
                        ...item,
                        shape:
                            item.shape === 'Rect' || item.shape === 'Round'
                                ? toggleToNextShape ? 'Round' : 'Rect'
                                : toggleToNextShape ? 'Chairs' : 'Benches'
                    }
                    : item
            )
        );
    };

    const handleShortlist = (product) => {
        setShortlistedItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.id === product.id);
            if (existingItemIndex !== -1) {
                // Replace the existing item with the new product data
                const updatedItems = [...prevItems];
                updatedItems[existingItemIndex] = {
                    ...product,
                    extras: product.extras,  // Use the new extras
                    totalPrice: product.totalPrice  // Use the new total price
                };
                return updatedItems;
            } else {
                // Add the new item
                return [...prevItems, product];
            }
        });
    };

    const transformShortlistedItems = () => {
        return shortlistedItems.map(item => ({
            id: item.id,
            name: item.name,
            size: item.size,
            totalPrice: item.totalPrice,
            inventories: item.inventories.map(inv => ({
                ...inv,
                qty: inv.type === "Single" ? 1 : itemQuantities[inv.name] || inv.qty
            }))
        }));
    };

    const handleDelete = (id) => {
        setShortlistedItems(prevShortlisted =>
            prevShortlisted.filter(item => item.id !== id)
        );
    };

    useEffect(() => {
        fetchTypes();
        if (initialSelectedTypes && initialSelectedTypes.length > 0) {
            console.log("Initial selected types:", initialSelectedTypes);
            initialSelectedTypes.forEach(typeId => fetchProducts(typeId));
        }
    }, []);

    const handleDrawerToggle = () => {
        setDrawerOpen(!drawerOpen);
    };

    useEffect(() => {
        if (selectedProduct?.length > 0) {
            const inventories = selectedProduct[0]?.inventories || [];
            const updatedItems = inventories.map(inventory => ({
                id: inventory.id,
                name: inventory.name,
                checked: inventory.default,
                shape: inventory.shape,
                price: inventory.price,
                type: inventory.type,
                info_text: inventory.info_text,
                qty: inventory.qty,
            }));
            setAdditionalItems(updatedItems);
        }
    }, [selectedProduct]);

    const calculateQty = useCallback((extra, isOn, currentSeatCount) => {
        if (currentSeatCount === 0) return extra.qty || 0;
        
        if (extra.toggleSwitchType === 'Tables') {
            return Math.ceil(currentSeatCount / (isOn ? 10 : 6));
        } else if (extra.toggleSwitchType === 'Chairs/Benches') {
            // Chairs when isOn is false (left text), Benches when isOn is true (right text)
            return isOn ? Math.ceil(currentSeatCount / 2.94) : currentSeatCount;
        }
        return extra.qty || 0;
    }, []);

    const updateItemQuantities = useCallback((updatedExtras) => {
        setItemQuantities(prevQuantities => {
            const newQuantities = { ...prevQuantities };
            extras.forEach(extra => {
                if (extra.display === 'Toggle Switch' && 
                    (extra.toggleSwitchType === 'Tables' || extra.toggleSwitchType === 'Chairs/Benches')) {
                    newQuantities[extra.id] = calculateQty(extra, updatedExtras[extra.id], seatCount);
                }
            });
            return newQuantities;
        });
    }, [extras, calculateQty, seatCount]);

    useEffect(() => {
        const fetchExtras = async () => {
            const querySnapshot = await getDocs(collection(db, 'extras'));
            const fetchedExtras = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedExtras.sort((a, b) => a.order - b.order);
            
            const extrasInfoObj = {};
            const initialSelectedExtras = {};
            const initialItemQuantities = {};
            
            fetchedExtras.forEach(extra => {
                extrasInfoObj[extra.id] = extra;
                const isSelected = extra.enabledByDefault || false;
                initialSelectedExtras[extra.id] = isSelected;
                
                if (extra.display === 'Toggle Switch') {
                    initialItemQuantities[extra.id] = calculateQty(extra, isSelected, seatCount);
                } else {
                    initialItemQuantities[extra.id] = extra.qty || 0;
                }
            });
            
            console.log('Initial extras state:', { extrasInfoObj, initialSelectedExtras, initialItemQuantities });
            
            setExtras(fetchedExtras);
            setExtrasInfo(extrasInfoObj);
            setSelectedExtras(initialSelectedExtras);
            setItemQuantities(initialItemQuantities);
            setIsInitialized(true);
            setIsDataLoaded(true);
            setExtrasLoaded(true);
        };

        fetchExtras();
    }, [calculateQty, seatCount]);

    useEffect(() => {
        if (isInitialized && isDataLoaded) {
            console.log('Updating quantities after initialization');
            const updatedQuantities = { ...itemQuantities };
            let hasChanges = false;
            extras.forEach(extra => {
                if (extra.display === 'Toggle Switch') {
                    const newQuantity = calculateQty(extra, selectedExtras[extra.id], seatCount);
                    if (updatedQuantities[extra.id] !== newQuantity) {
                        updatedQuantities[extra.id] = newQuantity;
                        hasChanges = true;
                    }
                }
            });
            if (hasChanges) {
                setItemQuantities(updatedQuantities);
            }
            
            // Remove the forced update
            // setForceUpdate(prev => prev + 1);
        }
    }, [isInitialized, isDataLoaded, seatCount, extras, selectedExtras, calculateQty]);

    const handleExtraChange = useCallback((changedExtra, isImportant) => {
        const [extraId, newValue] = Object.entries(changedExtra)[0];
        setSelectedExtras(prev => {
            const updatedExtras = { ...prev, [extraId]: newValue };
            if (isImportant) {
                extras.forEach(extra => {
                    if (!extra.important && extra.display === 'Toggle Switch') {
                        updatedExtras[extra.id] = newValue;
                    }
                });
            }
            return updatedExtras;
        });

        const extra = extras.find(e => e.id === extraId);
        if (extra && extra.toggleSwitchType === 'Chairs/Benches') {
            const newQuantity = calculateQty(extra, newValue, Number(formData.seats) || 0);
            handleQuantityChange(extraId, newQuantity);
        }
    }, [extras, formData.seats, calculateQty, handleQuantityChange]);

    const isProductsEmpty = useCallback((products) => {
        return !products || 
               Object.keys(products).length === 0 || 
               Object.values(products).every(typeObj => !typeObj.products || typeObj.products.length === 0);
    }, []);

    const proceed = () => {
        console.log('Proceeding to quote details');
        console.log('Shortlisted items:', shortlistedItems);
        console.log('Products:', products);
        console.log('Form data:', formData);

        if (shortlistedItems.length === 0) {
            alert('Please select at least one item before proceeding.');
            return;
        }

        navigate('/quote-details', { 
            state: { 
                shortlistedItems: shortlistedItems,
                products: products,
                dataFields: formData
            } 
        });
    };

    useEffect(() => {
        if (extras && extras.length > 0) {
            const initialQuantities = {};
            extras.forEach(extra => {
                if (extra.display === 'Toggle Switch') {
                    initialQuantities[extra.id] = calculateQty(extra, selectedExtras[extra.id] || false, seatCount);
                } else {
                    initialQuantities[extra.id] = extra.qty || 0;
                }
            });
            setItemQuantities(initialQuantities);
        }
    }, [extras, selectedExtras, seatCount, calculateQty]);

    // Add this useEffect to log formData changes
    useEffect(() => {
        console.log('Form data updated:', formData);
    }, [formData]);

    // Keep only one instance of handleFormChange
    const handleFormChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    // Function to create an SVG with the secondary color
    const createColoredSvg = (svgPath) => {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d={svgPath} fill={secondaryColor} />
            </svg>
        );
    };

    // SVG paths for icons
    const locationIconPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";
    const guestIconPath = "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z";
    const seatedIconPath = "M20 8V6c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v2c-1.1 0-2 .9-2 2v10h20V10c0-1.1-.9-2-2-2zm-2-2v2H6V6h12zM6 20v-8h12v8H6z";

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSecondaryColor(data.secondaryColor || '#00A0AB');
                document.documentElement.style.setProperty('--secondary-color', data.secondaryColor || '#00A0AB');
                
                if (data.headingColors) {
                    setHeadingColors(data.headingColors);
                    document.documentElement.style.setProperty('--h1-color', data.headingColors.h1);
                    document.documentElement.style.setProperty('--h2-color', data.headingColors.h2);
                    document.documentElement.style.setProperty('--h3-color', data.headingColors.h3);
                }
                
                // Set heading font families
                if (data.headingSettings) {
                    document.documentElement.style.setProperty('--h1-font-family', data.headingSettings.h1.fontFamily);
                    document.documentElement.style.setProperty('--h2-font-family', data.headingSettings.h2.fontFamily);
                    document.documentElement.style.setProperty('--h3-font-family', data.headingSettings.h3.fontFamily);
                }
                if (data.generalTextColor) {
                    setGeneralTextColor(data.generalTextColor);
                    document.documentElement.style.setProperty('--general-text-color', data.generalTextColor);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    // Add this useEffect to log formData changes
    useEffect(() => {
        console.log('Form data updated:', formData);
    }, [formData]);

    // Add this near the top of your component, with other useEffect hooks
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data.generalTextColor) {
                    setGeneralTextColor(data.generalTextColor);
                    document.documentElement.style.setProperty('--general-text-color', data.generalTextColor);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        console.log('seatCount updated:', seatCount);
    }, [seatCount]);

    useEffect(() => {
        if (formData.seats) {
            setSeatCount(parseInt(formData.seats, 10));
        }
    }, [formData.seats]);

    return (
        <>
            <div className='container-side' style={{ backgroundColor: 'var(--theme-color)', color: 'var(--general-text-color)' }}>
                <div className='header'>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3} className="logo-container tent-selection-logo">
                            <Header />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <div className='headerNav' style={{ flexDirection: 'column', alignItems: 'center' }}>
                                <h2 className='fs-35' style={{ 
                                    textAlign: 'center', 
                                    marginBottom: '0', 
                                    lineHeight: 1,
                                    fontFamily: 'var(--h2-font-family)',
                                    color: headingColors.h2 // Apply the h2 color here
                                }}>
                                    Tent Selection & Extras
                                </h2>
                                <div className='tentSelectionIcons' style={{ justifyContent: 'center', gap: '20px', marginTop: '0' }}>
                                    <div className='iconText'>
                                        {createColoredSvg(locationIconPath)}
                                        <Typography className='fs-16'>
                                            <span className='hidden'>Location:</span> {formData?.venuePost ? formData?.venuePost : 'Not Provided'}
                                        </Typography>
                                    </div>
                                    <div className='iconText'>
                                        {createColoredSvg(guestIconPath)}
                                        <Typography className='fs-16'>
                                            <span className='hidden'>guests:</span> {formData?.totalGuests ? formData?.totalGuests : 0}
                                        </Typography>
                                    </div>
                                    <div className='iconText'>
                                        {createColoredSvg(seatedIconPath)}
                                        <Typography className='fs-16'>
                                            <span className='hidden'>seated:</span> {formData?.seats ? formData?.seats : 0}
                                        </Typography>
                                    </div>
                                </div>
                            </div>
                        </Grid>
                        <Grid item xs={12} md={3} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <div className="stepper-container">
                                <ol className="stepper" style={{ '--secondary-color': secondaryColor }}>
                                    <li className="step">1</li>
                                    <li className="step active">2</li>
                                    <li className="step">3</li>
                                    <li className="step">4</li>
                                </ol>
                            </div>
                        </Grid>
                    </Grid>
                </div>
                <div className='body'>
                    <Grid container spacing={4}>
                        <Grid item xs={isSmallScreen ? 12 : 4}>
                            {!isSmallScreen ? (
                                <TentSelectionExtras
                                    isSmallScreen={isSmallScreen}
                                    types={types}
                                    onCheckboxChange={handleCheckboxChange}
                                    selectedTypes={selectedTypes}
                                    products={products}
                                    onAdditionalItemChange={handleAdditionalItemChange}
                                    additionalItems={additionalItems}
                                    shortlistedItems={shortlistedItems}
                                    onDelete={handleDelete}
                                    onProceed={proceed}
                                    selectedCardId={selectedCardId}
                                    selectedProduct={selectedProduct}
                                    itemQuantities={itemQuantities}
                                    setItemQuantities={setItemQuantities} // Pass setItemQuantities as a prop
                                    handleQuantityChange={handleQuantityChange}
                                    handleShapeChange={handleShapeChange}
                                    selectedExtras={selectedExtras}
                                    onExtraChange={handleExtraChange}
                                    extras={extras}
                                    extrasInfo={extrasInfo}
                                    generalTextColor={generalTextColor}
                                    seatCount={Number(formData.seats) || 0}
                                    calculateQty={calculateQty} // Pass calculateQty as a prop
                                    forceUpdate={forceUpdate}
                                    isDataLoaded={isDataLoaded}
                                />
                            ) : (
                                <Drawer
                                    anchor="left"
                                    open={drawerOpen}
                                    onClose={handleDrawerToggle}
                                    className=''
                                    classes={{ paper: 'drawerBackground' }}
                                    PaperProps={{ style: { width: '100%' } }} // Make drawer full width on mobile
                                >
                                    <TentSelectionExtras
                                        isSmallScreen={isSmallScreen}
                                        handleDrawerToggle={handleDrawerToggle}
                                        types={types}
                                        onCheckboxChange={handleCheckboxChange}
                                        selectedTypes={selectedTypes}
                                        products={products}
                                        onAdditionalItemChange={handleAdditionalItemChange}
                                        additionalItems={additionalItems}
                                        shortlistedItems={shortlistedItems}
                                        onDelete={handleDelete}
                                        onProceed={proceed}
                                        selectedCardId={selectedCardId}
                                        selectedProduct={selectedProduct}
                                        itemQuantities={itemQuantities}
                                        setItemQuantities={setItemQuantities} // Pass setItemQuantities as a prop
                                        handleQuantityChange={handleQuantityChange}
                                        handleShapeChange={handleShapeChange}
                                        selectedExtras={selectedExtras}
                                        onExtraChange={handleExtraChange}
                                        extras={extras}
                                        extrasInfo={extrasInfo}
                                        generalTextColor={generalTextColor}
                                        seatCount={Number(formData.seats) || 0}
                                        calculateQty={calculateQty} // Pass calculateQty as a prop
                                        forceUpdate={forceUpdate}
                                        isDataLoaded={isDataLoaded}
                                    />
                                </Drawer>
                            )}
                        </Grid>

                        <Grid item xs={isSmallScreen ? 12 : 8}>
                            {products && !isProductsEmpty(products) ? (
                                Object.entries(products).map(([typeId, typeObj]) => (
                                    typeObj.products && typeObj.products.length > 0 && (
                                        <Box key={typeId} mb={4}>
                                            <div className='flexSpaceBetween'>
                                                <h2 className='ps-20 pt-6 fs-35 tent-type-header' style={{ color: generalTextColor }}>{typeObj.type}</h2>
                                                {typeObj.products.length > 1 && (
                                                    <div>
                                                        <IconButton sx={{ color: "white" }} onClick={() => scrollLeft(typeId)}>
                                                            <ArrowBackIos />
                                                        </IconButton>
                                                        <IconButton sx={{ color: "white" }} onClick={() => scrollRight(typeId)}>
                                                            <ArrowForwardIos />
                                                        </IconButton>
                                                    </div>
                                                )}
                                            </div>
                                            <Box className="tentSelectType" ref={containerRefs[typeId]}>
                                                {typeObj.products.map((product, index) => (
                                                    <TentSelectionCard
                                                        key={`${product.id}-${index}`}
                                                        product={product}
                                                        onShortlist={handleShortlist}
                                                        selectedExtras={selectedExtras}
                                                        extrasInfo={extrasInfo}
                                                        itemQuantities={itemQuantities}
                                                        onQuantityChange={handleQuantityChange}
                                                        generalTextColor={generalTextColor}
                                                        formData={formData} // Add this line
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )
                                ))
                            ) : (
                                <Box sx={{ padding: '20px', textAlign: 'left', color: 'var(--general-text-color)' }}>
                                    <Typography variant="h5" gutterBottom sx={{ textAlign: 'left' }}>No Results</Typography>
                                    <Typography>
                                        Please <a href="https://cheshiretentco.co.uk/contact/" target="_blank" rel="noopener noreferrer" className="bold-link" style={{ color: 'inherit' }}>contact us</a> as your needs do not fit in our standard tent types. Our team will be happy to help suggest some suitable options for you. Or feel free to adjust your tent filters to see other options and prices (if you are not having a formal seated dinner for all please state zero here).
                                    </Typography>
                                </Box>
                            )}
                        </Grid>

                        {isSmallScreen && (
                            <>
                                <Button
                                    variant="contained"
                                    className="extras-button"
                                    startIcon={<IoAdd size={24} />}
                                    onClick={handleDrawerToggle}
                                >
                                    Extras
                                </Button>
                                <Button
                                    variant="contained"
                                    className="proceed-button"
                                    endIcon={<ArrowForwardIos />}
                                    onClick={proceed}
                                >
                                    Proceed
                                </Button>
                            </>
                        )}
                    </Grid>

                    <Box className="contactInfoFlex contactInfoTent">
                        <Footer />
                    </Box>

                </div>
            </div>
        </>
    )
}

export default TentSelection;
