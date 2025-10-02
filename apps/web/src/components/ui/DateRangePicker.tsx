import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn, formatDateRange } from '../../lib/utils';

interface DateRangePickerProps {
  value?: {
    start: Date;
    end: Date;
  };
  onChange: (range: { start: Date; end: Date }) => void;
  presets?: Array<{
    label: string;
    getValue: () => { start: Date; end: Date };
  }>;
  className?: string;
  disabled?: boolean;
}

const defaultPresets = [
  {
    label: 'Today',
    getValue: () => ({
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999)),
    }),
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        start: new Date(yesterday.setHours(0, 0, 0, 0)),
        end: new Date(yesterday.setHours(23, 59, 59, 999)),
      };
    },
  },
  {
    label: 'Last 7 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return {
        start: new Date(start.setHours(0, 0, 0, 0)),
        end: new Date(end.setHours(23, 59, 59, 999)),
      };
    },
  },
  {
    label: 'Last 30 days',
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return {
        start: new Date(start.setHours(0, 0, 0, 0)),
        end: new Date(end.setHours(23, 59, 59, 999)),
      };
    },
  },
  {
    label: 'This month',
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
      };
    },
  },
  {
    label: 'Last month',
    getValue: () => {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
      };
    },
  },
  {
    label: 'This quarter',
    getValue: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), quarter * 3, 1),
        end: new Date(now.getFullYear(), (quarter + 1) * 3, 0, 23, 59, 59, 999),
      };
    },
  },
  {
    label: 'Last quarter',
    getValue: () => {
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), (quarter - 1) * 3, 1),
        end: new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999),
      };
    },
  },
];

export function DateRangePicker({
  value,
  onChange,
  presets = defaultPresets,
  className,
  disabled = false,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{ start: Date | null; end: Date | null }>({
    start: value?.start || null,
    end: value?.end || null,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<Date | null> = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const handleDayClick = (date: Date) => {
    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
      // Start a new selection
      setSelectedRange({ start: date, end: null });
    } else {
      // Complete the selection
      if (date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start });
      } else {
        setSelectedRange({ start: selectedRange.start, end: date });
      }
    }
  };

  const handlePresetClick = (preset: { label: string; getValue: () => { start: Date; end: Date } }) => {
    const range = preset.getValue();
    setSelectedRange({ start: range.start, end: range.end });
    onChange(range);
    setIsOpen(false);
  };

  const handleApply = () => {
    if (selectedRange.start && selectedRange.end) {
      onChange({ start: selectedRange.start, end: selectedRange.end });
      setIsOpen(false);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!selectedRange.start || !selectedRange.end) return false;
    return date >= selectedRange.start && date <= selectedRange.end;
  };

  const isDateSelected = (date: Date) => {
    return (
      (selectedRange.start && date.getTime() === selectedRange.start.getTime()) ||
      (selectedRange.end && date.getTime() === selectedRange.end.getTime())
    );
  };

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center px-3 py-2 text-sm border rounded-md bg-white',
          'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
        <span>
          {value ? formatDateRange(value.start, value.end) : 'Select date range'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[600px]">
          <div className="flex gap-4">
            {/* Presets */}
            <div className="w-40 border-r pr-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick select</h3>
              <div className="space-y-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                </button>
                <h3 className="text-sm font-medium text-gray-900">{monthYear}</h3>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Days of week */}
              <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day ? (
                      <button
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          'w-full h-full text-sm rounded hover:bg-gray-100',
                          isDateSelected(day) && 'bg-primary-600 text-white hover:bg-primary-700',
                          isDateInRange(day) && !isDateSelected(day) && 'bg-primary-100',
                          day.getMonth() !== currentMonth.getMonth() && 'text-gray-400'
                        )}
                      >
                        {day.getDate()}
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                ))}
              </div>

              {/* Selected range display */}
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="text-sm">
                  {selectedRange.start && selectedRange.end ? (
                    <span className="text-gray-700">
                      {formatDateRange(selectedRange.start, selectedRange.end)}
                    </span>
                  ) : selectedRange.start ? (
                    <span className="text-gray-500">Select end date</span>
                  ) : (
                    <span className="text-gray-500">Select start date</span>
                  )}
                </div>
                <div className="space-x-2">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApply}
                    disabled={!selectedRange.start || !selectedRange.end}
                    className={cn(
                      'px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md',
                      'hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500',
                      (!selectedRange.start || !selectedRange.end) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}