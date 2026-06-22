'use client';
/**
 * useTheme.ts
 *
 * Active company ka theme_color CSS variable mein apply karta hai.
 * Jab bhi company switch hoti hai ya theme change hoti hai — CSS vars update ho jaate hain.
 *
 * Mount karo AppShell mein — ek baar, sab jagah effect aata hai.
 *
 * Usage in AppShell:
 *   import { useTheme } from '../../hooks/useTheme';
 *   export function AppShell({ children }) {
 *     useTheme();
 *     ...
 *   }
 */

import { useEffect } from 'react';
import { useAppSelector } from '../store';
import { selectActiveCompany } from '../store/slices/authSlice';

// Derived color variants from a hex primary color
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function lighten(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r + (255 - rgb.r) * factor);
  const g = Math.round(rgb.g + (255 - rgb.g) * factor);
  const b = Math.round(rgb.b + (255 - rgb.b) * factor);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function darken(hex: string, factor: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.round(rgb.r * (1 - factor));
  const g = Math.round(rgb.g * (1 - factor));
  const b = Math.round(rgb.b * (1 - factor));
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

// Default theme (from globals.css)
const DEFAULT = {
  '--blue':    '#1e56d9',
  '--blue-lt': '#eef3fd',
  '--blue-md': '#c7d9fb',
  '--blue-dk': '#1641b0',
};

export function useTheme() {
  const activeCompany = useAppSelector(selectActiveCompany);

  useEffect(() => {
    const root      = document.documentElement;
    const primary   = (activeCompany as any)?.theme_color;

    if (primary && /^#[0-9a-fA-F]{6}$/.test(primary)) {
      // Apply company theme color + derived variants
      root.style.setProperty('--blue',    primary);
      root.style.setProperty('--blue-lt', lighten(primary, 0.9));
      root.style.setProperty('--blue-md', lighten(primary, 0.6));
      root.style.setProperty('--blue-dk', darken(primary,  0.15));
    } else {
      // Reset to default on company switch or no theme
      for (const [k, v] of Object.entries(DEFAULT)) {
        root.style.setProperty(k, v);
      }
    }
  }, [activeCompany?.id, (activeCompany as any)?.theme_color]);
}