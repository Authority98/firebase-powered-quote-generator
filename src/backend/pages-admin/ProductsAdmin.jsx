import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';
import { db, storage } from '../firebase-admin';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  TextField, Typography, MenuItem, Select, InputLabel, FormControl, 
  Grid, Box, IconButton, DialogContentText, Snackbar, Alert 
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RefreshIcon from '@mui/icons-material/Refresh';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const ProductsAdmin = () => {
  const theme = useTheme();
  const secondaryColor = theme.palette.secondary.main;

  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({ 
    name: '', 
    size: '',
    price: '', 
    featuredImage: '', 
    additionalImages: [],
    type: '',
    included: [{ item: '', price: '' }],
    guestsCapacity: '',
    seatingCapacity: '',
    priority: 0 // Add this line
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imageError, setImageError] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchTypes();
    fetchUploadedImages();
  }, []);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, 'products'));
    const productsData = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        included: Array.isArray(data.included) ? data.included : [{ item: '', price: '' }] // Updated to include price
      };
    });
    setProducts(productsData);
  };

  const fetchTypes = async () => {
    const querySnapshot = await getDocs(collection(db, 'types'));
    setTypes(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const fetchUploadedImages = async () => {
    try {
      const imagesRef = ref(storage, 'product-images');
      const imagesList = await listAll(imagesRef);
      
      if (imagesList.items.length === 0) {
        setUploadedImages([]);
        setImageError("No images uploaded yet.");
        return;
      }
      
      const imageUrls = await Promise.all(imagesList.items.map(async (item) => {
        try {
          return await getDownloadURL(item);
        } catch (error) {
          console.error('Error getting download URL for item:', item.fullPath, error);
          return null;
        }
      }));
      
      const validImageUrls = imageUrls.filter(url => url !== null);
      setUploadedImages(validImageUrls);
      setImageError(null);
    } catch (error) {
      console.error("Error fetching uploaded images:", error);
      setImageError(`Failed to load uploaded images: ${error.message}`);
    }
  };

  const handleOpen = (product = { 
    name: '', 
    size: '', 
    price: '', 
    featuredImage: '', 
    additionalImages: [], 
    type: '', 
    included: [{ item: '', price: '' }], 
    guestsCapacity: '', 
    seatingCapacity: '',
    priority: 0 // Add this line
  }) => {
    console.log("Opening dialog with product:", product);
    const updatedProduct = {
      ...product,
      included: Array.isArray(product.included) ? product.included : [{ item: '', price: '' }],
      priority: product.priority || 0 // Add this line
    };
    setCurrentProduct(updatedProduct);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentProduct({ name: '', size: '', price: '', featuredImage: '', additionalImages: [], type: '', included: [{ item: '', price: '' }], guestsCapacity: '', seatingCapacity: '', priority: 0 });
    setImageFile(null);
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleImageSelect = (url) => {
    if (!currentProduct.featuredImage) {
      setCurrentProduct({ ...currentProduct, featuredImage: url });
    } else {
      setCurrentProduct({ 
        ...currentProduct, 
        additionalImages: [...currentProduct.additionalImages, url]
      });
    }
  };

  const handleRemoveAdditionalImage = (index) => {
    const newAdditionalImages = [...currentProduct.additionalImages];
    newAdditionalImages.splice(index, 1);
    setCurrentProduct({ ...currentProduct, additionalImages: newAdditionalImages });
  };

  const handleSave = async () => {
    try {
      let imageUrl = currentProduct.featuredImage;
      let additionalImageUrls = [...currentProduct.additionalImages];

      if (imageFile) {
        const storageRef = ref(storage, `product-images/${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      // Remove the featured image from additionalImages if it exists there
      additionalImageUrls = additionalImageUrls.filter(url => url !== imageUrl);

      const productData = {
        name: currentProduct.name,
        size: currentProduct.size || '',
        price: Number(currentProduct.price) || 0,
        type: currentProduct.type,
        featuredImage: imageUrl,
        additionalImages: additionalImageUrls,
        included: Array.isArray(currentProduct.included) 
          ? currentProduct.included.filter(item => item.item.trim() !== '')
          : [],
        guestsCapacity: Number(currentProduct.guestsCapacity) || 0,
        seatingCapacity: Number(currentProduct.seatingCapacity) || 0,
        priority: Number(currentProduct.priority) || 0 // Add this line
      };

      console.log("Current product before save:", currentProduct);
      console.log("Product data to be saved:", productData);

      if (currentProduct.id) {
        console.log("Updating existing product with ID:", currentProduct.id);
        await updateDoc(doc(db, 'products', currentProduct.id), productData);
        setNotification({ open: true, message: 'Product updated successfully', severity: 'success' });
      } else {
        console.log("Adding new product");
        await addDoc(collection(db, 'products'), productData);
        setNotification({ open: true, message: 'Product added successfully', severity: 'success' });
      }
      
      console.log("Save operation completed");
      handleClose();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setNotification({ open: true, message: 'Error saving product', severity: 'error' });
    }
  };

  const handleDeleteConfirmOpen = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirmClose = () => {
    setDeleteConfirmOpen(false);
    setProductToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (productToDelete) {
      try {
        await deleteDoc(doc(db, 'products', productToDelete.id));
        fetchProducts();
        setNotification({ open: true, message: 'Product deleted successfully', severity: 'success' });
      } catch (error) {
        console.error("Error deleting product:", error);
        setNotification({ open: true, message: 'Error deleting product', severity: 'error' });
      }
    }
    handleDeleteConfirmClose();
  };

  const handleRefreshImages = () => {
    fetchUploadedImages();
  };

  const handleRemoveFeaturedImage = () => {
    setCurrentProduct({ ...currentProduct, featuredImage: '' });
  };

  const handleAddIncluded = () => {
    setCurrentProduct({
      ...currentProduct,
      included: [...currentProduct.included, { item: '', price: '' }]
    });
  };

  const handleRemoveIncluded = (index) => {
    const newIncluded = [...currentProduct.included];
    newIncluded.splice(index, 1);
    setCurrentProduct({
      ...currentProduct,
      included: newIncluded
    });
  };

  const handleIncludedChange = (index, field, value) => {
    const newIncluded = [...currentProduct.included];
    newIncluded[index][field] = value;
    setCurrentProduct({
      ...currentProduct,
      included: newIncluded
    });
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  return (
    <>
      <Button variant="contained" onClick={() => handleOpen()} style={{ backgroundColor: secondaryColor }}>
        Add New Product
      </Button>
      {products && products.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Featured Image</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.size}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>{types && types.find(t => t.id === product.type)?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    {product.featuredImage && (
                      <img src={product.featuredImage} alt={product.name} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => handleOpen(product)}>Edit</Button>
                    <Button onClick={() => handleDeleteConfirmOpen(product)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography>No products available.</Typography>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{currentProduct.id ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={currentProduct.name}
            onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Size"
            fullWidth
            value={currentProduct.size}
            onChange={(e) => setCurrentProduct({ ...currentProduct, size: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Base Price"  // Changed from "Price" to "Base Price"
            fullWidth
            value={currentProduct.price}
            onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Guests Capacity"
            fullWidth
            type="number"
            value={currentProduct.guestsCapacity}
            onChange={(e) => setCurrentProduct({ ...currentProduct, guestsCapacity: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Seating Capacity"
            fullWidth
            type="number"
            value={currentProduct.seatingCapacity}
            onChange={(e) => setCurrentProduct({ ...currentProduct, seatingCapacity: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Priority (lower number = higher priority)"
            fullWidth
            type="number"
            value={currentProduct.priority}
            onChange={(e) => setCurrentProduct({ ...currentProduct, priority: e.target.value })}
          />
          
          {/* Included field area */}
          <Box sx={{ pt: 2 }}>
            {currentProduct.included.map((item, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  value={item.item}
                  onChange={(e) => handleIncludedChange(index, 'item', e.target.value)}
                  placeholder={`Included item ${index + 1}`}
                  sx={{ mr: 1 }}
                />
                <TextField
                  value={item.price}
                  onChange={(e) => handleIncludedChange(index, 'price', e.target.value)}
                  placeholder="Price"
                  type="number"
                  sx={{ width: '120px', mr: 1 }} // Increased from 100px to 120px
                />
                <IconButton onClick={() => handleRemoveIncluded(index)} color="error">
                  <RemoveIcon />
                </IconButton>
                {index === currentProduct.included.length - 1 && (
                  <IconButton onClick={handleAddIncluded} color="primary">
                    <AddIcon />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>

          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={currentProduct.type}
              onChange={(e) => setCurrentProduct({ ...currentProduct, type: e.target.value })}
            >
              {types.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="raised-button-file"
            type="file"
            onChange={handleImageChange}
          />
          <label htmlFor="raised-button-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              style={{ marginTop: '1rem', marginBottom: '1rem' }}
              fullWidth
            >
              Upload Images
            </Button>
          </label>
          {imageFile && (
            <Typography variant="body2" style={{ marginBottom: '1rem' }}>
              Selected file: {imageFile.name}
            </Typography>
          )}
          <Box>
            <Typography variant="h6" sx={{ lineHeight: '0px', paddingTop: '20px' }}>Featured Image:</Typography>
            {currentProduct.featuredImage ? (
              <Box position="relative" display="inline-block" width="100%">
                <img 
                  src={currentProduct.featuredImage} 
                  alt="Featured" 
                  style={{ 
                    width: '100%', 
                    maxHeight: '200px', 
                    objectFit: 'cover',
                    border: '2px solid #007bff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }} 
                />
                <Typography 
                  variant="caption" 
                  sx={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0, 123, 255, 0.8)',
                    color: 'white',
                    padding: '2px 5px',
                    borderRadius: '3px'
                  }}
                >
                  Featured
                </Typography>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    },
                  }}
                  onClick={handleRemoveFeaturedImage}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">No featured image selected</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: '0px', paddingTop: '50px' }}>Additional Images:</Typography>
            {currentProduct.additionalImages.length > 0 ? (
              <ImageList sx={{ width: '100%', height: 'auto', maxHeight: '300px' }} cols={3} rowHeight={100}>
                {currentProduct.additionalImages.map((img, index) => (
                  <ImageListItem key={index}>
                    <img
                      src={img}
                      alt={`Additional ${index}`}
                      loading="lazy"
                      style={{ 
                        height: '100%', 
                        width: '100%', 
                        objectFit: 'cover',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(40, 167, 69, 0.8)',
                        color: 'white',
                        padding: '2px 5px',
                        borderRadius: '3px'
                      }}
                    >
                      Additional
                    </Typography>
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        },
                      }}
                      onClick={() => handleRemoveAdditionalImage(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ImageListItem>
                ))}
              </ImageList>
            ) : (
              <Typography variant="body2" color="textSecondary">No additional images selected</Typography>
            )}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: '0px', paddingTop: '50px' }}>Select from uploaded images:</Typography>
            <Grid container spacing={2}>
              {uploadedImages.map((url, index) => (
                <Grid item xs={4} key={index}>
                  <Box 
                    position="relative" 
                    sx={{ 
                      cursor: 'pointer',
                      border: currentProduct.featuredImage === url 
                        ? '2px solid #007bff' 
                        : currentProduct.additionalImages.includes(url)
                        ? '2px solid #28a745'
                        : '2px solid transparent',
                      '&:hover': {
                        border: '2px solid #6c757d'
                      },
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                    onClick={() => handleImageSelect(url)}
                  >
                    <img
                      src={url}
                      alt={`Uploaded ${index}`}
                      style={{ 
                        width: '100%', 
                        height: '100px',
                        objectFit: 'cover'
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Add this new Dialog for delete confirmation */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteConfirmClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteConfirmClose}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProductsAdmin;