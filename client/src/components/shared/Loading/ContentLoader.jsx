import React from 'react';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';

const ContentLoader = ({ message = 'Loading...', className, height = 'h-64' }) => {
    return (
        <div className={cn("flex flex-col items-center justify-center w-full", height, className)}>
            <Loader className="mb-3 text-primary" />
            <span className="text-sm text-gray-500">{message}</span>
        </div>
    );
};

export default ContentLoader;
