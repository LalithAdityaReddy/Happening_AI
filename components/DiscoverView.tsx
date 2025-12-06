import React, { useState } from 'react';
import { Search, Loader2, Navigation, Compass } from 'lucide-react';
import { discoverPlaces } from '../services/geminiService';
import { DiscoveryResult, SearchParams } from '../types';
import { PlaceCard } from './PlaceCard';

// -- Sub-Components --

const HeroSearchBar: React.FC<{ 
    location: string; 
    setLocation: (v: string) => void;
    onSearch: (e: React.FormEvent) => void;
    loading: boolean;
    useCurrentLocation: boolean;
    setUseCurrentLocation: (v: boolean) => void;
    onLocationClick: () => void;
}> = ({ location, setLocation, onSearch, loading, useCurrentLocation, setUseCurrentLocation, onLocationClick }) => {
    return (
        <form onSubmit={onSearch} className="w-full max-w-xl mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-full blur opacity-0 group-focus-within:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center bg-[#0a0a0a] border border-neutral-800 rounded-full p-2 pl-6 transition-all duration-300 group-focus-within:border-orange-500/50 group-focus-within:shadow-[0_0_20px_rgba(249,115,22,0.1)]">
                <Search className="text-neutral-500 shrink-0 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    value={location}
                    onChange={(e) => { setLocation(e.target.value); setUseCurrentLocation(false); }}
                    placeholder="Where to? (e.g. Downtown)"
                    className="bg-transparent border-none outline-none text-white placeholder-neutral-600 w-full font-medium h-10 px-4"
                />
                <button 
                    type="button" 
                    onClick={onLocationClick}
                    className={`p-2 rounded-full transition-colors mr-2 ${useCurrentLocation ? 'text-orange-400 bg-orange-400/10' : 'text-neutral-600 hover:text-white'}`}
                >
                    <Navigation size={18} className={useCurrentLocation ? "fill-current" : ""} />
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-orange-500 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2 shrink-0"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Go'}
                </button>
            </div>
        </form>
    );
};

const FilterChips: React.FC<{
    interest: string;
    setInterest: (v: string) => void;
    timeframe: string;
    setTimeframe: (v: string) => void;
}> = ({ interest, setInterest, timeframe, setTimeframe }) => {
    const interests = [
        { label: 'Festivals', value: 'music festivals' },
        { label: 'Art', value: 'art exhibitions' },
        { label: 'Food', value: 'food trucks' },
        { label: 'Live Music', value: 'live music' },
        { label: 'Dining', value: 'restaurants' },
        { label: 'Coffee', value: 'coffee' },
    ];

    return (
        <div className="flex flex-wrap justify-center gap-3">
            {interests.map((item) => (
                <button
                    key={item.value}
                    onClick={() => setInterest(item.value)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all border ${
                        interest === item.value 
                        ? 'bg-orange-500 text-black border-orange-500 shadow-lg shadow-orange-500/20' 
                        : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-white'
                    }`}
                >
                    {item.label}
                </button>
            ))}
            <div className="w-[1px] h-8 bg-neutral-800 mx-2 hidden sm:block"></div>
             {['Today', 'Tonight', 'Weekend'].map((t) => (
                <button
                    key={t}
                    onClick={() => setTimeframe(t)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide uppercase transition-all border ${
                        timeframe === t
                        ? 'bg-neutral-800 text-amber-400 border-amber-400/30'
                        : 'bg-transparent text-neutral-600 border-transparent hover:text-neutral-400'
                    }`}
                >
                    {t}
                </button>
            ))}
        </div>
    );
};

const RecommendationHeader: React.FC = () => (
    <div className="w-full max-w-2xl mx-auto border-b border-neutral-800 pb-6 mb-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Recommended places for you
            <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></div>
        </h2>
        <p className="text-neutral-500 text-sm mt-1">Based on what’s happening nearby right now</p>
        <div className="h-0.5 w-12 bg-amber-400 mt-4"></div>
    </div>
);

