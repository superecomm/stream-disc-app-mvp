"use client";

import { useEffect, useState, useRef } from "react";

interface VoiceAnimationProps {
  state: "idle" | "listening" | "active" | "recording";
  size?: "sm" | "md" | "lg";
  className?: string;
  container?: "circle" | "square" | "none";
  visualStyle?: "bars" | "waves" | "blob" | "radial" | "canvas" | "particles";
  recordingCountdown?: number; // 3, 2, 1, or 0 (0 means recording in progress)
  recordingTime?: number; // elapsed seconds during recording
  audioStream?: MediaStream | null; // For real audio reactivity
}

export default function VoiceAnimation({ 
  state = "idle", 
  size = "md",
  className = "",
  container = "square",
  visualStyle = "particles",
  recordingCountdown = undefined,
  recordingTime = 0,
  audioStream = null
}: VoiceAnimationProps) {
  const [bars, setBars] = useState<number[]>([]);
  const [waveData, setWaveData] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Array<{x: number, y: number, vx: number, vy: number, life: number, targetX?: number, targetY?: number}>>([]);
  const [isExploding, setIsExploding] = useState(false);
  const [explosionProgress, setExplosionProgress] = useState(0);
  const prevStateRef = useRef(state);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const [audioAmplitude, setAudioAmplitude] = useState<number[]>([]); // Real-time audio data

  // Size configurations
  const sizeConfig = {
    sm: { barCount: 20, height: 100, barWidth: 4, gap: 4, containerSize: 280 },
    md: { barCount: 30, height: 150, barWidth: 6, gap: 6, containerSize: 380 },
    lg: { barCount: 40, height: 200, barWidth: 8, gap: 8, containerSize: 480 }
  };
  const config = sizeConfig[size];

  // Helper function to generate particle positions that form number shapes
  const getNumberParticles = (number: number, centerX: number, centerY: number) => {
    const scale = 30; // Size of the number
    const particles: Array<{x: number, y: number, vx: number, vy: number, life: number}> = [];
    
    // Define particle positions for each number (relative coordinates)
    const numberShapes: {[key: number]: Array<{x: number, y: number}>} = {
      1: [
        {x: 0, y: -1.5}, {x: 0, y: -1}, {x: 0, y: -0.5}, 
        {x: 0, y: 0}, {x: 0, y: 0.5}, {x: 0, y: 1}, {x: 0, y: 1.5}
      ],
      2: [
        {x: -0.8, y: -1.5}, {x: 0, y: -1.5}, {x: 0.8, y: -1.5},
        {x: 0.8, y: -0.8}, {x: 0.8, y: 0},
        {x: 0, y: 0.5},
        {x: -0.8, y: 1}, {x: -0.8, y: 1.5},
        {x: -0.8, y: 1.5}, {x: 0, y: 1.5}, {x: 0.8, y: 1.5}
      ],
      3: [
        {x: -0.8, y: -1.5}, {x: 0, y: -1.5}, {x: 0.8, y: -1.5},
        {x: 0.8, y: -0.8}, {x: 0.8, y: -0.3},
        {x: 0, y: 0}, {x: 0.5, y: 0},
        {x: 0.8, y: 0.3}, {x: 0.8, y: 0.8},
        {x: 0.8, y: 1.5}, {x: 0, y: 1.5}, {x: -0.8, y: 1.5}
      ]
    };
    
    const shape = numberShapes[number] || numberShapes[1];
    
    shape.forEach((point, index) => {
      particles.push({
        x: centerX + point.x * scale,
        y: centerY + point.y * scale,
        vx: 0,
        vy: 0,
        life: index / shape.length
      });
    });
    
    return particles;
  };

  // Setup Web Audio API for real microphone reactivity
  useEffect(() => {
    if (state === "recording" && audioStream && !audioContextRef.current) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(audioStream);
        
        analyser.fftSize = 128; // Smaller for smoother waveform (64 frequency bins)
        analyser.smoothingTimeConstant = 0.8; // Smooth but responsive
        
        source.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        
        console.log("✅ Web Audio API initialized for recording state");
      } catch (error) {
        console.error("Failed to setup Web Audio API:", error);
      }
    }
    
    // Cleanup on unmount or when recording stops
    return () => {
      if (audioContextRef.current && state !== "recording") {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
        dataArrayRef.current = null;
        setAudioAmplitude([]);
      }
    };
  }, [state, audioStream]);

  // Real-time audio analysis loop
  useEffect(() => {
    if (state === "recording" && analyserRef.current && dataArrayRef.current) {
      let animationId: number;
      
      const updateAudioData = () => {
        if (analyserRef.current && dataArrayRef.current) {
          const buffer = new Uint8Array(dataArrayRef.current.length);
          analyserRef.current.getByteFrequencyData(buffer);
          
          // Convert to normalized amplitude array (0-1 range)
          const amplitudes = Array.from(buffer).map(value => value / 255);
          setAudioAmplitude(amplitudes);
        }
        
        animationId = requestAnimationFrame(updateAudioData);
      };
      
      updateAudioData();
      
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }
  }, [state, analyserRef.current]);

  // Detect state transitions and trigger explosion effect
  useEffect(() => {
    // Trigger explosion when transitioning from active to idle (idea delivered, task complete)
    if (prevStateRef.current === "active" && state === "idle") {
      setIsExploding(true);
      setExplosionProgress(0);
      
      // Reset explosion after animation completes
      const explosionDuration = 800; // ms
      const resetTimer = setTimeout(() => {
        setIsExploding(false);
        setExplosionProgress(0);
      }, explosionDuration);
      
      return () => clearTimeout(resetTimer);
    }
    
    // Also trigger on recording -> idle (recording saved)
    if (prevStateRef.current === "recording" && state === "idle") {
      setIsExploding(true);
      setExplosionProgress(0);
      
      const explosionDuration = 800;
      const resetTimer = setTimeout(() => {
        setIsExploding(false);
        setExplosionProgress(0);
      }, explosionDuration);
      
      return () => clearTimeout(resetTimer);
    }
    
    prevStateRef.current = state;
  }, [state]);

  useEffect(() => {
    // Initialize data arrays
    setBars(Array(config.barCount).fill(0.2));
    setWaveData(Array(50).fill(0));
    
    // Initialize particles based on state
    if (visualStyle === "particles") {
      let particleCount: number;
      let initParticles;
      
      const centerX = config.containerSize / 2;
      const centerY = config.containerSize / 2;
      
      // Countdown mode: Form actual numbers 3, 2, 1
      if (recordingCountdown && recordingCountdown > 0) {
        initParticles = getNumberParticles(recordingCountdown, centerX, centerY);
        particleCount = initParticles.length;
      } else if (state === "recording" && recordingCountdown === 0) {
        // RECORDING MODE: Stable horizontal neural beam (like ACTIVE state structure)
        // This provides the stable base that audio reactivity will modulate
        particleCount = 60; // Same as active for consistency
        const beamWidth = config.containerSize * 0.7;
        
        initParticles = Array(particleCount).fill(0).map((_, i) => {
          const horizontalPos = (i / (particleCount - 1)) * beamWidth;
          const xPos = centerX - beamWidth / 2 + horizontalPos;
          
          // Start in a flat horizontal line - audio reactivity will add Y movement
          return {
            x: xPos,
            y: centerY, // Flat baseline - stable!
            vx: 0,
            vy: 0,
            life: i / particleCount,
            targetX: xPos, // Store base position for stability
            targetY: centerY
          };
        });
      } else if (state === "idle") {
        // Idle: 3-7 particles in center constellation
        particleCount = 5;
        initParticles = Array(particleCount).fill(0).map((_, i) => {
          const angle = (i / particleCount) * Math.PI * 2;
          const radius = 30;
          return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: 0,
            vy: 0,
            life: i / particleCount
          };
        });
      } else if (state === "listening") {
        // Listening: More particles, spread out
        particleCount = 40;
        initParticles = Array(particleCount).fill(0).map(() => ({
          x: centerX + (Math.random() - 0.5) * config.containerSize * 0.6,
          y: centerY + (Math.random() - 0.5) * config.containerSize * 0.6,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: Math.random()
        }));
      } else {
        // Active: More particles for neural stream
        particleCount = 60;
        initParticles = Array(particleCount).fill(0).map((_, i) => {
          // Start distributed across center horizontal stream
          const streamWidth = config.containerSize * 0.7;
          const streamHeight = 60;
          return {
            x: centerX - streamWidth / 2 + (i / particleCount) * streamWidth,
            y: centerY + (Math.random() - 0.5) * streamHeight,
            vx: 0,
            vy: 0,
            life: i / particleCount,
            targetX: centerX - streamWidth / 2 + (i / particleCount) * streamWidth,
            targetY: centerY
          };
        });
      }
      
      setParticles(initParticles);
    }

    let animationFrameId: number;
    const animate = () => {
      const time = Date.now() / 1000;
      
      // Update bars data
      setBars(prevBars => 
        prevBars.map((_, index) => {
          if (state === "active") {
            const wave1 = Math.sin(time * 2 + index * 0.3) * 0.4;
            const wave2 = Math.sin(time * 3 - index * 0.2) * 0.3;
            const wave3 = Math.sin(time * 1.5 + index * 0.4) * 0.2;
            return Math.abs(wave1 + wave2 + wave3) + 0.2;
          } else {
            const breathe = Math.sin(time * 0.5 + index * 0.1) * 0.1;
            return 0.2 + Math.abs(breathe);
          }
        })
      );
      
      // Update wave data for smooth curves
      setWaveData(prevWave =>
        prevWave.map((_, index) => {
          const position = index / prevWave.length;
          if (state === "active") {
            const wave1 = Math.sin(time * 2 + position * Math.PI * 4) * 0.5;
            const wave2 = Math.sin(time * 3 - position * Math.PI * 3) * 0.3;
            const wave3 = Math.sin(time * 1.5 + position * Math.PI * 5) * 0.2;
            return wave1 + wave2 + wave3;
          } else {
            const breathe = Math.sin(time * 0.5 + position * Math.PI * 2) * 0.2;
            return breathe;
          }
        })
      );
      
      // Update particles with three-state neural system + explosion effect
      if (visualStyle === "particles") {
        // Update explosion progress during animation
        if (isExploding) {
          setExplosionProgress(prev => Math.min(prev + 0.05, 1));
        }
        
        setParticles(prevParticles =>
          prevParticles.map((p, index) => {
            const centerX = config.containerSize / 2;
            const centerY = config.containerSize / 2;
            
            let newX = p.x;
            let newY = p.y;
            let newVx = p.vx;
            let newVy = p.vy;
            
            // EXPLOSION EFFECT: Override normal behavior
            if (isExploding) {
              const distFromCenterX = p.x - centerX;
              const distFromCenterY = p.y - centerY;
              const angle = Math.atan2(distFromCenterY, distFromCenterX);
              
              // Phase 1 (0-0.4): Explosive burst outward
              if (explosionProgress < 0.4) {
                const burstStrength = 15 * (1 - explosionProgress / 0.4);
                newVx = Math.cos(angle) * burstStrength;
                newVy = Math.sin(angle) * burstStrength;
              }
              // Phase 2 (0.4-1.0): Graceful return to constellation
              else {
                const returnProgress = (explosionProgress - 0.4) / 0.6;
                const targetAngle = (index / prevParticles.length) * Math.PI * 2;
                const targetRadius = 30;
                const targetX = centerX + Math.cos(targetAngle) * targetRadius;
                const targetY = centerY + Math.sin(targetAngle) * targetRadius;
                
                // Smooth pull back with easing
                const pullStrength = 0.15 * Math.pow(returnProgress, 2);
                newVx = (targetX - p.x) * pullStrength;
                newVy = (targetY - p.y) * pullStrength;
              }
              
              newX += newVx;
              newY += newVy;
              
            } else if (state === "idle") {
              // IDLE STATE: Constellation - slow orbital breathing
              const angle = (index / prevParticles.length) * Math.PI * 2 + time * 0.1;
              const breathe = Math.sin(time * 0.8 + index) * 5;
              const radius = 30 + breathe;
              
              const targetX = centerX + Math.cos(angle) * radius;
              const targetY = centerY + Math.sin(angle) * radius;
              
              // Smooth movement towards target
              newX += (targetX - p.x) * 0.05;
              newY += (targetY - p.y) * 0.05;
              
            } else if (state === "recording") {
              // RECORDING STATE: Stable horizontal beam with REAL audio reactivity
              // Layer 1: Stable base shape (horizontal line)
              const beamWidth = config.containerSize * 0.7;
              const baseX = centerX - beamWidth / 2 + (index / prevParticles.length) * beamWidth;
              const baseY = centerY;
              
              // Layer 2: Audio reactive amplitude (REAL microphone data)
              let audioOffset = 0;
              if (audioAmplitude.length > 0) {
                // Map particle index to audio frequency bin
                const binIndex = Math.floor((index / prevParticles.length) * audioAmplitude.length);
                const amplitude = audioAmplitude[binIndex] || 0;
                
                // Convert amplitude to Y-axis displacement (±60px max)
                audioOffset = amplitude * 60 - 30; // Center around baseline
              }
              
              // Target position: stable base + audio modulation
              const targetX = baseX;
              const targetY = baseY + audioOffset;
              
              // Smooth magnetic pull to target (prevents jitter)
              const pullStrength = 0.15; // Smooth but responsive
              newVx = (targetX - p.x) * pullStrength;
              newVy = (targetY - p.y) * pullStrength;
              
              newX += newVx;
              newY += newVy;
              
              // Layer 3: Subtle breathing effect for premium feel (very gentle)
              const breathe = Math.sin(time * 0.5 + p.life * Math.PI) * 2;
              newY += breathe;
              
            } else if (state === "listening") {
              // LISTENING STATE: Spread out with micro-shake and pulsing inward
              const distFromCenterX = p.x - centerX;
              const distFromCenterY = p.y - centerY;
              
              // Micro-shake (as if waiting for vibration)
              const shake = Math.sin(time * 20 + index) * 0.3;
              newVx += (Math.random() - 0.5) * shake;
              newVy += (Math.random() - 0.5) * shake;
              
              // Gentle pulsing inward towards center
              const pullStrength = 0.001;
              newVx += -distFromCenterX * pullStrength;
              newVy += -distFromCenterY * pullStrength;
              
              // Breathing effect
              const breatheX = Math.sin(time * 0.5 + p.life * Math.PI * 2) * 0.2;
              const breatheY = Math.cos(time * 0.5 + p.life * Math.PI * 2) * 0.2;
              
              newX += newVx + breatheX;
              newY += newVy + breatheY;
              
            } else {
              // ACTIVE STATE: Neural waveform stream - magnetize to center stream
              const streamCenterY = centerY;
              const waveAmplitude = 40;
              
              // Create horizontal neural stream with organic curves
              const horizontalPosition = (index / prevParticles.length) * config.containerSize * 0.7;
              const wave1 = Math.sin(time * 3 + horizontalPosition * 0.02) * waveAmplitude;
              const wave2 = Math.sin(time * 2 - horizontalPosition * 0.015 + p.life * Math.PI) * (waveAmplitude * 0.5);
              
              const targetX = centerX - (config.containerSize * 0.35) + horizontalPosition;
              const targetY = streamCenterY + wave1 + wave2;
              
              // Magnetize particles to stream (smooth cubic ease-in)
              const magnetStrength = 0.08;
              newVx = (targetX - p.x) * magnetStrength;
              newVy = (targetY - p.y) * magnetStrength;
              
              newX += newVx;
              newY += newVy;
            }
            
            // Square boundary constraints with bounce
            const padding = 10;
            const maxX = config.containerSize - padding;
            const maxY = config.containerSize - padding;
            
            if (newX < padding) {
              newX = padding;
              newVx = Math.abs(newVx) * 0.8;
            } else if (newX > maxX) {
              newX = maxX;
              newVx = -Math.abs(newVx) * 0.8;
            }
            
            if (newY < padding) {
              newY = padding;
              newVy = Math.abs(newVy) * 0.8;
            } else if (newY > maxY) {
              newY = maxY;
              newVy = -Math.abs(newVy) * 0.8;
            }
            
            // Gentle damping (except during explosion burst)
            if (!isExploding || explosionProgress >= 0.4) {
              newVx *= 0.95;
              newVy *= 0.95;
            }
            
            return {
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
              life: (p.life + 0.005) % 1,
              targetX: p.targetX,
              targetY: p.targetY
            };
          })
        );
      }
      
      // Canvas animation
      if (visualStyle === "canvas" && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 3;
          
          const layers = state === "active" ? 5 : 3;
          for (let layer = 0; layer < layers; layer++) {
            ctx.beginPath();
            const layerOffset = layer * 20;
            const centerY = canvas.height / 2;
            
            for (let x = 0; x < canvas.width; x += 2) {
              const position = x / canvas.width;
              const wave1 = Math.sin(time * (2 + layer * 0.5) + position * Math.PI * 4) * 30;
              const wave2 = Math.sin(time * (3 - layer * 0.3) - position * Math.PI * 3) * 20;
              const intensity = state === "active" ? 1 : 0.3;
              const y = centerY + (wave1 + wave2) * intensity + layerOffset - (layers * 10);
              
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            
            const hue = 180 + (layer / layers) * 150;
            ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${state === "active" ? 0.8 : 0.4})`;
            ctx.stroke();
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [state, config.barCount, config.containerSize, visualStyle, isExploding, explosionProgress, audioAmplitude]);

  // Helper function to get monochrome color with subtle blue accents
  const getMonochromeColor = (position: number, state: string) => {
    // Recording state: Red color scheme
    if (state === "recording") {
      const hue = 0; // Red hue
      const saturation = 80 + position * 20; // Vary saturation
      const lightness = 55 + position * 15; // Vary brightness
      return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`;
    }
    
    if (state === "idle") {
      // Idle: Pure white with slight glow
      return `rgba(255, 255, 255, ${0.8 + position * 0.2})`;
    } else if (state === "listening") {
      // Listening: Cool blue-violet accents
      const hue = 220 + position * 40; // Range from blue to violet
      return `hsla(${hue}, 70%, 70%, 0.7)`;
    } else {
      // Active: White with very subtle color variation (neural network)
      // Subtle hint of blue/purple/pink based on position (pitch mapping)
      const hue = 200 + position * 80; // 200 (blue) to 280 (purple) to 320 (pink)
      return `hsla(${hue}, 40%, 85%, 0.9)`;
    }
  };

  // Render the waveform bars (original style)
  const renderBars = () => (
    <div 
      className="flex items-center justify-center"
      style={{ 
        height: `${config.height}px`,
        gap: `${config.gap}px`
      }}
    >
      {bars.map((height, index) => {
        const position = index / bars.length;
        const color = getMonochromeColor(position, state);
        return (
          <div
            key={index}
            className="rounded-full transition-all duration-75 ease-out"
            style={{
              width: `${config.barWidth}px`,
              height: `${height * config.height}px`,
              backgroundColor: color,
              boxShadow: state === "active" 
                ? `0 0 ${config.barWidth * 2}px ${color}` 
                : `0 0 ${config.barWidth}px ${color}`,
              opacity: state === "active" ? 0.9 : 0.5,
            }}
          />
        );
      })}
    </div>
  );

  // Render smooth SVG sine waves
  const renderSmoothWaves = () => {
    const width = config.height * 2;
    const height = config.height;
    const layers = state === "active" ? 5 : 3;
    
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array(layers).fill(0).map((_, layerIndex) => {
          const points: string[] = [];
          const numPoints = 50;
          
          for (let i = 0; i <= numPoints; i++) {
            const x = (i / numPoints) * width;
            const waveValue = waveData[i] || 0;
            const layerOffset = (layerIndex - layers / 2) * 15;
            const y = height / 2 + waveValue * (state === "active" ? 40 : 15) + layerOffset;
            points.push(`${x},${y}`);
          }
          
          const position = layerIndex / layers;
          const color = getMonochromeColor(position, state);
          
          return (
            <polyline
              key={layerIndex}
              points={points.join(' ')}
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={state === "active" ? 0.8 : 0.5}
              style={{
                filter: `drop-shadow(0 0 ${state === "active" ? '8px' : '4px'} ${color})`
              }}
            />
          );
        })}
      </svg>
    );
  };

  // Render organic blob shape
  const renderBlob = () => {
    const size = config.height;
    const centerX = size;
    const centerY = size / 2;
    const time = Date.now() / 1000;
    
    // Generate blob path with animated points
    const points = 8;
    const pathPoints: string[] = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const wave1 = Math.sin(time * 2 + angle * 3) * 0.3;
      const wave2 = Math.sin(time * 3 - angle * 2) * 0.2;
      const baseRadius = state === "active" ? size * 0.4 : size * 0.25;
      const radius = baseRadius * (1 + wave1 + wave2);
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      pathPoints.push(`${x},${y}`);
    }
    
    // Create smooth path through points
    let pathD = `M ${pathPoints[0]}`;
    for (let i = 0; i < points; i++) {
      const nextIndex = (i + 1) % points;
      const current = pathPoints[i].split(',').map(Number);
      const next = pathPoints[nextIndex].split(',').map(Number);
      const controlX = (current[0] + next[0]) / 2;
      const controlY = (current[1] + next[1]) / 2;
      pathD += ` Q ${next[0]},${next[1]} ${controlX},${controlY}`;
    }
    pathD += ' Z';
    
    return (
      <svg width={size * 2} height={size}>
        <defs>
          <radialGradient id="blobGradient">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0.5" />
          </radialGradient>
        </defs>
        <path
          d={pathD}
          fill="url(#blobGradient)"
          stroke="#8b5cf6"
          strokeWidth="2"
          opacity={state === "active" ? 0.9 : 0.5}
          style={{
            filter: `drop-shadow(0 0 ${state === "active" ? '20px' : '10px'} #8b5cf6)`
          }}
        />
      </svg>
    );
  };

  // Render radial waveform
  const renderRadialWaveform = () => {
    const size = Math.min(config.height * 1.5, config.containerSize - 100);
    const centerX = size / 2;
    const centerY = size / 2;
    const baseRadius = size * 0.15;
    const segments = 60;
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {bars.slice(0, segments).map((amplitude, index) => {
          const angle = (index / segments) * Math.PI * 2 - Math.PI / 2;
          const waveHeight = amplitude * (state === "active" ? 80 : 30);
          const innerRadius = baseRadius;
          const outerRadius = baseRadius + waveHeight;
          
          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * outerRadius;
          const y2 = centerY + Math.sin(angle) * outerRadius;
          
          const position = index / segments;
          const color = getMonochromeColor(position, state);
          
          return (
            <line
              key={index}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              opacity={state === "active" ? 0.9 : 0.5}
              style={{
                filter: `drop-shadow(0 0 ${state === "active" ? '6px' : '3px'} ${color})`
              }}
            />
          );
        })}
      </svg>
    );
  };

  // Render canvas-based fluid curves
  const renderCanvasCurves = () => (
    <canvas
      ref={canvasRef}
      width={config.height * 2}
      height={config.height}
      style={{ width: config.height * 2, height: config.height }}
    />
  );

  // Render particle flow system - monochrome neural network
  const renderParticles = () => {
    const size = Math.min(config.containerSize - 50, config.height * 2);
    
    // Particle size varies by state
    const particleRadius = state === "idle" ? 4 : state === "listening" ? 3 : 2.5;
    
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Connection lines - neural network links */}
        {particles.map((particle, index) => {
          const lines: React.ReactElement[] = [];
          
          // Recording waveform: Connect adjacent horizontal particles
          if (state === "recording" && recordingCountdown === 0) {
            // Connect to next particle in waveform
            if (index < particles.length - 1) {
              const other = particles[index + 1];
              const x1 = (particle.x / config.containerSize) * size;
              const y1 = (particle.y / config.containerSize) * size;
              const x2 = (other.x / config.containerSize) * size;
              const y2 = (other.y / config.containerSize) * size;
              
              const position = particle.life;
              const color = getMonochromeColor(position, state);
              
              lines.push(
                <line
                  key={`waveform-${index}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={color}
                  strokeWidth="2.5"
                  opacity="0.8"
                  strokeLinecap="round"
                />
              );
            }
          }
          // Draw neural network connections
          else if (state === "active") {
            // Active: Connect nearby particles for neural stream effect
            particles.forEach((other, otherIndex) => {
              if (otherIndex <= index) return; // Avoid duplicate lines
              
              const x1 = (particle.x / config.containerSize) * size;
              const y1 = (particle.y / config.containerSize) * size;
              const x2 = (other.x / config.containerSize) * size;
              const y2 = (other.y / config.containerSize) * size;
              const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
              
              // Connect particles in neural stream (horizontal bias)
              if (distance < size * 0.12) {
                const opacity = 1 - (distance / (size * 0.12));
                const avgLife = (particle.life + other.life) / 2;
                const color = getMonochromeColor(avgLife, state);
                
                lines.push(
                  <line
                    key={`line-${index}-${otherIndex}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={color}
                    strokeWidth="2"
                    opacity={opacity * 0.5}
                  />
                );
              }
            });
          } else if (state === "idle") {
            // Idle: Connect constellation particles
            const nextIndex = (index + 1) % particles.length;
            const other = particles[nextIndex];
            
            const x1 = (particle.x / config.containerSize) * size;
            const y1 = (particle.y / config.containerSize) * size;
            const x2 = (other.x / config.containerSize) * size;
            const y2 = (other.y / config.containerSize) * size;
            
            lines.push(
              <line
                key={`const-${index}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                opacity="0.4"
              />
            );
          }
          
          return lines;
        })}
        
        {/* Particle dots */}
        {particles.map((particle, index) => {
          const position = particle.life;
          const color = getMonochromeColor(position, state);
          const normalizedX = (particle.x / config.containerSize) * size;
          const normalizedY = (particle.y / config.containerSize) * size;
          
          // Enhanced visuals during explosion
          const explosionScale = isExploding && explosionProgress < 0.4 
            ? 1 + explosionProgress * 2 
            : 1;
          const explosionGlow = isExploding && explosionProgress < 0.4
            ? particleRadius * 4 * (1 + explosionProgress * 3)
            : particleRadius * (state === "active" ? 3 : 2);
          const explosionOpacity = isExploding 
            ? 0.4 + explosionProgress * 0.4
            : (state === "idle" ? 0.15 : state === "listening" ? 0.2 : 0.3);
          
          return (
            <g key={index}>
              {/* Glow effect - stronger during explosion */}
              <circle
                cx={normalizedX}
                cy={normalizedY}
                r={explosionGlow}
                fill={isExploding && explosionProgress < 0.4 ? "rgba(255, 255, 255, 1)" : color}
                opacity={explosionOpacity}
                filter="blur(4px)"
              />
              {/* Main particle - larger during burst */}
              <circle
                cx={normalizedX}
                cy={normalizedY}
                r={particleRadius * explosionScale}
                fill={isExploding && explosionProgress < 0.4 ? "rgba(255, 255, 255, 1)" : color}
                opacity={isExploding ? 1 : (state === "idle" ? 0.8 : state === "listening" ? 0.7 : 0.95)}
                style={{
                  filter: `drop-shadow(0 0 ${state === "active" || isExploding ? '8px' : state === "listening" ? '4px' : '3px'} ${isExploding && explosionProgress < 0.4 ? 'rgba(255, 255, 255, 1)' : color})`
                }}
              />
            </g>
          );
        })}
      </svg>
    );
  };

  // Select the appropriate renderer based on visualStyle
  const renderWaveform = () => {
    switch (visualStyle) {
      case "waves":
        return renderSmoothWaves();
      case "blob":
        return renderBlob();
      case "radial":
        return renderRadialWaveform();
      case "canvas":
        return renderCanvasCurves();
      case "particles":
        return renderParticles();
      case "bars":
      default:
        return renderBars();
    }
  };

  // No container - just the waveform
  if (container === "none") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {renderWaveform()}
      </div>
    );
  }

  // With premium container (circle or square)
  const containerShape = container === "circle" ? "rounded-full" : "rounded-[4rem]";
  const backgroundShape = container === "circle" ? "rounded-full" : "rounded-[3.5rem]";
  
  // Calculate average audio volume for dynamic glow intensity
  const audioVolume = state === "recording" && audioAmplitude.length > 0
    ? audioAmplitude.reduce((acc, val) => acc + val, 0) / audioAmplitude.length
    : 0.5;
  
  // Dynamic red glow intensity based on volume (0.4 quiet → 0.8 loud)
  const glowIntensity = state === "recording" ? 0.4 + audioVolume * 0.4 : 0.6;
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className="relative"
        style={{ 
          width: `${config.containerSize}px`,
          height: `${config.containerSize}px`
        }}
      >
        {/* Monochrome glow layers with audio-reactive recording indicator */}
        <div 
          className={`absolute inset-0 ${backgroundShape} opacity-40 blur-xl`}
          style={{
            background: state === "recording"
              ? `radial-gradient(circle, rgba(255, 100, 100, ${glowIntensity}), rgba(220, 80, 80, ${glowIntensity * 0.6}), transparent)`
              : state === "idle"
              ? "radial-gradient(circle, rgba(255, 255, 255, 0.3), transparent)"
              : state === "listening"
              ? "radial-gradient(circle, rgba(100, 150, 255, 0.4), transparent)"
              : "radial-gradient(circle, rgba(150, 180, 255, 0.5), rgba(180, 150, 255, 0.3), transparent)",
            animation: (state === "active" || state === "recording") ? "spin-smooth 15s ease-in-out infinite" : "none"
          }}
        />
        
        {/* Secondary glow layer with recording pulse */}
        <div 
          className={`absolute inset-0 ${backgroundShape} opacity-30 blur-md`}
          style={{
            background: state === "recording"
              ? "radial-gradient(circle, rgba(255, 120, 120, 0.5), rgba(230, 100, 100, 0.3), transparent)"
              : state === "idle"
              ? "radial-gradient(circle, rgba(200, 200, 200, 0.2), transparent)"
              : state === "listening"
              ? "radial-gradient(circle, rgba(120, 160, 240, 0.3), transparent)"
              : "radial-gradient(circle, rgba(180, 150, 255, 0.4), rgba(150, 200, 255, 0.2), transparent)",
            animation: (state === "active" || state === "recording") ? "spin-smooth 15s ease-in-out infinite reverse" : "none"
          }}
        />
        
        {/* Main container with dark background and recording tint */}
        <div 
          className={`absolute inset-6 ${containerShape} border-2 flex items-center justify-center overflow-hidden`}
          style={{
            background: state === "recording"
              ? "linear-gradient(to bottom right, rgba(60, 15, 15, 1) 0%, rgba(40, 10, 10, 1) 50%, rgba(50, 12, 12, 1) 100%)"
              : "linear-gradient(to bottom right, rgb(0, 0, 0) 0%, rgb(3, 7, 18) 50%, rgb(0, 0, 0) 100%)",
            borderColor: state === "recording"
              ? "rgba(255, 80, 80, 0.9)"
              : state === "idle" 
              ? "rgba(100, 100, 100, 0.3)"
              : state === "listening"
              ? "rgba(100, 150, 255, 0.4)"
              : "rgba(150, 180, 255, 0.5)",
            borderWidth: state === "recording" ? "3px" : "2px",
            boxShadow: state === "recording"
              ? "0 0 50px rgba(255, 80, 80, 0.8), 0 0 30px rgba(255, 60, 60, 0.6), inset 0 0 80px rgba(255, 100, 100, 0.3)"
              : state === "idle"
              ? "0 0 20px rgba(255, 255, 255, 0.1), inset 0 0 30px rgba(255, 255, 255, 0.05)"
              : state === "listening"
              ? "0 0 25px rgba(100, 150, 255, 0.3), inset 0 0 35px rgba(100, 150, 255, 0.1)"
              : "0 0 40px rgba(150, 180, 255, 0.5), inset 0 0 40px rgba(150, 180, 255, 0.15)"
          }}
        >
          {/* Waveform */}
          {renderWaveform()}
          
          {/* Recording time display */}
          {state === "recording" && recordingTime > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-6 py-3 bg-red-900/70 border-2 border-red-500/70 rounded-full backdrop-blur-md shadow-lg">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
              <span className="text-red-100 font-mono text-lg font-bold tracking-wider">
                {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
              </span>
            </div>
          )}
          
          {/* Countdown display */}
          {recordingCountdown && recordingCountdown > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-9xl font-bold text-white/95 animate-pulse drop-shadow-2xl">
                {recordingCountdown}
              </div>
            </div>
          )}
          
          {/* Shimmer effect on active state - contained within this container */}
          {state === "active" && (
            <div 
              className="absolute inset-0 pointer-events-none overflow-hidden"
              style={{
                borderRadius: container === "circle" ? "9999px" : "1rem"
              }}
            >
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                  animation: "shimmer 2s infinite"
                }}
              />
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes spin-smooth {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
}

