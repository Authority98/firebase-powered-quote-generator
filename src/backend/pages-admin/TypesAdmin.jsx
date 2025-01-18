import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase-admin';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Fade, Switch, FormControlLabel, Typography } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import update from 'immutability-helper';
import { SketchPicker } from 'react-color';

const ItemType = 'TYPE';

const DraggableTableRow = ({ type, index, moveRow, handleOpen, handleDelete }) => {
  const ref = React.useRef(null);

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

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => ({ id: type.id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <TableRow ref={ref} style={{ opacity, cursor: isDragging ? 'grabbing' : 'grab' }} data-handler-id={handlerId}>
      <TableCell>
        <div style={{ cursor: 'grab' }}>
          <DragIndicatorIcon />
        </div>
      </TableCell>
      <TableCell>{type.name}</TableCell>
      <TableCell>
        {type.featured && (
          <div style={{
            display: 'inline-block',
            backgroundColor: type.featuredColor || 'red',
            color: 'white',
            borderRadius: '5px',
            padding: '5px',
            fontSize: '0.8rem',
            marginRight: '10px',
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)'
          }}>
            {type.featuredText}
          </div>
        )}
      </TableCell>
      <TableCell>
        <Button onClick={() => handleOpen(type)}>Edit</Button>
        <Button onClick={() => handleDelete(type.id)}>Delete</Button>
      </TableCell>
    </TableRow>
  );
};

const TypesAdmin = () => {
  const [types, setTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentType, setCurrentType] = useState({ 
    name: '', 
    featured: false, 
    featuredText: '', 
    featuredColor: '#FF0000',
    featuredTextColor: '#FFFFFF' // Add this line
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'types'));
      const fetchedTypes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        order: doc.data().order !== undefined ? doc.data().order : Infinity,
        newOrder: doc.data().order !== undefined ? doc.data().order : Infinity
      }));
      fetchedTypes.sort((a, b) => a.order - b.order);
      fetchedTypes.forEach((type, index) => {
        type.order = index;
        type.newOrder = index;
      });
      setTypes(fetchedTypes);
    } catch (error) {
      console.error("Error fetching types:", error);
    }
  };

  const handleOpen = (type = { name: '', order: types.length, featured: false, featuredText: '', featuredColor: '#FF0000' }) => {
    setCurrentType(type);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentType({ name: '', order: types.length, featured: false, featuredText: '', featuredColor: '#FF0000' });
  };

  const handleSave = async () => {
    try {
      const typeData = {
        name: currentType.name,
        order: currentType.order,
        featured: currentType.featured,
        featuredText: currentType.featuredText,
        featuredColor: currentType.featuredColor,
        featuredTextColor: currentType.featuredTextColor // Add this line
      };

      if (currentType.id) {
        await updateDoc(doc(db, 'types', currentType.id), typeData);
      } else {
        await addDoc(collection(db, 'types'), typeData);
      }
      handleClose();
      fetchTypes();
      setSnackbarMessage(currentType.id ? 'Type updated successfully!' : 'New type added successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error saving type:", error);
      setSnackbarMessage('Error saving type. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'types', id));
      fetchTypes();
      setSnackbarMessage('Type deleted successfully!');
      setSnackbarSeverity('info');
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error deleting type:", error);
      setSnackbarMessage('Error deleting type. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const moveRow = useCallback((dragIndex, hoverIndex) => {
    setTypes((prevTypes) => {
      const updatedTypes = update(prevTypes, {
        $splice: [
          [dragIndex, 1],
          [hoverIndex, 0, prevTypes[dragIndex]],
        ],
      });
      
      return updatedTypes.map((type, index) => ({
        ...type,
        newOrder: index,
      }));
    });
    setHasUnsavedChanges(true);
  }, []);

  const saveTypesOrder = useCallback(async () => {
    try {
      const batch = writeBatch(db);
      let updateCount = 0;
      
      const changedItems = types.filter(type => type.newOrder !== type.order);
      
      if (changedItems.length > 0) {
        changedItems.sort((a, b) => a.newOrder - b.newOrder);
        
        changedItems.forEach((type) => {
          const typeRef = doc(db, 'types', type.id);
          batch.update(typeRef, { order: type.newOrder });
          updateCount++;
        });
        
        await batch.commit();
        console.log(`${updateCount} types order updated successfully`);
        
        setTypes(prevTypes => 
          prevTypes.map(type => ({
            ...type,
            order: type.newOrder,
          })).sort((a, b) => a.order - b.order)
        );
        
        setHasUnsavedChanges(false);
        setSnackbarMessage(`Types order saved successfully!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage('No changes to save');
        setSnackbarSeverity('info');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error("Error updating types order:", error);
      setSnackbarMessage('Error saving types order. Please try again.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [types]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <Button variant="contained" onClick={() => handleOpen()}>Add New Type</Button>
        <div style={{ width: '20px' }}></div>
        <Fade in={hasUnsavedChanges} timeout={500}>
          <Button 
            variant="contained" 
            onClick={saveTypesOrder}
            sx={{ 
              bgcolor: '#4caf50 !important',
              '&:hover': {
                bgcolor: '#45a049 !important',
              },
              transition: 'opacity 0.5s',
              marginRight: '1rem',
              textTransform: 'none',
              height: '100%',
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
              <TableCell>Featured</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {types.map((type, index) => (
              <DraggableTableRow
                key={type.id}
                index={index}
                type={type}
                moveRow={moveRow}
                handleOpen={handleOpen}
                handleDelete={handleDelete}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentType.id ? 'Edit Type' : 'Add New Type'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={currentType.name}
            onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })}
          />
          <FormControlLabel
            control={
              <Switch
                checked={currentType.featured}
                onChange={(e) => setCurrentType({ ...currentType, featured: e.target.checked })}
              />
            }
            label="Featured"
          />
          {currentType.featured && (
            <>
              <TextField
                margin="dense"
                label="Featured Text"
                fullWidth
                value={currentType.featuredText}
                onChange={(e) => setCurrentType({ ...currentType, featuredText: e.target.value })}
              />
              <Typography variant="subtitle1" style={{ marginTop: '1rem' }}>Featured Background Color</Typography>
              <SketchPicker
                color={currentType.featuredColor}
                onChangeComplete={(color) => setCurrentType({ ...currentType, featuredColor: color.hex })}
              />
              <Typography variant="subtitle1" style={{ marginTop: '1rem' }}>Featured Text Color</Typography>
              <SketchPicker
                color={currentType.featuredTextColor}
                onChangeComplete={(color) => setCurrentType({ ...currentType, featuredTextColor: color.hex })}
              />
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

export default TypesAdmin;