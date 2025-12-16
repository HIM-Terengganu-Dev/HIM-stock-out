'use client';

import { useState } from 'react';
import ReportDisplay from './ReportDisplay';
import VisualsView from './VisualsView';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';

interface ReportContainerProps {
    title: string;
    dateRange?: string;
    data: any[];
    onExport: () => void;
    hideExportButton?: boolean;
    visualsEnabled?: boolean; // Some reports (like breakdown) might not need visuals yet or ever
}

export default function ReportContainer(props: ReportContainerProps) {
    const [view, setView] = useState<'table' | 'visual'>('table');
    const { visualsEnabled = true } = props;

    return (
        <div className="space-y-4">
            {/* View Toggle (Only if visuals are enabled and there is data) */}
            {visualsEnabled && props.data.length > 0 && (
                <div className="flex justify-end">
                    <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center">
                        <button
                            onClick={() => setView('table')}
                            className={`
                flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
              `}
                        >
                            <TableIcon className="w-4 h-4 mr-2" />
                            Data Table
                        </button>
                        <button
                            onClick={() => setView('visual')}
                            className={`
                flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${view === 'visual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}
              `}
                        >
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Visual Reports
                        </button>
                    </div>
                </div>
            )}

            <div className="animate-in fade-in duration-300">
                {view === 'table' ? (
                    <ReportDisplay {...props} />
                ) : (
                    <VisualsView data={props.data} />
                )}
            </div>
        </div>
    );
}
