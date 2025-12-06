import React from 'react';
import { Play, Pause, Rewind, FastForward, Clock } from 'lucide-react';

interface Props {
  currentTime: number;
  setCurrentTime: (t: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  speed: number;
  setSpeed: (s: number) => void;
  compact?: boolean;
}

export const Timeline: React.FC<Props> = ({ 
  currentTime, setCurrentTime, isPlaying, togglePlay, speed, setSpeed, compact = false
}) => {
  
  const formatTime = (val: number) => {
    // Map 0-100 to 00:00 - 24:00
    const totalMinutes = (val / 100) * 1440;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // MODO COMPACTO (TV MODE / APRESENTAÇÃO)
  if (compact) {
      return (
        <div className="w-full bg-gray-900/80 hover:bg-gray-900/95 border border-gray-600 rounded-full px-4 py-2 flex items-center gap-4 shadow-2xl backdrop-blur-md transition-all">
            {/* Play/Pause Button */}
            <button 
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow transition-transform hover:scale-105 shrink-0"
                title={isPlaying ? "Pausar" : "Reproduzir"}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>

            {/* Time Display */}
            <div className="flex items-center gap-2 font-mono text-blue-400 shrink-0 min-w-[70px]">
                <Clock size={16} />
                <span className="text-lg font-bold">{formatTime(currentTime)}</span>
            </div>

            {/* Progress Bar (Slider) */}
            <div className="flex-1 flex items-center">
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 focus:outline-none"
                />
            </div>

            {/* Speed Toggle (Cyclic) */}
            <button 
                onClick={() => setSpeed(speed === 1 ? 5 : speed === 5 ? 20 : 1)} 
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 border border-gray-600 text-xs font-bold text-gray-300 shrink-0 transition-colors"
                title="Alterar Velocidade"
            >
                {speed}x
            </button>
        </div>
      );
  }

  // MODO PADRÃO (SIDEBAR)
  return (
    <div className="w-full flex flex-col gap-4">
      {/* Time Display */}
      <div className="flex items-center justify-between text-gray-300 text-sm font-mono bg-gray-900 p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-400"/>
            <span className="text-xl font-bold text-white">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
        <label className="text-xs text-gray-400 mb-2 block">Progresso da Operação</label>
        <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={currentTime}
            onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
        />
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-3">
          <div className="flex justify-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
            <button className="text-gray-400 hover:text-white" onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}><Rewind size={20} /></button>
            <button 
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-transform hover:scale-105"
            >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <button className="text-gray-400 hover:text-white" onClick={() => setCurrentTime(Math.min(100, currentTime + 5))}><FastForward size={20} /></button>
          </div>

          <div className="flex gap-2 justify-between bg-gray-800 p-2 rounded-lg border border-gray-700">
             <span className="text-xs text-gray-400 flex items-center">Velocidade:</span>
             <div className="flex gap-1">
                <button onClick={() => setSpeed(1)} className={`px-2 py-1 text-xs rounded ${speed === 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>1x</button>
                <button onClick={() => setSpeed(5)} className={`px-2 py-1 text-xs rounded ${speed === 5 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>5x</button>
                <button onClick={() => setSpeed(20)} className={`px-2 py-1 text-xs rounded ${speed === 20 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>20x</button>
             </div>
          </div>
      </div>
    </div>
  );
};