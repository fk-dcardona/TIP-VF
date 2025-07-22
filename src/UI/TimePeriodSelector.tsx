import React from 'react';
import { Calendar, TrendingUp, HelpCircle } from 'lucide-react';

interface TimePeriodSelectorProps {
  selectedPeriod: string | undefined;
  availablePeriods: string[];
  onPeriodChange: (period: string) => void;
  className?: string;
}

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selectedPeriod,
  availablePeriods,
  onPeriodChange,
  className = ''
}) => {
  const formatPeriod = (period: string) => {
    if (!period) return 'No period';
    
    try {
      // Handle various period formats
      let date: Date;
      
      // If it's already in a readable format, just return it
      if (period.includes('/')) {
        // Handle M/D/YYYY format from CSV
        const parts = period.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0]) - 1; // Month is 0-indexed
          const day = parseInt(parts[1]);
          const year = parseInt(parts[2]);
          date = new Date(year, month, day);
        } else {
          return period; // Return as-is if can't parse
        }
      } else if (period.includes('-')) {
        // Handle YYYY-MM-DD format - move to end of month
        const [year, month, day] = period.split('-').map(Number);
        // Create date at end of month
        date = new Date(year, month, 0); // month 0 = last day of previous month
      } else {
        // Default case - try to parse directly
        date = new Date(period);
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return period; // Return original if invalid
      }
      
      // Always show as end-of-month
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      return endOfMonth.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return period; // Return original if parsing fails
    }
  };

  // Remove duplicates and sort periods in descending order
  const uniquePeriods = Array.from(new Set(availablePeriods))
    .filter(period => period && period.trim() !== '')
    .sort((a, b) => {
      try {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return b.localeCompare(a);
      }
    });

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Calendar className="h-4 w-4" />
        <span>Inventory Period:</span>
      </div>
      
      <select
        value={selectedPeriod || ''}
        onChange={(e) => onPeriodChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {uniquePeriods.length > 0 ? (
          uniquePeriods.map((period) => (
            <option key={period} value={period}>
              {formatPeriod(period)}
            </option>
          ))
        ) : (
          <option value="">No periods available</option>
        )}
      </select>
      
      {uniquePeriods.length > 1 && (
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <TrendingUp className="h-3 w-3" />
          <span>{uniquePeriods.length} periods available</span>
        </div>
      )}
    </div>
  );
}; 