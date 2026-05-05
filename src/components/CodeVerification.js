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
  const LOCKOUT_TIME = 30; // 30 seconds

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
    const value = e.target.value.replace(/\D/g, ''); // Only allow digits
    if (value.length <= 4) {
      setEnteredCode(value);
    }
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if code is correct
      if (enteredCode === lectureCode) {
        toast.success('Code verified successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
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
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
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
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          Code Verification
        </h2>
      </div>

      <div className="text-center mb-6">
        <p className="text-gray-600">
          Enter the 4-digit attendance code provided by your teacher.
        </p>
      </div>

      <div className="card">
        {/* Code Input */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
              isVerifying ? 'bg-blue-100' : 
              attempts > 0 ? 'bg-yellow-100' : 'bg-gray-100'
            }`}>
              {isVerifying ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                onKeyPress={handleKeyPress}
                placeholder="Enter 4-digit code"
                maxLength="4"
                disabled={isVerifying || isLocked}
                className={`w-full max-w-xs mx-auto text-center text-2xl font-mono tracking-widest input-field ${
                  isLocked ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isVerifying || isLocked}
              >
                {showCode ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={enteredCode.length !== 4 || isVerifying || isLocked}
              className="btn-primary w-full max-w-xs"
            >
              {isVerifying ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Verifying...
                </div>
              ) : (
                'Verify Code'
              )}
            </button>
          </form>
        </div>

        {/* Attempts Counter */}
        {attempts > 0 && !isLocked && (
          <div className="text-center mb-4">
            <p className="text-yellow-600 font-medium">
              {MAX_ATTEMPTS - attempts} attempts remaining
            </p>
          </div>
        )}

        {/* Lockout Timer */}
        {isLocked && (
          <div className="text-center mb-4 p-4 bg-red-50 rounded-lg">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600 font-medium">
              Too many failed attempts
            </p>
            <p className="text-red-600 text-sm">
              Please wait {formatTime(timeLeft)} before trying again
            </p>
          </div>
        )}

        {/* Code Display for Demo */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">Demo Code:</h3>
              <p className="text-sm text-blue-800">
                For demonstration purposes, the code is: {lectureCode}
              </p>
            </div>
            <div className="text-2xl font-mono font-bold text-blue-900">
              {lectureCode}
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Instructions:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Ask your teacher for the 4-digit attendance code</li>
          <li>• Enter the code exactly as provided</li>
          <li>• You have 3 attempts to enter the correct code</li>
          <li>• After 3 failed attempts, you'll be locked out for 30 seconds</li>
          <li>• The code is case-sensitive and numbers only</li>
        </ul>
      </div>
    </div>
  );
};

export default CodeVerification;
