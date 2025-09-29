import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

type PageHeaderProps = {
  title: ReactNode;
  description: string;
  badge?: {
    icon: ReactNode;
    text: string;
  };
  action?: ReactNode;
};

export function PageHeader({ title, description, badge, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-4">
        {badge && (
          <Badge variant="secondary" className="bg-gradient-to-r from-blue-500/20 to-green-500/20 border-blue-500/30">
            {badge.icon}
            {badge.text}
          </Badge>
        )}
        {action}
      </div>
    </div>
  );
}
