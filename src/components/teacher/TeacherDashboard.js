import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  Users,
  LogOut,
  BookOpen,
  CheckCircle,
  Plus,
  Clock,
  MapPin,
  Key,
  AlertCircle,
  QrCode,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../Logo';

const TeacherDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('lectures');
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(true);

  // Topic Editing State
  const [editingTopicLecture, setEditingTopicLecture] = useState(null);
  const [topicDescription, setTopicDescription] = useState('');

  const [lectures, setLectures] = useState([]);
  const [totalPresent, setTotalPresent] = useState(0);
  const [totalRegisteredStudents, setTotalRegisteredStudents] = useState(0);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [viewingLecture, setViewingLecture] = useState(null);
  const [showDailyList, setShowDailyList] = useState(false);
  const [showRegisteredList, setShowRegisteredList] = useState(false);
  const [showAbsentList, setShowAbsentList] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Initialize lectures if none exist for this laboratory/date
  const initializeLectures = async () => {
    try {
      setLoading(true);

      // Check if any lectures already exist for the selected date
      const existingQuery = query(collection(db, 'lectures'), where('date', '==', selectedDate));
      const existingSnapshot = await getDocs(existingQuery);

      if (!existingSnapshot.empty) {
        toast.error(`Lectures have already been initialized for ${selectedDate}.`);
        setLoading(false);
        return;
      }

      const defaultLectures = [
        { subject: 'Advance Web Development', teacherName: 'Dr. Pritesh Pandey', time: '09:00 AM', duration: '50 minutes', room: 'B-310', attendanceCode: '1234', topic: '' },
        { subject: 'Information and Network Security', teacherName: 'Dr. Priyanka Panchal', time: '09:55 AM', duration: '50 minutes', room: 'B-310', attendanceCode: '5678', topic: '' },
        { subject: 'Internet of Things', teacherName: 'Jimesh Rana', time: '10:50 AM', duration: '50 minutes', room: 'B-310', attendanceCode: '9012', topic: '' },
        { subject: 'Machine Learning', teacherName: 'Jaishree Patil', time: '11:45 AM', duration: '50 minutes', room: 'B-310', attendanceCode: '4455', topic: '' },
        { subject: 'Smart City Planning and Management', teacherName: 'Walsh Christian', time: '12:40 PM', duration: '50 minutes', room: 'B-310', attendanceCode: '6677', topic: '' },
        { subject: 'Computer Vision and Image Processing', teacherName: 'Bhumika Prajapati', time: '01:35 PM', duration: '50 minutes', room: 'B-310', attendanceCode: '7788', topic: '' }
      ];

      for (const lecture of defaultLectures) {
        await addDoc(collection(db, 'lectures'), {
          ...lecture,
          teacherId: user.uid, // This teacher initialized it
          date: selectedDate,
          location: { lat: 28.6139, lng: 77.2090 },
          createdAt: serverTimestamp()
        });
      }
      toast.success(`Lectures initialized for ${selectedDate}!`);
    } catch (error) {
      console.error("Error initializing lectures:", error);
      toast.error("Failed to initialize lectures");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    // 1. Listen to global lectures for the selected date
    const lecturesQuery = query(
      collection(db, 'lectures'),
      where('date', '==', selectedDate)
    );

    const unsubscribeLectures = onSnapshot(lecturesQuery, (snapshot) => {
      const lecturesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLectures(lecturesList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching lectures:", error);
      toast.error("Failed to load lectures");
      setLoading(false);
    });

    // 2. Listen to all attendance records (filtering happens in useMemo/useEffect)
    const attQuery = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'));
    const unsubscribeAttendance = onSnapshot(attQuery, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllRecords(records);
    });

    // 3. Fetch Registered Students
    const usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
    getDocs(usersQuery).then(snapshot => {
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegisteredStudents(studentsList);
      setTotalRegisteredStudents(studentsList.length);
    });

    return () => {
      unsubscribeLectures();
      unsubscribeAttendance();
    };
  }, [user, selectedDate]);

  const isMySubject = React.useCallback((lecture) => {
    if (!user?.name || !lecture?.teacherName) return false;
    const userName = user.name.toLowerCase().replace('dr. ', '').trim();
    const lectureTeacher = lecture.teacherName.toLowerCase().replace('dr. ', '').trim();
    return userName === lectureTeacher;
  }, [user.name]);

  const mySubjectIds = React.useMemo(() =>
    new Set(lectures.filter(isMySubject).map(l => l.id)),
    [lectures, isMySubject]
  );

  // Reactive Stats Calculation
  useEffect(() => {
    const myRecords = allRecords.filter(r => r.date === selectedDate && mySubjectIds.has(r.lectureId));

    // Unique students present for this teacher on selected date
    const uniqueStudentIds = new Set(myRecords.map(r => r.studentId));
    setTotalPresent(uniqueStudentIds.size);
  }, [allRecords, mySubjectIds, selectedDate]);
  // Self-Healing Curriculum: Syncs Firestore with the latest master schedule & 50-minute timetable
  useEffect(() => {
    const masterSchedule = [
      { subject: 'Advance Web Development', teacherName: 'Dr. Pritesh Pandey', time: '09:00 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Information and Network Security', teacherName: 'Dr. Priyanka Panchal', time: '09:55 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Internet of Things', teacherName: 'Jimesh Rana', time: '10:50 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Machine Learning', teacherName: 'Jaishree Patil', time: '11:45 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Smart City Planning and Management', teacherName: 'Walsh Christian', time: '12:40 PM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Computer Vision and Image Processing', teacherName: 'Bhumika Prajapati', time: '01:35 PM', duration: '50 minutes', room: 'B-310' }
    ];

    const synchronizeSchedule = async (isManual = false) => {
      console.log('Synchronizing curriculum schedule...');
      let addedCount = 0;
      let updatedCount = 0;

      // 1. Update existing lectures to match the new 50-min schedule and correct professors
      for (const lecture of lectures) {
        const master = masterSchedule.find(m => m.subject === lecture.subject);
        if (master) {
          const updates = {};
          if (lecture.teacherName !== master.teacherName) updates.teacherName = master.teacherName;
          if (lecture.time !== master.time) updates.time = master.time;
          if (lecture.duration !== master.duration) updates.duration = master.duration;
          if (lecture.room !== master.room) updates.room = master.room;
          if (!lecture.attendanceCode) updates.attendanceCode = Math.floor(1000 + Math.random() * 9000).toString();

          if (Object.keys(updates).length > 0) {
            updatedCount++;
            await updateDoc(doc(db, 'lectures', lecture.id), updates);
          }
        }
      }

      // 2. Add missing subjects using PREDICTABLE IDs to prevent duplicates
      for (const master of masterSchedule) {
        // Create a unique, deterministic ID for this subject on this date
        const lectureId = `lecture_${master.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedDate}`;
        const existingDoc = lectures.find(l => l.id === lectureId) || (await getDocs(query(collection(db, 'lectures'), where('date', '==', selectedDate)))).docs.find(d => d.id === lectureId);

        if (!existingDoc) {
          addedCount++;
          console.log(`Initialising missing subject: ${master.subject}`);
          await setDoc(doc(db, 'lectures', lectureId), {
            ...master,
            teacherId: user.uid,
            date: selectedDate,
            attendanceCode: Math.floor(1000 + Math.random() * 9000).toString(),
            location: { lat: 28.6139, lng: 77.2090 },
            createdAt: serverTimestamp()
          });
        }
      }

      if (isManual) {
        if (addedCount > 0 || updatedCount > 0) {
          toast.success(`Curriculum synced! Added ${addedCount}, Updated ${updatedCount}.`);
        } else {
          toast.success('Curriculum is already up to date.');
        }
      }
    };

    synchronizeSchedule();

    // Export for button access
    window.forceCurriculumSync = () => synchronizeSchedule(true);
  }, [lectures, selectedDate, user.uid]);

  const generateAttendanceCode = async (lectureId = null) => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    if (lectureId) {
      try {
        await updateDoc(doc(db, 'lectures', lectureId), {
          attendanceCode: code
        });
        toast.success('Attendance code updated in database!');
      } catch (error) {
        console.error("Error updating code:", error);
        toast.error("Failed to persist code to database");
      }
    }

    setGeneratedCode(code);
    setShowCodeGenerator(true);
    toast.success('New attendance code generated!');
  };

  const handleUpdateTopic = async () => {
    if (!editingTopicLecture) return;

    try {
      await updateDoc(doc(db, 'lectures', editingTopicLecture.id), {
        topic: topicDescription
      });
      toast.success('Lecture topic updated!');
      setEditingTopicLecture(null);
      setTopicDescription('');
    } catch (error) {
      console.error("Error updating topic:", error);
      toast.error("Failed to update topic");
    }
  };

  const handleLogout = () => logout();

  const getAttendancePercentage = (present, total) => (total > 0 ? Math.round((present / total) * 100) : 0);

  const getAbsentStudentsToday = () => {
    const presentInMyClasses = new Set(
      allRecords.filter(r => r.date === selectedDate && mySubjectIds.has(r.lectureId)).map(r => r.studentId)
    );
    return registeredStudents.filter(s => !presentInMyClasses.has(s.id));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Logo className="h-10 w-auto mr-3" showText={false} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.forceCurriculumSync && window.forceCurriculumSync()}
                className="bg-primary-50 text-primary-600 hover:bg-primary-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center transition-colors border border-primary-200"
                title="Force refresh subjects & schedule"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Sync Curriculum
              </button>
              <div className="flex items-center bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200">
                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none text-sm font-medium text-gray-700 focus:outline-none focus:ring-0 cursor-pointer"
                />
              </div>
              <button onClick={handleLogout} className="flex items-center text-gray-600 hover:text-gray-900 border-l pl-4">
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {activeTab === 'lectures' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Today's Lectures</h2>
              <button onClick={generateAttendanceCode} className="btn-primary flex items-center">
                <Plus className="h-5 w-5 mr-2" />
                Generate Code
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : lectures.length === 0 ? (
              <div className="card text-center py-16">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lectures Found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You haven't initialized your subjects yet. Would you like to use the default subjects for this laboratory?
                </p>
                <button
                  onClick={initializeLectures}
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Initialize Default Lectures
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {lectures.filter(isMySubject).map((lecture) => {
                  const presentStudentsCount = new Set(
                    allRecords
                      .filter(r => (r.lectureId === lecture.id || r.subject === lecture.subject) && r.date === lecture.date)
                      .map(r => r.studentId)
                  ).size;

                  return (
                    <div
                      key={lecture.id}
                      className="card hover:border-primary-500 cursor-pointer transition-all hover:shadow-md"
                      onClick={() => setViewingLecture(lecture)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{lecture.subject}</h3>
                          <p className="text-sm text-primary-600 font-medium">{lecture.teacherName}</p>
                          <p className="text-sm text-gray-600">{lecture.room}</p>
                        </div>
                        <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{lecture.time}</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600"><Clock className="h-4 w-4 mr-2" />{lecture.duration}</div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />{lecture.room}
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <Key className="h-4 w-4 mr-2" />
                            Code: <span className="ml-1 font-mono font-bold text-primary-600">{lecture.attendanceCode || 'None'}</span>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTopicLecture(lecture);
                                setTopicDescription(lecture.topic || '');
                              }}
                              className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center"
                            >
                              <BookOpen className="h-3 w-3 mr-1" /> Topic
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); generateAttendanceCode(lecture.id); }}
                              className="text-primary-600 hover:text-primary-700 text-xs font-medium flex items-center"
                            >
                              <Plus className="h-3 w-3 mr-1" /> Code
                            </button>
                          </div>
                        </div>
                        {lecture.topic && (
                          <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 italic">
                            "<span className="font-medium text-gray-700">{lecture.topic}</span>"
                          </div>
                        )}
                      </div>
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">Attendance</span>
                          <span className="text-sm text-gray-600">{presentStudentsCount}/{totalRegisteredStudents}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${getAttendancePercentage(presentStudentsCount, totalRegisteredStudents)}%` }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">{getAttendancePercentage(presentStudentsCount, totalRegisteredStudents)}% present</p>
                          {presentStudentsCount > 0 && (
                            <span className="text-[10px] font-bold text-green-600 flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Attendance marked for today
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'attendance' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div
                className="card text-center cursor-pointer hover:border-primary-500 transition-all hover:shadow-md"
                onClick={() => setShowDailyList(true)}
              >
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">{totalPresent}</h3>
                <p className="text-gray-600">Total Present Today</p>
                <p className="text-xs text-primary-600 mt-2 font-medium">Click to view list</p>
              </div>
              <div
                className="card text-center cursor-pointer hover:border-primary-500 transition-all hover:shadow-md"
                onClick={() => setShowAbsentList(true)}
              >
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">
                  {getAbsentStudentsToday().length}
                </h3>
                <p className="text-gray-600">Total Absent Today</p>
                <p className="text-xs text-primary-600 mt-2 font-medium">Click to view list</p>
              </div>
              <div
                className="card text-center cursor-pointer hover:border-primary-500 transition-all hover:shadow-md"
                onClick={() => setShowRegisteredList(true)}
              >
                <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <h3 className="text-2xl font-bold text-gray-900">{totalRegisteredStudents}</h3>
                <p className="text-gray-600">Total Registered Students</p>
                <p className="text-xs text-primary-600 mt-2 font-medium">Click to view list</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Management</h2>
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <p className="text-gray-600">Manage all registered students in the system.</p>
                <button onClick={() => setShowRegisteredList(true)} className="btn-secondary text-sm">View Full Directory</button>
              </div>
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
                    {registeredStudents.slice(0, 5).map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 uppercase">{student.role}</td>
                      </tr>
                    ))}
                    {registeredStudents.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-4 py-6 text-center text-gray-500">No students registered yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCodeGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <QrCode className="h-16 w-16 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">New Attendance Code</h3>
              <div className="text-4xl font-mono font-bold text-primary-600 mb-4">{generatedCode}</div>
              <p className="text-gray-600 mb-6">Share this code with your students to mark attendance.</p>
              <div className="flex space-x-3">
                <button onClick={() => setShowCodeGenerator(false)} className="flex-1 btn-secondary">Close</button>
                <button onClick={() => { navigator.clipboard.writeText(generatedCode); toast.success('Code copied to clipboard!'); }} className="flex-1 btn-primary">Copy Code</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingTopicLecture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Edit Lecture Topic</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Topic Description</label>
              <textarea
                value={topicDescription}
                onChange={(e) => setTopicDescription(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                rows="3"
                placeholder="e.g., Introduction to Neural Networks"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setEditingTopicLecture(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTopic}
                className="flex-1 btn-primary"
              >
                Save Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingLecture && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingLecture.subject} Attendance</h3>
                <p className="text-sm text-gray-600">{viewingLecture.time} | Room {viewingLecture.room}</p>
              </div>
              <button onClick={() => setViewingLecture(null)} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-6 w-6 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {allRecords.filter(r => r.lectureId === viewingLecture.id && r.date === viewingLecture.date).length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Marked</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allRecords
                      .filter(r => r.lectureId === viewingLecture.id && r.date === viewingLecture.date)
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.studentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Present</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No attendance records found for this lecture.</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-6 border-t">
              <button onClick={() => setViewingLecture(null)} className="w-full btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showDailyList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Attendance Summary</h3>
                <p className="text-sm text-gray-600">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button onClick={() => setShowDailyList(false)} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-6 w-6 rotate-180" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {allRecords.filter(r => r.date === selectedDate && mySubjectIds.has(r.lectureId)).length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {allRecords
                      .filter(r => r.date === selectedDate && mySubjectIds.has(r.lectureId))
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((record) => (
                        <tr key={record.id}>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.studentName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{record.subject}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">Present</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No students marked attendance on {selectedDate}.</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-6 border-t">
              <button onClick={() => setShowDailyList(false)} className="w-full btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showRegisteredList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Registered Students Directory</h3>
                <p className="text-sm text-gray-600">Total: {registeredStudents.length} Students</p>
              </div>
              <button onClick={() => setShowRegisteredList(false)} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-6 w-6 rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {registeredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.username}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-6 pt-6 border-t">
              <button onClick={() => setShowRegisteredList(false)} className="w-full btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {showAbsentList && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Students Absent</h3>
                <p className="text-sm text-gray-600">{new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button onClick={() => setShowAbsentList(false)} className="text-gray-400 hover:text-gray-600">
                <LogOut className="h-6 w-6 rotate-180" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {getAbsentStudentsToday().length > 0 ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {getAbsentStudentsToday().map((student) => (
                      <tr key={student.id}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{student.username}</td>
                        <td className="px-4 py-3">
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">Absent</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-500">Perfect! Everyone is present today.</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-6 border-t">
              <button onClick={() => setShowAbsentList(false)} className="w-full btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
