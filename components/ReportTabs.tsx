'use client';

interface ReportTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: { id: string; label: string }[];
}

export default function ReportTabs({ activeTab, onTabChange, tabs }: ReportTabsProps) {
  return (
    <div className="bg-slate-100/70 p-1.5 rounded-2xl shadow-inner mb-6 overflow-hidden">
      <nav 
        className="flex gap-1 overflow-x-auto custom-scrollbar pb-0.5 sm:pb-0" 
        role="tablist" 
        aria-label="Project Report Tabs"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={`
                whitespace-nowrap px-5 py-3 rounded-xl font-bold text-sm transition-all duration-200
                ${isActive
                  ? 'bg-white text-indigo-700 shadow-md shadow-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
