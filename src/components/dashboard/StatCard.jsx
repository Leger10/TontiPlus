import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const StatCard = ({ title, value, icon: Icon, trend }) => {
  return (
    <Card className="border border-[#4a4a4a] bg-[#3a3a3a]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-[#b0b0b0] uppercase tracking-wide">{title}</p>
            <h3 className="text-3xl font-extrabold mt-2 text-white">{value}</h3>
            {trend && (
              <p className={`text-sm mt-2 font-medium ${trend.positive ? 'text-[hsl(var(--primary))]' : 'text-destructive'}`}>
                {trend.positive ? '+' : '-'}{trend.value}% depuis le mois dernier
              </p>
            )}
          </div>
          <div className="h-14 w-14 rounded-2xl bg-[#2d2d2d] border border-[#4a4a4a] flex items-center justify-center text-[hsl(var(--accent))] shadow-inner">
            {Icon && <Icon size={28} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;