import React from 'react';
import { Loader } from '@/components/ui/loader';

const PageLoader = ({ message = 'Loading...' }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white backdrop-blur-sm fixed inset-0 z-50">
            <Loader size="lg" className="mb-4 text-primary" />
            <p className="text-lg text-gray-600 font-medium animate-pulse">{message}</p>
        </div>
    );
};

export default PageLoader;
