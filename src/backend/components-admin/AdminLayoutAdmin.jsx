import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton, Badge } from '@mui/material';
import { Inventory, Category, AddCircle, Logout, Palette, Email } from '@mui/icons-material';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase-admin'; // Import auth
import '../styles/admin-styles.css';
import { useTheme } from '@mui/material/styles'; // Add this import
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const drawerWidth = 240;

const AdminLayoutAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme(); // Add this line
  const [newLeadsCount, setNewLeadsCount] = useState(0);

  useEffect(() => {
    console.log('AdminLayoutAdmin rendered, current path:', location.pathname);
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, [location]);

  useEffect(() => {
    const q = query(collection(db, 'leads'), where('isNew', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNewLeadsCount(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { text: 'Products', icon: <Inventory />, path: '/admin/products' },
    { text: 'Types', icon: <Category />, path: '/admin/types' },
    { text: 'Extras', icon: <AddCircle />, path: '/admin/extras' },
    { text: 'Design', icon: <Palette />, path: '/admin/design' },
    { 
      text: 'Leads', 
      icon: 
        <Badge badgeContent={newLeadsCount} color="error">
          <Email />
        </Badge>, 
      path: '/admin/leads' 
    },
  ];

  return (
    <Box sx={{ 
      display: 'flex', 
      backgroundColor: '#F5F5F5', 
      minHeight: '100vh',
      fontFamily: theme.typography.fontFamily, // Add this line
    }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} className="admin-appbar">
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
        anchor="left"
        className="admin-sidebar"
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => console.log('Clicked:', item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: 3, 
        width: `calc(100% - ${drawerWidth}px)`,
        backgroundColor: '#F5F5F5'
      }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayoutAdmin;