import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange';
  format?: 'currency' | 'percentage' | 'number';
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50'
  },
  green: {
    bg: 'bg-green-500',
    text: 'text-green-600',
    lightBg: 'bg-green-50'
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-red-600',
    lightBg: 'bg-red-50'
  },
  yellow: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
    lightBg: 'bg-yellow-50'
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-50'
  },
  orange: {
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    lightBg: 'bg-orange-50'
  }
};

export function MetricCard({ title, value, change, icon: Icon, color, format = 'number' }: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
    }
    if (format === 'percentage') {
      return `${Number(val).toFixed(1)}%`;
    }
    return val.toString();
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-3xl font-bold text-gray-900">{formatValue(value)}</p>
            {change !== undefined && (
              <div className="flex items-center">
                <span className={`text-sm font-semibold ${
                  change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change >= 0 ? '↗' : '↘'} {change >= 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}