import React, { useState, useEffect, useCallback } from 'react';
import close from "../assets/close-side.svg";
import { Checkbox, Button, TextField, Typography, Switch, Box, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import deleteTent from '../assets/delete-tent.svg';
import arrowRight from "../assets/arrow-right.svg";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../backend/firebase-admin';
import { debounce } from 'lodash';
import Header from './Header';

// Update the CloseIcon component at the top of your file
const CloseIcon = ({ color }) => (
  <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.5 7.5L7.5 22.5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.5 7.5L22.5 22.5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Create a custom styled Checkbox
const CustomCheckbox = styled(Checkbox)(({ theme }) => ({
  color: 'var(--general-text-color)',
  '&.Mui-checked': {
    color: 'var(--general-text-color)',
  },
}));

// Move calculateQty function inside the ExtraItem component
const ExtraItem = React.memo(({ 
  extra, 
  selectedExtras, 
  onExtraChange, 
  itemQuantities, 
  onQuantityChange, 
  generalTextColor,
  calculateQty,
  seatCount
}) => {
  const isChecked = selectedExtras[extra.id] || false;
  const quantity = itemQuantities[extra.id] || extra.defaultQty || extra.qty || 0;

  console.log(`ExtraItem render for ${extra.name}:`, { isChecked, quantity, itemQuantities, extra });

  const handleChange = (event) => {
    const newIsChecked = event.target.checked;
    console.log(`Changing ${extra.name} to ${newIsChecked}`);
    onExtraChange({ [extra.id]: newIsChecked }, extra.important && extra.display === 'Toggle Switch');
  };

  const handleManualQuantityChange = (event) => {
    const newValue = event.target.value === '' ? 0 : Math.max(0, parseInt(event.target.value, 10));
    console.log(`ExtraItem: Manually changing quantity for ${extra.name} from ${quantity} to ${newValue}`);
    onQuantityChange(extra.id, newValue);
  };

  React.useEffect(() => {
    if (extra.toggleSwitchType === 'Chairs/Benches') {
      const newQuantity = calculateQty(extra, isChecked, seatCount);
      console.log(`useEffect: Updating quantity for ${extra.name}:`, { isChecked, newQuantity, seatCount });
      onQuantityChange(extra.id, newQuantity);
    }
  }, [seatCount, isChecked, extra, calculateQty, onQuantityChange]);

  return (
    <div className='flexContainer' key={`${extra.id}-${isChecked}-${quantity}`}>
      {extra.display !== 'Toggle Switch' && (
        <div>
          <div className="cursor-context" style={{ color: generalTextColor }}>{extra.name}</div>
          {extra.display === 'Checkbox' && extra.checkboxDescription && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: generalTextColor,
              opacity: 0.7,
              marginTop: '2px' 
            }}>
              {extra.checkboxDescription}
            </div>
          )}
        </div>
      )}
      {extra.display === 'Checkbox' && (
        <Checkbox
          checked={isChecked}
          onChange={handleChange}
          style={{ 
            color: generalTextColor,
          }}
        />
      )}
      {extra.display === 'QTY' && (
        <TextField
          type="number"
          value={quantity}
          onChange={handleManualQuantityChange}
          className="qty-field"
          inputProps={{ 
            min: 0,
            style: { color: generalTextColor }
          }}
          style={{ width: "60px" }}
        />
      )}
      {extra.display === 'Toggle Switch' && (
        <div style={{ width: '100%' }}>
          {extra.description && (
            <div style={{ 
              marginBottom: '10px', 
              fontStyle: extra.descriptionStyle || 'normal',
              fontSize: '0.9rem',
              color: generalTextColor
            }}>
              {extra.description}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: generalTextColor }}>{extra.leftText}</div>
            <Switch
              checked={isChecked}
              onChange={handleChange}
              className="custom-switch"
            />
            <div style={{ color: generalTextColor }}>{extra.rightText}</div>
            <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
              <div style={{ marginRight: '10px', color: generalTextColor }}>{extra.qtyText}</div>
              <TextField
                type="number"
                value={quantity}
                onChange={handleManualQuantityChange}
                className={`qty-field ${extra.toggleSwitchType === 'Tables' ? 'tables-qty' : ''}`}
                inputProps={{ 
                  min: 0,
                  style: { 
                    color: generalTextColor,
                    padding: '8px 12px',
                    fontSize: '14px',
                  }
                }}
                style={{ 
                  width: "63px",
                  margin: '0 5px'
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const TentSelectionExtras = ({ 
  shortlistedItems, 
  onDelete, 
  isSmallScreen,
  handleDrawerToggle,
  types,
  onCheckboxChange,
  selectedTypes,
  additionalItems,
  onAdditionalItemChange,
  onProceed,
  itemQuantities,
  setItemQuantities,
  handleQuantityChange,
  handleShapeChange,
  selectedExtras,
  onExtraChange,
  extrasInfo,
  generalTextColor,
  extras,
  seatCount,
  forceUpdate,
  isDataLoaded,
  calculateQty, // Add this prop
}) => {
  const navigate = useNavigate();

  const [localAdditionalItems, setLocalAdditionalItems] = useState(additionalItems);

  useEffect(() => {
    setLocalAdditionalItems(additionalItems);
  }, [additionalItems]);

  const homePage = () => {
    navigate("/")
  }

  const handleLocalAdditionalItemChange = (itemId, checked) => {
    const updatedItems = additionalItems.map(item =>
      item.id === itemId ? { ...item, checked: checked } : item
    );
    onAdditionalItemChange(updatedItems);
  };

  const debouncedHandleQuantityChange = React.useCallback(
    debounce((itemId, value) => {
      handleQuantityChange(itemId, value);
    }, 200),
    [handleQuantityChange]
  );

  const handleLocalQuantityChange = React.useCallback((itemId, value) => {
    console.log(`TentSelectionExtras: Changing quantity for item ${itemId} to ${value}`);
    handleQuantityChange(itemId, value);
  }, [handleQuantityChange]);

  const renderExtras = (extras) => {
    if (!extras || extras.length === 0) {
        return null;
    }

    return (
        <>
            <div className="fs-16 pt-4" style={{ color: generalTextColor }}>Extras:</div>
            <ul className="fs-16">
                {extras.map((extra) => {
                    if (extra.display === 'Toggle Switch') {
                        const isSelected = extra.selected !== undefined ? extra.selected : extra.defaultSelected;
                        return (
                            <li key={extra.id} style={{ color: generalTextColor }}>
                                {`${extra.qtyText}: ${extra.qty} ${isSelected ? extra.rightText : extra.leftText}`}
                            </li>
                        );
                    } else if (extra.display === 'Checkbox') {
                        return extra.selected ? (
                            <li key={extra.id} style={{ color: generalTextColor }}>
                                {extra.name}
                            </li>
                        ) : null;
                    } else if (extra.display === 'QTY' && extra.qty > 0) {
                        return (
                            <li key={extra.id} style={{ color: generalTextColor }}>
                                {`${extra.name}: ${extra.qty}`}
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        </>
    );
  };

  const handleExtraChange = useCallback((changedExtra, isImportant) => {
    console.log('handleExtraChange called with:', changedExtra, isImportant);
    onExtraChange(changedExtra, isImportant);

    const extraId = Object.keys(changedExtra)[0];
    const extra = extras.find(e => e.id === extraId);
    if (extra && extra.toggleSwitchType === 'Chairs/Benches') {
      const newQuantity = calculateQty(extra, changedExtra[extraId], seatCount);
      console.log(`Updating quantity for ${extra.name}:`, { isChecked: changedExtra[extraId], newQuantity, seatCount });
      handleQuantityChange(extraId, newQuantity);
    }
  }, [onExtraChange, extras, calculateQty, seatCount, handleQuantityChange]);

  return (
    <div className='drawerBackground' style={{ 
      padding: isSmallScreen ? '20px' : '0',
      overflowX: 'hidden',
      width: '100%',
      boxSizing: 'border-box',
      color: generalTextColor
    }}>
      <div className="sidebar-header-centered" style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        {isSmallScreen && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <Header />
            </div>
            <div 
              onClick={handleDrawerToggle} 
              className='cursor-pointer close-button'
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                padding: '5px', // Add some padding around the icon
              }}
            >
              <CloseIcon color={generalTextColor} />
            </div>
          </>
        )}
      </div>
      <div className='body' style={{ width: '100%' }}>
        <h1 className={`extrasHeader ${isSmallScreen ? 'paddingTopSmallScreen' : 'paddingTopLargeScreen'}`} style={{ color: generalTextColor }}>
          Quote Builder
        </h1>
        <h3 className='filterTents' style={{ color: generalTextColor, borderColor: generalTextColor }}>Your Selection</h3>
        <div className='filterTentList' style={{ 
          width: '100%', 
          overflowX: 'hidden',
          color: generalTextColor
        }}>
          {shortlistedItems.length > 0 ? (
            <>
              {shortlistedItems.map((item, index) => (
                <React.Fragment key={index}>
                  <div>
                    <div className="flexSpaceBetween">
                      <h3 style={{ color: generalTextColor }}>{item.name}</h3>
                      <img src={deleteTent} alt="delete" className="deleteTent" onClick={() => onDelete(item.id)} style={{ filter: `invert(${generalTextColor === '#FFFFFF' ? 1 : 0})` }} />
                    </div>
                    <div className="fs-16 fw-7" style={{ color: generalTextColor }}>{item.size}</div>
                    {renderExtras(item.extras)}
                    <div className="selection-price" style={{ color: generalTextColor }}>
                        {new Intl.NumberFormat('en-GB').format(Math.round(item.totalPrice))}
                    </div>
                    <Typography className="font_opacity" style={{ color: generalTextColor }}>Includes VAT & Insurance</Typography>
                  </div>
                  {index < shortlistedItems.length - 1 && (
                    <Divider 
                      sx={{ 
                        my: 2, 
                        borderStyle: 'dashed', 
                        borderColor: generalTextColor,
                        opacity: 0.3
                      }} 
                    />
                  )}
                </React.Fragment>
              ))}
              <Button
                variant="contained"
                className="white-button"
                onClick={onProceed}
                endIcon={<img src={arrowRight} alt="icon" />}
                style={{ color: '#4b3758' }} // Keep the original text color
              >
                Let's start talking
              </Button>
            </>
          ) : (
            <div style={{ color: generalTextColor }}>You currently have no items added</div>
          )}
        </div>
        <h3 className='filterTents' style={{ color: generalTextColor, borderColor: generalTextColor }}>
          Filter Tents
        </h3>
        <div className='filterTentList' style={{ color: generalTextColor }}>
          {types && types.length > 0 ? (
            types.map(type => (
              <div className='flexContainer' key={type.id}>
                <div className="cursor-context" style={{ display: 'flex', alignItems: 'center' }}>
                  Include {type.name}
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
                <CustomCheckbox
                  checked={selectedTypes.includes(type.id)}
                  onChange={() => onCheckboxChange(type.id)}
                  style={{ color: generalTextColor }}
                />
              </div>
            ))
          ) : (
            <div style={{ color: generalTextColor }}>Loading...</div>
          )}
        </div>
        <h3 className='filterTents' style={{ color: generalTextColor, borderColor: generalTextColor }}>
          Add & Remove Items
        </h3>
        <div className='filterTentList' style={{ color: generalTextColor }}>
          {extras && extras.length > 0 ? (
            extras.map((extra) => (
              <ExtraItem
                key={extra.id}
                extra={extra}
                selectedExtras={selectedExtras}
                onExtraChange={handleExtraChange}
                itemQuantities={itemQuantities}
                onQuantityChange={handleLocalQuantityChange}
                generalTextColor={generalTextColor}
                calculateQty={calculateQty}
                seatCount={seatCount}
              />
            ))
          ) : (
            <div style={{ color: generalTextColor }}>No items available</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TentSelectionExtras;
