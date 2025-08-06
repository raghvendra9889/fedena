# 💕 Marriage Match - Matrimony Web Application

A modern, full-stack matrimony/marriage matching web application built with React.js and Node.js. This platform helps people find their perfect life partner through advanced matching algorithms, secure messaging, and comprehensive profile management.

## ✨ Features

### 🔐 Authentication & Security
- User registration and login with JWT authentication
- Email and phone verification
- Password encryption with bcrypt
- Secure session management
- Account deactivation and reactivation

### 👤 Profile Management
- Comprehensive profile creation with 25+ fields
- Photo upload and management (up to 6 photos)
- Profile completion scoring
- Privacy controls and visibility settings
- Profile verification system

### 🎯 Smart Matching System
- Advanced compatibility algorithm considering:
  - Age preferences and compatibility
  - Location proximity
  - Education level matching
  - Religious compatibility
  - Lifestyle preferences (smoking, drinking, diet)
  - Shared interests and hobbies
  - Family values and children preferences
- Real-time compatibility scoring (0-100%)
- Detailed compatibility breakdown

### 💬 Messaging System
- Real-time messaging with Socket.IO
- Message status tracking (sent, delivered, read)
- Message history and conversation management
- Emoji and media support
- Message deletion and editing
- Unread message notifications

### 🔍 Discovery & Search
- Smart discovery based on preferences
- Advanced filtering options
- Location-based matching
- Profile views tracking
- Like/Pass/Super Like functionality
- Mutual match notifications

### 📱 Modern UI/UX
- Responsive design for all devices
- Material-UI components
- Smooth animations with Framer Motion
- Dark/Light theme support
- Mobile-first approach
- Progressive Web App (PWA) ready

### 🛡️ Safety Features
- User blocking and reporting
- Profile verification badges
- Privacy controls
- Secure image handling
- Content moderation tools

## 🏗️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Cloudinary** - Image storage and processing
- **Nodemailer** - Email services

### Frontend
- **React.js** - UI library
- **Material-UI (MUI)** - Component library
- **React Router** - Navigation
- **React Query** - Data fetching and caching
- **Socket.IO Client** - Real-time messaging
- **Formik & Yup** - Form handling and validation
- **Framer Motion** - Animations
- **Axios** - HTTP client

### Development Tools
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd marriage-match-app
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configurations:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/marriage-match
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # Cloudinary for image uploads
   CLOUDINARY_CLOUD_NAME=your-cloudinary-name
   CLOUDINARY_API_KEY=your-cloudinary-key
   CLOUDINARY_API_SECRET=your-cloudinary-secret
   
   # Email configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   
   # Client URL for CORS
   CLIENT_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the backend server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Frontend Setup

1. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_SERVER_URL=http://localhost:5000
   ```

3. **Start the frontend development server**
   ```bash
   npm start
   ```

### 🐳 Docker Setup (Optional)

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

This will start:
- MongoDB on port 27017
- Backend API on port 5000
- Frontend on port 3000

## 📊 Database Schema

### User Collection
- Personal information (name, email, phone, DOB, gender)
- Authentication data (password hash, verification status)
- Preferences (age range, gender preference, location)
- Privacy settings and blocked users

### Profile Collection
- Detailed profile information
- Physical attributes (height, weight, body type)
- Education and profession details
- Lifestyle preferences
- Photos and media
- Profile completion score

### Match Collection
- User pair matching records
- Compatibility scores and breakdown
- Match status (pending, mutual, rejected)
- Action history (like, pass, super like)

### Message Collection
- Real-time messaging data
- Message status and timestamps
- Media attachments
- Reply threading

## 🔧 API Documentation

### Authentication Endpoints
```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
GET  /api/auth/me          - Get current user
POST /api/auth/logout      - User logout
PUT  /api/auth/change-password - Change password
```

### Profile Endpoints
```
GET  /api/profiles/me      - Get my profile
PUT  /api/profiles/me      - Update my profile
GET  /api/profiles/:id     - Get profile by ID
POST /api/profiles/photos  - Add photo
DELETE /api/profiles/photos/:photoId - Remove photo
```

### Matching Endpoints
```
GET  /api/matches/discover - Get potential matches
POST /api/matches/:profileId/action - Like/Pass action
GET  /api/matches/mutual   - Get mutual matches
GET  /api/matches/likes    - Get users who liked me
```

### Messaging Endpoints
```
GET  /api/messages/conversations - Get all conversations
GET  /api/messages/:matchId - Get messages for match
POST /api/messages/:matchId - Send message
PUT  /api/messages/:messageId/read - Mark as read
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables
3. Deploy using Git or GitHub integration

### Frontend Deployment (Netlify/Vercel)
1. Build the production version
   ```bash
   npm run build
   ```
2. Deploy the `build` folder to your hosting platform

### Database Deployment (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Update the `MONGODB_URI` in your environment variables
3. Configure network access and database users

## 🔒 Security Features

- **Data Encryption**: All sensitive data is encrypted
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS policies
- **Helmet.js**: Security headers implementation
- **JWT Security**: Secure token-based authentication
- **Password Security**: Strong password requirements and hashing

## 📱 Mobile Responsiveness

- Mobile-first design approach
- Touch-friendly interface
- Optimized for various screen sizes
- Progressive Web App capabilities
- Offline functionality (basic features)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@marriagematch.com or create an issue in the GitHub repository.

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- Socket.IO team for real-time communication
- MongoDB team for the robust database solution
- All contributors who helped make this project better

---

**Made with ❤️ for helping people find their perfect match**