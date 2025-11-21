import { useState, useEffect } from 'react';

interface AddressInputProps {
  onFetch: (address: string) => void;
  onClear: () => void;
  isLoading: boolean;
  error: string | null;
  savedAddress: string | null;
}

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
    <div className="p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Address Input - Expanded */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              // Only allow editing if not showing truncated version
              // Otherwise user should use paste or clear+paste
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
            className="w-full bg-black/70 backdrop-blur-sm border border-gray-800/60 rounded-md px-4 py-3
                     text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 
                     focus:bg-black/90 transition-all duration-150 pr-32 font-mono text-sm"
            style={{ fontSize: '16px' }} // Prevents iOS zoom
            disabled={isLoading}
          />
          
          {/* Action buttons inside input */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {address && (
              <>
                {/* Copy button (clipboard emoji) */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-emerald-400 transition-colors relative"
                  disabled={isLoading}
                  title="Copy address"
                >
                  <span className="text-base">📋</span>
                  {showCopied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
                
                {/* Clear button */}
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-2 text-gray-500 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                  title="Clear address"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
            
            {canPaste && !address && (
              <button
                type="button"
                onClick={handlePaste}
                className="p-2 text-gray-500 hover:text-emerald-400 transition-colors"
                disabled={isLoading}
                title="Paste address"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Submit Button - Smaller */}
        <button
          type="submit"
          disabled={!address.trim() || isLoading}
          className="bg-gradient-to-b from-emerald-600 to-emerald-700 text-white 
                   font-semibold px-5 py-3 rounded-md transition-all duration-150
                   hover:from-emerald-500 hover:to-emerald-600 active:scale-98
                   disabled:opacity-40 disabled:cursor-not-allowed min-w-[70px]"
          style={{ fontSize: '16px' }} // Prevents iOS zoom
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            'GO'
          )}
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-950/30 border border-red-900/40 rounded-md">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <div className="text-red-400 text-sm font-medium">Error</div>
              <div className="text-red-300 text-sm mt-0.5">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};