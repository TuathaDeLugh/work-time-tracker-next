"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useWorkTimer, formatTime, formatShortTime } from "@/hooks/useWorkTimer";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    state,
    totalWork,
    totalBreak,
    remainingWork,
    remainingBreak,
    isOvertime,
    lastSynced,
    isLoaded,
    startDay,
    punchToggle,
    resetDay,
    formatTime: ft,
  } = useWorkTimer();

  const [workHours, setWorkHours] = useState(8);
  const [workMinutes, setWorkMinutes] = useState(0);
  const [breakMinutes, setBreakMinutes] = useState(60);
  const [entryTime, setEntryTime] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    setEntryTime(`${h}:${m}`);
  }, []);

  if (status === "loading" || !isLoaded) {
    return (
      <div className="page-loader">
        <div className="loader-spinner" />
      </div>
    );
  }

  if (!session) return null;

  const handleStartDay = () => {
    startDay(workHours, workMinutes, breakMinutes, entryTime);
  };

  const startTimeStr = state.startTime
    ? new Date(state.startTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main-content">
        {!state.isActive ? (
          /* ─── Setup Form ─── */
          <div className="glass-card setup-card animate-in">
            <div className="card-header">
              <h1 className="gradient-text">Work Time Tracker</h1>
              <p className="subtitle">Plan your day efficiently.</p>
            </div>

            <div className="form-group">
              <label>Work Duration</label>
              <div className="dual-input">
                <div className="input-half">
                  <span className="input-label-small">Hours</span>
                  <input
                    type="number"
                    id="workHours"
                    value={workHours}
                    onChange={(e) => setWorkHours(Number(e.target.value))}
                    min="0"
                    max="24"
                  />
                </div>
                <div className="input-half">
                  <span className="input-label-small">Minutes</span>
                  <input
                    type="number"
                    id="workMinutes"
                    value={workMinutes}
                    onChange={(e) => setWorkMinutes(Number(e.target.value))}
                    min="0"
                    max="59"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Break Time (Minutes)</label>
              <input
                type="number"
                id="breakMinutes"
                value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Entry Time</label>
              <input
                type="time"
                id="entryTime"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
              />
            </div>

            <button
              onClick={handleStartDay}
              className="btn-primary btn-full"
            >
              🚀 Start Day
            </button>
          </div>
        ) : (
          /* ─── Active Timer ─── */
          <div className="glass-card dashboard-card animate-in">
            <div className="dash-header">
              <span
                className={`status-badge ${state.status === "working" ? "working" : "on-break"}`}
              >
                {state.status === "working" ? "● Working" : "◉ On Break"}
              </span>
              <span className="clock-display mono">{new Date().toLocaleTimeString()}</span>
            </div>

            <div className="timer-hero">
              <span className="timer-label">
                {isOvertime ? "Overtime" : "Remaining work"}
              </span>
              <span
                className={`timer-value mono ${isOvertime ? "overtime" : ""}`}
              >
                {isOvertime ? "+" : ""}
                {ft(Math.abs(remainingWork))}
              </span>
            </div>

            {/* Sync Status */}
            <div className="sync-status">
              <span className="sync-dot" />
              <span>
                Auto-sync active
                {lastSynced && (
                  <> · Last synced {lastSynced.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                )}
              </span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Worked</span>
                <span className="stat-value mono">{formatShortTime(totalWork)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Break Used</span>
                <span className="stat-value mono">{formatShortTime(totalBreak)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Break Left</span>
                <span
                  className={`stat-value mono ${remainingBreak <= 0 ? "danger" : ""}`}
                >
                  {formatShortTime(Math.max(0, remainingBreak))}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Entry Time</span>
                <span className="stat-value mono">{startTimeStr}</span>
              </div>
            </div>

            {state.status === "working" ? (
              <button onClick={punchToggle} className="btn-punch-out btn-full">
                ⏸ Punch Out
              </button>
            ) : (
              <button onClick={punchToggle} className="btn-punch-in btn-full">
                ▶ Punch In
              </button>
            )}

            {/* Activity Log */}
            {state.logs.length > 0 && (
              <div className="activity-section">
                <h3>Activity</h3>
                <ul className="activity-list">
                  {state.logs.slice(0, 10).map((log, i) => (
                    <li key={i} className="activity-item">
                      <span>{log.type}</span>
                      <span className="log-time mono">
                        {new Date(log.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={resetDay} className="btn-danger">
              ↺ Reset Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
