'use client';

import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function CustomDateInput({ value, onChange, placeholder = 'Select date', id }: CustomDateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(value ? new Date(value) : null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
  };

  const handleInputClick = () => {
    setIsOpen(!isOpen);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const today = new Date();
  const displayDate = selectedDate || today;
  const daysInMonth = getDaysInMonth(displayDate);
  const firstDay = getFirstDayOfMonth(displayDate);

  const days: (number | null)[] = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Add all days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(displayDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const isToday = (day: number) => {
    const checkDate = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
    return checkDate.toDateString() === today.toDateString();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return selectedDate.getDate() === day &&
           selectedDate.getMonth() === displayDate.getMonth() &&
           selectedDate.getFullYear() === displayDate.getFullYear();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          id={id}
          ref={inputRef}
          type="text"
          readOnly
          value={value}
          onClick={handleInputClick}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 pr-10 border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer bg-white rounded-xl outline-none transition-all shadow-sm font-medium text-slate-700"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <Calendar className="w-5 h-5" />
        </div>
      </div>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-100/40 z-50 w-68 p-4.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all"
              type="button"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <h3 className="font-bold text-slate-800 text-sm">
              {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1.5 hover:bg-slate-50 border border-slate-100 rounded-lg transition-all"
              type="button"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-[10px] font-extrabold text-slate-400 py-1 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              return (
                <button
                  key={day}
                  onClick={() => handleDateSelect(new Date(displayDate.getFullYear(), displayDate.getMonth(), day))}
                  className={`
                    aspect-square flex items-center justify-center text-xs rounded-xl transition-all font-semibold
                    ${isSelected(day) 
                      ? 'bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-100' 
                      : isToday(day)
                      ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-100'
                      : 'text-slate-700 hover:bg-slate-50'
                    }
                  `}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
