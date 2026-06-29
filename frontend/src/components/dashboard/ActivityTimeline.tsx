import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TimelineEvent {
  id: string | number;
  title: string;
  description: string;
  time: string;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ events }) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => {
          const Icon = event.icon;
          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {eventIdx !== events.length - 1 ? (
                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-slate-700" aria-hidden="true" />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span 
                      className="h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-800"
                      style={{ 
                        backgroundColor: event.iconBgColor || 'var(--primary)',
                        color: event.iconColor || 'white'
                      }}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-slate-400">
                        {event.description}
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right text-xs text-gray-500 dark:text-slate-400">
                      <time dateTime={event.time}>{event.time}</time>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
