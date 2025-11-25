import { useState, useEffect } from 'react';
import { AddressInputProps } from '../types';

export const AddressInput = ({ onFetch, onClear, isLoading, error, savedAddress }: AddressInputProps) => {
  const [address, setAddress] = useState('');
  const [canPaste, setCanPaste] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  useEffect(() => {
    // Check if clipboard API is available
    setCanPaste(!!navigator.clipboard);
  }, []);

  // Load saved address into input on mount
  useEffect(() => {
    if (savedAddress) {
      setAddress(savedAddress);
    }
  }, [savedAddress]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (address.trim()) {
      onFetch(address.trim());
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setAddress(text.trim());
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    setAddress('');
    onClear();
  };

  // Truncate address for display: 0x5D2F...3514
  const truncateAddress = (addr: string): string => {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const displayValue = address.length > 14 ? truncateAddress(address) : address;

  return (
    <div>
      <form onSubmit={handleSubmit} className="relative">
        {/* Address Input with GO button inside */}
        <input
          type="text"
          value={displayValue}
          onChange={(e) => {
            // Only allow editing if not showing truncated version
            if (address.length <= 14) {
              setAddress(e.target.value);
            }
          }}
          onClick={() => {
            // If showing truncated, allow editing full address
            if (address.length > 14) {
              setAddress('');
            }
          }}
          placeholder="Enter Hyperliquid address"
          className="w-full bg-black/70 backdrop-blur-sm border border-gray-800/60 rounded-lg px-4 py-2.5
                   text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 
                   focus:bg-black/90 transition-all duration-150 pr-28"
          style={{ fontSize: '14px', fontFamily: 'SF Mono, Monaco, Consolas, monospace' }}
          disabled={isLoading}
        />
        
        {/* Action buttons inside input */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {address && (
            <>
              {/* Copy button */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors"
                disabled={isLoading}
                title="Copy address"
              >
                {showCopied ? (
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
              
              {/* Clear button */}
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors"
                disabled={isLoading}
                title="Clear address"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          
          {canPaste && !address && (
            <button
              type="button"
              onClick={handlePaste}
              className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors"
              disabled={isLoading}
              title="Paste address"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
          )}

          {/* GO Button - Inside input */}
          <button
            type="submit"
            disabled={!address.trim() || isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white 
                     font-semibold px-3 py-1 rounded-md text-sm transition-all duration-150
                     disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'GO'
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-2 p-2.5 bg-red-950/30 border border-red-900/40 rounded-md">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-red-300 text-xs">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
};