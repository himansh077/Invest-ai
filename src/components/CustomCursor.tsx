"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Hide default cursor globally when this component mounts
    document.body.style.cursor = 'none';

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if we are hovering over an interactive element
      const isInteractive = 
        target.tagName === 'A' || 
        target.tagName === 'BUTTON' || 
        target.tagName === 'INPUT' ||
        target.closest('a') !== null ||
        target.closest('button') !== null ||
        target.classList.contains('cursor-pointer');
      
      setIsHovering(isInteractive);
    };

    window.addEventListener("mousemove", updatePosition);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("mouseover", handleMouseOver);
      document.body.style.cursor = 'auto'; // cleanup
    };
  }, [pathname]);

  return (
    <div 
      id="cursor-glow" 
      className={isHovering ? "hover_active" : ""}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="cb tl"></div>
      <div className="cb tr"></div>
      <div className="cb bl"></div>
      <div className="cb br"></div>
    </div>
  );
}
