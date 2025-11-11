'use client';

import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Copy, Check, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  disableCopyButton?: boolean;
  className?: string;
}

/**
 * Code Block Component with Syntax Highlighting
 * 
 * Features:
 * - Syntax highlighting using existing prismjs setup
 * - Copy to clipboard functionality
 * - File name display
 * - Line numbers (optional)
 * - Responsive design
 */
export function CodeBlock({ 
  code, 
  language = 'text', 
  filename,
  disableCopyButton = false,
  className 
}: CodeBlockProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Detect language from common file extensions or code patterns
  const detectLanguage = (lang: string, codeContent: string): string => {
    if (lang && lang !== 'text') return lang;

    // File extension mapping
    const extensionMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'cs': 'csharp',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'html': 'html',
      'htm': 'html',
      'xml': 'xml',
      'css': 'css',
      'scss': 'scss',
      'sass': 'scss',
      'less': 'less',
      'json': 'json',
      'yml': 'yaml',
      'yaml': 'yaml',
      'md': 'markdown',
      'sql': 'sql',
      'sh': 'bash',
      'bash': 'bash',
      'zsh': 'bash',
      'ps1': 'powershell',
      'cmd': 'batch',
      'dockerfile': 'dockerfile',
      'env': 'dotenv',
      'gitignore': 'gitignore',
      'makefile': 'makefile',
      'toml': 'toml',
      'xml': 'xml',
      'svg': 'xml'
    };

    // Check filename for extension
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase();
      if (ext && extensionMap[ext]) {
        return extensionMap[ext];
      }
    }

    // Auto-detect based on code content
    if (codeContent.includes('function ') || codeContent.includes('=>') || codeContent.includes('const ')) {
      return 'javascript';
    }
    if (codeContent.includes('def ') || codeContent.includes('import ') || codeContent.includes('from ')) {
      return 'python';
    }
    if (codeContent.includes('class ') && (codeContent.includes('public:') || codeContent.includes('#include'))) {
      return 'cpp';
    }
    if (codeContent.includes('<?php')) {
      return 'php';
    }
    if (codeContent.includes('package ') && codeContent.includes('import ')) {
      return 'java';
    }
    if (codeContent.includes('SELECT ') || codeContent.includes('FROM ')) {
      return 'sql';
    }

    return 'text';
  };

  const detectedLanguage = detectLanguage(language, code);
  const displayLanguage = detectedLanguage !== 'text' ? detectedLanguage : '';

  // Copy code to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: 'Copied to clipboard!',
        description: `${filename || 'Code'} has been copied to your clipboard.`,
      });
      
      // Reset copy button state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        title: 'Copy failed',
        description: 'Unable to copy code to clipboard.',
        variant: 'destructive',
      });
    }
  };

  // Format language display
  const formatLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'csharp': 'C#',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'yaml': 'YAML',
      'markdown': 'Markdown',
      'sql': 'SQL',
      'bash': 'Bash',
      'powershell': 'PowerShell',
      'dockerfile': 'Dockerfile',
      'xml': 'XML'
    };
    
    return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  return (
    <div className={cn('my-4', className)}>
      <Card className="border-0 shadow-lg">
        {/* Code header with filename and copy button */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b">
          <div className="flex items-center space-x-2">
            {filename && (
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">{filename}</span>
              </div>
            )}
            {displayLanguage && !filename && (
              <span className="text-sm font-medium text-muted-foreground">
                {formatLanguage(displayLanguage)}
              </span>
            )}
          </div>
          
          {!disableCopyButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 hover:bg-transparent"
              disabled={copied}
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </Button>
          )}
        </div>

        {/* Code content with syntax highlighting */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <SyntaxHighlighter
              language={detectedLanguage}
              style={oneDark}
              customStyle={{
                margin: 0,
                padding: '1rem',
                fontSize: '0.875rem',
                lineHeight: '1.5',
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                background: 'transparent',
              }}
              codeTagProps={{
                style: {
                  fontSize: 'inherit',
                  lineHeight: 'inherit',
                  fontFamily: 'inherit',
                }
              }}
              wrapLongLines={true}
              showLineNumbers={code.split('\n').length > 1}
              lineNumberStyle={{
                minWidth: '3rem',
                paddingRight: '1rem',
                textAlign: 'right',
                color: '#6b7280',
                fontSize: '0.75rem',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CodeBlock;