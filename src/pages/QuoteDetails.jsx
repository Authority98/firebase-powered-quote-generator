import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';
import {
    TextField,
    MenuItem,
    Checkbox,
    Button,
    Grid,
    Box,
    useMediaQuery,
    useTheme,
    Typography,
    Divider,
    Select,
    FormControl,
    InputLabel,
    FormControlLabel
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Footer from './Footer';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import deleteTent from '../assets/delete-tent.svg';
import Header from './Header';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';

const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email address').required('Email is required'),
    confirm_email: Yup.string()
        .oneOf([Yup.ref('email'), null], 'Emails must match')
        .required('Confirm Email is required'),
    phone: Yup.string().required('Phone number is required'),
    event_type: Yup.string().required('Event type is required'),
    source: Yup.string().required('Please tell us where you found us'),
});

function QuoteDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { shortlistedItems, products, dataFields } = location.state || {};
    const [items, setItems] = useState(shortlistedItems || []);
    const [secondaryColor, setSecondaryColor] = useState('#00A0AB');
    const [headingColors, setHeadingColors] = useState({
        h1: '#000000',
        h2: '#000000',
        h3: '#000000',
    });
    const [generalTextColor, setGeneralTextColor] = useState('#FFFFFF');

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'design'), (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSecondaryColor(data.secondaryColor || '#00A0AB');
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
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        console.log('QuoteDetails: Location state:', location.state);
        console.log('QuoteDetails: Shortlisted items:', shortlistedItems);
        console.log('QuoteDetails: Products:', products);
        console.log('QuoteDetails: Data fields:', dataFields);
    }, [location.state, shortlistedItems, products, dataFields]);

    const handleDelete = (id) => {
        setItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const homePage = () => {
        navigate("/")
    }
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({
        resolver: yupResolver(validationSchema),
        defaultValues: {
            name: '',
            email: '',
            confirm_email: '',
            event_type: '',
            source: '',
            phone: '',
            notes: '',
            send_brochure: false,
        }
    });

    const formatExtras = (extras) => {
        const formattedExtras = extras.filter(extra => extra.selected || extra.qty > 0).map(extra => {
            if (extra.display === 'Toggle Switch') {
                return `${extra.qtyText}: ${extra.qty} ${extra.selected ? extra.rightText : extra.leftText}`;
            } else if (extra.display === 'Checkbox' && extra.selected) {
                return extra.name;
            } else if (extra.display === 'QTY' && extra.qty > 0) {
                return `${extra.name}: ${extra.qty}`;
            }
            return null;
        }).filter(Boolean);

        return formattedExtras.length > 0 ? formattedExtras.join('\n') : '';
    };

    const submitData = async (data) => {
        try {
            console.log('Form data submitted:', data);

            const transformedData = {
                products: items.map(item => ({
                    product_id: item.id || '',
                    name: item.name || '',
                    size: item.size || '',
                    totalPrice: item.totalPrice || 0,
                    extras: (item.inventories || []).concat(item.extras || [])
                        .filter(extra => extra && (extra.selected || extra.qty > 0))
                        .map(extra => ({
                            name: extra.name || '',
                            qty: extra.qty || 0,
                            selected: extra.selected || false,
                            display: extra.display || '',
                            qtyText: extra.qtyText || '',
                            leftText: extra.leftText || '',
                            rightText: extra.rightText || ''
                        }))
                })),
                contact_information: {
                    name: data.name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    event_type: data.event_type || '',
                    notes: data.notes || '',
                    brochure: data.send_brochure || false,
                    total_seats: dataFields.seats || '',
                    date: dataFields.date || '',
                    total_guest: dataFields.totalGuests || '',
                    venue_post: dataFields.venuePost || '',
                    source: data.source || ''
                }
            };

            console.log('Transformed data:', transformedData);

            // Save lead data to Firestore
            const docRef = await addDoc(collection(db, 'leads'), {
                ...transformedData,
                isNew: true,
                timestamp: serverTimestamp()
            });

            console.log('Document written with ID: ', docRef.id);

            // Fetch admin settings
            const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
            let adminEmail = 'usamashabbier@gmail.com'; // Default email
            let fromName = 'Cheshire Tent Company'; // Default from name
            let emailTitle = 'Your Quote Request - Cheshire Tent Company'; // Default email title

            if (settingsDoc.exists()) {
                const settingsData = settingsDoc.data();
                adminEmail = settingsData.adminEmail || adminEmail;
                fromName = settingsData.fromName || fromName;
                emailTitle = settingsData.emailTitle || emailTitle;
            }

            // Fetch design settings
            const designDoc = await getDoc(doc(db, 'settings', 'design'));
            let logoUrl = '';
            let themeColor = '#F06292'; // Default theme color

            if (designDoc.exists()) {
                const designData = designDoc.data();
                logoUrl = designData.logoUrl || '';
                themeColor = designData.themeColor || themeColor;
            }

            const formatDate = (dateString) => {
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                return new Date(dateString).toLocaleDateString('en-GB', options);
            };

            const createEmailTemplate = (isAdmin) => `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${emailTitle}</title>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f0f0f0; }
                        .container { max-width: 600px; margin: 20px auto; padding: 20px; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1) !important; }
                        .header { background-color: ${themeColor}; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .logo { max-width: 200px; }
                        h1, h2 { color: #444; }
                        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
                        .footer { background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .quantity, .checkbox, .details { text-align: center; }
                        .checkbox { font-size: 1.2em; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            ${logoUrl ? `<img src="${logoUrl}" alt="${fromName}" class="logo">` : `<h1>${fromName}</h1>`}
                        </div>
                        <div class="content">
                            <h1>${isAdmin ? 'New Quote Request' : 'Quote Request'}</h1>
                            ${isAdmin 
                                ? `<p>A new quote request has been submitted. Details are as follows:</p>`
                                : `<p>Hello ${transformedData.contact_information.name},</p>
                                   <p>Thank you for submitting a quote request for your event. Please find a copy of the details below, we will be in contact shortly about your enquiry.</p>`
                            }

                            <h2>EVENT INFORMATION</h2>
                            <p><strong>Location:</strong> ${transformedData.contact_information.venue_post}</p>
                            <p><strong>Date:</strong> ${formatDate(transformedData.contact_information.date)}</p>
                            <p><strong>Type:</strong> ${transformedData.contact_information.event_type}</p>
                            <p><strong>Total Guests:</strong> ${transformedData.contact_information.total_guest}</p>
                            <p><strong>Seated Guests:</strong> ${transformedData.contact_information.total_seats}</p>

                            <h2>TENTS & OPTIONS</h2>
                            ${transformedData.products.map(product => `
                                <h3>Type: ${product.name}</h3>
                                <p><strong>Variation:</strong> ${product.name}</p>
                                <p><strong>Size:</strong> ${product.size}</p>
                                <p><strong>Total Price:</strong> £${Math.round(product.totalPrice)} (Inclues VAT & Insurance)</p>
                                <table>
                                    <tr>
                                        <th>Extra</th>
                                        <th>Quantity</th>
                                        <th>Details</th>
                                    </tr>
                                    ${product.extras.map(extra => {
                                        if (extra.qty === 0 && extra.display !== 'Checkbox') return '';
                                        const quantityValue = extra.display === 'Checkbox' ? '' : extra.qty;
                                        let detailsValue = '';
                                        let checkboxValue = '';
                                        
                                        if (extra.display === 'Toggle Switch') {
                                            detailsValue = extra.selected ? extra.rightText : extra.leftText;
                                        } else if (extra.display === 'Checkbox') {
                                            checkboxValue = extra.selected ? '✅' : '';
                                        } else if (extra.qty > 0) {
                                            checkboxValue = '✅';
                                        }
                                        
                                        return `
                                            <tr>
                                                <td>${extra.name}</td>
                                                <td class="quantity">${quantityValue}</td>
                                                <td class="${detailsValue ? 'details' : 'checkbox'}">${detailsValue || checkboxValue}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </table>
                            `).join('')}

                            <h2>CONTACT INFORMATION</h2>
                            <p><strong>Name:</strong> ${transformedData.contact_information.name}</p>
                            <p><strong>Email:</strong> ${transformedData.contact_information.email}</p>
                            <p><strong>Phone:</strong> ${transformedData.contact_information.phone}</p>
                            <p><strong>Event Type:</strong> ${transformedData.contact_information.event_type}</p>
                            <p><strong>Found Us Through:</strong> ${transformedData.contact_information.source}</p>
                            <p><strong>Comments:</strong> ${transformedData.contact_information.notes}</p>
                            <p><strong>Brochure:</strong> ${transformedData.contact_information.brochure ? 'Yes' : 'No'}</p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Email to admin
            const adminEmailData = {
                sender: { email: 'marketing@mutatio.agency', name: fromName },
                to: [{ email: adminEmail, name: adminEmail.split('@')[0] }],
                subject: `New Quote Request from ${transformedData.contact_information.name}`,
                htmlContent: createEmailTemplate(true)
            };

            // Email to user
            const userEmailData = {
                sender: { email: 'marketing@mutatio.agency', name: fromName },
                to: [{ email: transformedData.contact_information.email, name: transformedData.contact_information.name }],
                subject: emailTitle,
                htmlContent: createEmailTemplate(false)
            };

            console.log('Admin Email data:', adminEmailData);
            console.log('User Email data:', userEmailData);

            // Send email to admin
            const adminResponse = await axios.post('https://api.brevo.com/v3/smtp/email', adminEmailData, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.REACT_APP_BREVO_API_KEY
                }
            });

            console.log('Admin Brevo API response:', adminResponse.data);

            // Send email to user
            const userResponse = await axios.post('https://api.brevo.com/v3/smtp/email', userEmailData, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': process.env.REACT_APP_BREVO_API_KEY
                }
            });

            console.log('User Brevo API response:', userResponse.data);

            if (adminResponse.data && adminResponse.data.messageId && userResponse.data && userResponse.data.messageId) {
                console.log('Emails sent successfully');
                navigate('/thankyou', { state: { name: data.name } });
            } else {
                console.error('Error sending emails:', adminResponse.data, userResponse.data);
                alert('Error sending emails: ' + JSON.stringify(adminResponse.data) + ' ' + JSON.stringify(userResponse.data));
            }

            reset();
        } catch (error) {
            console.error('Error submitting data:', error);
            alert('Error submitting data: ' + error.message);
        }
    };

    const renderExtras = (extras) => {
        const formattedExtras = extras.filter(extra => extra.selected || extra.qty > 0).map(extra => {
            if (extra.display === 'Toggle Switch') {
                return `${extra.qtyText}: ${extra.qty} ${extra.selected ? extra.rightText : extra.leftText}`;
            } else if (extra.display === 'Checkbox' && extra.selected) {
                return extra.name;
            } else if (extra.display === 'QTY' && extra.qty > 0) {
                return `${extra.name}: ${extra.qty}`;
            }
            return null;
        }).filter(Boolean);

        return formattedExtras.length > 0 ? (
            <>
                <div style={{ fontSize: '16px', marginBottom: '0', color: generalTextColor }}>Extras:</div>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.2' }}>
                    {formattedExtras.map((extra, index) => (
                        <li key={index} style={{ fontSize: '16px', marginBottom: '0', color: generalTextColor }}>{extra}</li>
                    ))}
                </ul>
            </>
        ) : null;
    };

    const inputProps = {
        style: { color: generalTextColor },
    };

    const InputLabelProps = {
        style: { color: generalTextColor },
        shrink: true,
    };

    return (
        <>
            <div className='quoteContainer' style={{ backgroundColor: 'var(--theme-color)', color: 'var(--general-text-color)' }}>
                <div className="headerContainer">
                    <Grid container direction="column" spacing={2}>
                        <Grid item xs={12} className="logo-container">
                            <div className="logo-wrapper">
                                <Header />
                            </div>
                        </Grid>
                    </Grid>
                    <div className="stepper-container">
                        <ol className="stepper" style={{ '--secondary-color': secondaryColor }}>
                            <li className="step">1</li>
                            <li className="step">2</li>
                            <li className="step active">3</li>
                            <li className="step">4</li>
                        </ol>
                    </div>
                </div>

                <Grid container>
                    <Grid item xs={12} md={8}>
                        <div className='headerNav leftSideBarBottom'>
                            <div className='body quoteDetails'>
                                <h2 className='fs-35' style={{ 
                                    textAlign: 'center', 
                                    marginBottom: '20px',
                                    color: headingColors.h2,
                                    fontFamily: 'var(--h2-font-family)'
                                }}>
                                    Let's Start Talking
                                </h2>
                                <div className='flexCenterColumn'>
                                    <p className='mainBodyText w-600 text-center' style={{ color: 'var(--general-text-color)' }}>
                                        We need to check if your selected tents are available on your event date, please complete the
                                        form below and a member of the team will come back to you with our availability.
                                        <br />
                                        <br />
                                        <small>*Please note all quotes are not valid until confirmed by a member of the team.</small>
                                    </p>
                                </div>
                                <form onSubmit={handleSubmit(submitData)}>
                                    <div className='form'>
                                        <Controller
                                            name="name"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Name"
                                                    variant="filled"
                                                    className="custom-textfield"
                                                    InputProps={inputProps}
                                                    InputLabelProps={InputLabelProps}
                                                    sx={{
                                                        '& .MuiFormHelperText-root': {
                                                            color: generalTextColor,
                                                        },
                                                        '& .MuiFormHelperText-root.Mui-error': {
                                                            color: generalTextColor,
                                                        },
                                                    }}
                                                    error={Boolean(errors.name)}
                                                    helperText={errors.name?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="email"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Email"
                                                    variant="filled"
                                                    type='email'
                                                    className="custom-textfield"
                                                    InputProps={inputProps}
                                                    InputLabelProps={InputLabelProps}
                                                    sx={{
                                                        '& .MuiFormHelperText-root': {
                                                            color: generalTextColor,
                                                        },
                                                        '& .MuiFormHelperText-root.Mui-error': {
                                                            color: generalTextColor,
                                                        },
                                                    }}
                                                    error={Boolean(errors.email)}
                                                    helperText={errors.email?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="confirm_email"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Confirm Email"
                                                    type='email'
                                                    variant="filled"
                                                    className="custom-textfield"
                                                    InputProps={inputProps}
                                                    InputLabelProps={InputLabelProps}
                                                    sx={{
                                                        '& .MuiFormHelperText-root': {
                                                            color: generalTextColor,
                                                        },
                                                        '& .MuiFormHelperText-root.Mui-error': {
                                                            color: generalTextColor,
                                                        },
                                                    }}
                                                    error={Boolean(errors.confirm_email)}
                                                    helperText={errors.confirm_email?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="event_type"
                                            control={control}
                                            defaultValue=""
                                            render={({ field }) => (
                                                <FormControl fullWidth variant="outlined" className="custom-select custom-textfield">
                                                    <InputLabel id="event-type-label">Event Type</InputLabel>
                                                    <Select
                                                        {...field}
                                                        labelId="event-type-label"
                                                        id="event_type"
                                                        label="Event Type"
                                                    >
                                                        <MenuItem value=""><em>Select an event type</em></MenuItem>
                                                        <MenuItem value="wedding">Wedding</MenuItem>
                                                        <MenuItem value="party">Party</MenuItem>
                                                        <MenuItem value="festival">Festival</MenuItem>
                                                        <MenuItem value="corporate">Corporate</MenuItem>
                                                        <MenuItem value="other">Other</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                        <Controller
                                            name="source"
                                            control={control}
                                            defaultValue=""
                                            render={({ field }) => (
                                                <FormControl fullWidth variant="outlined" className="custom-select custom-textfield">
                                                    <InputLabel id="source-label">Where did you find us?</InputLabel>
                                                    <Select
                                                        {...field}
                                                        labelId="source-label"
                                                        id="source"
                                                        label="Where did you find us?"
                                                        error={Boolean(errors.source)}
                                                    >
                                                        <MenuItem value=""><em>Select an option</em></MenuItem>
                                                        <MenuItem value="google">Google Search</MenuItem>
                                                        <MenuItem value="social">Social Media</MenuItem>
                                                        <MenuItem value="referral">Friend or Family</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}
                                        />
                                        <Controller
                                            name="phone"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Telephone Number"
                                                    type='number'
                                                    variant="filled"
                                                    className="custom-textfield"
                                                    InputProps={inputProps}
                                                    InputLabelProps={InputLabelProps}
                                                    sx={{
                                                        '& .MuiFormHelperText-root': {
                                                            color: generalTextColor,
                                                        },
                                                        '& .MuiFormHelperText-root.Mui-error': {
                                                            color: generalTextColor,
                                                        },
                                                    }}
                                                    error={Boolean(errors.phone)}
                                                    helperText={errors.phone?.message}
                                                />
                                            )}
                                        />
                                        <Controller
                                            name="notes"
                                            control={control}
                                            render={({ field }) => (
                                                <TextField
                                                    {...field}
                                                    label="Comments / Notes"
                                                    type='text'
                                                    variant="filled"
                                                    multiline
                                                    rows={3}
                                                    className="custom-textfield"
                                                />
                                            )}
                                        />
                                        <div className='flexContainer fs-16'>
                                            <Controller
                                                name="send_brochure"
                                                control={control}
                                                render={({ field }) => (
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                {...field}
                                                                checked={field.value}
                                                                className="custom-checkbox"
                                                            />
                                                        }
                                                        label="Send Brochure"
                                                        style={{ color: generalTextColor }}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className='w-300 pt-4'>
                                            <Button 
                                                type="submit" 
                                                variant='contained' 
                                                className='main-button'
                                                style={{ backgroundColor: 'var(--button-color)' }}
                                                endIcon={<ChevronRightIcon />}
                                            >
                                                Let's start talking
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        {!isSmallScreen &&
                            <Box className="contactInfoFlex contactInfoTent mb-40">
                                <Footer />
                            </Box>
                        }
                    </Grid>
                    <Grid item xs={12} md={4} className='rightSideBarBottom' style={{ backgroundColor: 'var(--theme-color)' }}>
                        <div className='body' style={{ padding: '0' }}>
                            <h3 style={{ 
                                padding: '20px 0 20px 20px', 
                                margin: 0, 
                                textAlign: 'left',
                                color: headingColors.h3,
                                fontFamily: 'var(--h3-font-family)'
                            }}>
                                Your Selection
                            </h3>
                            {items.length > 0 ? (
                                <>
                                    {items.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <div style={{ padding: '0 20px' }}>
                                                <div className="flexSpaceBetween">
                                                    <h3 style={{ color: generalTextColor }}>{item.name}</h3>
                                                    <img src={deleteTent} alt="delete" className="deleteTent" onClick={() => handleDelete(item.id)} />
                                                </div>
                                                <div className="fs-16 fw-7" style={{ color: generalTextColor }}>{item.size}</div>
                                                {renderExtras([...item.inventories, ...item.extras])}
                                                <div className="selection-price">
                                                    {new Intl.NumberFormat('en-GB').format(Math.round(item.totalPrice))}
                                                </div>
                                                <Typography className="font_opacity" style={{ fontSize: '14px', color: generalTextColor }}>Includes VAT & Insurance</Typography>
                                            </div>
                                            <Divider 
                                                sx={{ 
                                                    my: 2,  
                                                    borderStyle: 'dashed', 
                                                    borderColor: 'rgba(255, 255, 255, 0.3)'
                                                }} 
                                            />
                                        </React.Fragment>
                                    ))}
                                </>
                            ) : (
                                <Typography className='fs-16' style={{ padding: '0 20px', color: generalTextColor }}>
                                    You currently have no items added…
                                </Typography>
                            )}
                        </div>
                    </Grid>
                </Grid>
                {isSmallScreen &&
                    <Box className="contactInfoFlex contactInfoTent mb-40">
                        <Footer />
                    </Box>
                }
            </div>
        </>
    );
}

export default QuoteDetails;
