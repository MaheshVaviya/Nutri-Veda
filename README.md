# 🌿 NutriVeda - AI-Powered Ayurvedic Nutrition Platform

A comprehensive full-stack application for personalized Ayurvedic diet planning with AI integration, featuring beautiful React frontend and robust Node.js backend.

## ✨ Features

### 🎯 Core Features
- **Multi-Step Patient Registration**: Beautiful 6-step form with real-time BMI/BMR calculation
- **AI Diet Generation**: OpenAI-powered personalized 14-day Ayurvedic diet plans
- **Interactive Diet Plan Editor**: View, edit, and customize AI-generated plans
- **PDF Generation**: Download professionally formatted diet plans
- **Beautiful UI**: Modern gradient design with Tailwind CSS
- **Responsive Design**: Works perfectly on all devices

### 🤖 AI Integration
- Personalized diet plans based on patient's dosha, health conditions, and preferences
- Ayurvedic principles integration
- 14-day meal planning with timing and calorie information
- Customizable based on dietary restrictions and goals

### 🎨 UI/UX Features
- **Emerald/Teal Gradient Theme**: Professional and calming design
- **Step-by-step Progress**: Visual indicators for form completion
- **Real-time Validation**: Instant feedback on form inputs
- **Interactive Components**: Smooth animations and transitions
- **Mobile-First Design**: Optimized for all screen sizes

## 🏗️ Architecture

### Frontend (React - Port 3000)
```
nutriveda-frontend/
├── src/
│   ├── pages/
│   │   ├── PatientForm.jsx          # 6-step registration form
│   │   ├── DietPlanGenerator.jsx    # AI diet plan interface
│   │   └── ...
│   ├── components/
│   │   └── ...
│   └── App.js                       # Main routing
```

### Backend (Node.js - Port 5000)
```
nutriveda-backend/
├── src/
│   ├── controllers/
│   │   ├── aiDietController.js      # AI diet generation
│   │   ├── patientController.js     # Patient management
│   │   └── pdfController.js         # PDF generation
│   ├── models/
│   │   ├── Patient.js               # Patient schema
│   │   ├── DietChart.js             # Diet chart schema
│   │   └── ...
│   ├── routes/
│   │   ├── aiDiet.js                # AI diet routes
│   │   ├── patient.js               # Patient routes
│   │   └── pdf.js                   # PDF routes
│   └── services/
│       ├── csvService.js            # CSV processing
│       └── pdfService.js            # PDF generation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- OpenAI API Key
- Firebase Account (optional, for authentication)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/MaheshVaviya/Nutri-Veda.git
cd Nutri-Veda
```

2. **Setup Backend**
```bash
cd nutriveda-backend
npm install
```

3. **Setup Frontend**
```bash
cd ../nutriveda-frontend
npm install
```

4. **Environment Configuration**
   
   Edit `nutriveda-backend/.env`:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration (Optional)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d

# API Configuration
API_BASE_URL=http://localhost:5000/api/v1
```

### Running the Application

1. **Start Backend Server** (Terminal 1)
```bash
cd nutriveda-backend
npm start
```
Server runs on: http://localhost:5000

2. **Start Frontend Development Server** (Terminal 2)
```bash
cd nutriveda-frontend
npm start
```
Frontend runs on: http://localhost:3000

## 📋 Usage Guide

### 1. Patient Registration
1. Navigate to http://localhost:3000
2. Fill out the 6-step registration form:
   - **Step 1**: Personal Information (Name, Email, Phone, Age, Gender)
   - **Step 2**: Health Information (Height, Weight, Activity Level, Medical History)
   - **Step 3**: Dietary Information (Diet Type, Preferences, Water Intake)
   - **Step 4**: Ayurvedic Information (Dosha, Sleep Pattern, Stress Level)
   - **Step 5**: Goals and Preferences (Target Weight, Budget, Cooking Time)
   - **Step 6**: Additional Information (Previous Diets, Supplements, Notes)

### 2. AI Diet Plan Generation
1. After registration, you'll be redirected to the Diet Plan Generator
2. Click "Generate AI Diet Plan" to create a personalized 14-day plan
3. The AI will analyze patient data and generate:
   - Customized meal plans for 14 days
   - Daily calorie breakdowns
   - Ayurvedic tips and guidelines
   - Meal timing recommendations

### 3. Diet Plan Management
- **View Mode**: See the complete generated plan
- **Edit Mode**: Modify meals, add/remove items
- **Save Changes**: Update the plan with your modifications
- **Download PDF**: Generate and download a professional PDF

## 🔌 API Endpoints

### Patient Management
- `POST /api/v1/patients` - Register new patient
- `GET /api/v1/patients/:id` - Get patient details
- `PUT /api/v1/patients/:id` - Update patient information

### AI Diet Generation
- `POST /api/v1/ai-diet/generate/:patientId` - Generate AI diet plan
- `GET /api/v1/ai-diet/patient/:patientId` - Get existing diet plan
- `PUT /api/v1/ai-diet/save/:patientId` - Save/update diet plan

### PDF Generation
- `POST /api/v1/pdf/generate/:patientId` - Generate diet plan PDF
- `GET /api/v1/pdf/download/:fileName` - Download PDF file

## 🎨 Design System

### Color Palette
- **Primary**: Emerald/Teal gradient (#059669, #0d9488)
- **Secondary**: Orange/Red accents (#f59e0b, #ef4444)
- **Background**: Gradient from emerald-50 to teal-50
- **Text**: Gray scale (gray-700, gray-600, gray-500)

### Typography
- **Headings**: Inter/System fonts, bold weights
- **Body**: Clean, readable spacing
- **Buttons**: Medium weight, proper contrast

### Components
- **Cards**: White/70 opacity with backdrop blur
- **Forms**: Consistent padding, rounded corners
- **Buttons**: Gradient backgrounds with hover effects
- **Progress**: Visual step indicators

## 🧪 Key Technologies

### Frontend Stack
- **React 19**: Latest React with hooks
- **React Router DOM**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client for API calls

### Backend Stack
- **Node.js & Express**: Server framework
- **OpenAI API**: AI-powered diet generation
- **PDFKit**: PDF generation library
- **Firebase Admin**: Authentication & database
- **CORS & Helmet**: Security middleware

## 🔧 Development Features

### Code Quality
- **ESLint**: Code linting and formatting
- **React Strict Mode**: Development warnings
- **Error Boundaries**: Graceful error handling
- **Environment Variables**: Secure configuration

### Performance
- **Code Splitting**: Optimized bundle sizes
- **Lazy Loading**: Component-level loading
- **Memoization**: Optimized re-renders
- **API Caching**: Reduced server requests

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Perfect medium screen experience
- **Desktop Enhanced**: Full feature set on large screens
- **Touch Friendly**: Proper touch targets and gestures

## 🔒 Security Features

- **Input Validation**: Frontend and backend validation
- **CORS Protection**: Configured for security
- **Environment Variables**: Sensitive data protection
- **Error Handling**: No data leakage in errors

## 🚀 Deployment

### Frontend Deployment
```bash
cd nutriveda-frontend
npm run build
# Deploy build folder to your hosting service
```

### Backend Deployment
```bash
cd nutriveda-backend
# Set production environment variables
NODE_ENV=production PORT=5000 npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mahesh Vaviya**
- GitHub: [@MaheshVaviya](https://github.com/MaheshVaviya)

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Tailwind CSS for beautiful styling
- Lucide React for icon library
- React community for excellent documentation

---

<div align="center">
  <h3>🌿 Built with ❤️ for better health through Ayurvedic nutrition</h3>
</div>
