import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

const StatsCard = ({ title, value, icon: Icon, subtitle }: StatsCardProps) => {
  return (
    <div className="gradient-card p-6 rounded-xl shadow-elevated border border-border hover:shadow-glow transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-secondary" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
