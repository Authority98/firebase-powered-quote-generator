import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase-admin';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Chip, IconButton, Collapse, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp, Delete } from '@mui/icons-material';

const LeadRow = ({ lead, onLeadViewed, onLeadDelete }) => {
  const [open, setOpen] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleExpandClick = () => {
    setOpen(!open);
    if (lead.isNew) {
      onLeadViewed(lead.id);
    }
  };

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onLeadDelete(lead.id);
    setOpenDeleteDialog(false);
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
  };

  const renderExtras = (extras) => {
    return extras.map((extra, index) => {
      if (extra.display === 'Toggle Switch') {
        return (
          <div key={index}>
            {extra.qtyText}: {extra.qty} {extra.selected ? extra.rightText : extra.leftText}
          </div>
        );
      } else if (extra.display === 'Checkbox') {
        return extra.selected ? (
          <div key={index}>
            {extra.name}
          </div>
        ) : null;
      } else if (extra.display === 'QTY' && extra.qty > 0) {
        return (
          <div key={index}>
            {extra.name}: {extra.qty}
          </div>
        );
      }
      return null;
    });
  };

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={handleExpandClick}
          >
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {lead.contact_information.name}
        </TableCell>
        <TableCell align="right">{lead.contact_information.email}</TableCell>
        <TableCell align="right">{lead.contact_information.phone}</TableCell>
        <TableCell align="right">{lead.contact_information.event_type}</TableCell>
        <TableCell align="right">
          <Chip 
            label={lead.isNew ? "New" : "Viewed"} 
            color={lead.isNew ? "error" : "default"}
          />
        </TableCell>
        <TableCell align="right">
          <IconButton onClick={handleDeleteClick}>
            <Delete />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Lead Details
              </Typography>
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell align="right">Total Price</TableCell>
                    <TableCell align="right">Extras</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lead.products.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.size}</TableCell>
                      <TableCell align="right">£{Math.round(product.totalPrice)}</TableCell>
                      <TableCell align="right">
                        {renderExtras(product.extras)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Delete Lead"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this lead? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const LeadsAdmin = () => {
  const [leads, setLeads] = useState([]);
  const [adminEmail, setAdminEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [emailTitle, setEmailTitle] = useState(''); // New state for email title
  const [isSettingsChanged, setIsSettingsChanged] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'leads'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLeads(snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Lead data:', data);
        return { id: doc.id, ...data };
      }));
    });

    // Fetch admin email, from name, and email title
    const fetchAdminSettings = async () => {
      const settingsDoc = await getDoc(doc(db, 'settings', 'admin'));
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setAdminEmail(data.adminEmail || '');
        setFromName(data.fromName || '');
        setEmailTitle(data.emailTitle || 'Your Quote Request - Cheshire Tent Company'); // Set default if not exists
      }
    };

    fetchAdminSettings();

    return () => unsubscribe();
  }, []);

  const handleLeadViewed = async (leadId) => {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, { isNew: false });
  };

  const handleLeadDelete = async (leadId) => {
    try {
      await deleteDoc(doc(db, 'leads', leadId));
      console.log('Lead deleted successfully');
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleAdminEmailChange = (event) => {
    setAdminEmail(event.target.value);
    setIsSettingsChanged(true);
  };

  const handleFromNameChange = (event) => {
    setFromName(event.target.value);
    setIsSettingsChanged(true);
  };

  const handleEmailTitleChange = (event) => {
    setEmailTitle(event.target.value);
    setIsSettingsChanged(true);
  };

  const handleSaveSettings = async () => {
    try {
      await setDoc(doc(db, 'settings', 'admin'), { 
        adminEmail, 
        fromName,
        emailTitle 
      }, { merge: true });
      setIsSettingsChanged(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  return (
    <>
      <div style={{ marginBottom: '20px' }}>
        <TextField
          label="Admin Email"
          value={adminEmail}
          onChange={handleAdminEmailChange}
          fullWidth
          margin="normal"
          helperText="This is where you will receive your leads"
        />
        <TextField
          label="From Name"
          value={fromName}
          onChange={handleFromNameChange}
          fullWidth
          margin="normal"
          helperText="This is where you can set your email 'from name'"
        />
        <TextField
          label="Email Title"
          value={emailTitle}
          onChange={handleEmailTitleChange}
          fullWidth
          margin="normal"
          helperText="This is the title/subject of the email sent to users"
        />
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSaveSettings}
          disabled={!isSettingsChanged}
          style={{ marginTop: '10px' }}
        >
          Save Settings
        </Button>
      </div>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell align="right">Email</TableCell>
              <TableCell align="right">Phone</TableCell>
              <TableCell align="right">Event Type</TableCell>
              <TableCell align="right">Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <LeadRow 
                key={lead.id} 
                lead={lead} 
                onLeadViewed={handleLeadViewed}
                onLeadDelete={handleLeadDelete}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};

export default LeadsAdmin;
