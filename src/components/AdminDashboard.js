import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Users, 
  BookOpen, 
  Settings, 
  Calendar, 
  LogOut, 
  Shield, 
  TrendingUp, 
  UserPlus 
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import Logo from './Logo';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [lectures, setLectures] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setLoading(true);

    // 1. Listen to all users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegisteredUsers(usersList);
      setTotalTeachers(usersList.filter(u => u.role === 'teacher').length);
      setTotalAdmins(usersList.filter(u => u.role === 'admin').length);
    });

    // 2. Listen to lectures for selected date
    const lecturesQuery = query(collection(db, 'lectures'), where('date', '==', selectedDate));
    const unsubscribeLectures = onSnapshot(lecturesQuery, (snapshot) => {
      const lecturesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(lecturesList);
      setLoading(false);
    });

    // 3. Listen to all attendance
    const attQuery = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribeAttendance = onSnapshot(attQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRecords(records);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLectures();
      unsubscribeAttendance();
    };
  }, [selectedDate]);

  const stats = {
    totalStudents: registeredUsers.filter(u => u.role === 'student').length,
    totalTeachers: totalTeachers,
    totalAdmins: totalAdmins,
    totalLectures: lectures.length,
    attendanceRate: lectures.length > 0
      ? Math.round((allRecords.filter(r => r.date === selectedDate).length / (registeredUsers.filter(u => u.role === 'student').length * lectures.length)) * 100) || 0
      : 0
  };

  const recentActivities = allRecords.slice(0, 5).map(record => ({
    id: record.id,
    action: `Attendance marked for ${record.subject}`,
    user: record.studentName,
    time: new Date(record.timestamp).toLocaleTimeString(),
    type: 'info'
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            import Logo from './Logo';

            // ...

            // Inside component render
            <div className="flex items-center">
              <Logo className="mr-3" showText={false} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Welcome back, {user?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
              <button
                onClick={logout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors border-l pl-4"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'lectures', label: 'Lectures', icon: BookOpen },
                { id: 'settings', label: 'Settings', icon: Settings }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
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
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div
                className="card text-center cursor-pointer hover:border-primary-500 transition-all hover:shadow-md"
                onClick={() => setShowStudentModal(true)}
              >
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                <p className="text-gray-600">Total Students</p>
                <p className="text-xs text-primary-600 mt-2 font-medium">Click to view all users</p>
              </div>
              <div className="card text-center">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</h3>
                <p className="text-gray-600">Total Teachers</p>
              </div>
              <div className="card text-center">
                <Shield className="h-12 w-12 text-primary-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">{stats.totalAdmins}</h3>
                <p className="text-gray-600">Total Admins</p>
              </div>
              <div className="card text-center">
                <TrendingUp className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">{stats.attendanceRate}%</h3>
                <p className="text-gray-600">Attendance Rate</p>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activities
                </h3>
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full mr-3 ${activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' :
                          'bg-blue-500'
                        }`}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-600">{activity.user} • {activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <UserPlus className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Add New User</p>
                      <p className="text-sm text-gray-600">Register student or teacher</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <Calendar className="h-5 w-5 text-green-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Schedule Lecture</p>
                      <p className="text-sm text-gray-600">Create new lecture</p>
                    </div>
                  </button>
                  <button className="w-full flex items-center p-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                    <BarChart3 className="h-5 w-5 text-purple-500 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">View Reports</p>
                      <p className="text-sm text-gray-600">Attendance analytics</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                User Management
              </h2>
              <button className="btn-primary flex items-center text-sm px-4 py-2">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registeredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {u.name}
                            {u.role === 'admin' && (
                              <span className="ml-2 bg-primary-100 text-primary-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase italic">Admin</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            u.role === 'teacher' ? 'bg-green-100 text-green-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lectures' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Lecture Management
            </h2>
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {lectures.map((lecture) => {
                      const presentCount = allRecords.filter(r =>
                        r.lectureId === lecture.id && r.date === lecture.date
                      ).length;
                      return (
                        <tr key={lecture.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{lecture.subject}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lecture.teacherName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lecture.time}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{lecture.room}</td>
                          <td className="px-4 py-3 text-sm text-green-600 font-medium">{presentCount}/{lecture.totalStudents}</td>
                        </tr>
                      );
                    })}
                    {lectures.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No lectures scheduled for today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              System Settings
            </h2>
            <div className="card">
              <p className="text-gray-600">System settings will be implemented here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Student Directory Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">User Directory</h3>
                <p className="text-sm text-gray-600">Total: {registeredUsers.length} System Users</p>
              </div>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-6 w-6 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {registeredUsers.filter(u => u.role === 'student').length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {registeredUsers.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {u.name}
                            {u.role === 'admin' && (
                              <span className="ml-2 bg-primary-100 text-primary-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase">Admin</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-400 font-mono">#{u.id.toString().slice(-6)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students registered in the system yet.</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={() => setShowStudentModal(false)}
                className="w-full btn-secondary py-3"
              >
                Close Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
