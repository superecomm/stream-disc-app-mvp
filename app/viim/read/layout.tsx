"use client";

import { useEffect } from "react";

export default function ReadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Hide the navbar on this page
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
    }
    
    // Override body background
    document.body.style.backgroundColor = '#FFFFFF';
    document.body.style.color = '#111111';
    
    return () => {
      // Restore on unmount
      if (navbar) {
        navbar.style.display = '';
      }
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <div style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', color: '#111111' }}>
      {children}
    </div>
  );
}

