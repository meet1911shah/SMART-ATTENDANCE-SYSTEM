import React from 'react';
import { Settings, ExternalLink, Copy, FileText, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const SetupRequired = () => {
    const copyConfig = () => {
        const configText = `const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};`;
        navigator.clipboard.writeText(configText);
        toast.success("Template copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-primary-600 p-8 text-center">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <Settings className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Setup Required</h1>
                    <p className="text-primary-100 text-lg">Connect your database to get started</p>
                </div>

                <div className="p-8">
                    <div className="flex items-start mb-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                        <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-900">Firebase Configuration Missing</h3>
                            <p className="text-yellow-800 text-sm mt-1">
                                To enable login and data sync across devices, you need to connect a Firebase project.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-bold mr-3">1</span>
                                Create Project
                            </h3>
                            <p className="text-gray-600 ml-11 mb-4">
                                Go to the Firebase Console and create a new project. Enable <strong>Authentication</strong> (Email/Password) and <strong>Firestore Database</strong>.
                            </p>
                            <a
                                href="https://console.firebase.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-11 inline-flex items-center text-primary-600 font-medium hover:underline"
                            >
                                Open Firebase Console <ExternalLink className="h-4 w-4 ml-1" />
                            </a>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-bold mr-3">2</span>
                                Get Configuration
                            </h3>
                            <p className="text-gray-600 ml-11 mb-4">
                                In Project Settings, look for "Your apps" and create a Web app. Copy the <code>firebaseConfig</code> object.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-bold mr-3">3</span>
                                Update App
                            </h3>
                            <p className="text-gray-600 ml-11 mb-4">
                                Open <code>src/firebase.js</code> in your editor and replace the placeholder config with your actual keys.
                            </p>
                            <div className="ml-11 bg-gray-900 rounded-lg p-4 relative group">
                                <button
                                    onClick={copyConfig}
                                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Copy template"
                                >
                                    <Copy className="h-4 w-4" />
                                </button>
                                <pre className="text-gray-300 text-sm overflow-x-auto font-mono">
                                    {`const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  ...
};`}
                                </pre>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t flex justify-center">
                        <p className="text-gray-500 text-sm flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Edit <strong>src/firebase.js</strong> to continue
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetupRequired;
