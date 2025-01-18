# Events Under Canvas - Quote Generator

A sophisticated quote generation system built with React, Material-UI, and Firebase, designed for event planning and tent rental services.

## Features

- **Dynamic Quote Generation**: Interactive form-based quote generation for events
- **Smart Tent Selection**: Recommends tents based on guest count and seating requirements
- **Flexible Extras Management**: 
  - Toggle switches with dual pricing (Left/Right positions)
  - Quantity-based items
  - Checkbox options
- **Admin Dashboard**:
  - Product management
  - Extras configuration
  - Design customization
  - Quote management
- **Email Notifications**:
  - Automated email notifications using Brevo API and SMTP
  - Custom email templates for both admin and users
  - Professional HTML email formatting
  - Reliable email delivery through SMTP relay

## Tech Stack

- React.js
- Material-UI (MUI)
- Firebase (Firestore)
- Brevo (Email Service with SMTP)
- Custom CSS

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase:
   - Create a Firebase project
   - Enable Firestore
   - Add your Firebase configuration to the project

4. Set up Brevo (formerly Sendinblue):
   - Create a Brevo account
   - Generate an API key
   - Configure SMTP credentials
   - Add both API key and SMTP settings to your environment variables

5. Start the development server:
   ```bash
   npm start
   ```

6. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file with your configuration:

```
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# SMTP settings for Brevo
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your_smtp_username
MAIL_PASSWORD=your_smtp_password
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=your_from_email_address

# Brevo API Configuration
REACT_APP_BREVO_API_KEY=your_brevo_api_key_here
```

## Project Structure

- `/src`
  - `/components`: Reusable UI components
  - `/pages`: Main application pages
  - `/backend`: Firebase configuration and admin functions
  - `/assets`: Images and static resources

## License

This project is proprietary software. All rights reserved.
