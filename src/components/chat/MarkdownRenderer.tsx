'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { CodeBlock } from './CodeBlock';
import { MathBlock } from './MathBlock';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  disableCopyButtons?: boolean;
}

/**
 * Secure Markdown Renderer Component
 * 
 * Features:
 * - XSS protection through rehype-sanitize
 * - Syntax highlighting for code blocks
 * - Math formula rendering with KaTeX
 * - GitHub Flavored Markdown support
 * - Safe HTML attribute filtering
 * - Copy buttons for code blocks
 */
export function MarkdownRenderer({ 
  content, 
  className,
  disableCopyButtons = false
}: MarkdownRendererProps) {
  // Custom sanitization schema for safe rendering
  const sanitizationSchema = {
    // Allow these HTML tags
    tagNames: [
      'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'strong', 'em', 'u', 's', 'code', 'pre', 'samp', 'kbd',
      'a', 'img', 'blockquote', 'cite',
      'ul', 'ol', 'li', 'dl', 'dt', 'dd',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    // Allow these HTML attributes
    attributes: {
      '*': ['className', 'style'],
      'a': ['href', 'title', 'target', 'rel'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'code': ['className'],
      'pre': ['className'],
      'h1': ['id'],
      'h2': ['id'],
      'h3': ['id'],
      'h4': ['id'],
      'h5': ['id'],
      'h6': ['id']
    },
    // Remove these potentially dangerous protocols
    protocols: {
      'src': ['http', 'https', 'data'],
      'href': ['http', 'https', 'mailto', 'tel']
    },
    // Remove these attributes entirely
    remove: {
      '*': ['on*', 'javascript:', 'data:']
    }
  };

  // Custom renderers for specific Markdown elements
  const renderers = {
    // Code blocks with syntax highlighting
    code: ({ node, inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      if (inline) {
        return (
          <code 
            className={cn(
              'bg-muted rounded px-1 py-0.5 text-sm font-mono',
              className
            )} 
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <CodeBlock
          language={language}
          code={String(children).replace(/\n$/, '')}
          filename={node?.data?.meta?.filename}
          disableCopyButton={disableCopyButtons}
          {...props}
        />
      );
    },

    // Math blocks using KaTeX
    math: ({ value, type }: { value: string; type: string }) => (
      <MathBlock content={value} type={type} />
    ),

    // Links with security
    link: ({ href, title, children }: any) => {
      // Validate href to prevent XSS
      let safeHref = href;
      if (href && !href.match(/^https?:\/\/|^mailto:|^tel:|^\/\//i)) {
        safeHref = '#';
      }

      return (
        <a
          href={safeHref}
          title={title}
          target={safeHref.startsWith('http') ? '_blank' : undefined}
          rel={safeHref.startsWith('http') ? 'noopener noreferrer' : undefined}
          className="text-primary hover:underline underline-offset-4 break-words"
        >
          {children}
        </a>
      );
    },

    // Images with security
    image: ({ src, alt, title }: any) => {
      // Validate image source
      if (!src || (!src.startsWith('https://') && !src.startsWith('data:'))) {
        return null;
      }

      return (
        <img
          src={src}
          alt={alt || ''}
          title={title}
          className="max-w-full h-auto rounded-lg my-2"
          loading="lazy"
        />
      );
    },

    // Tables with proper styling
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-border">
          {children}
        </table>
      </div>
    ),

    // Table headers
    th: ({ children }: any) => (
      <th className="border border-border px-4 py-2 bg-muted font-semibold text-left">
        {children}
      </th>
    ),

    // Table data cells
    td: ({ children }: any) => (
      <td className="border border-border px-4 py-2">
        {children}
      </td>
    ),

    // Blockquotes
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-primary pl-4 my-4 italic bg-muted/50 rounded-r-lg p-3">
        {children}
      </blockquote>
    ),

    // Lists with proper spacing
    list: ({ ordered, children, depth }: any) => {
      const Tag = ordered ? 'ol' : 'ul';
      const baseStyle = depth > 0 ? 'pl-4' : 'pl-6';
      
      return (
        <Tag className={cn(
          `${ordered ? 'list-decimal' : 'list-disc'} space-y-1 my-2`,
          baseStyle
        )}>
          {children}
        </Tag>
      );
    },

    // List items
    listItem: ({ children }: any) => (
      <li className="leading-relaxed">{children}</li>
    ),

    // Headings with anchor support
    heading: ({ level, children, ...props }: any) => {
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
      const headingText = React.Children.map(children, child => 
        typeof child === 'string' ? child : ''
      ).join('');
      
      // Generate ID for anchor links if heading text exists
      const id = headingText
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 50);

      return (
        <HeadingTag 
          id={id} 
          className={cn(
            'scroll-mt-20',
            {
              'text-2xl font-bold mt-8 mb-4': level === 1,
              'text-xl font-semibold mt-6 mb-3': level === 2,
              'text-lg font-semibold mt-4 mb-2': level === 3,
              'text-base font-semibold mt-3 mb-2': level === 4,
              'text-sm font-semibold mt-2 mb-1': level === 5,
              'text-xs font-semibold mt-2 mb-1': level === 6,
            }
          )}
          {...props}
        >
          {children}
        </HeadingTag>
      );
    },

    // Paragraphs with proper spacing
    paragraph: ({ children }: any) => (
      <p className="my-2 leading-relaxed">{children}</p>
    ),

    // Strong/bold text
    strong: ({ children }: any) => (
      <strong className="font-semibold">{children}</strong>
    ),

    // Emphasis/italic text
    emphasis: ({ children }: any) => (
      <em className="italic">{children}</em>
    ),

    // Underline text
    underline: ({ children }: any) => (
      <u className="underline underline-offset-4">{children}</u>
    ),

    // Strikethrough text
    delete: ({ children }: any) => (
      <s className="line-through">{children}</s>
    )
  };

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        rehypeSanitizeOptions={{ schema: sanitizationSchema }}
        components={renderers}
        skipHtml={false}
        linkTarget="_blank"
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;