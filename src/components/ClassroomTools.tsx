import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Dices,
  Flame,
  Hourglass,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  Shuffle,
  Sparkles,
  Trophy,
  Trash2,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { AppDatabase, AuthUser, Student } from '../types';
import { getGradeLabel } from '../constants';
import { sportsAudio } from '../services/soundEffects';

interface ClassroomToolsProps {
  db: AppDatabase;
  currentUser: AuthUser;
  onAwardStickerQuick?: (student: Student) => void;
  onRecordParticipationQuick?: (student: Student) => void;
}

// Warm sports color palette for wheel segments
const WHEEL_COLORS = [
  '#C58B50', // Caramel Gold
  '#4A2E1B', // Deep Espresso
  '#059669', // Emerald Sports
  '#D97706', // Amber Athletic
  '#7C3AED', // Regal Purple
  '#DC2626', // Crimson Energy
  '#2563EB', // Blue Sprint
  '#0D9488', // Teal Power
  '#E11D48', // Rose Flame
  '#854D0E', // Bronze Champion
  '#16A34A', // Green Energy
  '#475569', // Slate Focus
];

const TEAM_PRESETS = [
  { name: 'فريق الصقور 🦅', color: 'bg-[#B45309] text-white border-[#92400E]', lightBg: 'bg-[#FEF3C7]' },
  { name: 'فريق الفهود 🐆', color: 'bg-[#047857] text-white border-[#065F46]', lightBg: 'bg-[#D1FAE5]' },
  { name: 'فريق النجوم ⭐', color: 'bg-[#6D28D9] text-white border-[#5B21B6]', lightBg: 'bg-[#EDE9FE]' },
  { name: 'فريق الهمم 🔥', color: 'bg-[#BE123C] text-white border-[#9F1239]', lightBg: 'bg-[#FFE4E6]' },
  { name: 'فريق العزيمة 🏆', color: 'bg-[#1D4ED8] text-white border-[#1E40AF]', lightBg: 'bg-[#DBEAFE]' },
];

export const ClassroomTools: React.FC<ClassroomToolsProps> = ({
  db,
  currentUser,
  onAwardStickerQuick,
  onRecordParticipationQuick,
}) => {
  // Navigation inside classroom tools
  const [activeSubTab, setActiveSubTab] = useState<'wheel' | 'teams' | 'timer' | 'hourglass'>('wheel');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // STUDENT SELECTION & FILTERING
  // ---------------------------------------------------------------------------
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [customStudentInput, setCustomStudentInput] = useState('');

  // Extracted unique grades & sections
  const availableGrades = useMemo(() => {
    const grades = Array.from(new Set(db.students.map((s) => s.grade))).sort((a, b) => a - b);
    return grades.length > 0 ? grades : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  }, [db.students]);

  const availableSections = useMemo(() => {
    let filtered = db.students;
    if (selectedGrade !== 'all') {
      filtered = filtered.filter((s) => s.grade === selectedGrade);
    }
    const secs = Array.from(new Set(filtered.map((s) => s.section))).sort();
    return secs.length > 0 ? secs : ['1', '2', '3', '4'];
  }, [db.students, selectedGrade]);

  // Base list of students filtered by grade and section
  const filteredStudents = useMemo(() => {
    let list = db.students;
    if (selectedGrade !== 'all') {
      list = list.filter((s) => s.grade === selectedGrade);
    }
    if (selectedSection !== 'all') {
      list = list.filter((s) => s.section === selectedSection);
    }
    return list;
  }, [db.students, selectedGrade, selectedSection]);

  // Active names on the wheel (can be customized or had students temporarily excluded)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [customNames, setCustomNames] = useState<string[]>([]);
  const [winnerHistory, setWinnerHistory] = useState<
    Array<{ id: string; name: string; timestamp: string; grade?: number; section?: string }>
  >([]);

  // Wheel active participants
  const activeParticipants = useMemo(() => {
    if (customNames.length > 0) {
      return customNames.map((name, i) => ({
        id: `custom-${i}`,
        name,
        grade: typeof selectedGrade === 'number' ? selectedGrade : undefined,
        section: selectedSection !== 'all' ? selectedSection : undefined,
      }));
    }
    return filteredStudents
      .filter((s) => !excludedIds.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        section: s.section,
      }));
  }, [customNames, filteredStudents, excludedIds, selectedGrade, selectedSection]);

  // Handle Mute toggle
  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sportsAudio.isMuted = next;
  };

  // Fullscreen toggle for classroom smartboard projector
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ---------------------------------------------------------------------------
  // WHEEL OF FORTUNE CANVAS & PHYSICS
  // ---------------------------------------------------------------------------
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<{
    id: string;
    name: string;
    grade?: number;
    section?: string;
  } | null>(null);

  const rotationRef = useRef<number>(0);
  const angularVelocityRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);
  const lastTickAngleRef = useRef<number>(0);

  // Redraw Wheel
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 24;

    ctx.clearRect(0, 0, size, size);

    const items = activeParticipants;
    const count = items.length;

    if (count === 0) {
      // Empty placeholder wheel
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#FAF5ED';
      ctx.fill();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#DFCDB6';
      ctx.stroke();

      ctx.fillStyle = '#7D6752';
      ctx.font = 'bold 16px Cairo, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('الرجاء اختيار صف أو إضافة طالبات', center, center);
      return;
    }

    const arc = (2 * Math.PI) / count;
    const currentRot = rotationRef.current;

    // Draw outer sports rim
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#3D2517';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#D4A76A';
    ctx.stroke();

    // Outer rim sports studs / pegs
    const pegCount = Math.max(count * 2, 24);
    for (let p = 0; p < pegCount; p++) {
      const pegAngle = (p * (2 * Math.PI)) / pegCount + currentRot;
      const px = center + (radius + 6) * Math.cos(pegAngle);
      const py = center + (radius + 6) * Math.sin(pegAngle);
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#F5E8D3';
      ctx.fill();
    }

    // Draw slices
    for (let i = 0; i < count; i++) {
      const angle = currentRot + i * arc;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arc);
      ctx.closePath();

      // Pick vibrant color
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Slice Text (Student Name)
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';

      // Dynamic font size depending on slices count
      const fontSize = count > 20 ? 11 : count > 12 ? 13 : 15;
      ctx.font = `bold ${fontSize}px Cairo, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 4;

      const name = items[i].name;
      // Truncate if long
      const displayName = name.length > 18 ? name.slice(0, 16) + '..' : name;
      ctx.fillText(displayName, radius - 18, 0);
      ctx.restore();
    }

    // Center Sports Badge
    ctx.beginPath();
    ctx.arc(center, center, 38, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#C58B50';
    ctx.stroke();

    // Center Inner Golden Core
    ctx.beginPath();
    ctx.arc(center, center, 28, 0, 2 * Math.PI);
    ctx.fillStyle = '#3D2517';
    ctx.fill();

    ctx.fillStyle = '#D4A76A';
    ctx.font = 'bold 12px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('طاقة', center, center - 6);
    ctx.font = 'bold 10px Cairo, sans-serif';
    ctx.fillText('وانطلاقة', center, center + 8);

    ctx.restore();
  }, [activeParticipants]);

  // Render on mount and state update
  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#D4A76A', '#3D2517', '#059669', '#E11D48', '#2563EB', '#F59E0B'],
    });
  };

  // Spin the wheel with realistic physics
  const spinWheel = () => {
    if (isSpinning || activeParticipants.length === 0) return;

    setSelectedWinner(null);
    setIsSpinning(true);

    // Initial angular velocity (randomized between 0.28 and 0.45 rad/frame)
    const initialVelocity = 0.32 + Math.random() * 0.18;
    angularVelocityRef.current = initialVelocity;
    // Friction deceleration
    const friction = 0.988 + Math.random() * 0.004;

    lastTickAngleRef.current = rotationRef.current;
    const arc = (2 * Math.PI) / activeParticipants.length;

    const animate = () => {
      angularVelocityRef.current *= friction;
      rotationRef.current += angularVelocityRef.current;

      // Play tick sound when moving past peg
      const currentAngle = rotationRef.current;
      const angleDiff = Math.abs(currentAngle - lastTickAngleRef.current);
      if (angleDiff >= arc) {
        sportsAudio.playWheelTick();
        lastTickAngleRef.current = currentAngle;
      }

      drawWheel();

      // Check if wheel slowed to a stop
      if (angularVelocityRef.current < 0.002) {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        setIsSpinning(false);

        // Calculate winning slice pointing at Top (angle = 3 * PI / 2 or 270 deg)
        // Since wheel rotates counter-clockwise/clockwise, pointer is at 270 deg (top)
        const total = activeParticipants.length;
        const normalized = (rotationRef.current % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        // Pointer is at angle 3*PI/2 (top: -PI/2 or 3PI/2)
        const pointerAngle = (3 * Math.PI) / 2;
        let relativeAngle = (pointerAngle - normalized) % (2 * Math.PI);
        if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

        const winningIndex = Math.floor(relativeAngle / arc) % total;
        const winner = activeParticipants[winningIndex];

        if (winner) {
          setSelectedWinner(winner);
          sportsAudio.playWinnerFanfare();
          triggerConfetti();

          // Add to winner history
          setWinnerHistory((prev) => [
            {
              id: winner.id,
              name: winner.name,
              grade: winner.grade,
              section: winner.section,
              timestamp: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }),
            },
            ...prev,
          ]);
        }
        return;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  // Instant Random Draw (Fast Pick without waiting for wheel spin)
  const instantRandomDraw = () => {
    if (activeParticipants.length === 0) return;
    const randomIndex = Math.floor(Math.random() * activeParticipants.length);
    const winner = activeParticipants[randomIndex];

    setSelectedWinner(winner);
    sportsAudio.playWinnerFanfare();
    triggerConfetti();

    // Rotate wheel to center that winner
    const arc = (2 * Math.PI) / activeParticipants.length;
    rotationRef.current = (3 * Math.PI) / 2 - (randomIndex + 0.5) * arc;
    drawWheel();

    setWinnerHistory((prev) => [
      {
        id: winner.id,
        name: winner.name,
        grade: winner.grade,
        section: winner.section,
        timestamp: new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
  };

  // Exclude winner from future rounds so every student gets a turn
  const handleExcludeWinner = (id: string) => {
    setExcludedIds((prev) => new Set([...prev, id]));
    setSelectedWinner(null);
  };

  // Reset excluded students
  const handleResetExclusions = () => {
    setExcludedIds(new Set());
    setSelectedWinner(null);
  };

  // ---------------------------------------------------------------------------
  // RANDOM SHUFFLE & TEAM GENERATOR
  // ---------------------------------------------------------------------------
  const [shuffledList, setShuffledList] = useState<Array<{ rank: number; student: Student }>>([]);
  const [teamCount, setTeamCount] = useState<number>(2);
  const [generatedTeams, setGeneratedTeams] = useState<Array<{ name: string; color: string; lightBg: string; members: Student[] }>>([]);

  // Generate random order for all filtered students
  const handleShuffleOrder = () => {
    if (filteredStudents.length === 0) return;
    const shuffled = [...filteredStudents].sort(() => Math.random() - 0.5);
    setShuffledList(shuffled.map((s, idx) => ({ rank: idx + 1, student: s })));
    sportsAudio.playWinnerFanfare();
    triggerConfetti();
  };

  // Divide class into teams
  const handleGenerateTeams = () => {
    if (filteredStudents.length === 0) return;
    const shuffled = [...filteredStudents].sort(() => Math.random() - 0.5);

    const teams: Array<{ name: string; color: string; lightBg: string; members: Student[] }> = [];
    for (let i = 0; i < teamCount; i++) {
      const preset = TEAM_PRESETS[i % TEAM_PRESETS.length];
      teams.push({
        name: preset.name,
        color: preset.color,
        lightBg: preset.lightBg,
        members: [],
      });
    }

    shuffled.forEach((s, idx) => {
      teams[idx % teamCount].members.push(s);
    });

    setGeneratedTeams(teams);
    sportsAudio.playWhistle();
    triggerConfetti();
  };

  // ---------------------------------------------------------------------------
  // PROFESSIONAL DIGITAL SPORTS TIMER
  // ---------------------------------------------------------------------------
  const [timerMode, setTimerMode] = useState<'countdown' | 'stopwatch'>('countdown');
  const [countdownDuration, setCountdownDuration] = useState<number>(60); // in seconds
  const [remainingTime, setRemainingTime] = useState<number>(60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('1');
  const [customSecondsInput, setCustomSecondsInput] = useState<string>('0');

  // Stopwatch state
  const [stopwatchMs, setStopwatchMs] = useState<number>(0);
  const [stopwatchLaps, setStopwatchLaps] = useState<Array<{ lap: number; timeFormatted: string; studentName?: string }>>([]);
  const stopwatchIntervalRef = useRef<number | null>(null);

  // Countdown Interval
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timerMode === 'countdown') {
      timer = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimerRunning(false);
            sportsAudio.playWhistle();
            triggerConfetti();
            return 0;
          }
          // Beep on 3, 2, 1
          if (prev <= 4 && prev > 1) {
            sportsAudio.playCountdownBeep(false);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timerMode]);

  // Stopwatch Interval
  useEffect(() => {
    if (isTimerRunning && timerMode === 'stopwatch') {
      const start = Date.now() - stopwatchMs;
      stopwatchIntervalRef.current = window.setInterval(() => {
        setStopwatchMs(Date.now() - start);
      }, 35);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isTimerRunning, timerMode, stopwatchMs]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
    sportsAudio.playCountdownBeep(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    if (timerMode === 'countdown') {
      setRemainingTime(countdownDuration);
    } else {
      setStopwatchMs(0);
      setStopwatchLaps([]);
    }
  };

  const handleSetPresetCountdown = (seconds: number) => {
    setIsTimerRunning(false);
    setCountdownDuration(seconds);
    setRemainingTime(seconds);
  };

  const handleApplyCustomCountdown = () => {
    const mins = parseInt(customMinutesInput) || 0;
    const secs = parseInt(customSecondsInput) || 0;
    const total = mins * 60 + secs;
    if (total > 0) {
      handleSetPresetCountdown(total);
    }
  };

  const handleAddStopwatchLap = () => {
    const formatted = formatStopwatch(stopwatchMs);
    setStopwatchLaps((prev) => [
      { lap: prev.length + 1, timeFormatted: formatted },
      ...prev,
    ]);
  };

  const formatStopwatch = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  const formatCountdown = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ---------------------------------------------------------------------------
  // INTERACTIVE SAND TIMER (HOURGLASS)
  // ---------------------------------------------------------------------------
  const [sandDuration, setSandDuration] = useState<number>(60); // seconds
  const [sandRemaining, setSandRemaining] = useState<number>(60);
  const [isSandRunning, setIsSandRunning] = useState<boolean>(false);
  const [isSandFlipped, setIsSandFlipped] = useState<boolean>(false);
  const sandCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSandRunning) {
      interval = setInterval(() => {
        setSandRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsSandRunning(false);
            sportsAudio.playWhistle();
            triggerConfetti();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isSandRunning]);

  // Draw Realistic Flowing Hourglass
  useEffect(() => {
    const canvas = sandCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particleOffset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const progress = 1 - sandRemaining / sandDuration; // 0 (start) to 1 (full bottom)

      // Center coordinates
      const cx = width / 2;
      const topBulbY = 55;
      const neckY = height / 2;
      const bottomBulbY = height - 55;
      const bulbRadius = 65;

      // Draw Wooden/Sports Frame (Top & Bottom bases)
      ctx.fillStyle = '#3D2517';
      ctx.strokeStyle = '#D4A76A';
      ctx.lineWidth = 3;

      // Top Base
      ctx.beginPath();
      ctx.roundRect(cx - 85, 20, 170, 16, 8);
      ctx.fill();
      ctx.stroke();

      // Bottom Base
      ctx.beginPath();
      ctx.roundRect(cx - 85, height - 36, 170, 16, 8);
      ctx.fill();
      ctx.stroke();

      // Side Pillars
      ctx.fillStyle = '#4A2E1B';
      ctx.beginPath();
      ctx.roundRect(cx - 80, 36, 12, height - 72, 4);
      ctx.roundRect(cx + 68, 36, 12, height - 72, 4);
      ctx.fill();

      // Glass Outer Outline
      ctx.save();
      ctx.beginPath();
      // Upper bulb
      ctx.moveTo(cx - 65, 42);
      ctx.bezierCurveTo(cx - 65, neckY - 20, cx - 12, neckY - 10, cx - 6, neckY);
      // Lower bulb
      ctx.bezierCurveTo(cx - 12, neckY + 10, cx - 65, neckY + 20, cx - 65, height - 42);
      ctx.lineTo(cx + 65, height - 42);
      ctx.bezierCurveTo(cx + 65, neckY + 20, cx + 12, neckY + 10, cx + 6, neckY);
      ctx.bezierCurveTo(cx + 12, neckY - 10, cx + 65, neckY - 20, cx + 65, 42);
      ctx.closePath();

      // Glass sheen gradient
      const glassGrad = ctx.createLinearGradient(cx - 65, 0, cx + 65, 0);
      glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      glassGrad.addColorStop(0.3, 'rgba(240, 245, 255, 0.15)');
      glassGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.3)');
      glassGrad.addColorStop(1, 'rgba(200, 220, 240, 0.45)');
      ctx.fillStyle = glassGrad;
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#B89060';
      ctx.stroke();
      ctx.clip(); // Clip sand inside glass

      // Sand Color Gradient (Warm Golden Caramel Sand)
      const sandGrad = ctx.createLinearGradient(0, 40, 0, height - 40);
      sandGrad.addColorStop(0, '#D4A76A');
      sandGrad.addColorStop(0.5, '#C58B50');
      sandGrad.addColorStop(1, '#96602E');

      // 1. Upper Sand Level (decreasing as progress goes from 0 -> 1)
      const upperRemainingRatio = Math.max(0, 1 - progress);
      if (upperRemainingRatio > 0.02) {
        const upperSandHeight = 90 * upperRemainingRatio;
        const upperTopY = neckY - 10 - upperSandHeight;
        ctx.beginPath();
        ctx.moveTo(cx - 55, upperTopY);
        ctx.quadraticCurveTo(cx, upperTopY + 8, cx + 55, upperTopY);
        ctx.lineTo(cx + 8, neckY - 5);
        ctx.lineTo(cx - 8, neckY - 5);
        ctx.closePath();
        ctx.fillStyle = sandGrad;
        ctx.fill();
      }

      // 2. Stream of falling sand particles (if timer is running and time remains)
      if (isSandRunning && sandRemaining > 0) {
        ctx.strokeStyle = '#E6BA7E';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cx, neckY - 4);
        ctx.lineTo(cx, height - 52 - 70 * progress);
        ctx.stroke();

        // Animated Grains
        particleOffset = (particleOffset + 2) % 12;
        ctx.fillStyle = '#FFFFFF';
        for (let p = 0; p < 5; p++) {
          const py = neckY + 15 + p * 20 + particleOffset;
          if (py < height - 52 - 70 * progress) {
            ctx.beginPath();
            ctx.arc(cx + (Math.sin(p) * 1.5), py, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      }

      // 3. Lower Sand Mound (increasing as progress goes from 0 -> 1)
      if (progress > 0.01) {
        const lowerSandHeight = 85 * Math.min(progress, 1);
        const lowerTopY = height - 44 - lowerSandHeight;
        ctx.beginPath();
        ctx.moveTo(cx - 55, height - 42);
        ctx.lineTo(cx + 55, height - 42);
        ctx.quadraticCurveTo(cx + 35, lowerTopY + 8, cx, lowerTopY);
        ctx.quadraticCurveTo(cx - 35, lowerTopY + 8, cx - 55, height - 42);
        ctx.closePath();
        ctx.fillStyle = sandGrad;
        ctx.fill();
      }

      ctx.restore();

      if (isSandRunning) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [sandRemaining, sandDuration, isSandRunning, isSandFlipped]);

  const flipHourglass = () => {
    setIsSandFlipped((prev) => !prev);
    setIsSandRunning(false);
    setSandRemaining(sandDuration);
    sportsAudio.playCountdownBeep(true);
  };

  return (
    <div
      ref={containerRef}
      className={`space-y-6 ${
        isFullscreen ? 'bg-[#FAF7F2] p-6 min-h-screen overflow-y-auto' : ''
      }`}
      dir="rtl"
    >
      {/* =====================================================================
          HEADER WITH SPORTS THEME & CONTROLS
          ===================================================================== */}
      <div className="bg-gradient-to-l from-[#3D2517] via-[#4F3320] to-[#2B180E] text-white rounded-3xl p-6 sm:p-7 border border-[#5C3922] shadow-[0_12px_36px_rgba(43,24,14,0.2)] relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-[#C58B50]/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-[#D4A76A]/20 text-[#D4A76A] border border-[#D4A76A]/30">
                <Dices className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <span>أدوات الحصة والقرعة الرياضية</span>
                  <span className="text-sm font-bold text-[#F5E8D3] bg-[#C58B50]/30 px-2.5 py-0.5 rounded-xl border border-[#C58B50]/50">
                    (طاقة وانطلاقة)
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-[#F5ECE0]/80">
                  العجلة الدوارة لاختيار الطالبات عشوائياً، تشكيل الفرق الرياضية، والمؤقت والساعة الرملية للحصة
                </p>
              </div>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isMuted
                  ? 'bg-red-500/20 border-red-500/40 text-red-200'
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
              title={isMuted ? 'تشغيل المؤثرات الصوتية الرياضية' : 'كتم الصوت الرياضي'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#D4A76A]" />}
              <span className="hidden sm:inline">{isMuted ? 'الصوت صامت' : 'صوت رياضي'}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              title="عرض كامل الشاشة للشاشات الذكية وجهاز العرض"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-[#D4A76A]" />}
              <span className="hidden sm:inline">{isFullscreen ? 'إنهاء الشاشة الكاملة' : 'عرض الشاشة'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs between Tools */}
        <div className="relative mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('wheel')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'wheel'
                ? 'bg-[#D4A76A] text-[#2B180E] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>العجلة الدوارة للقرعة 🎡</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('teams')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'teams'
                ? 'bg-[#D4A76A] text-[#2B180E] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>الترتيب العشوائي والفرق 🎽</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('timer')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'timer'
                ? 'bg-[#D4A76A] text-[#2B180E] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>المؤقت الرقمي وساعة الإيقاف ⏱️</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('hourglass')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeSubTab === 'hourglass'
                ? 'bg-[#D4A76A] text-[#2B180E] shadow-sm'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <Hourglass className="w-4 h-4" />
            <span>الساعة الرملية الرياضية ⏳</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: SPINNING WHEEL (عجلة الحظ الدوارة)
          ===================================================================== */}
      {activeSubTab === 'wheel' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls & Class Filter Column */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#F7EFE4] pb-3">
                <h3 className="text-sm font-black text-[#2C1A11] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#7C4E2E]" />
                  <span>تحديد الصف والشعبة للسحب</span>
                </h3>
                <span className="text-xs font-bold text-[#7C4E2E] bg-[#FAF5EC] px-2 py-0.5 rounded-lg border border-[#DFCDB6]">
                  {activeParticipants.length} طالبة في العجلة
                </span>
              </div>

              {/* Grade Selector */}
              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1.5">
                  اختيار الصف الدراسي:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1 bg-[#FAF7F2] rounded-xl border border-[#E8DDD0]">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGrade('all');
                      setCustomNames([]);
                    }}
                    className={`px-2 py-1.5 text-xs font-black rounded-lg transition-colors ${
                      selectedGrade === 'all'
                        ? 'bg-[#4A2E1B] text-white shadow-2xs'
                        : 'bg-white text-[#5A402D] hover:bg-[#F2E8DC]'
                    }`}
                  >
                    الكل
                  </button>
                  {availableGrades.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setSelectedGrade(g);
                        setCustomNames([]);
                      }}
                      className={`px-2 py-1.5 text-xs font-black rounded-lg transition-colors ${
                        selectedGrade === g
                          ? 'bg-[#4A2E1B] text-white shadow-2xs'
                          : 'bg-white text-[#5A402D] hover:bg-[#F2E8DC]'
                      }`}
                    >
                      {getGradeLabel(g)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section Selector */}
              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1.5">
                  الشعبة:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSection('all');
                      setCustomNames([]);
                    }}
                    className={`px-3 py-1 text-xs font-black rounded-lg transition-colors ${
                      selectedSection === 'all'
                        ? 'bg-[#7C4E2E] text-white'
                        : 'bg-[#FAF7F2] text-[#5A402D] hover:bg-[#F2E8DC] border border-[#E8DDD0]'
                    }`}
                  >
                    كافة الشعب
                  </button>
                  {availableSections.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec);
                        setCustomNames([]);
                      }}
                      className={`px-3 py-1 text-xs font-black rounded-lg transition-colors ${
                        selectedSection === sec
                          ? 'bg-[#7C4E2E] text-white'
                          : 'bg-[#FAF7F2] text-[#5A402D] hover:bg-[#F2E8DC] border border-[#E8DDD0]'
                      }`}
                    >
                      شعبة {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exclusions status */}
              {excludedIds.size > 0 && (
                <div className="bg-[#FEF3C7] border border-[#FDE68A] p-3 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[#92400E] font-bold">
                    تم استبعاد ({excludedIds.size}) طالبة تم اختيارهن
                  </span>
                  <button
                    type="button"
                    onClick={handleResetExclusions}
                    className="text-xs font-black text-[#B45309] hover:underline"
                  >
                    إرجاع الجميع للعجلة
                  </button>
                </div>
              )}

              {/* Quick Add Custom Names */}
              <div className="pt-2 border-t border-[#F7EFE4] space-y-2">
                <label className="block text-xs font-bold text-[#5A402D]">
                  إضافة طالبات يدويًا (مفصولة بفواصل):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customStudentInput}
                    onChange={(e) => setCustomStudentInput(e.target.value)}
                    placeholder="مثال: مريم، فاطمة، عائشة..."
                    className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl focus:outline-none focus:border-[#7C4E2E]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customStudentInput.trim()) return;
                      const parts = customStudentInput
                        .split(/[,،\n]/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      setCustomNames((prev) => [...prev, ...parts]);
                      setCustomStudentInput('');
                    }}
                    className="px-3 py-1.5 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl hover:bg-[#382012]"
                  >
                    إضافة
                  </button>
                </div>
                {customNames.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomNames([])}
                    className="text-[11px] text-red-600 hover:underline block"
                  >
                    إلغاء القائمة اليدوية والعودة لقائمة المدرسة
                  </button>
                )}
              </div>
            </div>

            {/* Winner History Card */}
            <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#F7EFE4] pb-2">
                <h4 className="text-xs font-black text-[#2C1A11] flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-[#D4A76A]" />
                  <span>سجل الطالبات المشاركات في الحصة</span>
                </h4>
                {winnerHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setWinnerHistory([])}
                    className="text-[11px] text-[#7D6752] hover:text-red-600"
                  >
                    مسح السجل
                  </button>
                )}
              </div>

              {winnerHistory.length === 0 ? (
                <p className="text-xs text-[#8C7560] py-2 text-center">
                  لم يتم إجراء قرعة بعد. قومي بتدوير العجلة لاختيار أول طالبة!
                </p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {winnerHistory.map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[#E8DDD0] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EADDCA] text-[#4A2E1B] font-black text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#2C1A11]">{item.name}</span>
                      </div>
                      <span className="text-[10px] text-[#7D6752] tabular-nums">{item.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Wheel Canvas Display */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E8DDD0] p-6 shadow-sm relative">
            {/* Pointer / Needle at Top */}
            <div className="relative z-10 flex flex-col items-center -mb-6">
              <div
                className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[34px] border-t-[#D4A76A] filter drop-shadow-[0_4px_8px_rgba(74,46,27,0.35)]"
                style={{ transform: 'rotate(180deg)' }}
              />
              <div className="w-5 h-5 rounded-full bg-[#3D2517] border-2 border-white -mt-2 shadow-sm" />
            </div>

            {/* Canvas Wheel */}
            <div className="relative p-2">
              <canvas
                ref={canvasRef}
                width={520}
                height={520}
                className="max-w-full h-auto cursor-pointer select-none"
                onClick={spinWheel}
              />
            </div>

            {/* Actions Toolbar below wheel */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={spinWheel}
                disabled={isSpinning || activeParticipants.length === 0}
                className={`px-7 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-2.5 shadow-md ${
                  isSpinning || activeParticipants.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#4A2E1B] hover:bg-[#382012] text-white hover:scale-102 active:scale-98'
                }`}
              >
                <Sparkles className="w-5 h-5 text-[#D4A76A]" />
                <span>{isSpinning ? 'العجلة تدور الآن...' : 'تدوير العجلة واختيار طالبة 🎡'}</span>
              </button>

              <button
                type="button"
                onClick={instantRandomDraw}
                disabled={isSpinning || activeParticipants.length === 0}
                className="px-5 py-3 rounded-2xl bg-[#FAF5EC] hover:bg-[#F2E8DC] border border-[#DFCDB6] text-[#4A2E1B] text-xs font-black transition-all flex items-center gap-2"
                title="سحب عشوائي فوري بضغطة زر بدون انتظار دوران العجلة"
              >
                <Zap className="w-4 h-4 text-[#D4A76A]" />
                <span>سحب سريع فوري ⚡</span>
              </button>
            </div>

            {/* Winner Announcement Card */}
            {selectedWinner && (
              <div className="mt-6 w-full max-w-md bg-gradient-to-r from-[#FAF5EC] via-white to-[#FAF5EC] border-2 border-[#D4A76A] rounded-2xl p-5 shadow-lg text-center animate-in fade-in zoom-in-95 duration-300">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-black mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                  <span>طالبة المشاركة المختارة بالقرعة!</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-[#2C1A11] mb-1">
                  🎉 {selectedWinner.name} 🎉
                </h3>
                {selectedWinner.grade && (
                  <p className="text-xs font-bold text-[#7C4E2E]">
                    {getGradeLabel(selectedWinner.grade)} {selectedWinner.section ? `· شعبة ${selectedWinner.section}` : ''}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExcludeWinner(selectedWinner.id)}
                    className="px-3.5 py-1.5 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl hover:bg-[#382012] transition-colors"
                  >
                    استبعادها من السحب القادم (لإتاحة الفرصة للبقية)
                  </button>

                  <button
                    type="button"
                    onClick={spinWheel}
                    className="px-3.5 py-1.5 bg-[#FAF5EC] border border-[#DFCDB6] text-[#4A2E1B] text-xs font-bold rounded-xl hover:bg-[#F2E8DC] transition-colors"
                  >
                    إعادة السحب مباشرة 🔄
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: RANDOM SHUFFLE & TEAM GENERATOR (الترتيب العشوائي وتشكيل الفرق)
          ===================================================================== */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#E8DDD0] p-6 shadow-xs space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#F7EFE4] pb-4">
              <div>
                <h3 className="text-base font-black text-[#2C1A11] flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-[#7C4E2E]" />
                  <span>الترتيب العشوائي وتشكيل الفرق الرياضية</span>
                </h3>
                <p className="text-xs text-[#7D6752] mt-0.5">
                  ترتيب عشوائي عادل لطالبات الصف، أو تقسيمهن إلى فرق رياضية متوازنة في ثوانٍ
                </p>
              </div>

              {/* Class & Section select */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 py-1.5 text-xs font-bold bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl text-[#2C1A11]"
                >
                  <option value="all">كافة الصفوف</option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      {getGradeLabel(g)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl text-[#2C1A11]"
                >
                  <option value="all">كافة الشعب</option>
                  {availableSections.map((s) => (
                    <option key={s} value={s}>
                      شعبة {s}
                    </option>
                  ))}
                </select>

                <span className="text-xs font-bold text-[#7C4E2E] bg-[#FAF5EC] px-2.5 py-1.5 rounded-xl border border-[#DFCDB6]">
                  {filteredStudents.length} طالبة
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Shuffle Line-up */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DDD0] space-y-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#4A2E1B] text-[#D4A76A]">
                    <Shuffle className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-[#2C1A11]">ترتيب الطالبات عشوائيًا</h4>
                    <p className="text-[11px] text-[#7D6752]">ترتيب دور كل طالبة في المسابقات والتمارين الرياضية</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleShuffleOrder}
                  disabled={filteredStudents.length === 0}
                  className="w-full py-2.5 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Shuffle className="w-4 h-4 text-[#D4A76A]" />
                  <span>توليد الترتيب العشوائي لطالبات الصف 🎲</span>
                </button>
              </div>

              {/* Option B: Team Generator */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8DDD0] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#059669] text-white">
                      <Shield className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-[#2C1A11]">تقسيم الصف إلى فرق رياضية</h4>
                      <p className="text-[11px] text-[#7D6752]">توزيع عشوائي متوازن بأسماء وشارات رياضية</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[#5A402D] font-bold">الفرق:</span>
                    {[2, 3, 4, 5].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setTeamCount(cnt)}
                        className={`w-7 h-7 rounded-lg text-xs font-black transition-colors ${
                          teamCount === cnt
                            ? 'bg-[#059669] text-white'
                            : 'bg-white border border-[#E8DDD0] text-[#5A402D]'
                        }`}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateTeams}
                  disabled={filteredStudents.length === 0}
                  className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
                >
                  <Trophy className="w-4 h-4 text-[#A7F3D0]" />
                  <span>تشكيل {teamCount} فرق رياضية عشوائياً 🏆</span>
                </button>
              </div>
            </div>

            {/* Shuffled List Display */}
            {shuffledList.length > 0 && (
              <div className="pt-4 border-t border-[#F7EFE4] space-y-3">
                <h4 className="text-xs font-black text-[#2C1A11] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                  <span>الترتيب العشوائي المعتمد للأدوار:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {shuffledList.map((item) => (
                    <div
                      key={item.student.id}
                      className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD0] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#4A2E1B] text-[#D4A76A] font-black flex items-center justify-center text-xs">
                          {item.rank}
                        </span>
                        <span className="font-bold text-[#2C1A11]">{item.student.name}</span>
                      </div>
                      <span className="text-[10px] text-[#7D6752]">
                        {getGradeLabel(item.student.grade)}/{item.student.section}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generated Teams Display */}
            {generatedTeams.length > 0 && (
              <div className="pt-4 border-t border-[#F7EFE4] space-y-4">
                <h4 className="text-xs font-black text-[#2C1A11] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#D4A76A]" />
                  <span>الفرق الرياضية المتشكلة للحصة:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {generatedTeams.map((team, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-[#E8DDD0] bg-white overflow-hidden shadow-xs flex flex-col justify-between"
                    >
                      <div className={`p-3 font-black text-sm flex items-center justify-between ${team.color}`}>
                        <span>{team.name}</span>
                        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-lg backdrop-blur-xs">
                          {team.members.length} طالبات
                        </span>
                      </div>
                      <div className="p-3 space-y-1.5 flex-1 max-h-60 overflow-y-auto">
                        {team.members.map((member, mIdx) => (
                          <div
                            key={member.id}
                            className="p-1.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD0] text-xs flex items-center justify-between font-bold text-[#2C1A11]"
                          >
                            <span>
                              {mIdx + 1}. {member.name}
                            </span>
                            <span className="text-[10px] text-[#7D6752]">
                              شعبة {member.section}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: DIGITAL SPORTS TIMER & STOPWATCH (المؤقت الرقمي وساعة الإيقاف)
          ===================================================================== */}
      {activeSubTab === 'timer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Digital Display */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E8DDD0] p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center space-y-6">
            {/* Mode switch (Countdown vs Stopwatch) */}
            <div className="flex items-center p-1 bg-[#FAF7F2] rounded-2xl border border-[#E8DDD0]">
              <button
                type="button"
                onClick={() => {
                  handleResetTimer();
                  setTimerMode('countdown');
                }}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  timerMode === 'countdown'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#5A402D] hover:text-[#2C1A11]'
                }`}
              >
                مؤقت العد التنازلي ⏳
              </button>

              <button
                type="button"
                onClick={() => {
                  handleResetTimer();
                  setTimerMode('stopwatch');
                }}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
                  timerMode === 'stopwatch'
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'text-[#5A402D] hover:text-[#2C1A11]'
                }`}
              >
                ساعة الإيقاف (الأزمنة) ⏱️
              </button>
            </div>

            {/* Huge Digital Sports Display */}
            <div
              className={`w-full max-w-xl py-10 px-6 rounded-3xl text-center shadow-inner transition-colors duration-300 ${
                timerMode === 'countdown' && remainingTime <= 5 && isTimerRunning
                  ? 'bg-red-950 text-red-200 border-4 border-red-500 animate-pulse'
                  : 'bg-[#1C140E] text-[#D4A76A] border-4 border-[#3D2517]'
              }`}
            >
              <div className="text-[64px] sm:text-[96px] md:text-[110px] font-black tracking-widest font-mono select-none leading-none tabular-nums">
                {timerMode === 'countdown'
                  ? formatCountdown(remainingTime)
                  : formatStopwatch(stopwatchMs)}
              </div>
              <div className="text-xs sm:text-sm text-[#F5ECE0]/60 font-bold mt-2">
                {timerMode === 'countdown'
                  ? remainingTime === 0
                    ? 'انتهى الوقت! 🏁'
                    : isTimerRunning
                    ? 'الوقت جارٍ...'
                    : 'المؤقت متوقف'
                  : 'ساعة قياس الأزمنة وسرعات الجري'}
              </div>
            </div>

            {/* Play, Pause, Reset, Lap Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isTimerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="px-8 py-3.5 bg-[#059669] hover:bg-[#047857] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 hover:scale-102"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>بدء التوقيت ▶</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="px-8 py-3.5 bg-[#D97706] hover:bg-[#B45309] text-white font-black text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 hover:scale-102"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>إيقاف مؤقت ⏸</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTimer}
                className="px-6 py-3.5 bg-[#FAF7F2] hover:bg-[#F2E8DC] border border-[#DFCDB6] text-[#4A2E1B] font-black text-sm rounded-2xl transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة ضبط ↺</span>
              </button>

              {timerMode === 'stopwatch' && isTimerRunning && (
                <button
                  type="button"
                  onClick={handleAddStopwatchLap}
                  className="px-6 py-3.5 bg-[#4A2E1B] hover:bg-[#382012] text-white font-black text-sm rounded-2xl transition-all flex items-center gap-2 shadow-xs"
                >
                  <Flame className="w-4 h-4 text-[#D4A76A]" />
                  <span>تسجيل دورة / زمن طالبة 🏅</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Presets & Laps Column */}
          <div className="lg:col-span-4 space-y-4">
            {timerMode === 'countdown' ? (
              <div className="bg-white rounded-3xl border border-[#E8DDD0] p-5 shadow-xs space-y-4">
                <div className="border-b border-[#F7EFE4] pb-3">
                  <h4 className="text-xs font-black text-[#2C1A11] flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-[#D4A76A]" />
                    <span>أوقات جاهزة للتمارين والأنشطة الرياضية</span>
                  </h4>
                  <p className="text-[11px] text-[#7D6752]">اختاري التوقيت المناسب للحصة بضغطة واحدة</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: '15 ثانية', desc: 'إطالة وتمدد', secs: 15 },
                    { label: '30 ثانية', desc: 'تمرين بلانك', secs: 30 },
                    { label: '45 ثانية', desc: 'تمارين بطن', secs: 45 },
                    { label: '1 دقيقة', desc: 'تحدي القوة', secs: 60 },
                    { label: '2 دقيقة', desc: 'جولة تدريبية', secs: 120 },
                    { label: '3 دقائق', desc: 'شوط رياضي', secs: 180 },
                    { label: '5 دقائق', desc: 'لعبة جماعية', secs: 300 },
                    { label: '10 دقائق', desc: 'منافسة الحصة', secs: 600 },
                  ].map((p) => (
                    <button
                      key={p.secs}
                      type="button"
                      onClick={() => handleSetPresetCountdown(p.secs)}
                      className={`p-3 rounded-xl border text-right transition-all ${
                        countdownDuration === p.secs
                          ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-2xs'
                          : 'bg-[#FAF7F2] hover:bg-[#F2E8DC] border-[#E8DDD0] text-[#2C1A11]'
                      }`}
                    >
                      <div className="font-black text-sm">{p.label}</div>
                      <div
                        className={`text-[10px] ${
                          countdownDuration === p.secs ? 'text-[#D4A76A]' : 'text-[#7D6752]'
                        }`}
                      >
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Custom Time Input */}
                <div className="pt-3 border-t border-[#F7EFE4] space-y-2">
                  <span className="block text-xs font-bold text-[#5A402D]">تحديد وقت مخصص:</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="60"
                        value={customMinutesInput}
                        onChange={(e) => setCustomMinutesInput(e.target.value)}
                        placeholder="دقائق"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl text-center font-bold"
                      />
                      <span className="block text-[10px] text-center text-[#7D6752] mt-0.5">دقائق</span>
                    </div>
                    <span className="font-bold text-[#7D6752]">:</span>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={customSecondsInput}
                        onChange={(e) => setCustomSecondsInput(e.target.value)}
                        placeholder="ثواني"
                        className="w-full px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DDD0] rounded-xl text-center font-bold"
                      />
                      <span className="block text-[10px] text-center text-[#7D6752] mt-0.5">ثواني</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCustomCountdown}
                      className="px-3.5 py-1.5 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl hover:bg-[#382012]"
                    >
                      تطبيق
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8DDD0] p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F7EFE4] pb-2">
                  <h4 className="text-xs font-black text-[#2C1A11] flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-[#D4A76A]" />
                    <span>سجل أزمنة الطالبات (Laps)</span>
                  </h4>
                  {stopwatchLaps.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStopwatchLaps([])}
                      className="text-[11px] text-[#7D6752] hover:text-red-600"
                    >
                      مسح
                    </button>
                  )}
                </div>

                {stopwatchLaps.length === 0 ? (
                  <p className="text-xs text-[#8C7560] py-4 text-center">
                    اضغطي على "تسجيل دورة / زمن طالبة" أثناء تشغيل ساعة الإيقاف لحفظ أزمنة السباق
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto">
                    {stopwatchLaps.map((lap) => (
                      <div
                        key={lap.lap}
                        className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD0] flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-[#4A2E1B]">دورة {lap.lap}</span>
                        <span className="font-mono font-black text-sm text-[#2C1A11] tabular-nums">
                          {lap.timeFormatted}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: INTERACTIVE SPORTS SAND TIMER (الساعة الرملية الرياضية)
          ===================================================================== */}
      {activeSubTab === 'hourglass' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hourglass Canvas Canvas Display */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E8DDD0] p-6 sm:p-8 shadow-sm flex flex-col items-center justify-center space-y-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EC] border border-[#DFCDB6] text-xs font-black text-[#4A2E1B]">
                <Hourglass className="w-3.5 h-3.5 text-[#D4A76A]" />
                <span>ساعة رملية فيزيائية تفاعلية للحصة</span>
              </span>
              <div className="text-3xl font-black text-[#2C1A11] font-mono mt-2 tabular-nums">
                {formatCountdown(sandRemaining)}
              </div>
            </div>

            {/* Hourglass Canvas */}
            <div
              className={`transition-transform duration-700 ease-in-out ${
                isSandFlipped ? 'rotate-180' : 'rotate-0'
              }`}
            >
              <canvas
                ref={sandCanvasRef}
                width={300}
                height={380}
                className="max-w-full h-auto select-none"
              />
            </div>

            {/* Hourglass Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isSandRunning ? (
                <button
                  type="button"
                  onClick={() => setIsSandRunning(true)}
                  disabled={sandRemaining === 0}
                  className="px-7 py-3 bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2 hover:scale-102"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>تدفق الرمل ▶</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSandRunning(false)}
                  className="px-7 py-3 bg-[#D97706] hover:bg-[#B45309] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center gap-2"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  <span>إيقاف مؤقت ⏸</span>
                </button>
              )}

              <button
                type="button"
                onClick={flipHourglass}
                className="px-5 py-3 bg-[#4A2E1B] hover:bg-[#382012] text-white font-black text-xs sm:text-sm rounded-2xl transition-all flex items-center gap-2 shadow-xs"
                title="قلب الساعة الرملية لتبدأ دورة جديدة"
              >
                <RefreshCw className="w-4 h-4 text-[#D4A76A]" />
                <span>قلب الساعة الرملية ⏳</span>
              </button>
            </div>
          </div>

          {/* Hourglass Duration Presets */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E8DDD0] p-6 shadow-xs space-y-4">
            <div className="border-b border-[#F7EFE4] pb-3">
              <h4 className="text-sm font-black text-[#2C1A11] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#7C4E2E]" />
                <span>أوقات الساعة الرملية الرياضية</span>
              </h4>
              <p className="text-xs text-[#7D6752]">اختاري كمية الرمل وزمن التدفق للنشاط</p>
            </div>

            <div className="space-y-2.5">
              {[
                { label: '30 ثانية', desc: 'تمرين سريع أو إجابة طالبة', secs: 30 },
                { label: '1 دقيقة', desc: 'نشاط الإحماء الفردي', secs: 60 },
                { label: '2 دقيقة', desc: 'تحدي المهارة الحركية', secs: 120 },
                { label: '3 دقائق', desc: 'شوط مباراة سريعة', secs: 180 },
                { label: '5 دقائق', desc: 'تمرين جماعي ومنافسة صفية', secs: 300 },
              ].map((item) => (
                <button
                  key={item.secs}
                  type="button"
                  onClick={() => {
                    setIsSandRunning(false);
                    setSandDuration(item.secs);
                    setSandRemaining(item.secs);
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                    sandDuration === item.secs
                      ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-2xs'
                      : 'bg-[#FAF7F2] hover:bg-[#F2E8DC] border-[#E8DDD0] text-[#2C1A11]'
                  }`}
                >
                  <div>
                    <div className="font-black text-sm">{item.label}</div>
                    <div
                      className={`text-xs mt-0.5 ${
                        sandDuration === item.secs ? 'text-[#D4A76A]' : 'text-[#7D6752]'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold">
                    {formatCountdown(item.secs)}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-[#FAF5EC] border border-[#DFCDB6] text-xs space-y-1.5 text-[#5A402D]">
              <div className="font-black text-[#4A2E1B] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#D4A76A]" />
                <span>ميزة الساعة الرملية في الحصة:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#7D6752]">
                تساعد الساعة الرملية الطالبات على إدراك الوقت بصرياً وتضفي حماساً وتشويقاً أثناء أداء المهارات الرياضية والتحديات الفردية والجماعية.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
