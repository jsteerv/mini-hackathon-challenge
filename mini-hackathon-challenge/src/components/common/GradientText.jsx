/**
 * GradientText - Text with gradient color and optional glow
 * Perfect for headings and call-to-actions
 */

import React from 'react';

const GradientText = ({
  children,
  className = '',
  from = '#ff6b35',
  to = '#00d9c0',
  glow = false,
  as = 'span',
}) => {
  const baseClasses = `
    text-transparent bg-clip-text
    bg-gradient-to-r
  `;

  const glowClasses = glow ? 'animate-glow' : '';

  const Tag = as;

  return (
    <Tag
      className={`${baseClasses} ${glowClasses} ${className}`.trim()}
      style={{
        backgroundImage: `linear-gradient(to right, ${from}, ${to})`,
      }}
    >
      {children}
    </Tag>
  );
};

export default GradientText;
