import React from 'react';

const Logo = ({ className = '', showText = true }) => {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <img
                src="/logo.png"
                alt="MBIT Logo"
                className="h-12 w-auto object-contain"
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                }}
            />
            {/* Fallback text if image fails */}
            <div className="hidden text-xl font-bold text-primary-600 ml-2">
                MBIT Attendance
            </div>
            {showText && (
                <span className="ml-3 text-xl font-bold text-gray-900 tracking-tight hidden sm:block">
                    Attendance System
                </span>
            )}
        </div>
    );
};

export default Logo;
