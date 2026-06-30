"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import type { AttendanceStatus } from "@/components/badges";

export interface AttendanceStudent {
  id: string;
  name: string;
  is_active: boolean;
}

interface AttendanceRecord {
  status: AttendanceStatus;
  notes: string;
  showNotes: boolean;
}

interface AttendanceFormProps {
  students: AttendanceStudent[];
  today: string;
  existingRecords: Array<{
    student_id: string;
    status: AttendanceStatus;
    notes: string | null;
  }>;
}

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; colors: string }[] = [
  { value: "present", label: "حاضر", colors: "border-[#16a34a] bg-[#dcfce7] text-[#166534]" },
  { value: "absent", label: "غائب", colors: "border-[#dc2626] bg-[#fee2e2] text-[#991b1b]" },
  { value: "late", label: "متأخر", colors: "border-[#ca8a04] bg-[#fef9c3] text-[#854d0e]" },
];

export function AttendanceForm({ students, today, existingRecords }: AttendanceFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sorted = [...students].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    return a.name.localeCompare(b.name, "ar");
  });

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() => {
    const init: Record<string, AttendanceRecord> = {};
    for (const s of sorted) {
      const existing = existingRecords.find((r) => r.student_id === s.id);
      init[s.id] = {
        status: existing?.status ?? "present",
        notes: existing?.notes ?? "",
        showNotes: !!(existing?.notes),
      };
    }
    return init;
  });

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const setNotes = (studentId: string, notes: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], notes },
    }));
  };

  const toggleNotes = (studentId: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], showNotes: !prev[studentId].showNotes },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch("/api/attendance/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendance_date: today,
            records: sorted.map((s) => ({
              student_id: s.id,
              status: records[s.id].status,
              notes: records[s.id].notes || null,
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "حدث خطأ");

        setSuccess(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "حدث خطأ");
      }
    });
  };

  if (sorted.length === 0) {
    return (
      <div className="card py-12 text-center text-muted-foreground">
        <p className="font-medium">لا يوجد طلاب مسندون إليك</p>
      </div>
    );
  }

  const todayFormatted = new Date(today).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="card">
        <h3 className="font-semibold text-base">{todayFormatted}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {sorted.length} طالب — الافتراضي: حاضر
        </p>
      </div>

      {success && (
        <div className="rounded-lg bg-[#dcfce7] p-3 text-sm font-medium text-[#166534] flex items-center gap-2">
          <CheckCircle2 className="size-4" />
          تم حفظ الحضور ✓
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((s) => {
          const rec = records[s.id];
          return (
            <div key={s.id} className="card space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {!s.is_active && (
                    <span className="text-xs text-muted-foreground">غير نشط</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotes(s.id)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {rec.showNotes ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(({ value, label, colors }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(s.id, value)}
                    className={`min-h-[48px] rounded-lg border-2 text-sm font-medium transition-colors ${
                      rec.status === value ? colors : "border-border bg-card text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {rec.showNotes && (
                <input
                  className="input-field text-sm"
                  placeholder="ملاحظة اختيارية…"
                  value={rec.notes}
                  onChange={(e) => setNotes(s.id, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="field-error text-base">{error}</p>}

      <button type="submit" className="btn-primary w-full py-3 text-base sticky bottom-4" disabled={isPending}>
        {isPending ? <Loader2 className="size-5 animate-spin" /> : "حفظ الكل"}
      </button>
    </form>
  );
}
