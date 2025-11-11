'use client';

import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MathBlockProps {
  content: string;
  type: 'block' | 'inline';
  className?: string;
}

/**
 * Math Block Component using KaTeX
 * 
 * Features:
 * - Block and inline math rendering
 * - Support for LaTeX and KaTeX syntax
 * - Proper styling integration with Tailwind
 * - Error handling for invalid math expressions
 */
export function MathBlock({ 
  content, 
  type = 'inline',
  className 
}: MathBlockProps) {
  
  // Clean the math content to handle common AI formatting issues
  const cleanMathContent = (math: string): string => {
    // Remove surrounding $$ if present (for block math)
    let cleaned = math.replace(/^\$\$(.*?)\$$$/s, '$1').trim();
    
    // Remove surrounding $ if present (for inline math)
    cleaned = cleaned.replace(/^\$(.*?)\$$/, '$1').trim();
    
    // Handle common AI formatting issues
    cleaned = cleaned
      // Replace common AI mistakes
      .replace(/\\begin\{align\*\}/g, '\\begin{aligned}')
      .replace(/\\end\{align\*\}/g, '\\end{aligned}')
      .replace(/\\begin\{gather\*\}/g, '\\begin{gathered}')
      .replace(/\\end\{gather\*\}/g, '\\end{gathered}')
      // Fix spacing issues
      .replace(/\\;/g, '\\ ')
      .replace(/\\,/g, '\\ ')
      // Handle common fractions
      .replace(/(\d+)\\\/(\d+)/g, '\\frac{$1}{$2}')
      // Fix common trigonometric functions
      .replace(/sin\(/g, '\\sin(')
      .replace(/cos\(/g, '\\cos(')
      .replace(/tan\(/g, '\\tan(')
      .replace(/log\(/g, '\\log(')
      .replace(/ln\(/g, '\\ln(')
      // Fix common limits and integrals
      .replace(/lim_/g, '\\lim_')
      .replace(/int_/g, '\\int_')
      .replace(/sum_/g, '\\sum_');
    
    return cleaned.trim();
  };

  const cleanedContent = cleanMathContent(content);
  
  // Check if content is valid math (basic validation)
  const isValidMath = (math: string): boolean => {
    if (!math || typeof math !== 'string') return false;
    
    // Check for basic math symbols or LaTeX commands
    const mathPatterns = [
      /[+\-*/=<>]/,  // Basic operators
      /\\[a-zA-Z]+/, // LaTeX commands
      /[{}()]/,      // Math delimiters
      /[0-9]/,       // Numbers
      /[a-zA-Z]/,     // Variables
      /[$πθαβγδεηθικλμνξοπρστυφχψω]/, // Greek letters
    ];
    
    return mathPatterns.some(pattern => pattern.test(math));
  };

  // If content is not valid math, return as plain text with styling
  if (!isValidMath(cleanedContent)) {
    return (
      <span className={cn(
        'font-mono text-sm bg-muted/50 px-1 py-0.5 rounded',
        className
      )}>
        {content}
      </span>
    );
  }

  // Handle block math
  if (type === 'block') {
    return (
      <div className={cn('my-4 flex justify-center', className)}>
        <Card className="p-4 bg-background border-border shadow-sm">
          <div className="overflow-x-auto">
            <BlockMath math={cleanedContent} />
          </div>
        </Card>
      </div>
    );
  }

  // Handle inline math
  return (
    <InlineMath 
      math={cleanedContent} 
      className={cn('font-mono', className)}
    />
  );
}

// Utility function to detect and render math expressions in text
export function renderMathInText(text: string): React.ReactNode {
  if (!text || typeof text !== 'string') return text;

  // Split text by math delimiters
  const parts = text.split(/(\$\$[^$]*\$\$|\$[^$]*\$)/g);
  
  return parts.map((part, index) => {
    // Check if this part is math
    const isBlockMath = /^\$\$.*\$\$/.test(part);
    const isInlineMath = /^\$.*\$/.test(part) && !isBlockMath;
    
    if (isBlockMath) {
      const mathContent = part.slice(2, -2); // Remove $$ delimiters
      return (
        <MathBlock 
          key={index} 
          content={mathContent} 
          type="block" 
        />
      );
    }
    
    if (isInlineMath) {
      const mathContent = part.slice(1, -1); // Remove $ delimiters
      return (
        <MathBlock 
          key={index} 
          content={mathContent} 
          type="inline" 
        />
      );
    }
    
    // Regular text
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default MathBlock;