/**
 * GlassCard - Glass morphism card component
 * Provides a frosted glass effect with subtle borders
 */

import React from 'react';

const GlassCard = ({ children, className = '', hover = true, onClick }) => {
  const baseClasses = `
    bg-[#1a2133]/80 backdrop-blur-sm
    border border-white/10
    p-6 rounded-lg
    transition-all duration-300
  `;

  const hoverClasses = hover
    ? 'hover:scale-[1.02] hover:border-[#ff6b35]/50 hover:shadow-lg hover:shadow-orange-500/20'
    : '';

  const interactiveClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${interactiveClasses} ${className}`.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default GlassCard;
