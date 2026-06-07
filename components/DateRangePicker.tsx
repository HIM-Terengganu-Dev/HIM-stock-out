'use client';

import { useState, useEffect } from 'react';
import CustomDateInput from './CustomDateInput';

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
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">Filter by Date/Time Range</h3>
        {hasFilter && (
          <button
            onClick={handleClear}
            className="text-base font-medium text-blue-600 hover:text-blue-800 underline underline-offset-4"
            aria-label="Clear all date and time filters"
          >
            Clear Filter
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-base font-semibold text-gray-700 mb-2">
            Start Date & Time
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomDateInput
                value={startDate}
                onChange={setStartDate}
                placeholder="Start date"
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
              className="w-40 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-base font-semibold text-gray-700 mb-2">
            End Date & Time
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <CustomDateInput
                value={endDate}
                onChange={setEndDate}
                placeholder="End date"
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
              className="w-40 px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
          </div>
        </div>
      </div>
      
      {!hasFilter && (
        <p className="text-base text-gray-500 mt-3 font-medium" role="status">No filter applied - showing all data</p>
      )}
      {hasFilter && (
        <p className="text-base text-gray-700 mt-3 font-medium bg-blue-50/50 p-3 rounded-lg border border-blue-100" aria-live="polite">
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

