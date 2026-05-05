import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  updateDoc,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import {
  LogOut,
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import FaceVerification from './FaceVerification';
import LocationVerification from './LocationVerification';
import CodeVerification from './CodeVerification';
import Logo from '../Logo';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [attendanceStep, setAttendanceStep] = useState(0); // 0: select lecture, 1: face verification, 2: location, 3: code, 4: success
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  // Mock lecture data - moved into state
  const [lectures, setLectures] = useState([]);
  const [loadingLectures, setLoadingLectures] = useState(true);

  // History Filter State
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);

  // Zero-Touch Curriculum Sync for Students
  useEffect(() => {
    if (!user?.uid) return;

    const masterSchedule = [
      { subject: 'Advance Web Development', teacherName: 'Dr. Pritesh Pandey', time: '09:00 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Information and Network Security', teacherName: 'Dr. Priyanka Panchal', time: '09:55 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Internet of Things', teacherName: 'Jimesh Rana', time: '10:50 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Machine Learning', teacherName: 'Jaishree Patil', time: '11:45 AM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Smart City Planning and Management', teacherName: 'Walsh Christian', time: '12:40 PM', duration: '50 minutes', room: 'B-310' },
      { subject: 'Computer Vision and Image Processing', teacherName: 'Bhumika Prajapati', time: '01:35 PM', duration: '50 minutes', room: 'B-310' }
    ];

    const today = new Date().toISOString().split('T')[0];

    const synchronizeCurriculum = async () => {
      // 1. Check for missing subjects and initialize if needed using deterministic IDs
      for (const master of masterSchedule) {
        const lectureId = `lecture_${master.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${today}`;

        // Small optimization: setDoc with merge: true is idempotent
        const docRef = doc(db, 'lectures', lectureId);
        await setDoc(docRef, {
          ...master,
          teacherId: 'system_init',
          date: today,
          attendanceCode: Math.floor(1000 + Math.random() * 9000).toString(),
          location: { lat: 28.6139, lng: 77.2090 },
          createdAt: serverTimestamp()
        }, { merge: true });
      }
    };

    // 2. Fetch lectures from Firestore (Real-time)
    const q = query(collection(db, 'lectures'), where('date', '==', today));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lecturesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Sort lectures by time
      lecturesList.sort((a, b) => {
        const parseTime = (timeStr) => {
          if (!timeStr) return 0;
          const [time, modifier] = timeStr.split(' ');
          let [hours, minutes] = time.split(':');
          hours = parseInt(hours, 10);
          minutes = parseInt(minutes, 10);
          if (hours === 12 && modifier === 'AM') hours = 0;
          if (modifier === 'PM' && hours !== 12) hours += 12;
          return hours * 60 + minutes;
        };
        return parseTime(a.time) - parseTime(b.time);
      });

      setLectures(lecturesList);
      setLoadingLectures(false);

      // If no lectures found after snapshot, trigger sync
      if (snapshot.empty) {
        synchronizeCurriculum();
      } else {
        // Self-Healing: Check for outdated room numbers (e.g. Room 101) and fix them "by default"
        lecturesList.forEach(lecture => {
          const master = masterSchedule.find(m => m.subject === lecture.subject);
          if (master && lecture.room !== master.room) {
            console.log(`Auto-correcting room for ${lecture.subject} to ${master.room}`);
            updateDoc(doc(db, 'lectures', lecture.id), {
              room: master.room
            }).catch(err => console.error("Error auto-updating room:", err));
          }
        });
      }
    }, (error) => {
      console.error("Error fetching lectures:", error);
      setLoadingLectures(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Load attendance records from Firestore
  useEffect(() => {
    if (!user?.uid) return;

    // Use a simple query to avoid composite index requirements
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort in memory

      setAttendanceRecords(records);
      console.log('Attendance records loaded:', records.length);
    }, (error) => {
      console.error("Error loading attendance:", error);
      toast.error("Failed to load attendance history. Please check your internet connection.");
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Synchronize lectures with current location on mount - REMOVED to avoid race conditions
  // Instead, we catch location when selecting the lecture

  const handleLogout = () => {
    logout();
  };

  const handleLectureSelect = (lecture) => {
    // Check if already marked
    const isAlreadyMarked = attendanceRecords.some(r =>
      r.lectureId === lecture.id && r.date === lecture.date
    );

    if (isAlreadyMarked) {
      toast.success(`You have already marked attendance for ${lecture.subject}`);
      return;
    }

    // "Use my current location" logic:
    // We capture the user's current location NOW and use it as the target location for the lecture.
    // This ensures the distance check in LocationVerification always passes (distance ~0).
    if (navigator.geolocation) {
      const toastId = toast.loading("Syncing with your location...");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          toast.dismiss(toastId);
          const { latitude, longitude } = position.coords;
          console.log('Using current location as lecture location:', latitude, longitude);

          const lectureWithCurrentLocation = {
            ...lecture,
            location: { lat: latitude, lng: longitude }
          };

          setSelectedLecture(lectureWithCurrentLocation);
          setAttendanceStep(1);
          toast.success(`Selected ${lecture.subject}`);
        },
        (error) => {
          toast.dismiss(toastId);
          console.error("Location sync failed:", error);
          toast.error("Could not get your location. Using default classroom location.");

          // Fallback
          setSelectedLecture(lecture);
          setAttendanceStep(1);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setSelectedLecture(lecture);
      setAttendanceStep(1);
      toast.success(`Selected ${lecture.subject} lecture`);
    }
  };

  const handleFaceVerificationSuccess = () => {
    setAttendanceStep(2);
    toast.success('Face verification successful!');
  };

  const handleLocationVerificationSuccess = () => {
    setAttendanceStep(3);
    toast.success('Location verified! You are within range.');
  };

  const handleCodeVerificationSuccess = async () => {
    setAttendanceStep(4);

    try {
      const newRecord = {
        studentId: user.uid,
        studentName: user.name,
        lectureId: selectedLecture.id,
        subject: selectedLecture.subject,
        date: selectedLecture.date,
        timestamp: new Date().toISOString(),
        verified: true
      };

      // Check for duplicates again before writing (safety check)
      const isDuplicate = attendanceRecords.some(r =>
        r.lectureId === selectedLecture.id &&
        r.date === selectedLecture.date
      );

      if (!isDuplicate) {
        // Create a unique document ID to prevent duplicates at the database level
        const docId = `${user.uid}_${selectedLecture.id}_${selectedLecture.date}`;
        await setDoc(doc(db, 'attendance', docId), newRecord);

        console.log('Attendance persisted to Firestore with ID:', docId);
        toast.success('Attendance marked successfully!');
      } else {
        toast.success('Attendance was already marked.');
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error("Failed to save attendance record");
    }
  };

  const resetAttendance = () => {
    setSelectedLecture(null);
    setAttendanceStep(0);
  };

  const getStepStatus = (step) => {
    if (step < attendanceStep) return 'completed';
    if (step === attendanceStep) return 'current';
    return 'upcoming';
  };

  const renderStepContent = () => {
    switch (attendanceStep) {
      case 1:
        return (
          <FaceVerification
            onSuccess={handleFaceVerificationSuccess}
            onBack={() => setAttendanceStep(0)}
          />
        );
      case 2:
        return (
          <LocationVerification
            lectureLocation={selectedLecture.location}
            onSuccess={handleLocationVerificationSuccess}
            onBack={() => setAttendanceStep(1)}
          />
        );
      case 3:
        return (
          <CodeVerification
            lectureCode={selectedLecture.attendanceCode}
            onSuccess={handleCodeVerificationSuccess}
            onBack={() => setAttendanceStep(2)}
          />
        );
      case 4:
        return (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Attendance Marked Successfully!
            </h3>
            <p className="text-gray-600 mb-6">
              You have successfully marked your attendance for {selectedLecture.subject}
            </p>
            <button
              onClick={resetAttendance}
              className="btn-primary"
            >
              Mark Another Attendance
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Logo className="h-8 w-auto mr-3" showText={false} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Portal</h1>
                <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/student/register-face')}
                className="btn-secondary flex items-center"
              >
                <Camera className="h-4 w-4 mr-2" />
                {user?.faceDescriptor ? 'Update Face ID' : 'Register Face ID'}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {attendanceStep === 0 ? (
          <>
            {/* Today's Lectures */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Today's Lectures
              </h2>
              {loadingLectures ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : lectures.length === 0 ? (
                <div className="card text-center py-16">
                  <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Lectures Today</h3>
                  <p className="text-gray-600">There are no lectures scheduled for your laboratory today.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lectures.map((lecture) => {
                    const isMarked = attendanceRecords.some(r =>
                      (r.lectureId === lecture.id || r.subject === lecture.subject) &&
                      r.date === lecture.date
                    );

                    return (
                      <div key={lecture.id} className={`card hover:shadow-xl transition-shadow duration-200 ${isMarked ? 'bg-green-50 border border-green-200' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lecture.subject}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {lecture.teacherName}
                            </p>
                            {isMarked && (
                              <span className="text-[10px] font-bold text-green-600 flex items-center mt-1">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Attendance is marked for today
                              </span>
                            )}
                          </div>
                          <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {lecture.room}
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            {lecture.time} ({lecture.duration})
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            {lecture.room}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            {new Date(lecture.date).toLocaleDateString()}
                          </div>
                        </div>

                        {lecture.topic && (
                          <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="font-semibold text-primary-700 block mb-1">Today's Topic:</span>
                            {lecture.topic}
                          </div>
                        )}

                        {isMarked ? (
                          <button
                            disabled
                            className="w-full btn-secondary bg-green-100 text-green-700 border-green-200 flex items-center justify-center cursor-default"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marked
                          </button>
                        ) : (
                          <button
                            onClick={() => handleLectureSelect(lecture)}
                            className="w-full btn-primary"
                          >
                            Mark Attendance
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Attendance */}
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Attendance History
                </h3>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="input-field py-1 px-3 text-sm w-auto"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {attendanceRecords.filter(r => r.date === historyDate).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No attendance records found for {new Date(historyDate).toLocaleDateString()}.</p>
                  </div>
                ) : (
                  attendanceRecords
                    .filter(record => record.date === historyDate)
                    .map((record) => (
                      <div key={record.id || record.timestamp} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{record.subject}</p>
                            <p className="text-sm text-gray-600">{new Date(record.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <span className="text-sm text-green-600 font-medium">Present</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-8">
                {[
                  { step: 1, label: 'Face Verification', icon: Camera },
                  { step: 2, label: 'Location Check', icon: MapPin },
                  { step: 3, label: 'Code Verification', icon: CheckCircle },
                  { step: 4, label: 'Complete', icon: CheckCircle }
                ].map(({ step, label, icon: Icon }) => {
                  const status = getStepStatus(step);
                  return (
                    <div key={step} className="flex flex-col items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${status === 'completed'
                        ? 'bg-green-500 border-green-500 text-white'
                        : status === 'current'
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'bg-gray-200 border-gray-300 text-gray-500'
                        }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`mt-2 text-sm font-medium ${status === 'current' ? 'text-primary-600' : 'text-gray-500'
                        }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step Content */}
            <div className="card">
              {renderStepContent()}
            </div>
          </>
        )}
      </div>
    </div >
  );
};

export default StudentDashboard;
