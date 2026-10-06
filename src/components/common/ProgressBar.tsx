interface Props {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'emerald' | 'yellow' | 'red';
}

const colorMap = {
  primary: 'bg-primary-500',
  emerald: 'bg-emerald-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
};

export default function ProgressBar({ value, max = 100, className = '', color = 'primary' }: Props) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = value >= 100 ? colorMap.emerald : value >= 60 ? colorMap.primary : value >= 30 ? colorMap.yellow : colorMap.red;
  return (
    <div className={`w-full bg-slate-100 rounded-full h-2 ${className}`}>
      <div
        className={`h-2 rounded-full transition-all ${color === 'primary' ? barColor : colorMap[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
