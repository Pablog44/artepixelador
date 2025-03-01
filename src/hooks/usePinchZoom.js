// hooks/usePinchZoom.js
import { useRef, useEffect } from 'react';

const usePinchZoom = (onZoomChange) => {
  const initialDistance = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [touch1, touch2] = e.touches;
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        initialDistance.current = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistance.current) {
        const [touch1, touch2] = e.touches;
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        const currentDistance = Math.hypot(dx, dy);
        const scaleChange = currentDistance / initialDistance.current;
        onZoomChange(scaleChange);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialDistance.current = null;
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onZoomChange]);
};

export default usePinchZoom;
