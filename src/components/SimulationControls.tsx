import { useState } from 'react';
import { SimulationControlsProps } from '../types';

export const SimulationControls = ({
  onSimulate,
  isSimulating,
  onReset,
}: SimulationControlsProps) => {
  const [customPercent, setCustomPercent] = useState('');

  const crashScenarios = [
    { label: 'Black Swan', value: -50, severity: 'severe' },
    { label: 'Flash Crash', value: -30, severity: 'severe' },
    { label: 'Correction', value: -20, severity: 'moderate' },
    { label: 'Dip', value: -10, severity: 'moderate' },
  ];

  const pumpScenarios = [
    { label: 'Small Pump', value: 10, severity: 'moderate' },
    { label: 'Rally', value: 20, severity: 'moderate' },
    { label: 'Moon', value: 30, severity: 'severe' },
    { label: 'Mars', value: 50, severity: 'severe' },
  ];

  const quickPresets = [-5, -3, 3, 5];

  const handleCustomSimulate = () => {
    const value = parseFloat(customPercent);
    if (!isNaN(value) && value !== 0) {
      onSimulate(value);
      setCustomPercent('');
    }
  };

  const getButtonClass = (type: 'crash' | 'pump', severity: string) => {
    if (type === 'crash') {
      return severity === 'severe' ? 'btn-crash-severe' : 'btn-crash-moderate';
    }
    return severity === 'severe' ? 'btn-pump-severe' : 'btn-pump-moderate';
  };

  const getQuickButtonClass = (value: number) => {
    if (value <= -3) return 'bg-red-950/30 text-red-400 border-red-900/40 hover:bg-red-900/20';
    if (value < 0) return 'bg-orange-950/30 text-orange-400 border-orange-900/40 hover:bg-orange-900/20';
    if (value >= 3) return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/40 hover:bg-emerald-900/20';
    return 'bg-green-950/30 text-green-400 border-green-900/40 hover:bg-green-900/20';
  };

  const CrashIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );

  const PumpIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  return (
    <div className="glass-card p-5 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Simulate Scenarios</h3>
        {isSimulating && (
          <button
            onClick={onReset}
            className="btn-glass text-sm px-4 py-2"
          >
            Reset
          </button>
        )}
      </div>

      {/* Crash Scenarios */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">
          Crash Scenarios
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {crashScenarios.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => onSimulate(scenario.value)}
              className={`relative overflow-hidden group py-3.5 px-3 rounded-xl 
                        transition-all duration-200 border backdrop-blur-sm
                        ${getButtonClass('crash', scenario.severity)}
                        active:scale-95`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <CrashIcon />
                <span className="text-xs font-semibold">{scenario.label}</span>
                <span className="text-sm font-bold mono">{scenario.value}%</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                            translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </button>
          ))}
        </div>
      </div>

      {/* Pump Scenarios */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">
          Pump Scenarios
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {pumpScenarios.map((scenario) => (
            <button
              key={scenario.label}
              onClick={() => onSimulate(scenario.value)}
              className={`relative overflow-hidden group py-3.5 px-3 rounded-xl 
                        transition-all duration-200 border backdrop-blur-sm
                        ${getButtonClass('pump', scenario.severity)}
                        active:scale-95`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <PumpIcon />
                <span className="text-xs font-semibold">{scenario.label}</span>
                <span className="text-sm font-bold mono">+{scenario.value}%</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent 
                            translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
            </button>
          ))}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 font-semibold">Quick:</span>
        <div className="flex gap-2 flex-1">
          {quickPresets.map((value) => (
            <button
              key={value}
              onClick={() => onSimulate(value)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold mono border 
                        transition-all duration-200 backdrop-blur-sm ${getQuickButtonClass(value)}
                        active:scale-95`}
            >
              {value > 0 ? '+' : ''}{value}%
            </button>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="flex gap-2.5">
        <div className="relative flex-1">
          <input
            type="number"
            value={customPercent}
            onChange={(e) => setCustomPercent(e.target.value)}
            placeholder="Custom % change"
            className="input-field w-full pr-10 text-sm"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
            %
          </span>
        </div>
        <button
          onClick={handleCustomSimulate}
          disabled={!customPercent}
          className="btn-primary px-6 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Simulate
        </button>
      </div>

      {/* Risk Warning */}
      {customPercent && parseFloat(customPercent) < -30 && (
        <div className="p-3.5 bg-red-950/30 border border-red-900/40 rounded-xl animate-fade-in">
          <div className="flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-red-400 text-sm font-medium">
              High risk scenario - This would likely trigger liquidation
            </p>
          </div>
        </div>
      )}
    </div>
  );
};