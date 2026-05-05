import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, AlertCircle, Key, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const CodeVerification = ({ lectureCode, onSuccess, onBack }) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const inputRef = useRef(null);

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_TIME = 30;

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  useEffect(() => {
    let timer;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (isLocked) {
      setIsLocked(false);
      setAttempts(0);
      toast.success('You can try again now.');
    }
    return () => clearTimeout(timer);
  }, [timeLeft, isLocked]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) setEnteredCode(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      toast.error(`Please wait ${timeLeft} seconds before trying again.`);
      return;
    }
    if (enteredCode.length !== 4) {
      toast.error('Please enter a 4-digit code.');
      return;
    }
    setIsVerifying(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (enteredCode === lectureCode) {
        toast.success('Code verified successfully!');
        setTimeout(() => onSuccess(), 800);
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setTimeLeft(LOCKOUT_TIME);
          toast.error(`Too many failed attempts. Please wait ${LOCKOUT_TIME} seconds.`);
        } else {
          toast.error(`Incorrect code. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
        }
        setEnteredCode('');
        if (inputRef.current) inputRef.current.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Code Verification</h2>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${isVerifying ? 'bg-blue-100' : attempts > 0 ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            {isVerifying ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            ) : attempts > 0 ? (
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            ) : (
              <Key className="h-8 w-8 text-gray-600" />
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type={showCode ? 'text' : 'password'}
              value={enteredCode}
              onChange={handleCodeChange}
              placeholder="Enter 4-digit code"
              maxLength="4"
              disabled={isVerifying || isLocked}
              className={`w-full max-w-xs mx-auto text-center text-2xl font-mono tracking-widest input-field ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowCode(!showCode)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isVerifying || isLocked}
            >
              {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <button type="submit" disabled={enteredCode.length !== 4 || isVerifying || isLocked} className="btn-primary w-full max-w-xs">
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        {attempts > 0 && !isLocked && (
          <div className="text-center mt-3">
            <p className="text-yellow-600 font-medium">{3 - attempts} attempts remaining</p>
          </div>
        )}

        {isLocked && (
          <div className="text-center mt-3 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">Too many failed attempts</p>
            <p className="text-red-600 text-sm">Please wait {formatTime(timeLeft)} before trying again</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Verification Code:</h3>
              <p className="text-sm text-blue-800">The code for this session is:</p>
            </div>
            <div className="text-2xl font-mono font-bold text-blue-900">{lectureCode}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeVerification;



