import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Event...</h2>
        <p className="text-gray-600">Please wait while we load the event details</p>
      </div>
    </div>
  );
}