// -- Main View --

export const DiscoverView: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<DiscoveryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);

    const [location, setLocation] = useState('');
    const [useCurrentLocation, setUseCurrentLocation] = useState(false);
    const [interest, setInterest] = useState('');
    const [timeframe, setTimeframe] = useState('Today');

    const handleLocationClick = () => {
        if (navigator.geolocation) {
          setLoading(true); 
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUseCurrentLocation(true);
              setLocation("Current Location");
              setLoading(false);
            },
            (err) => {
              console.error(err);
              setError("Unable to retrieve location.");
              setLoading(false);
            }
          );
        } else {
          setError("Geolocation not supported.");
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!interest && !location) {
            setError("Please enter a location or interest.");
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            let lat, lng;
            if (useCurrentLocation) {
                await new Promise<void>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(pos => {
                        lat = pos.coords.latitude;
                        lng = pos.coords.longitude;
                        resolve();
                    }, reject);
                });
            }

            const params: SearchParams = {
                location: location || "nearby", 
                interest: interest || "popular places",
                timeframe,
                useCurrentLocation,
                latitude: lat,
                longitude: lng
            };

            const data = await discoverPlaces(params);
            setResult(data);
        } catch (err: any) {
            setError(err.message || "Failed to fetch recommendations.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative w-full h-full overflow-y-auto bg-[#050505] scrollbar-hide pb-32"
            onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 20)}
        >
            {/* Collapsible Logo */}
            <div className={`fixed top-8 left-8 z-50 transition-all duration-500 ease-in-out pointer-events-none mix-blend-difference ${scrolled ? 'opacity-0 -translate-y-8 blur-sm' : 'opacity-50 translate-y-0 blur-0'}`}>
                <h1 className="text-lg font-bold text-white tracking-widest uppercase">Happening<span className="text-orange-500">.</span>AI</h1>
            </div>

            {/* Top Spacing */}
            <div className="h-12 w-full"></div>

            {/* 1. Hero Section */}
            <div className="w-full px-6 flex flex-col gap-8 mb-12">
                
                <div className="text-center space-y-2 mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                        Discover what's <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">happening.</span>
                    </h1>
                </div>

                <HeroSearchBar 
                    location={location}
                    setLocation={setLocation}
                    onSearch={handleSearch}
                    loading={loading}
                    useCurrentLocation={useCurrentLocation}
                    setUseCurrentLocation={setUseCurrentLocation}
                    onLocationClick={handleLocationClick}
                />

                <FilterChips 
                    interest={interest} 
                    setInterest={setInterest} 
                    timeframe={timeframe} 
                    setTimeframe={setTimeframe} 
                />
            </div>

            {/* 2. Content Section */}
            <div className="w-full px-6 flex flex-col items-center">
                
                {loading && (
                    <div className="flex flex-col items-center py-20">
                        <Loader2 className="animate-spin text-orange-500 mb-4" size={32} />
                        <p className="text-neutral-500 text-sm tracking-widest uppercase">Analyzing real-time data...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/10 border border-red-900/30 text-red-400 px-6 py-4 rounded-lg text-center mb-8 max-w-md">
                        {error}
                    </div>
                )}

                {result && (
                    <div className="w-full max-w-2xl flex flex-col gap-6 animate-fade-in">
                        
                        {/* Static Header Block - VISUALLY SEPARATED */}
                        <RecommendationHeader />

                        {/* Recommendation Cards List - VERTICAL STACK */}
                        <div className="flex flex-col gap-6">
                            <PlaceCard content={result.text} chunks={result.groundingChunks || []} />
                        </div>
                    </div>
                )}
                
                {/* Empty State */}
                {!result && !loading && !error && (
                    <div className="py-20 opacity-30 select-none">
                         <Compass size={64} className="text-neutral-700 mx-auto mb-4" />
                         <p className="text-center text-neutral-700 font-medium">Ready to explore</p>
                    </div>
                )}

            </div>
        </div>
    );
};