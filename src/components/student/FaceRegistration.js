import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import * as faceapi from 'face-api.js';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const FaceRegistration = () => {
    const { updateProfile } = useAuth();
    const navigate = useNavigate();
    const [capturedImage, setCapturedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
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
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const loadModels = async () => {
        try {
            // Use PUBLIC_URL for better compatibility with subdirectories
            // If running in development, this is typically empty string or process.env.PUBLIC_URL
            const MODEL_URL = (process.env.PUBLIC_URL || '') + '/models';

            console.log('FaceRegistration v2: Starting to load models from:', MODEL_URL);

            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);

            console.log('FaceRegistration v2: Models loaded successfully');
            setModelLoaded(true);
            startCamera();
        } catch (error) {
            console.error('FaceRegistration v2 Error:', error);
            // Show the exact error from face-api
            toast.error(`Model Load Error: ${error.message || error}`);
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
            }
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

                // Match canvas size to video
                const displaySize = { width: video.videoWidth, height: video.videoHeight };
                faceapi.matchDimensions(canvas, displaySize);

                const detections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                    .withFaceLandmarks();

                const resizedDetections = faceapi.resizeResults(detections, displaySize);

                // Clear previous drawings
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Draw detection box
                faceapi.draw.drawDetections(canvas, resizedDetections);

                setIsFaceDetected(detections.length > 0);
            }
        }, 100);
    };

    const captureAndRegister = async () => {
        if (!videoRef.current) return;

        setIsProcessing(true);
        const video = videoRef.current;

        // Draw current frame to canvas
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageSrc);
        stopCamera();

        try {
            // Create an image element from the captured data
            const img = await faceapi.fetchImage(imageSrc);

            // Detect face from the captured image with lower threshold
            const detection = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                toast.error('No face detected. Please try again with better lighting.');
                setCapturedImage(null);
                startCamera();
                setIsProcessing(false);
                return;
            }

            // Save descriptor
            // Determine descriptor array (it's a Float32Array, need to convert to regular array for JSON storage)
            const descriptorArray = Array.from(detection.descriptor);

            await updateProfile({
                faceDescriptor: descriptorArray,
                faceRegistered: true
            });

            toast.success('Face registered successfully!');
            setTimeout(() => navigate('/student'), 1500);

        } catch (error) {
            console.error(error);
            toast.error('Failed to process face data.');
            setCapturedImage(null);
            startCamera();
        } finally {
            setIsProcessing(false);
        }
    };

    const retake = () => {
        setCapturedImage(null);
        startCamera();
    };

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate('/student')} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    Back
                </button>
                <h2 className="text-2xl font-bold text-gray-900">Register Face ID</h2>
            </div>

            <div className="glass p-6">
                {!modelLoaded ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading AI Models...</p>
                    </div>
                ) : (
                    <div className="text-center">
                        {!capturedImage ? (
                            <div className="relative w-full max-w-md mx-auto mb-6 camera-frame">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    onPlay={handleVideoPlay}
                                    className="w-full h-72 bg-black/80 rounded-2xl object-cover mirror"
                                />
                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full mirror" />
                            </div>
                        ) : (
                            <div className="relative w-full max-w-md mx-auto mb-6">
                                <img src={capturedImage} alt="Captured" className="w-full h-72 bg-black/80 rounded-2xl object-cover" />
                            </div>
                        )}

                        <div className="mt-6">
                            {!capturedImage ? (
                                <button
                                    onClick={captureAndRegister}
                                    disabled={isProcessing || !isFaceDetected}
                                    className={`btn-primary ${!isFaceDetected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isProcessing ? 'Processing...' : isFaceDetected ? 'Capture & Register' : 'Detecting Face...'}
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    {isProcessing ? (
                                        <p className="text-primary-600 font-medium">Registering Face ID...</p>
                                    ) : (
                                        <div className="flex justify-center space-x-4">
                                            <button onClick={retake} className="btn-secondary flex items-center">
                                                <RotateCcw className="h-4 w-4 mr-2" /> Retake
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="mt-4 text-sm text-gray-500">
                            Please ensure your face is clearly visible and well-lit.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FaceRegistration;
