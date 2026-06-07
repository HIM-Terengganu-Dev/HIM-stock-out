'use client';

interface ReportTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    tabs: { id: string; label: string }[];
}

export default function ReportTabs({ activeTab, onTabChange, tabs }: ReportTabsProps) {
    return (
        <div className="border-b border-gray-200 mb-8 overflow-hidden">
            <nav className="-mb-px flex space-x-8 overflow-x-auto custom-scrollbar shadow-sm" role="tablist" aria-label="Project Report Tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        aria-controls={`panel-${tab.id}`}
                        onClick={() => onTabChange(tab.id)}
                        className={`
              whitespace-nowrap py-4 px-4 border-b-2 font-semibold text-base transition-all duration-200
              ${activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
}
