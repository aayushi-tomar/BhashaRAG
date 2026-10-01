import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react";

interface AudioPlayerProps {
  src: string;
  autoPlay?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  autoPlay = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasError(false);
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Audio playback failed:", err);
        setHasError(true);
      });
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (autoPlay) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const togglePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 2.0];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const restart = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (hasError) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-500/[0.05] border border-red-500/20 text-red-600 dark:text-red-400 text-xs mt-3">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>Synthesized audio stream unavailable.</span>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-sm">
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onError={() => setHasError(true)}
        preload="metadata"
      />

      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center transition-all hover:opacity-90 active:scale-95 shrink-0 shadow-2xs"
          aria-label={
            isPlaying ? "Pause spoken response" : "Play spoken response"
          }
        >
          {isPlaying ? (
            <Pause className="w-3 h-3 fill-current" />
          ) : (
            <Play className="w-3 h-3 fill-current ml-0.5" />
          )}
        </button>

        {/* Scrubber & Time */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mb-1">
            <span className="flex items-center gap-1 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
              <span>Indic Voice Response</span>
            </span>
            <span>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1 bg-slate-200 dark:bg-white/[0.08] rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              style={{
                background: `linear-gradient(to right, #f59e0b ${progressPercent}%, rgba(255, 255, 255, 0.08) ${progressPercent}%)`,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={restart}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Restart audio"
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          <button
            onClick={togglePlaybackRate}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
            title="Playback speed"
          >
            {playbackRate}x
          </button>

          <button
            onClick={toggleMute}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors hidden sm:inline-flex"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-3 h-3 text-red-500" />
            ) : (
              <Volume2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
