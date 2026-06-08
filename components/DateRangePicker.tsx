'use client';

import { useState, useEffect } from 'react';
import CustomDateInput from './CustomDateInput';
import { Calendar, Clock, X } from 'lucide-react';

interface DateRangePickerProps {
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
}

export default function DateRangePicker({ onDateRangeChange }: DateRangePickerProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Combine date and time into a Date object with defaults
  const combineDateTime = (dateStr: string, timeStr: string, isEndDate: boolean = false): Date | null => {
    if (!dateStr) return null;
    // Default times: 00:00:00 for start, 23:59:59 for end
    const defaultTime = isEndDate ? '23:59:59' : '00:00:00';
    const timeToUse = timeStr || defaultTime;
    const dateTimeStr = `${dateStr}T${timeToUse}`;
    const date = new Date(dateTimeStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // Auto-set default times when date is selected but time is not set
  useEffect(() => {
    if (startDate && !startTime) {
      setStartTime('00:00:00');
    }
  }, [startDate, startTime]);

  useEffect(() => {
    if (endDate && !endTime) {
      setEndTime('23:59:59');
    }
  }, [endDate, endTime]);

  // Notify parent when date range changes
  useEffect(() => {
    const start = combineDateTime(startDate, startTime, false);
    const end = combineDateTime(endDate, endTime, true);
    onDateRangeChange(start, end);
  }, [startDate, startTime, endDate, endTime, onDateRangeChange]);

  const handleClear = () => {
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
  };

  const hasFilter = startDate || endDate;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm shadow-slate-100/40 mb-6">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-600" />
          Filter by Date/Time Range
        </h3>
        {hasFilter && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/60 px-3 py-1.5 rounded-lg transition-all"
            aria-label="Clear all date and time filters"
          >
            <X className="w-3.5 h-3.5" />
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="start-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Start Date & Time
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomDateInput
                value={startDate}
                onChange={setStartDate}
                placeholder="Select start date"
                id="start-date"
              />
            </div>
            <input
              id="start-time"
              type="time"
              step="1"
              aria-label="Start time"
              value={startTime || '00:00:00'}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-36 px-4 py-2.5 border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-base outline-none bg-white transition-all shadow-sm"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            End Date & Time
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomDateInput
                value={endDate}
                onChange={setEndDate}
                placeholder="Select end date"
                id="end-date"
              />
            </div>
            <input
              id="end-time"
              type="time"
              step="1"
              aria-label="End time"
              value={endTime || '23:59:59'}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-36 px-4 py-2.5 border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-base outline-none bg-white transition-all shadow-sm"
            />
          </div>
        </div>
      </div>
      
      {!hasFilter && (
        <p className="text-xs text-slate-500 mt-4 font-semibold" role="status">Showing all dates detected in active session.</p>
      )}
      {hasFilter && (
        <p className="text-xs font-bold text-indigo-700 mt-4 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50" aria-live="polite">
          {startDate && endDate 
            ? `Filtering from ${startDate} ${startTime || '00:00:00'} to ${endDate} ${endTime || '23:59:59'}`
            : startDate 
            ? `Filtering from ${startDate} ${startTime || '00:00:00'} onwards`
            : endDate
            ? `Filtering up to ${endDate} ${endTime || '23:59:59'}`
            : ''}
        </p>
      )}
    </div>
  );
}
