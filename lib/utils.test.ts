import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('should merge tailwind classes properly', () => {
    // Basic class merging
    expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    
    // Conditional passing of classes
    expect(cn('bg-red-500', false && 'text-white', true && 'p-4')).toBe('bg-red-500 p-4');
    
    // Tailwind-merge resolution of conflicts
    expect(cn('p-2 p-4')).toBe('p-4');
    expect(cn('text-sm text-lg')).toBe('text-lg');
  });
});
