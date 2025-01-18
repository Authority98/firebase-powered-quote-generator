import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-admin'; // Import auth
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import '../styles/admin-styles.css';

const LoginAdmin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/products');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div className="admin-background">
      <Typography variant="h4" className="admin-title">
        Admin
      </Typography>
      <Container maxWidth="xs" className="login-container">
        <Typography variant="h5" className="login-title">
          Login to Your Account
        </Typography>
        <Typography variant="body2" className="login-subtitle">
          Enter your email & password to login
        </Typography>
        <Box component="form" onSubmit={handleLogin} className="login-form">
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            className="login-button"
          >
            Login
          </Button>
        </Box>
      </Container>
    </div>
  );
};

export default LoginAdmin;