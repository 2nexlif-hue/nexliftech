import { useEffect, useState } from 'react';
import './CustomCursor.css';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [trailPosition, setTrailPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isHidden, setIsHidden] = useState(true);
  const [isMobile, setIsMobile] = useState(true);

  // Detect touch/mobile devices to disable custom cursor
  useEffect(() => {
    const checkDevice = () => {
      const mobile = 
        ('ontouchstart' in window) || 
        (navigator.maxTouchPoints > 0) || 
        (window.matchMedia('(max-width: 768px)').matches);
      setIsMobile(mobile);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Track real mouse cursor position
  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      setIsHidden(false);
    };

    const handleMouseLeave = () => {
      setIsHidden(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isMobile]);

  // Smooth trail rendering (spring physics style using requestAnimationFrame)
  useEffect(() => {
    if (isMobile || isHidden) return;

    let animId;
    const updateTrail = () => {
      setTrailPosition((prev) => {
        const dx = position.x - prev.x;
        const dy = position.y - prev.y;
        // Skip update if cursor barely moved (< 0.5px)
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return prev;
        // snappy but fluid response factor
        const ease = 0.16;
        return {
          x: prev.x + dx * ease,
          y: prev.y + dy * ease,
        };
      });
      animId = requestAnimationFrame(updateTrail);
    };

    animId = requestAnimationFrame(updateTrail);
    return () => cancelAnimationFrame(animId);
  }, [position, isMobile, isHidden]);

  // Handle clickable hover transitions
  useEffect(() => {
    if (isMobile) return;

    const handleMouseOver = (e) => {
      const target = e.target;
      if (!target) return;

      const isClickable = 
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.closest('.btn') ||
        target.closest('.glass-card') ||
        target.closest('.social-link') ||
        target.closest('.tech-badge') ||
        target.closest('.pricing-tab') ||
        target.closest('.admin-lock-link') ||
        target.getAttribute('role') === 'button';

      setIsHovered(!!isClickable);
    };

    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    return () => window.removeEventListener('mouseover', handleMouseOver);
  }, [isMobile]);

  if (isMobile || isHidden) return null;

  return (
    <>
      <div 
        className={`custom-cursor-dot ${isHovered ? 'hovered' : ''}`}
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
      />
      <div 
        className={`custom-cursor-ring ${isHovered ? 'hovered' : ''}`}
        style={{ left: `${trailPosition.x}px`, top: `${trailPosition.y}px` }}
      />
    </>
  );
}
