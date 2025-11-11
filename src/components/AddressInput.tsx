import { useState, useEffect } from 'react';
import { AddressInputProps } from '../types';

export const AddressInput = ({ onFetch, isLoading, error }: AddressInputProps) => {
  const [address, setAddress] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Example addresses for quick testing
  const exampleAddresses = [
    { name: 'Test Trader', address: '0x328Bb023B9B9f0EffCcC73F169F9DDe7680C28b3' },
    { name: 'Community Vault', address: '0xdfc24b077bc1425ad1dea75bcb6f8158e10df303' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onFetch(address.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.startsWith('0x')) {
        setAddress(text);
        onFetch(text.trim());
      }
    } catch (err) {
      console.error('Failed to read clipboard');
    }
  };

  const handleExample = (addr: string) => {
    setAddress(addr);
    onFetch(addr);
    setShowTooltip(false);
  };

  if (isMobile) {
    return (
      <div className="p-4 safe-area-top">
        <div className="flex items-center gap-3">
          {/* Logo/Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-700 to-green-900 
                          flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">HL</span>
            </div>
            <div>
              <h1 className="text-sm font-bold gradient-text leading-tight">Risk Sim</h1>
              <p className="text-xs text-gray-600 font-medium">Hyperliquid</p>
            </div>
          </div>

          {/* Input Section */}
          <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address..."
                className="input-field w-full h-10 text-xs pr-8"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-emerald-400 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handlePaste}
              className="btn-glass px-3 h-10 text-xs"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            <button
              type="submit"
              className="btn-primary px-4 h-10 text-xs font-bold"
              disabled={isLoading || !address.trim()}
            >
              {isLoading ? '...' : 'GO'}
            </button>
          </form>
        </div>

        {/* Example Addresses Dropdown */}
        {showTooltip && (
          <div className="absolute top-16 right-4 z-50 glass-card p-3 animate-fade-in w-72">
            <p className="text-xs text-gray-500 mb-2 font-medium">Try these:</p>
            {exampleAddresses.map((ex) => (
              <button
                key={ex.name}
                onClick={() => handleExample(ex.address)}
                className="w-full text-left p-2 hover:bg-emerald-900/20 rounded-lg transition-colors"
              >
                <p className="text-xs font-semibold text-white">{ex.name}</p>
                <p className="text-xs text-gray-600 truncate mono">{ex.address.slice(0, 20)}...</p>
              </button>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-3 p-3 bg-red-950/30 border border-red-800/50 rounded-lg">
            <p className="text-xs text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Desktop version
  return (
    <div className="p-5 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-700 to-green-900 
                          flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">HL</span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">
                Hyperliquid Risk Simulator
              </h1>
              <p className="text-sm text-gray-500 font-medium">
                Professional position risk analysis & simulation terminal
              </p>
            </div>
          </div>

          {/* Input Section */}
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Hyperliquid address (0x...)"
                className="input-field w-96 text-sm"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-emerald-400 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {/* Desktop Tooltip */}
              {showTooltip && (
                <div className="absolute top-full mt-2 right-0 z-50 glass-card p-4 w-80 animate-fade-in">
                  <p className="text-sm text-gray-500 mb-3 font-medium">Example addresses to try:</p>
                  {exampleAddresses.map((ex) => (
                    <button
                      key={ex.name}
                      onClick={() => handleExample(ex.address)}
                      className="w-full text-left p-2.5 hover:bg-emerald-900/20 rounded-lg transition-colors mb-1"
                    >
                      <p className="text-sm font-semibold text-white">{ex.name}</p>
                      <p className="text-xs text-gray-600 mono mt-0.5">{ex.address}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handlePaste}
              className="btn-glass px-5"
              disabled={isLoading}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="font-medium">Paste</span>
              </span>
            </button>

            <button
              type="submit"
              className="btn-primary px-6"
              disabled={isLoading || !address.trim()}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Loading...
                </span>
              ) : (
                'Fetch Positions'
              )}
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3.5 bg-red-950/30 border border-red-800/50 rounded-xl">
            <p className="text-sm text-red-400 flex items-center gap-2 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};