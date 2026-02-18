"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { EventClickArg } from "@fullcalendar/core";
import Navbar from "@/components/Navbar";

// Lazy-load FullCalendar with SSR disabled — prevents blocking the initial render
const FullCalendar = dynamic(() => import("@fullcalendar/react"), {
  ssr: false,
  loading: () => (
    <div className="calendar-skeleton">
      <div className="calendar-skeleton-header" />
      <div className="calendar-skeleton-grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="calendar-skeleton-cell" />
        ))}
      </div>
    </div>
  ),
});

// These must be imported after FullCalendar is loaded — dynamic import handles this
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

interface WorkLog {
  id: string;
  date: string;
  punchIn: string;
  punchOut: string | null;
  totalHours: number | null;
  breakMinutes: number;
  status: string;
  notes: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    log: WorkLog;
  };
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedLog, setSelectedLog] = useState<WorkLog | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchLogs = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setDataLoading(true);
      let url = "/api/worklog";
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);

        const calendarEvents: CalendarEvent[] = data.map((log: WorkLog) => {
          const hours = log.totalHours
            ? `${log.totalHours.toFixed(1)}h`
            : "Active";
          const isActive = log.status === "active";

          return {
            id: log.id,
            title: `${hours}${isActive ? " 🟢" : ""}`,
            start: log.punchIn,
            end: log.punchOut || undefined,
            backgroundColor: isActive
              ? "rgba(0, 230, 118, 0.15)"
              : "rgba(138, 43, 226, 0.15)",
            borderColor: isActive
              ? "rgba(0, 230, 118, 0.5)"
              : "rgba(138, 43, 226, 0.4)",
            textColor: isActive ? "#00e676" : "#c4a1e8",
            extendedProps: { log },
          };
        });

        setEvents(calendarEvents);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchLogs();
    }
  }, [session, fetchLogs]);

  const handleEventClick = (info: EventClickArg) => {
    const log = info.event.extendedProps.log as WorkLog;
    setSelectedLog(log);
  };

  const handleDatesSet = (dateInfo: { startStr: string; endStr: string }) => {
    fetchLogs(dateInfo.startStr, dateInfo.endStr);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const deleteLog = async (id: string) => {
    if (!confirm("Delete this work log?")) return;
    try {
      const res = await fetch(`/api/worklog/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedLog(null);
        fetchLogs();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  // Aggregate daily stats
  const dailyStats = logs.reduce(
    (acc, log) => {
      const day = new Date(log.date).toLocaleDateString();
      if (!acc[day]) {
        acc[day] = { totalHours: 0, sessions: 0, breakMinutes: 0 };
      }
      acc[day].sessions++;
      acc[day].totalHours += log.totalHours || 0;
      acc[day].breakMinutes += log.breakMinutes || 0;
      return acc;
    },
    {} as Record<string, { totalHours: number; sessions: number; breakMinutes: number }>
  );

  const totalMonthHours = Object.values(dailyStats).reduce(
    (sum, d) => sum + d.totalHours,
    0
  );
  const totalDaysWorked = Object.keys(dailyStats).length;

  // Only block render while auth is resolving
  if (status === "loading") {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content calendar-page">
        <div className="calendar-header">
          <h1 className="gradient-text">Work Calendar</h1>
          <div className="calendar-stats">
            <div className="mini-stat">
              <span className="mini-stat-value mono">
                {totalMonthHours.toFixed(1)}h
              </span>
              <span className="mini-stat-label">Total Hours</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value mono">{totalDaysWorked}</span>
              <span className="mini-stat-label">Days Worked</span>
            </div>
            <div className="mini-stat">
              <span className="mini-stat-value mono">
                {totalDaysWorked > 0
                  ? (totalMonthHours / totalDaysWorked).toFixed(1) + "h"
                  : "0h"}
              </span>
              <span className="mini-stat-label">Avg / Day</span>
            </div>
          </div>
        </div>

        <div className="calendar-wrapper glass-card">
          {dataLoading && (
            <div className="calendar-data-loading">
              <div className="loader-spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            </div>
          )}
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek",
            }}
            events={events}
            eventClick={handleEventClick}
            datesSet={handleDatesSet}
            height="auto"
            dayMaxEvents={3}
            eventDisplay="block"
            nowIndicator={true}
          />
        </div>

        {/* Day Detail Modal */}
        {selectedLog && (
          <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div
              className="modal-card glass-card animate-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Work Session</h2>
                <button
                  className="modal-close"
                  onClick={() => setSelectedLog(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value mono">
                    {new Date(selectedLog.date).toLocaleDateString("en-IN", {
                      dateStyle: "long",
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Punch In</span>
                  <span className="detail-value mono">
                    {formatDateTime(selectedLog.punchIn)}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Punch Out</span>
                  <span className="detail-value mono">
                    {selectedLog.punchOut
                      ? formatDateTime(selectedLog.punchOut)
                      : "Still active"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Hours</span>
                  <span className="detail-value mono highlight">
                    {selectedLog.totalHours
                      ? `${selectedLog.totalHours.toFixed(2)}h`
                      : "In progress"}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span
                    className={`status-badge-small ${selectedLog.status === "active" ? "active" : "completed"}`}
                  >
                    {selectedLog.status === "active" ? "Active" : "Completed"}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  className="btn-danger-small"
                  onClick={() => deleteLog(selectedLog.id)}
                >
                  Delete Log
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
