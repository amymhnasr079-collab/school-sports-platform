import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  Eye,
  Maximize,
  Minimize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Settings,
  RefreshCw,
  ExternalLink,
  Film,
  Sparkles,
} from 'lucide-react';

interface EmbeddedVideoPlayerProps {
  src: string | null;
  title: string;
  poster?: string;
  isLoading?: boolean;
  loadingProgress?: number | null;
  loadingMessage?: string;
  onDownload?: () => void;
  isDownloading?: boolean;
  externalUrl?: string;
}

export const EmbeddedVideoPlayer: React.FC<EmbeddedVideoPlayerProps> = ({
  src,
  title,
  poster,
  isLoading = false,
  loadingProgress = null,
  loadingMessage = 'جاري بث وتشغيل الفيديو عبر السحابة...',
  onDownload,
  isDownloading = false,
  externalUrl,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}`;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused || videoRef.current.ended) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Video play prevented:', err);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + seconds)
    );
  };

  const handleVolumeChange = (newVolume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  const handleSpeedChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3500);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip(5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSkip(-5);
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isMuted, volume]);

  return (
    <div className="w-full space-y-3">
      {/* Video Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          if (isPlaying) setShowControls(false);
        }}
        className={`relative w-full overflow-hidden bg-black rounded-2xl border border-[#382012] shadow-2xl select-none group aspect-video flex items-center justify-center ${
          isFullscreen ? 'rounded-none max-h-screen' : 'max-h-[72vh]'
        }`}
      >
        {/* Loading / Buffering Overlay */}
        {(isLoading || isBuffering) && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs p-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center border border-[#7C4E2E] shadow-lg animate-pulse">
              <RefreshCw className="w-7 h-7 animate-spin text-[#D4A76A]" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-white">{loadingMessage}</p>
              <p className="text-xs text-[#D4A76A]">
                {loadingProgress !== null
                  ? `جاري التحميل: ${loadingProgress}%`
                  : 'جاري تهيئة البث المباشر للفيديو...'}
              </p>
            </div>
            {loadingProgress !== null && (
              <div className="w-48 bg-white/20 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#D4A76A] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${Math.max(5, loadingProgress)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* The HTML5 Video Element */}
        {src ? (
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            playsInline
            preload="metadata"
            onClick={togglePlay}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onWaiting={() => setIsBuffering(true)}
            onPlaying={() => setIsBuffering(false)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
              }
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) {
                setDuration(videoRef.current.duration);
              }
            }}
            className="w-full h-full object-contain cursor-pointer"
          >
            متصفحكِ لا يدعم تشغيل هذا الفيديو مباشرة.
          </video>
        ) : (
          !isLoading && (
            <div className="p-8 text-center space-y-3 text-white/80">
              <Film className="w-12 h-12 text-[#D4A76A] mx-auto opacity-70" />
              <p className="text-sm font-bold">بانتظار تجهيز رابط الفيديو...</p>
            </div>
          )
        )}

        {/* Center Big Play Button Overlay when paused */}
        {!isPlaying && !isLoading && src && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-18 h-18 rounded-full bg-[#4A2E1B]/90 hover:bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center border-2 border-[#D4A76A] shadow-2xl transition-all transform hover:scale-110 z-20"
            title="تشغيل الفيديو"
          >
            <Play className="w-8 h-8 fill-[#D4A76A] ml-1" />
          </button>
        )}

        {/* Video Controls Bar Overlay */}
        {src && (
          <div
            className={`absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-4 z-20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Timeline Progress Bar */}
            <div className="flex items-center gap-3 mb-2.5">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setCurrentTime(val);
                  if (videoRef.current) {
                    videoRef.current.currentTime = val;
                  }
                }}
                className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#D4A76A] hover:h-2 transition-all"
                dir="ltr"
              />
            </div>

            {/* Controls Toolbar */}
            <div className="flex items-center justify-between text-white text-xs gap-2 flex-wrap">
              {/* Left Side: Playback & Volume */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[#D4A76A] flex items-center justify-center transition-colors"
                  title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-[#D4A76A]" />
                  ) : (
                    <Play className="w-4 h-4 fill-[#D4A76A] ml-0.5" />
                  )}
                </button>

                {/* Replay 10s */}
                <button
                  type="button"
                  onClick={() => handleSkip(-10)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-colors"
                  title="رجوع 10 ثوانٍ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Forward 10s */}
                <button
                  type="button"
                  onClick={() => handleSkip(10)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-colors"
                  title="تقديم 10 ثوانٍ"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                {/* Volume & Mute */}
                <div className="flex items-center gap-1.5 group/vol">
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 flex items-center justify-center transition-colors"
                    title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#D4A76A] hidden sm:block"
                    dir="ltr"
                  />
                </div>

                {/* Time Display */}
                <div className="text-[11px] font-mono text-white/90 tabular-nums px-1.5" dir="ltr">
                  <span>{formatTime(currentTime)}</span>
                  <span className="text-white/40 mx-1">/</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Right Side: Speed & Fullscreen */}
              <div className="flex items-center gap-2">
                {/* Playback Speed Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-[#D4A76A] transition-colors flex items-center gap-1"
                    title="سرعة التشغيل"
                  >
                    <span>{playbackRate}x</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#2C1A11] border border-[#7C4E2E] rounded-xl p-1 shadow-2xl flex flex-col gap-0.5 z-40 min-w-[70px]">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleSpeedChange(rate)}
                          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg text-left transition-colors ${
                            playbackRate === rate
                              ? 'bg-[#D4A76A] text-[#2C1A11]'
                              : 'text-white hover:bg-white/10'
                          }`}
                        >
                          {rate}x {rate === 1 && '(عادي)'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fullscreen Button */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[#D4A76A] flex items-center justify-center transition-colors"
                  title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Auxiliary Actions Bar (Download is Secondary and Optional) */}
      <div className="bg-[#FAF5EC] rounded-xl border border-[#DFCDB6] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#4A2E1B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">مشغل الفيديو المدمج جاهز ويعمل مباشرة لجميع المستخدمات عبر الرابط ✓</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="تنزيل نسخة من الفيديو على جهازكِ للمشاهدة بدون اتصال بالإنترنت"
            >
              {isDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7C4E2E]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#7C4E2E]" />
              )}
              <span>تحميل نسخة للجهاز (اختياري)</span>
            </button>
          )}

          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span>الرابط المباشر</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
