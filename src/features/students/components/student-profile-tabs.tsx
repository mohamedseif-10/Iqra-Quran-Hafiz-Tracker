"use client";

import { useState } from "react";
import { InitialMemorizationGrid, type JuzEntry } from "@/features/students/components/initial-memorization-grid";
import { StudentSessionsTab } from "@/features/sessions/components/student-sessions-tab";
import { StudentAttendanceTab } from "@/features/attendance/components/student-attendance-tab";
import { ProgressMap } from "@/features/students/components/progress-map";
import { StudentIjazatTab } from "@/features/ijazat/components/student-ijazat-tab";

type TabId = "progress" | "sessions" | "attendance" | "ijazat";

interface StudentProfileTabsProps {
  studentId: string;
  initMemValue: JuzEntry[];
  isAdmin?: boolean;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "progress", label: "التقدم" },
  { id: "sessions", label: "الجلسات" },
  { id: "attendance", label: "الحضور" },
  { id: "ijazat", label: "الإجازات" },
];

export function StudentProfileTabs({
  studentId,
  initMemValue,
  isAdmin = false,
}: StudentProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("progress");

  return (
    <div className="card p-0">
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === "progress" && (
          <div className="space-y-6">
            <ProgressMap studentId={studentId} />
            {initMemValue.length > 0 && (
              <div className="space-y-3 border-t border-border pt-4">
                <p className="text-sm font-medium">الحفظ السابق قبل الانضمام</p>
                <InitialMemorizationGrid value={initMemValue} readOnly />
              </div>
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <StudentSessionsTab studentId={studentId} />
        )}

        {activeTab === "attendance" && (
          <StudentAttendanceTab studentId={studentId} />
        )}

        {activeTab === "ijazat" && (
          <StudentIjazatTab studentId={studentId} isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}
