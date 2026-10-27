const variants = {
  primary: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  secondary: 'bg-purple-50 text-purple-700 border border-purple-200/60',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  gray: 'bg-gray-100 text-gray-700 border border-gray-200',
};

export default function Badge({ children, variant = 'primary', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.primary} ${className}`}>
      {children}
    </span>
  );
}
