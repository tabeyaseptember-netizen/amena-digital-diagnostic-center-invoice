import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

export const StatCard = ({ 
  title, 
  value, 
  icon: Icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary"
}: StatCardProps) => {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label mb-2">{title}</p>
          <p className="stat-value">{value}</p>
        </div>
        <div className={`rounded-xl ${iconBgColor} p-3`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
};
