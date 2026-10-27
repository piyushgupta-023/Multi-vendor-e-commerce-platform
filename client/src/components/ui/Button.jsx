import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white hover:from-indigo-700 hover:to-violet-700 shadow-md shadow-indigo-500/20 active:shadow-none',
  secondary: 'bg-white text-indigo-600 border border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/50 shadow-sm',
  ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-500/20',
  outline: 'border border-gray-200 text-gray-700 hover:bg-gray-50',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-lg',
  sm: 'px-3.5 py-1.5 text-xs rounded-xl',
  md: 'px-4.5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
  xl: 'px-8 py-3.5 text-lg rounded-2xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled,
  type = 'button',
  fullWidth = false,
  icon
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none
        ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </motion.button>
  );
}
