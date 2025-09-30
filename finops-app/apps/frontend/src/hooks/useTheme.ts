import { useEffect } from 'react';

export default function useTheme(theme: 'light' | 'dark', primaryColor: string = '#2563eb') {
  useEffect(() => {
    const root = window.document.documentElement;

    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    // Apply dynamic primary color
    root.style.setProperty('--primary-color', primaryColor);
  }, [theme, primaryColor]);
}
