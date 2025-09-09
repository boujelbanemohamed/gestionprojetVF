import { useState, useEffect } from 'react';

// Accessibility utilities and helpers
export class AccessibilityHelper {
  // Focus management
  static trapFocus(element: HTMLElement): () => void {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }

  // Announce to screen readers
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }

  // Check if user prefers reduced motion
  static prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // High contrast mode detection
  static prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  // Generate accessible IDs
  static generateId(prefix: string = 'element'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate color contrast
  static validateContrast(foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    // Simplified contrast calculation
    // In a real implementation, you'd use a proper color contrast library
    const ratio = 4.5; // Mock ratio
    
    return {
      ratio,
      wcagAA: ratio >= 4.5,
      wcagAAA: ratio >= 7
    };
  }

  // Skip link functionality
  static createSkipLink(targetId: string, label: string): HTMLElement {
    const skipLink = document.createElement('a');
    skipLink.href = `#${targetId}`;
    skipLink.textContent = label;
    skipLink.className = 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50';
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });

    return skipLink;
  }
}

// React hook for accessibility
export function useAccessibility() {
  const [reducedMotion, setReducedMotion] = useState(AccessibilityHelper.prefersReducedMotion());
  const [highContrast, setHighContrast] = useState(AccessibilityHelper.prefersHighContrast());

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');

    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    const handleContrastChange = (e: MediaQueryListEvent) => setHighContrast(e.matches);

    motionQuery.addEventListener('change', handleMotionChange);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  return {
    reducedMotion,
    highContrast,
    announce: AccessibilityHelper.announce,
    generateId: AccessibilityHelper.generateId
  };
}

// ARIA helpers
export const ARIA = {
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  selected: (selected: boolean) => ({ 'aria-selected': selected }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  live: (live: 'polite' | 'assertive' | 'off') => ({ 'aria-live': live }),
  atomic: (atomic: boolean) => ({ 'aria-atomic': atomic }),
  busy: (busy: boolean) => ({ 'aria-busy': busy }),
  disabled: (disabled: boolean) => ({ 'aria-disabled': disabled }),
  invalid: (invalid: boolean) => ({ 'aria-invalid': invalid }),
  required: (required: boolean) => ({ 'aria-required': required })
};