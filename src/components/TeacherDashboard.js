import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  BookOpen, 
  Users, 
  Clock, 
  MapPin, 
  Key,
  QrCode,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('lectures');
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Mock data
  const [lectures] = useState([
    {
      id: 1,
      subject: 'Mathematics',
      time: '09:00 AM',
      duration: '1 hour',
      room: 'Room 101',
      date: new Date().toISOString().split('T')[0],
      attendanceCode: '1234',
      totalStudents: 45,
      presentStudents: 38,
      location: { lat: 28.6139, lng: 77.2090 }
    },
    {
      id: 2,
      subject: 'Physics',
      time: '11:00 AM',
      duration: '1.5 hours',
      room: 'Room 102',
      date: new Date().toISOString().split('T')[0],
      attendanceCode: '5678',
      totalStudents: 42,
      presentStudents: 40,
      location: { lat: 28.6139, lng: 77.2090 }
    }
  ]);

  const generateAttendanceCode = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setShowCodeGenerator(true);
    toast.success('New attendance code generated!');
  };

  const handleLogout = () => {
    logout();
  };

  const getAttendancePercentage = (present, total) => {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary-600 mr-3" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Teacher Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'lectures', label: 'My Lectures', icon: BookOpen },
                { id: 'attendance', label: 'Attendance', icon: CheckCircle },
                { id: 'students', label: 'Students', icon: Users }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'lectures' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Today's Lectures
              </h2>
              <button
                onClick={generateAttendanceCode}
                className="btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Generate Code
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lectures.map((lecture) => (
                <div key={lecture.id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lecture.subject}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {lecture.room}
                      </p>
                    </div>
                    <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {lecture.time}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {lecture.duration}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {lecture.room}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Key className="h-4 w-4 mr-2" />
                      Code: {lecture.attendanceCode}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Attendance</span>
                      <span className="text-sm text-gray-600">
                        {lecture.presentStudents}/{lecture.totalStudents}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getAttendancePercentage(lecture.presentStudents, lecture.totalStudents)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getAttendancePercentage(lecture.presentStudents, lecture.totalStudents)}% present
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Attendance Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">78</h3>
                <p className="text-gray-600">Total Present Today</p>
              </div>
              <div className="card text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">9</h3>
                <p className="text-gray-600">Total Absent Today</p>
              </div>
              <div className="card text-center">
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">87</h3>
                <p className="text-gray-600">Total Students</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Student Management
            </h2>
            <div className="card">
              <p className="text-gray-600">Student management features will be implemented here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Code Generator Modal */}
      {showCodeGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                New Attendance Code
              </h3>
              <div className="text-4xl font-mono font-bold text-primary-600 mb-4">
                {generatedCode}
              </div>
              <p className="text-gray-600 mb-6">
                Share this code with your students to mark attendance.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCodeGenerator(false)}
                  className="flex-1 btn-secondary"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedCode);
                    toast.success('Code copied to clipboard!');
                  }}
                  className="flex-1 btn-primary"
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
