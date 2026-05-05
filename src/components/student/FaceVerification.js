import React, { useState, useRef, useEffect } from 'react';
import { Camera, ArrowLeft, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import * as faceapi from 'face-api.js';
import { useAuth } from '../../contexts/AuthContext';

const FaceVerification = ({ onSuccess, onBack }) => {
  const { user } = useAuth();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isCapturing && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCapturing]);

  const loadModels = async () => {
    try {
      if (!user.faceDescriptor) {
        toast.error('Face ID not set up. Please register your face first.');
        return;
      }

      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
      ]);
      setModelLoaded(true);
      startCamera();
    } catch (error) {
      console.error('Error loading models:', error);
      toast.error('Failed to load face detection models');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
      }
      setIsCapturing(true);
    } catch (error) {
      toast.error('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleVideoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      if (videoRef.current && canvasRef.current && !capturedImage) {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const displaySize = { width: video.videoWidth, height: video.videoHeight };
        faceapi.matchDimensions(canvas, displaySize);

        const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
          .withFaceLandmarks();

        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        setIsFaceDetected(detections.length > 0);
      }
    }, 100);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setCapturedImage(imageData);
      stopCamera();
      setIsCapturing(false);
    }
  };

  const verifyFace = async () => {
    if (!capturedImage || !user.faceDescriptor) return;
    setIsVerifying(true);

    try {
      const img = await faceapi.fetchImage(capturedImage);
      const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setVerificationResult(false);
        toast.error('No face detected.');
        setIsVerifying(false);
        return;
      }

      const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
      const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
      const isVerified = distance < 0.45;

      setVerificationResult(isVerified);

      if (isVerified) {
        toast.success('Face verification successful!');
        setTimeout(() => onSuccess(), 800);
      } else {
        toast.error('Face does not match registered ID.');
        setTimeout(() => {
          retakePhoto();
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      toast.error('Verification error');
      setVerificationResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setVerificationResult(null);
    startCamera();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Face Verification</h2>
      </div>

      <div className="glass p-6">
        {!modelLoaded ? (
          <div className="text-center py-12">
            {!user.faceDescriptor ? (
              <div className="text-red-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Face ID not set up. Please go to dashboard and register your face.</p>
              </div>
            ) : (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading AI Models...</p>
              </>
            )}
          </div>
        ) : (
          <>
            {!capturedImage ? (
              <div className="text-center">
                {!isCapturing ? (
                  <div>
                    <div className="w-64 h-64 bg-gray-200 rounded-2xl mx-auto mb-6 flex items-center justify-center camera-frame">
                      <Camera className="h-16 w-16 text-gray-400" />
                    </div>
                    <button onClick={startCamera} className="btn-primary">Start Camera</button>
                  </div>
                ) : (
                  <div>
                    <div className="relative w-full max-w-md mx-auto mb-6 camera-frame">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        onPlay={handleVideoPlay}
                        className="w-full h-72 bg-black/80 rounded-2xl object-cover mirror"
                      />
                      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mirror" />
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Please ensure your face is clearly visible in the frame.
                    </p>
                    <button
                      onClick={capturePhoto}
                      className={`btn-primary ${!isFaceDetected ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!isFaceDetected}
                    >
                      {isFaceDetected ? 'Capture Photo' : 'Detecting Face...'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="relative w-full max-w-md mx-auto mb-6">
                  <img src={capturedImage} alt="Captured face" className="w-full h-72 bg-black/80 rounded-2xl object-cover" />
                  {verificationResult === true && (
                    <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-16 w-16 text-green-500" />
                    </div>
                  )}
                  {verificationResult === false && (
                    <div className="absolute inset-0 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <AlertCircle className="h-16 w-16 text-red-500" />
                    </div>
                  )}
                </div>

                {verificationResult === null && (
                  <div className="space-y-4">
                    <button onClick={verifyFace} disabled={isVerifying} className="btn-primary w-full max-w-xs">
                      {isVerifying ? 'Verifying...' : 'Verify Face'}
                    </button>
                    <button onClick={retakePhoto} className="flex items-center justify-center w-full max-w-xs mx-auto text-gray-600 hover:text-gray-900">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retake Photo
                    </button>
                  </div>
                )}

                {verificationResult === false && (
                  <div className="space-y-4">
                    <p className="text-red-600 font-medium">Face does not match. Please try again.</p>
                    <button onClick={retakePhoto} className="btn-primary">Try Again</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Face Verification Tips:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Ensure good lighting on your face</li>
          <li>• Look directly at the camera</li>
          <li>• Remove glasses or hats if possible</li>
          <li>• Keep your face centered in the frame</li>
        </ul>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default FaceVerification;
