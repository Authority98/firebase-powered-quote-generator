import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase-admin';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Snackbar, Fade, Typography, Checkbox, FormControlLabel } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { DndProvider, useDrag, useDrop, DragPreviewImage } from 'react-dnd';
import { HTML5Backend, getEmptyImage } from 'react-dnd-html5-backend';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import update from 'immutability-helper';

const ItemType = 'EXTRA';

const DraggableTableRow = React.memo(({ extra, index, moveRow, handleOpen, handleDelete }) => {
  const ref = useRef(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemType,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemType,
    item: () => ({ id: extra.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <TableRow 
      ref={ref} 
      style={{ 
        opacity,
        cursor: isDragging ? 'grabbing' : 'grab' // Change cursor style
      }} 
      data-handler-id={handlerId}
    >
      <TableCell>
        <div style={{ cursor: 'grab' }}> {/* Change cursor style */}
          <DragIndicatorIcon />
        </div>
      </TableCell>
      <TableCell>{extra.name}</TableCell>
      <TableCell>{extra.display}</TableCell>
      <TableCell>
        {extra.display === 'Toggle Switch' ? (
          <>
            Left: {extra.priceLeft || extra.price}<br/>
            Right: {extra.priceRight || extra.price}
          </>
        ) : (
          extra.price
        )}
      </TableCell>
      <TableCell>
        {extra.display === 'Checkbox' ? extra.checkboxDescription : extra.description}
      </TableCell>
      <TableCell>
        <Button onClick={() => handleOpen(extra)}>Edit</Button>
        <Button onClick={() => handleDelete(extra.id)}>Delete</Button>
      </TableCell>
    </TableRow>
  );
});

const ExtrasAdmin = () => {
  const [extras, setExtras] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentExtra, setCurrentExtra] = useState({
    name: '',
    display: '',
    price: '',
    leftText: '',
    rightText: '',
    qty: '',
    descriptionStyle: 'normal',
    qtyText: '',
    order: 0,
    description: '',
    checkboxDescription: '',
    important: false,
    enabledByDefault: false,
    toggleSwitchType: '',
    defaultQty: '', // Add this new field
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'extras'));
      const fetchedExtras = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        order: doc.data().order !== undefined ? doc.data().order : Infinity,
        newOrder: doc.data().order !== undefined ? doc.data().order : Infinity
      }));
      fetchedExtras.sort((a, b) => a.order - b.order);
      fetchedExtras.forEach((extra, index) => {
        extra.order = index;
        extra.newOrder = index;
      });
      setExtras(fetchedExtras);
    } catch (error) {
      console.error("Error fetching extras:", error);
    }
  };

  const handleOpen = (extra = { name: '', display: '', price: '', leftText: '', rightText: '', qty: '', descriptionStyle: 'normal', qtyText: '', order: extras.length, description: '' }) => {
    setCurrentExtra(extra);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentExtra({ name: '', display: '', price: '', leftText: '', rightText: '', qty: '', descriptionStyle: 'normal', qtyText: '', order: extras.length, description: '' });
  };

  const handleSave = async () => {
    try {
      const extraData = {
        name: currentExtra.name,
        display: currentExtra.display,
        price: currentExtra.display === 'Toggle Switch' ? currentExtra.priceLeft : currentExtra.price,
        priceLeft: currentExtra.display === 'Toggle Switch' ? currentExtra.priceLeft : null,
        priceRight: currentExtra.display === 'Toggle Switch' ? currentExtra.priceRight : null,
        leftText: currentExtra.leftText || '',
        rightText: currentExtra.rightText || '',
        qty: currentExtra.qty || '',
        qtyText: currentExtra.qtyText || '',
        order: currentExtra.order,
        description: currentExtra.description || '',
        checkboxDescription: currentExtra.checkboxDescription || '',
        important: currentExtra.important || false,
        enabledByDefault: currentExtra.enabledByDefault || false,
        toggleSwitchType: currentExtra.toggleSwitchType || '',
        descriptionStyle: currentExtra.descriptionStyle || 'normal',
        defaultQty: currentExtra.defaultQty || '',
      };

      if (currentExtra.id) {
        await updateDoc(doc(db, 'extras', currentExtra.id), extraData);
      } else {
        await addDoc(collection(db, 'extras'), extraData);
      }
      handleClose();
      fetchExtras();
      setSnackbarMessage(currentExtra.id ? 'Extra updated successfully!' : 'New extra added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error saving extra:", error);
      setSnackbarMessage('Error saving extra. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'extras', id));
      fetchExtras();
      setSnackbarMessage('Extra deleted successfully!');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting extra:", error);
      setSnackbarMessage('Error deleting extra. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    setExtras((prevExtras) => {
      const updatedExtras = update(prevExtras, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevExtras[dragIndex]],
        ],
      });
      
      return updatedExtras.map((extra, index) => ({
        ...extra,
        newOrder: index,
      }));
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveExtrasOrder = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      let updateCount = 0;
      
      const changedItems = extras.filter(extra => extra.newOrder !== extra.order);
      
      if (changedItems.length > 0) {
        changedItems.sort((a, b) => a.newOrder - b.newOrder);
        
        changedItems.forEach((extra) => {
          const extraRef = doc(db, 'extras', extra.id);
          batch.update(extraRef, { order: extra.newOrder });
          updateCount++;
        });
        
        await batch.commit();
        console.log(`${updateCount} extras order updated successfully`);
        
        setExtras(prevExtras => 
          prevExtras.map(extra => ({
            ...extra,
            order: extra.newOrder,
          })).sort((a, b) => a.order - b.order)
        );
        
        setHasUnsavedChanges(false);
        setSnackbarMessage(`Extras order saved successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('No changes to save');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating extras order:", error);
      setSnackbarMessage('Error saving extras order. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [extras]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button variant="contained" onClick={() => handleOpen()}>Add New Extra</Button>
        <div style={{ width: '20px' }}></div>
        <Fade in={hasUnsavedChanges && !fadeOut} timeout={500}>
          <Button 
            variant="contained" 
            onClick={saveExtrasOrder}
            className="MuiButton-contained"
            sx={{ 
              bgcolor: '#4caf50 !important',  // Green color with !important
              '&:hover': {
                bgcolor: '#45a049 !important',  // Darker green on hover with !important
              },
              transition: 'opacity 0.5s',
              opacity: fadeOut ? 0 : 1,
              marginRight: '1rem',
              textTransform: 'none',
              height: '100%',  // Match the height of the parent container
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Save Order
          </Button>
        </Fade>
      </div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reorder</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Display</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {extras.map((extra, index) => (
              <DraggableTableRow
                key={extra.id}
                index={index}
                extra={extra}
                moveRow={moveRow}
                handleOpen={handleOpen}
                handleDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentExtra.id ? 'Edit Extra' : 'Add New Extra'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={currentExtra.name}
            onChange={(e) => setCurrentExtra({ ...currentExtra, name: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Display</InputLabel>
            <Select
              value={currentExtra.display}
              onChange={(e) => setCurrentExtra({ ...currentExtra, display: e.target.value })}
            >
              <MenuItem value="">Select a display type</MenuItem>
              <MenuItem value="Checkbox">Checkbox</MenuItem>
              <MenuItem value="QTY">QTY</MenuItem>
              <MenuItem value="Toggle Switch">Toggle Switch</MenuItem>
            </Select>
          </FormControl>
          {currentExtra.display === 'Toggle Switch' && (
            <>
              <TextField
                margin="dense"
                label="Top Description"
                fullWidth
                value={currentExtra.description}
                onChange={(e) => setCurrentExtra({ ...currentExtra, description: e.target.value })}
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Top Description Style</InputLabel>
                <Select
                  value={currentExtra.descriptionStyle}
                  onChange={(e) => setCurrentExtra({ ...currentExtra, descriptionStyle: e.target.value })}
                >
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="italic">Italic</MenuItem>
                </Select>
              </FormControl>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <TextField
                  margin="dense"
                  label="Left Text"
                  fullWidth
                  value={currentExtra.leftText}
                  onChange={(e) => setCurrentExtra({ ...currentExtra, leftText: e.target.value })}
                  style={{ marginRight: '10px' }}
                />
                <TextField
                  margin="dense"
                  label="Right Text"
                  fullWidth
                  value={currentExtra.rightText}
                  onChange={(e) => setCurrentExtra({ ...currentExtra, rightText: e.target.value })}
                />
              </div>
              <TextField
                margin="dense"
                label="QTY Text"
                fullWidth
                value={currentExtra.qtyText}
                onChange={(e) => setCurrentExtra({ ...currentExtra, qtyText: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentExtra.important}
                    onChange={(e) => setCurrentExtra({ ...currentExtra, important: e.target.checked })}
                  />
                }
                label="Important"
              />
              <FormControl fullWidth margin="dense">
                <InputLabel>Toggle Switch Type</InputLabel>
                <Select
                  value={currentExtra.toggleSwitchType}
                  onChange={(e) => setCurrentExtra({ ...currentExtra, toggleSwitchType: e.target.value })}
                >
                  <MenuItem value="">Select a type</MenuItem>
                  <MenuItem value="Tables">Tables</MenuItem>
                  <MenuItem value="Chairs/Benches">Chairs/Benches</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </>
          )}
          {currentExtra.display === 'Checkbox' && (
            <>
              <TextField
                margin="dense"
                label="Checkbox Description (Optional)"
                fullWidth
                value={currentExtra.checkboxDescription || ''}
                onChange={(e) => setCurrentExtra({ ...currentExtra, checkboxDescription: e.target.value })}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={currentExtra.enabledByDefault}
                    onChange={(e) => setCurrentExtra({ ...currentExtra, enabledByDefault: e.target.checked })}
                  />
                }
                label="Enabled by Default"
              />
            </>
          )}
          {currentExtra.display === 'QTY' && (
            <TextField
              margin="dense"
              label="Default Quantity"
              fullWidth
              value={currentExtra.defaultQty}
              onChange={(e) => setCurrentExtra({ ...currentExtra, defaultQty: e.target.value })}
              type="number"
            />
          )}
          {currentExtra.display !== '' && (
            <>
              {currentExtra.display === 'Toggle Switch' ? (
                <>
                  <TextField
                    margin="dense"
                    label="Price per QTY (Left Text)"
                    fullWidth
                    value={currentExtra.priceLeft || currentExtra.price || ''}
                    onChange={(e) => {
                      const re = /^[0-9\b]+$/;
                      if (e.target.value === '' || re.test(e.target.value)) {
                        setCurrentExtra({ 
                          ...currentExtra, 
                          priceLeft: e.target.value,
                          price: e.target.value // Keep price field for backward compatibility
                        });
                      }
                    }}
                    type="number"
                  />
                  <TextField
                    margin="dense"
                    label="Price per QTY (Right Text)"
                    fullWidth
                    value={currentExtra.priceRight || ''}
                    onChange={(e) => {
                      const re = /^[0-9\b]+$/;
                      if (e.target.value === '' || re.test(e.target.value)) {
                        setCurrentExtra({ ...currentExtra, priceRight: e.target.value });
                      }
                    }}
                    type="number"
                  />
                </>
              ) : (
                <TextField
                  margin="dense"
                  label="Price"
                  fullWidth
                  value={currentExtra.price}
                  onChange={(e) => {
                    const re = /^[0-9\b]+$/;
                    if (e.target.value === '' || re.test(e.target.value)) {
                      setCurrentExtra({ ...currentExtra, price: e.target.value });
                    }
                  }}
                  type="number"
                />
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          elevation={6} 
          variant="filled"
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </DndProvider>
  );
};

export default ExtrasAdmin;
