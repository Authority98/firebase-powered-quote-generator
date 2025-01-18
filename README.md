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

## Tech Stack

- React.js
- Material-UI (MUI)
- Firebase (Firestore)
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

4. Start the development server:
   ```bash
   npm start
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file with your Firebase configuration:

```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Project Structure

- `/src`
  - `/components`: Reusable UI components
  - `/pages`: Main application pages
  - `/backend`: Firebase configuration and admin functions
  - `/assets`: Images and static resources

## License

This project is proprietary software. All rights reserved.
