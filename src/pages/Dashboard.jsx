import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import TextField from '@mui/material/TextField';
import { Button, Checkbox, Typography, useMediaQuery } from '@mui/material';
import { Box } from '@mui/system';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Header from './Header';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import { doc, onSnapshot } from 'firebase/firestore';

// Yup validation schema
const validationSchema = Yup.object({
    totalGuests: Yup.number().required('Please enter the approximate number of guests').positive('Must be a positive number').integer('Must be an integer'),
    venuePost: Yup.string().required('Location is required'),
});

// Create styled components
const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiFilledInput-root': {
        backgroundColor: theme.palette.background.paper,
    },
    '& .MuiInputLabel-root': {
        color: 'white', // Ensure label color is white
    },
    '& .MuiFilledInput-input': {
        color: 'white', // Ensure input text color is white
    },
    '& .MuiFilledInput-root:hover': {
        backgroundColor: theme.palette.background.paper,
        opacity: 0.9,
    },
}));

function Dashboard() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [types, setTypes] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [products, setProducts] = useState({});
    const [additionalItems, setAdditionalItems] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedCardId, setSelectedCardId] = useState(null);
    const [secondaryColor, setSecondaryColor] = useState('#00A0AB');
    const [headingColors, setHeadingColors] = useState({
        h1: '#000000',
        h2: '#000000',
        h3: '#000000',
    });
    const [generalTextColor, setGeneralTextColor] = useState('#FFFFFF');
    const [headingSettings, setHeadingSettings] = useState({
        h1: { fontFamily: 'FSAlbert' },
        h2: { fontFamily: 'FSAlbert' },
        h3: { fontFamily: 'FSAlbert' },
    });

    const { control, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            date: '',
            venuePost: '',
            totalGuests: '',
            seats: '',
            // interestedInTipis: false,
            // interestedInSailcloth: false,
            // interestedInStretchTents: false,
        },
        resolver: yupResolver(validationSchema),
    });

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

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchProducts = async (typeId) => {
        try {
            const q = query(collection(db, 'products'), where("type", "==", typeId));
            const querySnapshot = await getDocs(q);
            const fetchedProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(prevProducts => {
                const newProducts = {
                    ...prevProducts,
                    [typeId]: { products: fetchedProducts },
                };
                updateAdditionalItems(newProducts);
                setSelectedCardId(fetchedProducts[0]?.id);
                setSelectedProduct(fetchedProducts);
                return newProducts;
            });
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const updateAdditionalItems = (products) => {
        const inventories = Object.values(products || {}).flatMap(category => category.products || []);
        const itemMap = new Map();

        inventories.forEach(product => {
            const productInventories = product.inventories || [];
            productInventories.forEach(inventory => {
                itemMap.set(inventory.name, {
                    id: inventory.id,
                    name: inventory.name,
                    checked: inventory.default,
                    shape: inventory.shape,
                    price: inventory.price,
                    type: inventory.type,
                    info_text: inventory.info_text,
                    qty: inventory.qty,
                });
            });
        });

        const uniqueItems = Array.from(itemMap.values());
        setAdditionalItems(uniqueItems);
    };

    // Handle checkbox changes for selecting types
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

    const onSubmit = (data) => {
        navigate("/tent", {
            state: {
                formData: data,
                selectedTypes: selectedTypes,
                types: types,
                products: products,
                additionalItems: additionalItems,
                selectedCardId: selectedCardId,
                selectedProduct: selectedProduct,
                seatCount: parseInt(data.seats) || 0
            }
        });
    };

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSecondaryColor(data.secondaryColor || '#00A0AB');
                if (data.headingSettings) {
                    document.documentElement.style.setProperty('--h1-font-family', data.headingSettings.h1.fontFamily);
                    document.documentElement.style.setProperty('--h2-font-family', data.headingSettings.h2.fontFamily);
                    document.documentElement.style.setProperty('--h3-font-family', data.headingSettings.h3.fontFamily);
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
                }
                setHeadingSettings(data.headingSettings || {
                    h1: { fontFamily: 'FSAlbert' },
                    h2: { fontFamily: 'FSAlbert' },
                    h3: { fontFamily: 'FSAlbert' },
                });
            }
        });

        return () => unsubscribe();
    }, []);

    const inputProps = {
        style: { 
            color: `${generalTextColor} !important`,
        },
    };

    const InputLabelProps = {
        style: { color: `${generalTextColor} !important` },
        shrink: true,
    };

    return (
        <div className='dashboard-container' style={{ 
            backgroundColor: 'var(--theme-color)',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            margin: 0,
            padding: 0,
            color: generalTextColor,
            fontFamily: theme.typography.fontFamily,
        }}>
            <div className='header' style={{ padding: isMobile ? '0' : '20px 0' }}>
                <div className='headerNav' style={{ 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0 20px'
                }}>
                    <div className="logo-container" style={{ 
                        justifyContent: 'flex-start', 
                        marginBottom: isMobile ? '0' : '0'
                    }}>
                        <Header />
                    </div>
                    <div className="stepper-container" style={{ 
                        paddingTop: isMobile ? '0' : '0', 
                        paddingBottom: isMobile ? '0' : '20px'
                    }}>
                        <ol className="stepper" style={{ '--secondary-color': secondaryColor }}>
                            <li className="step active">1</li>
                            <li className="step">2</li>
                            <li className="step">3</li>
                            <li className="step">4</li>
                        </ol>
                    </div>
                </div>
            </div>
            <div className='body' style={{ flex: 1, padding: '0 20px', color: 'var(--general-text-color)' }}>
                <div className='pt-40 text-center'>
                    <h2 className='fs-35' style={{ 
                        textAlign: 'center', 
                        marginBottom: '20px',
                        color: headingColors.h2,
                        fontFamily: headingSettings.h2.fontFamily
                    }}>
                        Event Details
                    </h2>
                    <p className='mainBodyText' style={{ color: 'var(--general-text-color)' }}>
                        Please provide some basic event details so we can work out options. <br />
                        Completing as much of this information as possible allows for a more accurate quote.
                    </p>
                </div>
                <form className="form" onSubmit={handleSubmit(onSubmit)}>
                    <Controller
                        name="date"
                        control={control}
                        render={({ field }) => (
                            <StyledTextField
                                id="date"
                                label="Event Date (if known)"
                                className='custom-textfield'
                                type="date"
                                {...field}
                                variant="filled"
                                InputLabelProps={{
                                    ...InputLabelProps,
                                    shrink: true,
                                }}
                                inputProps={{
                                    ...inputProps,
                                    min: today,
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            border: 'none',
                                        },
                                        '& input': {
                                            color: `${generalTextColor} !important`,
                                            padding: '10px 12px',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderRadius: '0',
                                            borderBottom: `1px solid ${generalTextColor}`,
                                        },
                                    },
                                    '& .MuiSvgIcon-root': {
                                        color: '#304a5a !important',
                                    },
                                    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                                        color: '#304a5a !important',
                                    },
                                    '& input::-webkit-calendar-picker-indicator': {
                                        filter: 'invert(22%) sepia(17%) saturate(934%) hue-rotate(158deg) brightness(94%) contrast(88%) !important',
                                    },
                                    borderRadius: '5px',
                                    width: '250px',
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="venuePost"
                        control={control}
                        rules={{
                            required: 'Location is required'
                        }}
                        render={({ field }) => (
                            <TextField
                                id="venuePost"
                                label="Venue Location"
                                variant="filled"
                                {...field}
                                error={!!errors.venuePost}
                                helperText={errors.venuePost?.message}
                                className="custom-textfield"
                                sx={{
                                    '& .MuiFormHelperText-root': {
                                        color: 'white',
                                    },
                                    '& .MuiFormHelperText-root.Mui-error': {
                                        color: 'white',
                                    },
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="totalGuests"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                id="totalGuests"
                                label="Total Guests Attending"
                                variant="filled"
                                type="text"
                                {...field}
                                error={!!errors.totalGuests}
                                helperText={errors.totalGuests?.message}
                                className="custom-textfield"
                                sx={{
                                    '& .MuiFormHelperText-root': {
                                        color: 'white',
                                    },
                                    '& .MuiFormHelperText-root.Mui-error': {
                                        color: 'white',
                                    },
                                }}
                            />
                        )}
                    />

                    <Controller
                        name="seats"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                id="seats"
                                label="No. of Formal Dining Seats Required"
                                variant="filled"
                                type="text"
                                {...field}
                                error={!!errors.seats}
                                helperText={errors.seats?.message}
                                className="custom-textfield"
                                sx={{
                                    '& .MuiFormHelperText-root': {
                                        color: 'black',
                                    },
                                }}
                            />
                        )}
                    />

                    <Typography className='fs-16'>(enter zero if casual party)</Typography>

                    <div className='fs-16'>
                        {types?.length > 0 ? (
                            types.map(type => (
                                <div className='flexContainer' key={type.id}>
                                    <div className="cursor-context" style={{ display: 'flex', alignItems: 'center' }}>
                                        Interested In {type.name}
                                        {type.featured && (
                                            <div style={{
                                                display: 'inline-block',
                                                backgroundColor: type.featuredColor || 'red',
                                                color: type.featuredTextColor || 'white', // Use the new text color
                                                borderRadius: '5px',
                                                padding: '5px',
                                                fontSize: '0.8rem',
                                                marginLeft: '10px',
                                                boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)'
                                            }}>
                                                {type.featuredText}
                                            </div>
                                        )}
                                    </div>
                                    <Checkbox
                                        className="custom-checkbox"
                                        checked={selectedTypes.includes(type.id)}
                                        onChange={() => handleCheckboxChange(type.id)}
                                    />
                                </div>
                            ))
                        ) : (
                            <div>Loading...</div>
                        )}
                    </div>

                    <div className='w-300 pt-4'>
                        <Button 
                            type="submit" 
                            variant='contained' 
                            className='main-button'
                            style={{ backgroundColor: 'var(--button-color)' }}
                            endIcon={<ChevronRightIcon />}
                        >
                            Tents & Options
                        </Button>
                    </div>
                </form>
            </div>
            <Box className="footer" style={{ padding: '20px 0', color: 'white' }}>
                <Typography className='fs-60 fw-7' style={{ color: 'white', fontFamily: 'var(--h1-font-family)' }}>Let's get started</Typography>
                <Box className="contactInfo">
                    <Footer />
                </Box>
            </Box>
        </div>
    );
}

export default Dashboard;