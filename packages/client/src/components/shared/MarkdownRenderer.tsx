import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { slugify } from '@shared';
import { Link as LinkIcon } from 'lucide-react';
import CopyButton from './CopyButton';
import 'highlight.js/styles/github-dark.css';

export default function MarkdownRenderer({ content, className = '' }: { content: string; className?: string }) {
  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight]}
        components={{
          pre({ children, ...props }) {
            return (
              <div className="group relative">
                <CopyButton content={extractText(children)} />
                <pre {...props}>{children}</pre>
              </div>
            );
          },
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith('http');
            return (
              <a
                href={href}
                {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
          img({ src, alt, ...props }) {
            return <img src={src} alt={alt} loading="lazy" className="max-w-full rounded-lg" {...props} />;
          },
          h1: HeadingWithAnchor('h1'),
          h2: HeadingWithAnchor('h2'),
          h3: HeadingWithAnchor('h3'),
          h4: HeadingWithAnchor('h4'),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function HeadingWithAnchor(Tag: 'h1' | 'h2' | 'h3' | 'h4') {
  return function Heading({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    const text = extractText(children);
    const id = slugify(text);
    return (
      <Tag id={id} className="group/heading" {...props}>
        {children}
        <a
          href={`#${id}`}
          className="ml-2 inline-block opacity-0 transition-opacity group-hover/heading:opacity-100"
          aria-label={`Link to ${text}`}
        >
          <LinkIcon className="inline h-4 w-4 text-muted-foreground" />
        </a>
      </Tag>
    );
  };
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const el = node as { props?: { children?: React.ReactNode } };
    return extractText(el.props?.children);
  }
  return '';
}
