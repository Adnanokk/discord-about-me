
import React, { useEffect, useRef } from 'react';

interface RainBackgroundProps {
  theme: 'gray' | 'warm';
}

const RainBackground: React.FC<RainBackgroundProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const particles: { x: number; y: number; length: number; speed: number; opacity: number }[] = [];
    // Increased particle count for "thicker" rain
    const particleCount = 250;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: Math.random() * 25 + 10, // Longer drops
        speed: Math.random() * 4 + 2,
        opacity: Math.random() * 0.25 + 0.1 // Higher base opacity
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      // More visible stroke colors
      ctx.strokeStyle = theme === 'gray' ? '#ffffff' : '#18181b'; 
      ctx.lineWidth = 1.2; // Thicker lines

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.length);
        ctx.globalAlpha = p.opacity;
        ctx.stroke();

        p.y += p.speed;
        if (p.y > height) {
          p.y = -p.length;
          p.x = Math.random() * width;
        }
      });

      requestAnimationFrame(animate);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => window.removeEventListener('resize', handleResize);
  }, [theme]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0"
      style={{ filter: 'blur(0.1px)' }}
    />
  );
};

export default RainBackground;
