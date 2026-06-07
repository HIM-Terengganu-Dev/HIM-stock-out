'use client';

import { useState } from 'react';
import ReportDisplay from './ReportDisplay';
import { LayoutGrid, Table as TableIcon } from 'lucide-react';
import dynamic from 'next/dynamic';

const VisualsView = dynamic(() => import('./VisualsView'), {
  ssr: false,
});

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
                    <div className="bg-gray-100 p-1.5 rounded-xl inline-flex items-center" role="radiogroup" aria-label="Report view selection">
                        <button
                            onClick={() => setView('table')}
                            role="radio"
                            aria-checked={view === 'table'}
                            className={`
                flex items-center px-5 py-2.5 rounded-lg text-base font-semibold transition-all duration-200
                ${view === 'table' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}
              `}
                        >
                            <TableIcon className="w-5 h-5 mr-3" aria-hidden="true" />
                            Data Table
                        </button>
                        <button
                            onClick={() => setView('visual')}
                            role="radio"
                            aria-checked={view === 'visual'}
                            className={`
                flex items-center px-5 py-2.5 rounded-lg text-base font-semibold transition-all duration-200
                ${view === 'visual' ? 'bg-white text-blue-700 shadow-md' : 'text-gray-500 hover:text-gray-700'}
              `}
                        >
                            <LayoutGrid className="w-5 h-5 mr-3" aria-hidden="true" />
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
