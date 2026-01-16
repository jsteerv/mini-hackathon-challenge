/**
 * NeonButton - Button with neon glow effects
 * Supports primary, secondary, and outline variants
 */

import React from 'react';

const NeonButton = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: `
      bg-[#ff6b35] text-[#0a0e27]
      hover:shadow-lg hover:shadow-orange-500/50
      hover:scale-105
    `,
    secondary: `
      bg-[#00d9c0] text-[#0a0e27]
      hover:shadow-lg hover:shadow-teal-500/50
      hover:scale-105
    `,
    outline: `
      border-2 border-[#ff6b35] text-[#ff6b35]
      hover:bg-[#ff6b35]/10
      hover:shadow-lg hover:shadow-orange-500/30
    `,
    ghost: `
      text-[#ff6b35]
      hover:bg-[#ff6b35]/10
      hover:shadow-lg hover:shadow-orange-500/20
    `,
  };

  const baseClasses = `
    font-bold px-6 py-3 rounded-lg
    transition-all duration-300
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};

export default NeonButton;
