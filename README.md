# Smart Attendance Management System

A comprehensive React-based attendance management system with role-based authentication, face verification, location tracking, and code verification.

## Features

### 🔐 Authentication System
- Role-based login (Student, Teacher, Administrator)
- Secure authentication with protected routes
- User session management

### 👨‍🎓 Student Features
- **Face Verification**: Camera-based face recognition for attendance
- **Location Verification**: GPS-based location checking (20-meter range)
- **Code Verification**: 4-digit attendance code verification
- **Lecture Selection**: Choose from available lectures
- **Real-time Status**: Track attendance progress

### 👨‍🏫 Teacher Features
- **Code Generation**: Generate unique 4-digit attendance codes
- **Lecture Management**: View and manage lectures
- **Attendance Monitoring**: Real-time attendance tracking
- **Student Overview**: Monitor student attendance rates

### 👨‍💼 Administrator Features
- **System Overview**: Dashboard with key metrics
- **User Management**: Manage students and teachers
- **Analytics**: Attendance reports and statistics
- **System Settings**: Configure system parameters

## Technology Stack

- **Frontend**: React 18, React Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Location**: HTML5 Geolocation API
- **Camera**: MediaDevices API

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd attendance-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Demo Credentials

### Student Login
- **Username**: `student1`
- **Password**: `123456`

### Teacher Login
- **Username**: `teacher1`
- **Password**: `123456`

### Administrator Login
- **Username**: `admin`
- **Password**: `123456`

## How It Works

### Student Attendance Process

1. **Login**: Student logs in with their credentials
2. **Select Lecture**: Choose from available lectures
3. **Face Verification**: Camera captures and verifies student's face
4. **Location Check**: GPS verifies student is within 20 meters of classroom
5. **Code Verification**: Student enters 4-digit code provided by teacher
6. **Success**: Attendance is marked successfully

### Teacher Process

1. **Login**: Teacher logs in with their credentials
2. **Generate Code**: Create unique 4-digit attendance codes
3. **Monitor**: View real-time attendance statistics
4. **Manage**: Oversee student attendance

## Key Components

### Authentication
- `AuthContext.js` - Authentication state management
- `Login.js` - Role-based login interface
- `ProtectedRoute.js` - Route protection

### Student Dashboard
- `StudentDashboard.js` - Main student interface
- `FaceVerification.js` - Camera-based face verification
- `LocationVerification.js` - GPS location checking
- `CodeVerification.js` - 4-digit code verification

### Teacher Dashboard
- `TeacherDashboard.js` - Teacher management interface

### Admin Dashboard
- `AdminDashboard.js` - Administrative interface

## Security Features

- **Face Verification**: Prevents proxy attendance
- **Location Verification**: Ensures physical presence
- **Code Verification**: Time-sensitive attendance codes
- **Role-based Access**: Secure user permissions
- **Session Management**: Secure login/logout

## Browser Requirements

- **Camera Access**: Required for face verification
- **Location Services**: Required for GPS verification
- **Modern Browser**: Chrome, Firefox, Safari, Edge (latest versions)

## Development

### Project Structure
```
src/
├── components/          # React components
├── contexts/           # React contexts
├── App.js             # Main application
└── index.js           # Entry point
```

### Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Future Enhancements

- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with school management systems
- [ ] Biometric authentication
- [ ] Offline support
- [ ] Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team.

---

**Note**: This is a demonstration project. In a production environment, implement proper backend APIs, database integration, and enhanced security measures.

