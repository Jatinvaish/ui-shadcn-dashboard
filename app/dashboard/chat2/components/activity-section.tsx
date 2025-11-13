// ============================================
// components/ActivitySection.tsx
// ============================================

"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

// ==================== TYPES ====================
interface ActivitySectionProps {
  title: string;
  count: number;
}

// ==================== ACTIVITY SECTION COMPONENT ====================
const ActivitySection: React.FC<ActivitySectionProps> = ({ title, count }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-sm font-semibold mb-2 hover:text-white"
      >
        <span>{title}</span>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-2">
          {count === 0 ? (
            <p className="text-xs text-gray-500">
              No {title.toLowerCase()} yet
            </p>
          ) : (
            Array.from({ length: Math.min(count, 3) }).map((_, i) => (
              <div
                key={i}
                className="text-xs p-2 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer"
              >
                Sample {title.toLowerCase().slice(0, -1)} {i + 1}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ActivitySection;
