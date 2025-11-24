// components/chat/message-content.tsx - SLACK-LIKE MESSAGE FORMATTING
"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface MessageContentProps {
  content: string;
  isOwn: boolean;
  className?: string;
}

export function MessageContent({ content, isOwn, className }: MessageContentProps) {
  // Parse HTML content and render with proper formatting
  const renderContent = () => {
    // Simple HTML to React conversion for common tags
    // In production, you'd use DOMPurify for sanitization
    
    // Handle mentions
    let formatted = content.replace(
      /@(\w+)/g,
      '<span class="mention">@$1</span>'
    );

    // Handle bold
    formatted = formatted.replace(
      /\*\*(.+?)\*\*/g,
      '<strong>$1</strong>'
    );

    // Handle italic
    formatted = formatted.replace(
      /\*(.+?)\*/g,
      '<em>$1</em>'
    );

    // Handle inline code
    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="inline-code">$1</code>'
    );

    // Handle strikethrough
    formatted = formatted.replace(
      /~~(.+?)~~/g,
      '<del>$1</del>'
    );

    // Handle line breaks
    formatted = formatted.replace(/\n/g, '<br />');

    return formatted;
  };

  return (
    <div
      className={cn(
        'message-content inline-block max-w-md rounded-lg px-3 py-2',
        isOwn
          ? 'bg-blue-600 text-white'
          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        className
      )}
      dangerouslySetInnerHTML={{ __html: renderContent() }}
      style={{
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      }}
    />
  );
}

// Add these styles to your global CSS
const globalStyles = `
.message-content {
  line-height: 1.5;
}

.message-content .mention {
  background-color: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
  font-weight: 600;
  padding: 0 0.25rem;
  border-radius: 0.25rem;
}

.message-content .inline-code {
  background-color: rgba(0, 0, 0, 0.05);
  color: rgb(220, 38, 38);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875em;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.dark .message-content .inline-code {
  background-color: rgba(255, 255, 255, 0.05);
  color: rgb(252, 165, 165);
  border-color: rgba(255, 255, 255, 0.1);
}

.message-content strong {
  font-weight: 700;
}

.message-content em {
  font-style: italic;
}

.message-content del {
  text-decoration: line-through;
  opacity: 0.7;
}

.message-content code {
  display: inline-block;
}

/* For code blocks */
.message-content pre {
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.375rem;
  padding: 0.75rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.dark .message-content pre {
  background-color: rgba(255, 255, 255, 0.05);
}

.message-content pre code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}

/* Lists */
.message-content ul,
.message-content ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-content li {
  margin: 0.25rem 0;
}

/* Blockquotes */
.message-content blockquote {
  border-left: 3px solid rgba(0, 0, 0, 0.2);
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  font-style: italic;
  opacity: 0.8;
}

.dark .message-content blockquote {
  border-left-color: rgba(255, 255, 255, 0.2);
}

/* Links */
.message-content a {
  color: rgb(59, 130, 246);
  text-decoration: underline;
}

.message-content a:hover {
  color: rgb(37, 99, 235);
}
`;