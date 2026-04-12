"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { organizerApi } from "@/lib/organizerApi";

export default function AnalyticsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [occupancy, setOccupancy] = useState<any>(null);
    const [error, setError] = useState("");

    const eventId = typeof window !== "undefined" ? localStorage.getItem("activeEventId") : null;

    useEffect(() => {
        if (!eventId) {
            router.push("/organizer/events");
            return;
        }
        loadData();
    }, [eventId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, occupancyData] = await Promise.all([
                organizerApi.getEventTimeSummary(eventId!),
                organizerApi.getCurrentOccupancy(eventId!)
            ]);
            setStats(statsData);
            setOccupancy(occupancyData);
        } catch (err) {
            setError("Failed to load analytics data");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 dir="auto" className="text-2xl font-bold text-gray-900 text-start dynamic-content">Live Analytics</h1>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        ← Back to Scanner
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 dir="auto" className="text-sm font-medium text-gray-500 mb-1 text-start dynamic-content">Total Check-ins</h3>
                        <p className="text-3xl font-bold text-indigo-600">
                            {occupancy?.stats?.totalCheckIns || 0}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 dir="auto" className="text-sm font-medium text-gray-500 mb-1 text-start dynamic-content">Total Check-outs</h3>
                        <p className="text-3xl font-bold text-orange-600">
                            {occupancy?.stats?.totalCheckOuts || 0}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 dir="auto" className="text-sm font-medium text-gray-500 mb-1 text-start dynamic-content">Current Occupancy</h3>
                        <p className="text-3xl font-bold text-green-600">
                            {(occupancy?.stats?.totalCheckIns || 0) - (occupancy?.stats?.totalCheckOuts || 0)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Estimated based on scans</p>
                    </div>
                </div>

                {/* Gate Breakdown */}
                {occupancy?.stats?.checkInsByGate && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h3 dir="auto" className="font-semibold text-gray-900 text-start dynamic-content">Activity by Gate</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {Object.entries(occupancy.stats.checkInsByGate).map(([gate, count]: [string, any]) => (
                                    <div key={gate} className="flex items-center justify-between">
                                        <span dir="auto" className="text-gray-700 text-start dynamic-content">{gate}</span>
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm text-gray-600">{count} scans</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
