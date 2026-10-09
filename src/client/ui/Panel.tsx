import React from 'react';

interface PanelProps {
  tone?: 'default' | 'raised' | 'inset';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children: React.ReactNode;
}

/** Surface container. `raised` for cards on a surface, `inset` for wells inside a panel. */
export function Panel({ tone = 'default', padding = 'md', className, children }: PanelProps) {
  const classes = [
    'panel',
    tone !== 'default' ? `panel--${tone}` : '',
    padding !== 'none' ? `panel--pad-${padding}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={classes}>{children}</div>;
}
