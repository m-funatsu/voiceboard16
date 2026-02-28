interface StatCardProps {
  label: string;
  value: number | string;
  icon?: string;
  color?: string;
}

export default function StatCard({ label, value, icon, color = 'bg-indigo-100 text-indigo-700' }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color} text-lg`}>
            {icon}
          </div>
        )}
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}
