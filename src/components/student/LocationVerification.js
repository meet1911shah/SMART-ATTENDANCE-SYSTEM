import React, { useState, useEffect } from 'react';
import { MapPin, ArrowLeft, CheckCircle, AlertCircle, WifiOff, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const LocationVerification = ({ lectureLocation, onSuccess, onBack, requiredRangeMeters = 500 }) => {
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [distance, setDistance] = useState(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const hasFixedClassroom = Boolean(lectureLocation && typeof lectureLocation.lat === 'number' && typeof lectureLocation.lng === 'number');
  const RANGE_METERS = hasFixedClassroom ? 20 : requiredRangeMeters;

  useEffect(() => {
    getCurrentLocation();
  }, [lectureLocation.lat, lectureLocation.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentLocation = () => {
    setIsLoading(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const calculatedDistance = hasFixedClassroom
          ? calculateDistance(latitude, longitude, lectureLocation.lat, lectureLocation.lng)
          : 0;
        setDistance(calculatedDistance);
        setIsWithinRange(calculatedDistance <= RANGE_METERS);
        setIsLoading(false);
        if (calculatedDistance <= RANGE_METERS) {
          toast.success(hasFixedClassroom ? 'You are within the required range!' : 'Location captured. Access granted for nearby area.');
        } else {
          toast.error(`You are ${calculatedDistance.toFixed(1)}m away. Please move closer.`);
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
          default:
            errorMessage = 'Unknown location error.';
        }
        setLocationError(errorMessage);
        setIsLoading(false);
        toast.error(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleContinue = () => {
    if (isWithinRange) {
      onSuccess();
    } else {
      toast.error('You must be within 20 meters of the classroom to continue.');
    }
  };

  const getLocationStatus = () => {
    if (isLoading) return 'loading';
    if (locationError) return 'error';
    if (distance !== null) return isWithinRange ? 'success' : 'warning';
    return 'idle';
  };

  const status = getLocationStatus();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-900 mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Location Verification</h2>
      </div>

      <div className="card">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${status === 'loading' ? 'bg-blue-100' :
              status === 'success' ? 'bg-green-100' :
                status === 'warning' ? 'bg-yellow-100' :
                  status === 'error' ? 'bg-red-100' :
                    'bg-gray-100'
            }`}>
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            )}
            {status === 'success' && <CheckCircle className="h-10 w-10 text-green-600" />}
            {status === 'warning' && <AlertCircle className="h-10 w-10 text-yellow-600" />}
            {status === 'error' && <WifiOff className="h-10 w-10 text-red-600" />}
            {status === 'idle' && <MapPin className="h-10 w-10 text-gray-600" />}
          </div>
          {status === 'loading' && <p className="text-blue-600 font-medium">Getting your location...</p>}
          {status === 'success' && (
            <div>
              <p className="text-green-600 font-medium">Location Verified!</p>
              <p className="text-sm text-gray-600 mt-1">You are {distance?.toFixed(1)}m away from the classroom</p>
            </div>
          )}
          {status === 'warning' && (
            <div>
              <p className="text-yellow-600 font-medium">Too Far Away</p>
              <p className="text-sm text-gray-600 mt-1">You are {distance?.toFixed(1)}m away. Please move closer (within 20m)</p>
            </div>
          )}
          {status === 'error' && (
            <div>
              <p className="text-red-600 font-medium">Location Error</p>
              <p className="text-sm text-gray-600 mt-1">{locationError}</p>
            </div>
          )}
        </div>

        {userLocation && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Location Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Your Location:</p>
                <p className="font-mono text-gray-900">{userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
              </div>
              {hasFixedClassroom && (
                <div>
                  <p className="text-gray-600">Classroom Location:</p>
                  <p className="font-mono text-gray-900">{lectureLocation.lat.toFixed(6)}, {lectureLocation.lng.toFixed(6)}</p>
                </div>
              )}
            </div>
            {distance !== null && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Distance:</span>
                  <span className={`font-medium ${isWithinRange ? 'text-green-600' : 'text-red-600'}`}>{distance.toFixed(1)} meters</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-600">Required Range:</span>
                  <span className="text-gray-900">≤ {RANGE_METERS} meters</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex space-x-4">
          <button onClick={getCurrentLocation} disabled={isLoading} className="flex-1 btn-secondary flex items-center justify-center">
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2" />
            ) : (
              <Navigation className="h-5 w-5 mr-2" />
            )}
            {isLoading ? 'Checking...' : 'Refresh Location'}
          </button>
          {isWithinRange && (
            <button onClick={handleContinue} className="flex-1 btn-primary flex items-center justify-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationVerification;

