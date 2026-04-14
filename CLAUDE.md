# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Heritage Slabs** granite system - a full-stack mobile application for managing a granite slab inventory and sales system. The project consists of two main components:

1. **Backend API** (`granite-system-backend/`) - Node.js/Express REST API with MongoDB
2. **Mobile App** (`granite-system-mobile/`) - React Native mobile app built with Expo

The system supports two user roles:
- **Admin**: Can manage products (granite slabs), view/manage users, and access administrative features
- **Customer**: Can browse the product catalog and view their profile

## Architecture

### Backend (`granite-system-backend/`)

The backend follows a standard MVC architecture:

- **Models** (`models/`) - Mongoose schemas
  - `User.js` - User model with roles (Admin/Customer), authentication fields
  - `Product.js` - Product model for granite slabs with pricing, stock, images, and user reference

- **Controllers** (`controllers/`) - Business logic
  - `authController.js` - User registration, login (JWT), CRUD operations, password hashing (bcrypt)
  - `productController.js` - Product CRUD operations, image handling

- **Routes** (`routes/`) - API endpoints
  - `authRoutes.js` - `/api/auth/*` endpoints (register, login, user management)
  - `productRoutes.js` - `/api/products/*` endpoints (CRUD operations)

- **Middleware** (`middleware/`)
  - `authMiddleware.js` - JWT token verification and route protection
  - `validationMiddleware.js` - Input validation using express-validator
  - `uploadMiddleware.js` - File upload handling with multer

- **Entry point**: `server.js` - Express app setup, MongoDB connection, CORS, static file serving for uploads

The API uses MongoDB Atlas for data persistence. Images are uploaded to the local `uploads/` directory and served as static files.

### Mobile App (`granite-system-mobile/`)

React Native app using Expo and React Navigation:

- **Navigation** (`App.js`) - Stack navigator with all screen routes
- **API Layer** (`src/api/axiosConfig.js`) - Axios instance with base URL configuration, request/response interceptors
- **Screens** (`src/screens/`) - All UI components:
  - `LoginScreen.js`, `RegisterScreen.js` - Authentication
  - `AdminDashboardScreen.js` - Admin home with navigation to management features
  - `ProductManagementScreen.js` - View/edit/delete products
  - `AddProductScreen.js` - Create new products with image picker
  - `EditProductScreen.js` - Update existing products
  - `UserManagementScreen.js` - Admin user management
  - `CustomerCatalogScreen.js` - Customer product browsing
  - `ProfileScreen.js` - User profile view/edit

The mobile app stores authentication tokens in AsyncStorage and configures the axios instance to communicate with the backend API.

## Common Development Commands

### Backend

```bash
cd granite-system-backend

# Install dependencies
npm install

# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

### Mobile App

```bash
cd granite-system-mobile

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run android
npm run ios
npm run web
```

## Important Implementation Notes

### Backend Configuration

- The backend requires a `.env` file in `granite-system-backend/` with:
  - `MONGO_URI` - MongoDB Atlas connection string
  - `JWT_SECRET` - Secret key for JWT token generation
  - `PORT` - Server port (defaults to 5000)

- The server listens on `0.0.0.0` to allow external connections (required for mobile app testing)
- Uploads are stored in `granite-system-backend/uploads/` (excluded from git)

### Mobile App Configuration

- The API base URL is hardcoded in `granite-system-mobile/src/api/axiosConfig.js`
- When developing, update the IP address in `axiosConfig.js` to match your local machine's IP where the backend is running
- The current configuration uses `http://10.68.29.60:5050/api` - adjust as needed for your environment

### Authentication Flow

1. User registers/logs in via mobile app
2. Backend validates credentials and returns JWT token
3. Mobile app stores token in AsyncStorage
4. Token is used for authenticated requests (users, products, profile updates)
5. JWT tokens expire after 30 days

### Product Management

- Products (granite slabs) have: `stoneName`, `pricePerSqFt`, `stockInSqFt`, `imageUrl`
- Products are linked to the user who created them via `user` field (ObjectId reference)
- Images are uploaded using multer and stored locally
- Image URLs are constructed as `http://<backend-url>/uploads/<filename>`

### Validation

- Input validation is handled on the backend using express-validator
- User registration requires: name (3+ chars, not only numbers), valid email format, password
- User updates validate name and email format
- Product validation ensures required fields are present

## Git Workflow

- Main branch: `main`
- The repository has merge conflicts in `granite-system-mobile/package-lock.json` that need to be resolved
- There's a deleted swap file in staging: `granite-system-mobile/src/screens/.LoginScreen.js.swp`
