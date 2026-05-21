import React, { useState, useEffect, useRef } from "react";

/* ── helpers ── */
const cx = (...args) => args.filter(Boolean).join(" ");

/* Network helper: exponential backoff with jitter for 429s */
async function fetchWithBackoff(url, opts = {}, retries = 5, baseDelay = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, opts);
      if (res.status !== 429) return res;
      // 429 received: respect Retry-After if present
      const retryAfter = res.headers.get && res.headers.get('Retry-After');
      if (retryAfter) {
        const waitMs = Number(retryAfter) * 1000;
        await new Promise(r => setTimeout(r, waitMs));
      } else {
        const jitter = Math.random() * 100;
        const waitMs = baseDelay * (2 ** attempt) + jitter;
        await new Promise(r => setTimeout(r, waitMs));
      }
    } catch (err) {
      // Network error: retry unless last attempt
      if (attempt === retries) throw err;
      const jitter = Math.random() * 200;
      const waitMs = baseDelay * (2 ** attempt) + jitter;
      await new Promise(r => setTimeout(r, waitMs));
    }
  }
  throw new Error('Max retries reached for ' + url);
}

async function fetchJsonWithBackoff(url, opts = {}, retries = 5) {
  const res = await fetchWithBackoff(url, opts, retries);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`Request failed: ${res.status} ${res.statusText} ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}
/* ── static data ── */
const MARKS = [
  { sub: "Mathematics", mark: 88, grade: "A+", color: "#16a34a" },
  { sub: "Science", mark: 74, grade: "B", color: "#1a56db" },
  { sub: "English", mark: 91, grade: "A+", color: "#0d9488" },
  { sub: "Social Science", mark: 62, grade: "C", color: "#d97706" },
  { sub: "Tamil", mark: 79, grade: "B+", color: "#16a34a" },
];
const GRADE_CLS = { "A+": "green", A: "green", "B+": "blue", B: "blue", C: "amber", D: "red" };

const TIMETABLE = [
  { time: "8:00", sub: "Mathematics", teacher: "Mrs. Lakshmi", room: "R-12", color: "#1a56db" },
  { time: "9:00", sub: "Science", teacher: "Mr. Rajan", room: "Lab-1", color: "#0d9488" },
  { time: "10:00", sub: "Break", teacher: "", room: "", color: "#9ba0b0" },
  { time: "10:20", sub: "English", teacher: "Ms. Anitha", room: "R-12", color: "#d97706" },
  { time: "11:20", sub: "Tamil", teacher: "Mrs. Kamala", room: "R-14", color: "#16a34a" },
  { time: "12:20", sub: "Social Science", teacher: "Mr. Senthil", room: "R-12", color: "#dc2626" },
];

const DASH_ATT = [
  { p: 92, a: 5, l: 3, day: "Mon" }, { p: 96, a: 3, l: 1, day: "Tue" },
  { p: 78, a: 18, l: 4, day: "Wed" }, { p: 94, a: 4, l: 2, day: "Thu" },
  { p: 88, a: 8, l: 4, day: "Fri" }, { p: 91, a: 6, l: 3, day: "Mon" },
  { p: 97, a: 2, l: 1, day: "Tue" }, { p: 89, a: 7, l: 4, day: "Wed" },
];

const TOP_STUDENTS = [
  { name: "Priya Devi", cls: "9-A", avg: "94%", rank: 1, color: "#d97706" },
  { name: "Arjun Kumar", cls: "9-A", avg: "88%", rank: 2, color: "#6b7080" },
  { name: "Riya S", cls: "10-A", avg: "86%", rank: 3, color: "#cd7f32" },
  { name: "Vikram P", cls: "7-A", avg: "85%", rank: 4, color: "#1a56db" },
  { name: "Meena T", cls: "9-A", avg: "82%", rank: 5, color: "#16a34a" },
];

const PERF_SUBJECTS = [
  { s: "Maths", v: 74, c: "#1a56db" }, { s: "Sci", v: 68, c: "#0d9488" },
  { s: "Eng", v: 82, c: "#16a34a" }, { s: "SS", v: 62, c: "#dc2626" },
  { s: "Tamil", v: 77, c: "#d97706" },
];

const TEACHER_STUDENTS = [
  { name: "Arjun Kumar", roll: "14", init: "AK", status: "P" },
  { name: "Priya Devi", roll: "22", init: "PD", status: "P" },
  { name: "Rahul Sharma", roll: "31", init: "RS", status: "P" },
  { name: "Meena T", roll: "08", init: "MT", status: "P" },
  { name: "Karthik R", roll: "17", init: "KR", status: "P" },
  { name: "Divya K", roll: "05", init: "DK", status: "P" },
  { name: "Suresh P", roll: "38", init: "SP", status: "A" },
  { name: "Ananya V", roll: "03", init: "AV", status: "L" },
];

const ENROLL = [
  { cls: "Cl.6", n: 238 }, { cls: "Cl.7", n: 252 }, { cls: "Cl.8", n: 260 },
  { cls: "Cl.9", n: 268 }, { cls: "Cl.10", n: 222 },
];

const TIMELINE_DATA = [
  { year: "Class 9 — 2024–25", detail: "GKM Matric · Avg 79% · Att 87% · Rank #4", color: "#1a56db" },
  { year: "Class 8 — 2023–24", detail: "GKM Matric · Avg 82% · Att 91% · Perfect Attendance Award", color: "#16a34a" },
  { year: "Class 7 — 2022–23", detail: "St. Joseph's CBSE · Avg 79% · Att 88%", color: "#d97706" },
  { year: "Class 6 — 2021–22", detail: "St. Joseph's CBSE · Avg 75% · Att 85%", color: "#9ba0b0" },
];

const ATT_DAYS = "M,T,W,T,F,M,T,W,T,F,M,T,W,T,F,M,T,W,T,F,M,T,W,T".split(",");
const ATT_STATUS = [1,1,0,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,0,1,1,1];

const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard", section: "Overview" },
  { id: "student", icon: "🎓", label: "Student", section: "Modules" },
  { id: "courses", icon: "📚", label: "Courses", section: null },
  { id: "parent", icon: "👨‍👩‍👧", label: "Parent", badge: "3", section: null },
  { id: "teacher", icon: "👨‍🏫", label: "Teacher", section: null },
  { id: "admin", icon: "🏫", label: "Admin", section: null },
  { id: "record", icon: "🪪", label: "Digital Record", section: null },
  { id: "ai", icon: "🤖", label: "AI Insights", section: null },
  { id: "fees", icon: "💰", label: "Fee Management", section: "System" },
  { id: "reports", icon: "📊", label: "Reports", section: null },
  { id: "settings", icon: "⚙", label: "Settings", section: null },
];

/* Small in-memory users for demo (username/password) */
const USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "Admin Kumar", init: "AK" },
  { username: "teacher", password: "teach123", role: "teacher", name: "Mrs. Lakshmi", init: "ML" },
  { username: "student", password: "student123", role: "student", name: "Arjun Kumar", init: "AK" },
  { username: "parent", password: "parent123", role: "parent", name: "Mr. Suresh", init: "SK" },
];

/* Role -> allowed pages (simple RBAC demo) */
const ALLOWED_PAGES = {
  admin: NAV.map(n => n.id),
  teacher: ["dashboard","teacher","reports","student","record","settings","ai"],
  parent: ["dashboard","parent","fees","record"],
  student: ["dashboard","student","record","ai"],
};

const ROLE_DEFAULT_PAGE = { admin: 'dashboard', teacher: 'teacher', parent: 'parent', student: 'student' };

/* ── sub-components ── */
function Badge({ variant = "gray", children }) {
  const cls = {
    green: { bg: "rgba(22,163,74,0.1)", color: "#16a34a" },
    amber: { bg: "rgba(217,119,6,0.1)", color: "#d97706" },
    red: { bg: "rgba(220,38,38,0.1)", color: "#dc2626" },
    blue: { bg: "rgba(26,86,219,0.08)", color: "#1a56db" },
    teal: { bg: "rgba(13,148,136,0.08)", color: "#0d9488" },
    gray: { bg: "#eef0f4", color: "#6b7080" },
  }[variant] || { bg: "#eef0f4", color: "#6b7080" };
  return (
    <span style={{
      display: "inline-block", padding: "2px 9px", borderRadius: 4,
      fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
      background: cls.bg, color: cls.color,
    }}>{children}</span>
  );
}

function AlertItem({ icon, iconVariant = "blue", title, desc, meta, children }) {
  const bg = { green: "rgba(22,163,74,0.1)", red: "rgba(220,38,38,0.1)", amber: "rgba(217,119,6,0.1)", blue: "rgba(26,86,219,0.08)" }[iconVariant];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 9, border: "0.5px solid rgba(0,0,0,0.08)", background: "#fff" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#0f1117" }}>{title}</div>
        {desc && <div style={{ fontSize: 11, color: "#6b7080" }}>{desc}</div>}
      </div>
      {meta && <div style={{ fontSize: 10, color: "#9ba0b0", flexShrink: 0 }}>{meta}</div>}
      {children}
    </div>
  );
}

function StatCard({ color = "blue", label, value, sub, change, changeDir = "up" }) {
  const accent = { blue: "#1a56db", green: "#16a34a", amber: "#d97706", red: "#dc2626" }[color];
  return (
    <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent, borderRadius: "12px 12px 0 0" }} />
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, color: "#0f1117", letterSpacing: -1, lineHeight: 1, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#6b7080", marginTop: 6 }}>{sub}</div>}
      {change && <div style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, marginTop: 6, color: changeDir === "up" ? "#16a34a" : "#dc2626" }}>{change}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.07)", padding: "18px 20px", ...style }}>
      {children}
    </div>
  );
}

function CardHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
      <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080" }}>{title}</span>
      {action && <span style={{ fontSize: 11, color: "#1a56db", cursor: "pointer", fontWeight: 600 }}>{action}</span>}
    </div>
  );
}

function PageHero({ title, sub }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#1a56db 0%,#0e3a9e 100%)", borderRadius: 12, padding: "24px 28px", color: "#fff", marginBottom: 22, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: -20, top: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      <h2 style={{ fontFamily: "Georgia, serif", fontSize: 22, marginBottom: 4, fontWeight: 400 }}>{title}</h2>
      <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>{sub}</p>
    </div>
  );
}

function Btn({ variant = "primary", size = "md", onClick, children, style }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 7, borderRadius: 8, fontFamily: "inherit", fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s" };
  const variants = {
    primary: { background: "#1a56db", color: "#fff", ...base },
    secondary: { background: "#f7f8fa", color: "#3d4152", border: "0.5px solid rgba(0,0,0,0.12)", ...base },
  };
  const sizes = { md: { padding: "9px 18px", fontSize: 13 }, sm: { padding: "6px 13px", fontSize: 11 } };
  return <button style={{ ...variants[variant], ...sizes[size], ...style }} onClick={onClick}>{children}</button>;
}

function FeeBar({ label, amount, pct, color = "#16a34a", status }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#3d4152" }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 600 }}>{amount}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#eef0f4", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 4, background: color, width: `${pct}%`, transition: "width .6s ease" }} />
      </div>
      {status && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: status.paid ? "#16a34a" : "#dc2626" }}>{status.label}</span>
          <span style={{ fontSize: 10, color: status.paid ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{status.paid ? "✓" : "Pending"}</span>
        </div>
      )}
    </div>
  );
}

/* ── pages ── */

function Dashboard() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard color="blue" label="Total Students" value="1,240" change="↑ 48 this year" changeDir="up" />
        <StatCard color="green" label="Today's Attendance" value="91%" change="↑ 3% vs yesterday" changeDir="up" />
        <StatCard color="amber" label="Fee Collected" value="₹12.4L" sub="Term 2 · 76% rate" />
        <StatCard color="red" label="Pending Fees" value="₹3.9L" sub="298 students due" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Weekly Attendance — All Classes" action="View full report →" />
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            {[ ["#1a56db","Present"],["#dc2626","Absent"],["#d97706","Late"] ].map(([c,l]) => (
              <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#6b7080" }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100 }}>
            {DASH_ATT.map((d, i) => (
              <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, height: "100%" }}>
                {[[d.p,"#1a56db"],[d.a,"#dc2626"],[d.l,"#d97706"]].map(([v,c],j) => (
                  <div key={j} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: c, height: `${(v/100)*90}px`, minHeight: 2 }} />
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {DASH_ATT.map((d,i) => <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#9ba0b0" }}>{d.day}</span>)}
          </div>
        </Card>

        <Card>
          <CardHeader title="Live Alerts" action="All →" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AlertItem icon="🚨" iconVariant="red" title="3 students absent — Class 10-A" desc="Parents notified via WhatsApp" meta="Now" />
            <AlertItem icon="💰" iconVariant="amber" title="Fee due — 14 students" desc="Reminder sent automatically" meta="1hr" />
            <AlertItem icon="✅" iconVariant="green" title="Marks uploaded — Class 9-A" desc="By Mrs. Lakshmi · Maths" meta="2hr" />
            <AlertItem icon="📝" iconVariant="blue" title="Assignment due tomorrow" desc="Class 8 · Science Ch.6" meta="5hr" />
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader title="Class Performance — Term 2" action="Details →" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Class","Students","Avg Mark","Status"].map(h => <th key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080", padding: "8px 12px", textAlign: "left", background: "#f7f8fa", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {[ ["Class 10-A",42,"79%","green","Good"],["Class 9-A",45,"74%","blue","Average"],["Class 8-B",44,"68%","amber","Needs work"],["Class 7-A",40,"82%","Excellent"],["Class 6-C",38,"61%","red","At risk"] ].map(([cls,n,avg,v,lbl]) => (
                <tr key={cls} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{cls}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{n}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{avg}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}><Badge variant={v}>{lbl}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Top Students — This Term" action="All →" />
          {TOP_STUDENTS.map(s => (
            <div key={s.rank} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.color, width: 20, textAlign: "center" }}>{s.rank}</div>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f7f8fa", border: "0.5px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#3d4152" }}>{s.name.split(" ").map(w=>w[0]).join("")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "#6b7080" }}>Class {s.cls}</div>
              </div>
              <Badge variant="green">{s.avg}</Badge>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Student() {
  return (
    <div>
      <PageHero title="Student Portal" sub="Arjun Kumar · Class 9-A · Roll No. 14 · GKM Matric School" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard color="blue" label="Attendance" value="87%" sub="21/24 days present" />
        <StatCard color="green" label="Overall Rank" value="#4" sub="out of 45 students" />
        <StatCard color="amber" label="Avg Mark" value="79%" sub="Term 2 · 5 subjects" />
        <StatCard color="red" label="Homework Due" value="2" sub="Submit by tomorrow" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Exam Marks — Term 2" action="Download report card →" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>{["Subject","Mark","Grade"].map(h => <th key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080", padding: "8px 12px", textAlign: "left", background: "#f7f8fa", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {MARKS.map(m => (
                <tr key={m.sub} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>
                    <div style={{ fontWeight: 500 }}>{m.sub}</div>
                    <div style={{ height: 3, borderRadius: 2, background: "#eef0f4", marginTop: 4, overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: m.color, width: `${m.mark}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{m.mark}/100</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}><Badge variant={GRADE_CLS[m.grade] || "gray"}>{m.grade}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Today's Timetable" action="Full week →" />
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {TIMETABLE.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "#f7f8fa" }}>
                <span style={{ fontSize: 11, color: "#6b7080", width: 40, flexShrink: 0, fontWeight: 500 }}>{t.time}</span>
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: t.color }}>{t.sub}</span>
                {t.room && <span style={{ fontSize: 10, background: "#eef0f4", padding: "2px 7px", borderRadius: 4, color: "#6b7080" }}>{t.room}</span>}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080" }}>Attendance — This Month</span>
          <Badge variant="green">87% — Good Standing</Badge>
        </div>
        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 52 }}>
          {ATT_STATUS.map((s,i) => <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", background: s===1?"#1a56db":"#dc2626", height: "52px", minHeight: 4 }} />)}
        </div>
        <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
          {ATT_DAYS.map((d,i) => <span key={i} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#9ba0b0" }}>{d}</span>)}
        </div>
      </Card>

      <div style={{ background: "#0f1117", borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>🤖 AI Study Assistant</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
          Hey Arjun! Based on your Term 2 results, <strong style={{ color: "#93c5fd" }}>Social Science needs attention</strong> — your 62 marks is below the class average of 71.
          I suggest focusing on <strong style={{ color: "#93c5fd" }}>Chapter 4: Resource Distribution</strong> this week.
          Your English and Maths performance is excellent — keep it up! Next exam is in 12 days.
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {[ ["⚠ Weak: Social Science (62)","warn"],["✓ Strong: English (91), Maths (88)","ok"],["📅 Exam: 12 days",""],["📚 Homework: 2 pending",""] ].map(([t,v]) => (
            <span key={t} style={{ display: "inline-block", background: v==="warn"?"rgba(220,38,38,0.2)":v==="ok"?"rgba(22,163,74,0.2)":"rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: v==="warn"?"#fca5a5":v==="ok"?"#86efac":"rgba(255,255,255,0.7)" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Parent() {
  return (
    <div>
      <PageHero title="Parent Dashboard" sub="Mr. Suresh Kumar · Parent of Arjun Kumar · Class 9-A" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard color="blue" label="Attendance" value="87%" sub="21 of 24 days present" />
        <StatCard color="green" label="Term Avg" value="79%" sub="Class rank #4" />
        <StatCard color="amber" label="Fee Due" value="₹4,200" sub="Due: 5 June 2025" />
        <StatCard color="red" label="Alerts" value="3" sub="Unread notifications" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Live Notifications" action="Mark all read" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AlertItem icon="✅" iconVariant="green" title="Arjun marked Present" desc="Gate entry confirmed at 08:14 AM today" meta="Today" />
            <AlertItem icon="📊" iconVariant="amber" title="Social Science: 62/100" desc="Below class average of 71. Needs attention." meta="Yesterday" />
            <AlertItem icon="💰" iconVariant="red" title="Fee Reminder" desc="₹4,200 due in 8 days — Term 2 tuition" meta="2 days" />
            <AlertItem icon="📝" iconVariant="blue" title="Homework Pending" desc="Maths Ch.7 — due tomorrow" meta="3 days" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Fee Status — Term 2" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FeeBar label="Tuition fee" amount="₹6,000" pct={100} color="#16a34a" status={{ paid: true, label: "Paid" }} />
            <FeeBar label="Transport fee" amount="₹4,200" pct={0} color="#dc2626" status={{ paid: false, label: "Due: 5 Jun" }} />
            <FeeBar label="Lab fee" amount="₹1,800" pct={100} color="#16a34a" status={{ paid: true, label: "Paid" }} />
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>₹4,200 <span style={{ fontSize: 12, fontWeight: 400, color: "#6b7080" }}>outstanding</span></div>
            <Btn style={{ width: "100%", justifyContent: "center" }} onClick={() => alert("UPI/Card payment gateway")}>Pay ₹4,200 via UPI / Card →</Btn>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="WhatsApp Auto-Alert Preview" action={<Badge variant="green">Live Integration</Badge>} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#e2f7cb", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: "0.5px solid rgba(0,0,0,0.1)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>CS</div>
              <div><div style={{ fontSize: 11, fontWeight: 700, color: "#075e54" }}>CoreSchool Alerts</div><div style={{ fontSize: 10, color: "#128c7e" }}>Official School Channel</div></div>
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.7, color: "#111b21" }}>
              🏫 <strong>CoreSchool Alert</strong><br />
              Student: Arjun Kumar | Class 9-A<br />
              ✅ Present today at 8:14 AM<br />
              📝 Homework pending: Maths Ch.7<br />
              📅 Parent-Teacher Meet: 15 Jun<br />
              💰 Fee due: ₹4,200 (5 Jun deadline)
            </div>
            <div style={{ fontSize: 10, color: "#667781", textAlign: "right", marginTop: 6 }}>08:15 AM ✓✓</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f1117", marginBottom: 4 }}>Alert Types Configured</div>
            <AlertItem icon="✅" iconVariant="green" title="Daily Attendance" desc="Sent at 8:30 AM every school day" />
            <AlertItem icon="🚨" iconVariant="red" title="Absence Alert" desc="Instant, if child absent by 9 AM" />
            <AlertItem icon="📊" iconVariant="amber" title="Marks Published" desc="Sent when teacher enters marks" />
            <AlertItem icon="💰" iconVariant="blue" title="Fee Reminder" desc="7 days, 3 days, 1 day before due" />
          </div>
        </div>
      </Card>
    </div>
  );
}

function Teacher() {
  const [attendance, setAttendance] = useState(TEACHER_STUDENTS.map(s => s.status));

  function markAll(status) {
    setAttendance(attendance.map(() => status));
  }

  function saveAttendance() {
    const r = TEACHER_STUDENTS.map((s, i) => `${s.name}: ${attendance[i]}`).join("\n");
    alert("Attendance saved!\n\n" + r + "\n\nParents of absent students notified via WhatsApp ✓");
  }

  return (
    <div>
      <PageHero title="Teacher Panel" sub="Mrs. Lakshmi R · Mathematics · Classes: 9-A, 9-B, 10-A" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Upload Study Material" />
          <div onClick={() => alert("File picker")} style={{ border: "1.5px dashed rgba(0,0,0,0.12)", borderRadius: 12, padding: 24, textAlign: "center", background: "#f7f8fa", cursor: "pointer" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📤</div>
            <div style={{ fontSize: 13, color: "#3d4152" }}>Drag & drop or <strong style={{ color: "#1a56db" }}>click to upload</strong></div>
            <div style={{ fontSize: 11, color: "#9ba0b0", marginTop: 4 }}>PDF, DOCX, MP4, PPT · Max 100MB</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 10, flexWrap: "wrap" }}>
              {[ ["📄 Notes","blue"],["📝 Assignments","green"],["🎥 Videos","amber"],["📊 Practice tests","teal"] ].map(([l,v]) => <Badge key={l} variant={v}>{l}</Badge>)}
            </div>
          </div>
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Subject</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}><option>Mathematics</option><option>Physics</option><option>Chemistry</option></select></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Chapter</label><input style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }} placeholder="e.g. Ch.7 Algebra" /></div>
              <div><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Class</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}><option>9-A</option><option>9-B</option><option>10-A</option></select></div>
            </div>
            <Btn style={{ width: "100%", justifyContent: "center" }}>Upload Material →</Btn>
          </div>
        </Card>

        <Card>
          <CardHeader title="Class 9-A Performance" action="Export Excel →" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90, marginTop: 10, padding: "0 2px" }}>
            {PERF_SUBJECTS.map(s => (
              <div key={s.s} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7080", fontWeight: 600, marginBottom: 3 }}>{s.v}</div>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: s.c, height: `${s.v * 0.8}px` }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
            {PERF_SUBJECTS.map(s => <span key={s.s} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#9ba0b0" }}>{s.s}</span>)}
          </div>
          <div style={{ height: "0.5px", background: "rgba(0,0,0,0.08)", margin: "14px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
            {[ ["Class Avg","74.2","#0f1117"],["Highest","94","#16a34a"],["Lowest","41","#dc2626"],["Pass rate","91%","#0f1117"] ].map(([l,v,c]) => (
              <div key={l}><div style={{ color: "#6b7080", fontSize: 10 }}>{l}</div><div style={{ fontWeight: 700, fontSize: 18, color: c }}>{v}</div></div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080" }}>Mark Attendance — Class 9-A · Today</span>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" size="sm" onClick={() => markAll("P")}>Mark All Present</Btn>
            <Btn size="sm" onClick={saveAttendance}>Save Attendance →</Btn>
          </div>
        </div>
        {TEACHER_STUDENTS.map((s, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f7f8fa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#3d4152", border: "0.5px solid rgba(0,0,0,0.08)" }}>{s.init}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: "#9ba0b0" }}>Roll #{s.roll}</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {["P","A","L"].map(t => {
                const colors = { P: ["rgba(22,163,74,0.1)","#16a34a"], A: ["rgba(220,38,38,0.1)","#dc2626"], L: ["rgba(217,119,6,0.1)","#d97706"] };
                const [bg, fg] = colors[t];
                const sel = attendance[idx] === t;
                return (
                  <button key={t} onClick={() => setAttendance(attendance.map((a,i) => i===idx?t:a))} style={{ padding: "4px 11px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", background: bg, color: fg, opacity: sel ? 1 : 0.35, transition: "opacity .1s" }}>{t}</button>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080" }}>Pending Tasks</span>
          <Badge variant="red">4 items</Badge>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <AlertItem icon="❗" iconVariant="red" title="Enter Maths Term 2 marks — Class 9-B" desc="Deadline: Today"><Btn size="sm">Enter →</Btn></AlertItem>
          <AlertItem icon="📋" iconVariant="amber" title="Review 5 assignment submissions" desc="Class 9-A · Algebra Ch.7"><Btn variant="secondary" size="sm">Review →</Btn></AlertItem>
          <AlertItem icon="📅" iconVariant="green" title="Parent-Teacher meet agenda" desc="Due: 14 Jun 2025"><Btn variant="secondary" size="sm">Publish →</Btn></AlertItem>
          <AlertItem icon="📤" iconVariant="blue" title="Upload Chapter 8 notes — Class 10-A" desc="Requested by 12 students"><Btn variant="secondary" size="sm">Upload →</Btn></AlertItem>
        </div>
      </Card>
    </div>
  );
}

function Admin() {
  const maxEnroll = Math.max(...ENROLL.map(e => e.n));
  return (
    <div>
      <PageHero title="Admin Dashboard" sub="GKM Matriculation School · Chennai · Full control panel" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard color="blue" label="Total Students" value="1,240" change="↑ 48 new admissions" changeDir="up" />
        <StatCard color="green" label="Staff Members" value="84" sub="62 teachers · 22 staff" />
        <StatCard color="amber" label="Monthly Revenue" value="₹3.8L" change="↑ 12% vs last month" changeDir="up" />
        <StatCard color="red" label="Overdue Fees" value="298" sub="students pending" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon:"🎓", title:"Student Database", desc:"Manage all student profiles, admissions, and records", stat:"1,240 students", statColor:"#1a56db", bg:"rgba(26,86,219,0.08)" },
          { icon:"💰", title:"Fee Management", desc:"Track payments, send reminders, generate receipts", stat:"₹12.4L collected", statColor:"#16a34a", bg:"rgba(22,163,74,0.1)" },
          { icon:"📊", title:"Reports & Export", desc:"PDF report cards, Excel exports, analytics", stat:"Export anytime", statColor:"#d97706", bg:"rgba(217,119,6,0.1)" },
          { icon:"👨‍🏫", title:"Staff Management", desc:"Teacher profiles, salaries, class assignments", stat:"84 staff", statColor:"#0d9488", bg:"rgba(13,148,136,0.1)" },
          { icon:"📲", title:"Notifications", desc:"WhatsApp, SMS bulk messaging to parents", stat:"1,240 parents", statColor:"#16a34a", bg:"rgba(22,163,74,0.1)" },
          { icon:"⚙", title:"School Settings", desc:"Academic year, holidays, timetable config", stat:"Configure →", statColor:"#6b7080", bg:"rgba(220,38,38,0.1)" },
        ].map(m => (
          <div key={m.title} onClick={() => alert(m.title)} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 18, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", transition: "transform .15s, box-shadow .15s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.07)"; }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{m.title}</div>
            <div style={{ fontSize: 11, color: "#6b7080" }}>{m.desc}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.statColor, marginTop: 8 }}>{m.stat}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader title="Enrollment by Class" action="Detailed view →" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 90, padding: "0 2px", marginTop: 10 }}>
            {ENROLL.map(e => (
              <div key={e.cls} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 9, color: "#6b7080", fontWeight: 600, marginBottom: 3 }}>{e.n}</div>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: "#1a56db", height: `${(e.n/maxEnroll)*80}px` }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 5, marginTop: 4 }}>
            {ENROLL.map(e => <span key={e.cls} style={{ flex: 1, textAlign: "center", fontSize: 9, color: "#9ba0b0" }}>{e.cls}</span>)}
          </div>
        </Card>

        <Card>
          <CardHeader title="Fee Collection — Term 2" action="Download report →" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FeeBar label="Tuition fees" amount="₹8.2L / ₹10.5L" pct={78} />
            <FeeBar label="Transport fees" amount="₹2.8L / ₹4.2L" pct={67} color="#d97706" />
            <FeeBar label="Lab fees" amount="₹1.4L / ₹1.6L" pct={88} />
          </div>
          <div style={{ marginTop: 14, padding: 12, background: "#f7f8fa", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 10, color: "#6b7080" }}>Total outstanding</div><div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626" }}>₹3.9L</div></div>
            <Btn size="sm" onClick={() => alert("Reminders sent")}>Send reminders →</Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Record() {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg,#1a56db 0%,#0e3a9e 100%)", borderRadius: 12, padding: "22px 24px", color: "#fff", position: "relative", overflow: "hidden", marginBottom: 16 }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ fontSize: 10, opacity: 0.6, marginBottom: 4, letterSpacing: 0.5 }}>🪪 STUDENT ID: CS-2025-00847 · DIGITAL RECORD</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 24, letterSpacing: -0.5, marginBottom: 2 }}>Arjun Kumar</div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>GKM Matriculation School, Chennai · Class 9-A · Roll No. 14</div>
        <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
          {["Academic: B+","Attendance: 87%","Activity: Sports Captain","Behavior: Excellent","Transfer-ready ✓"].map(t => (
            <span key={t} style={{ background: "rgba(255,255,255,0.12)", padding: "4px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{t}</span>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Academic History (Year-wise)" />
          <div style={{ marginTop: 4 }}>
            {TIMELINE_DATA.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", position: "relative" }}>
                {i < TIMELINE_DATA.length - 1 && <div style={{ position: "absolute", left: 7, top: 22, bottom: -8, width: 1, background: "rgba(0,0,0,0.12)" }} />}
                <div style={{ width: 15, height: 15, borderRadius: "50%", flexShrink: 0, marginTop: 3, background: h.color, border: "2px solid #fff", boxShadow: `0 0 0 1.5px ${h.color}` }} />
                <div><div style={{ fontSize: 12, fontWeight: 700 }}>{h.year}</div><div style={{ fontSize: 11, color: "#6b7080" }}>{h.detail}</div></div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Achievements & Certificates" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AlertItem icon="🏆" iconVariant="amber" title="District Science Olympiad — 2nd Place" desc="2024 · Certificate issued" />
            <AlertItem icon="⚽" iconVariant="green" title="School Football Team Captain" desc="2024–25 · Leadership award" />
            <AlertItem icon="📜" iconVariant="blue" title="Perfect Attendance Award" desc="Class 8 · Academic year 2023–24" />
            <AlertItem icon="🎨" iconVariant="red" title="School Art Competition — 1st Place" desc="2023 · State-level qualifier" />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Documents & Transfer" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <Btn onClick={() => alert("Generating Transfer Certificate...")}>📄 Transfer Certificate →</Btn>
          <Btn variant="secondary" onClick={() => alert("Downloading report card...")}>📊 Full Report Card →</Btn>
          <Btn variant="secondary" onClick={() => alert("Generating conduct certificate...")}>📝 Conduct Certificate →</Btn>
        </div>
        <div style={{ marginTop: 14, padding: 12, background: "#f7f8fa", borderRadius: 8, fontSize: 12, color: "#3d4152", lineHeight: 1.8 }}>
          <strong>🔐 Digital Record System</strong> — Arjun's complete academic history is stored securely and is instantly transferable to any school that uses CoreSchool. Schools can request records with one click, parents can share with new schools, and students carry their full history seamlessly.
        </div>
      </Card>
    </div>
  );
}

function AI() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setAiError(null);
      try {
        if (typeof window === 'undefined') return;
        const data = await fetchJsonWithBackoff('/api/ai/insights', { method: 'GET' }, 3);
        if (mounted) setInsights(data);
      } catch (err) {
        console.warn('AI fetch failed', err);
        if (mounted) setAiError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <PageHero title="AI Insights Engine" sub="Powered by machine learning · Predictions updated daily" />
      {loading && <Card style={{ marginBottom: 12 }}><div style={{ padding: 12 }}>Loading AI insights…</div></Card>}
      {aiError && <Card style={{ marginBottom: 12 }}><AlertItem icon="⚠️" iconVariant="red" title="AI service unavailable" desc={aiError} /></Card>}
      {/* If `insights` exists you can render it here; otherwise show the static dashboard below as fallback */}
      {insights && <Card style={{ marginBottom: 12 }}><pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{JSON.stringify(insights, null, 2)}</pre></Card>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard color="blue" label="At-risk Students" value="23" sub="Need intervention now" />
        <StatCard color="amber" label="Dropout Risk" value="7" sub="High probability flag" />
        <StatCard color="green" label="Improvement Rate" value="+14%" sub="Students who improved" />
        <StatCard color="red" label="Fee Default Risk" value="41" sub="Predicted this term" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="Performance Predictions — Term 3" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr>{["Student","Predicted","Risk"].map(h => <th key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080", padding: "8px 12px", textAlign: "left", background: "#f7f8fa", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>{h}</th>)}</tr></thead>
            <tbody>
              {[ ["Priya D (9-A)","88%","Low","green"],["Rajan K (8-B)","54%","High","red"],["Meena T (9-A)","72%","Medium","amber"],["Arjun K (9-A)","81%","Low","green"],["Suresh P (6-C)","48%","Critical","red"] ].map(([s,p,r,v]) => (
                <tr key={s} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{s}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}>{p}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}><Badge variant={v}>{r}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Weak Subject Detection" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AlertItem icon="📐" iconVariant="red" title="Maths — Class 6-C" desc="Avg 49% · 18 students below pass mark"><Badge variant="red">Critical</Badge></AlertItem>
            <AlertItem icon="🧪" iconVariant="amber" title="Science — Class 8-B" desc="Avg 61% · Trending downward"><Badge variant="amber">Watch</Badge></AlertItem>
            <AlertItem icon="🌍" iconVariant="amber" title="Social Science — Class 9-A" desc="Avg 67% · Below school average"><Badge variant="amber">Watch</Badge></AlertItem>
          </div>
        </Card>
      </div>

      <div style={{ background: "#0f1117", borderRadius: 12, padding: "18px 20px", color: "#fff" }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>🤖 AI Recommendations for This Week</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
          <strong style={{ color: "#93c5fd" }}>Priority 1:</strong> Schedule extra Maths support classes for Class 6-C. 18 students are at fail risk for Term 3 — early intervention can improve pass rate by ~34%.<br /><br />
          <strong style={{ color: "#93c5fd" }}>Priority 2:</strong> Rajan K (Class 8-B) has shown 3 consecutive months of declining marks. Recommend parent counselling.<br /><br />
          <strong style={{ color: "#93c5fd" }}>Priority 3:</strong> 41 families show fee payment patterns consistent with default risk. Send personalised WhatsApp messages for higher response rate.
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {[ ["23 at-risk students","warn"],["7 dropout flags","warn"],["Extra classes → +34% pass rate","ok"],["Auto report ready",""] ].map(([t,v]) => (
            <span key={t} style={{ background: v==="warn"?"rgba(220,38,38,0.2)":v==="ok"?"rgba(22,163,74,0.2)":"rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: 5, fontSize: 10, fontWeight: 600, color: v==="warn"?"#fca5a5":v==="ok"?"#86efac":"rgba(255,255,255,0.7)" }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Fees() {
  return (
    <div>
      <PageHero title="Fee Management" sub="Collect, track, remind, and reconcile all school fees in one place" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard color="green" label="Total Collected" value="₹12.4L" sub="Term 2 · 76% rate" />
        <StatCard color="red" label="Outstanding" value="₹3.9L" sub="298 students pending" />
        <StatCard color="blue" label="This Week" value="₹84,000" change="↑ 22% vs last week" changeDir="up" />
        <StatCard color="amber" label="Overdue >30 days" value="48" sub="Escalation required" />
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080" }}>Recent Transactions</span>
          <div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" size="sm">📊 Export Excel</Btn><Btn size="sm">+ Record Payment</Btn></div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Student","Class","Amount","Type","Date","Status"].map(h => <th key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080", padding: "8px 12px", textAlign: "left", background: "#f7f8fa", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[ ["Priya Devi","9-A","₹6,000","Tuition","28 May","green","Paid"],["Karthik R","10-A","₹4,200","Transport","27 May","green","Paid"],["Rajan K","8-B","₹8,500","Tuition+Lab","26 May","green","Paid"],["Arjun Kumar","9-A","₹4,200","Transport","Due 5 Jun","red","Pending"],["Meena T","9-A","₹6,000","Tuition","Due 5 Jun","amber","Partial"] ].map(([n,c,a,t,d,v,s]) => (
              <tr key={n} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                {[n,c,a,t,d].map((x,i) => <td key={i} style={{ padding: "10px 12px", fontSize: 12 }}>{x}</td>)}
                <td style={{ padding: "10px 12px", fontSize: 12 }}><Badge variant={v}>{s}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardHeader title="Send Fee Reminder" />
          {[ ["Target Group",["All pending students","Overdue >7 days","Overdue >30 days","Specific class"]],["Channel",["WhatsApp + SMS","WhatsApp only","SMS only"]] ].map(([l,opts]) => (
            <div key={l} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>{l}</label>
              <select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}>{opts.map(o => <option key={o}>{o}</option>)}</select>
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Message Preview</label>
            <div style={{ background: "#e2f7cb", borderRadius: 12, padding: "14px 16px", fontSize: 11, lineHeight: 1.7, color: "#111b21" }}>🏫 Fee Reminder — GKM Matric<br />Dear Parent, ₹[AMOUNT] is due by [DATE].<br />Pay online: cs.school/pay or visit school office.<br />Ignore if already paid. Thank you! 🙏</div>
          </div>
          <Btn style={{ width: "100%", justifyContent: "center" }}>Send to 298 Parents →</Btn>
        </Card>

        <Card>
          <CardHeader title="Record Manual Payment" />
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Student Name / Roll No.</label><input style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none", boxSizing: "border-box" }} placeholder="Search student..." /></div>
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Fee Type</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}>{["Tuition fee","Transport fee","Lab fee","Sports fee","Other"].map(o => <option key={o}>{o}</option>)}</select></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Amount (₹)</label><input type="number" style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none", boxSizing: "border-box" }} placeholder="0" /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Payment Mode</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}>{["Cash","UPI","Card","Cheque"].map(o => <option key={o}>{o}</option>)}</select></div>
          </div>
          <Btn style={{ width: "100%", justifyContent: "center" }}>Record & Generate Receipt →</Btn>
        </Card>
      </div>
    </div>
  );
}

function Reports() {
  return (
    <div>
      <PageHero title="Reports & Analytics" sub="Generate PDF / Excel reports for any module in seconds" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { icon:"📄", title:"Report Cards", desc:"Printable PDF for each student with marks, grade, rank", bg:"rgba(26,86,219,0.08)" },
          { icon:"📊", title:"Attendance Report", desc:"Month/year-wise attendance for all classes", bg:"rgba(22,163,74,0.1)" },
          { icon:"💰", title:"Fee Collection Report", desc:"Collected, pending, outstanding by class", bg:"rgba(217,119,6,0.1)" },
          { icon:"📈", title:"Performance Analytics", desc:"Subject-wise, class-wise, trend analysis", bg:"rgba(13,148,136,0.1)" },
          { icon:"📜", title:"Transfer Certificates", desc:"Auto-filled TC with complete student history", bg:"rgba(220,38,38,0.1)" },
          { icon:"👨‍🏫", title:"Staff Report", desc:"Attendance, performance, salary summary", bg:"rgba(22,163,74,0.1)" },
        ].map(m => (
          <div key={m.title} onClick={() => alert(`Generating ${m.title}...`)} style={{ background: "#fff", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, padding: 18, cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: m.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 10 }}>{m.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{m.title}</div>
            <div style={{ fontSize: 11, color: "#6b7080" }}>{m.desc}</div>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader title="Custom Report Builder" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {[ ["Report Type",["Academic performance","Attendance","Fee collection","Combined"]],["Date Range",["This term","This year","Last term","Custom range"]] ].map(([l,opts]) => (
            <div key={l}><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>{l}</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}>{opts.map(o => <option key={o}>{o}</option>)}</select></div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
          {[ ["Class",["All classes","Class 6","Class 7","Class 8","Class 9","Class 10"]],["Format",["PDF","Excel (.xlsx)","CSV"]] ].map(([l,opts]) => (
            <div key={l}><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>{l}</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}>{opts.map(o => <option key={o}>{o}</option>)}</select></div>
          ))}
        </div>
        <Btn onClick={() => alert("Generating custom report...")}>Generate Report →</Btn>
      </Card>
    </div>
  );
}

function Settings() {
  return (
    <div>
      <PageHero title="School Settings" sub="Configure your school profile, academic calendar, and integrations" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <Card>
          <CardHeader title="School Profile" />
          {[ ["School Name","GKM Matriculation School","text"],["Location","Chennai, Tamil Nadu","text"],["Phone","+91 98400 00000","text"],["Email","admin@gkmschool.in","text"] ].map(([l,v,t]) => (
            <div key={l} style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>{l}</label><input type={t} defaultValue={v} style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none", boxSizing: "border-box" }} /></div>
          ))}
          <div style={{ marginBottom: 14 }}><label style={{ fontSize: 11, fontWeight: 600, color: "#3d4152", marginBottom: 5, display: "block" }}>Board / Affiliation</label><select style={{ width: "100%", padding: "9px 12px", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 8, fontSize: 13, fontFamily: "inherit", color: "#0f1117", background: "#fff", outline: "none" }}><option>Tamil Nadu Matriculation</option><option>CBSE</option><option>ICSE</option><option>State Board</option></select></div>
          <Btn size="sm">Save Profile →</Btn>
        </Card>

        <Card>
          <CardHeader title="Integrations" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <AlertItem icon="📲" iconVariant="green" title="WhatsApp Business API" desc="Connected · 1,240 parent numbers"><Badge variant="green">Active</Badge></AlertItem>
            <AlertItem icon="💳" iconVariant="blue" title="Razorpay (Fee Gateway)" desc="UPI, Card, Net Banking"><Btn variant="secondary" size="sm">Connect →</Btn></AlertItem>
            <AlertItem icon="📧" iconVariant="amber" title="SMS Gateway (Textlocal)" desc="Bulk SMS for low-internet areas"><Badge variant="green">Active</Badge></AlertItem>
            <AlertItem icon="📊" iconVariant="red" title="Google Sheets Sync" desc="Auto export marks and fees"><Btn variant="secondary" size="sm">Connect →</Btn></AlertItem>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="User Role Access Control" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr>{["Feature","Student","Parent","Teacher","Admin"].map(h => <th key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6b7080", padding: "8px 12px", textAlign: "left", background: "#f7f8fa", borderBottom: "0.5px solid rgba(0,0,0,0.12)" }}>{h}</th>)}</tr></thead>
          <tbody>
            {[ ["View own marks","✅","✅","✅","✅"],["Enter/edit marks","❌","❌","✅","✅"],["Take attendance","❌","❌","✅","✅"],["Fee payment","❌","✅","❌","✅"],["Generate reports","❌","❌","✅","✅"],["Manage students","❌","❌","❌","✅"] ].map(([f,...vals]) => (
              <tr key={f} style={{ borderBottom: "0.5px solid rgba(0,0,0,0.08)" }}>
                <td style={{ padding: "10px 12px", fontSize: 12 }}>{f}</td>
                {vals.map((v,i) => <td key={i} style={{ padding: "10px 12px", fontSize: 12 }}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const PAGES = { dashboard: Dashboard, student: Student, parent: Parent, teacher: Teacher, admin: Admin, record: Record, ai: AI, fees: Fees, reports: Reports, settings: Settings };
const PAGE_TITLES = { dashboard:"Dashboard", student:"Student Portal", parent:"Parent Dashboard", teacher:"Teacher Panel", admin:"Admin Panel", record:"Digital Record", ai:"AI Insights", fees:"Fee Management", reports:"Reports", settings:"Settings" };

/* ── Login Panel (simple demo) ── */
function LoginPanel({ onLogin, onQuickLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);

  function submit(e) {
    e && e.preventDefault();
    setError("");
    const ok = onLogin(username.trim(), password);
    if (!ok) setError("Invalid username or password.");
  }

  return (
    <div style={{ width: "100%", background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 8px 32px rgba(2,6,23,0.12)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>CS</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Sign in to CoreSchool</div>
          <div style={{ fontSize: 12, color: "#6b7080" }}>Enter your credentials to continue</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {USERS.map(u => (
          <button key={u.username} onClick={() => onQuickLogin(u.username)} style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "#f7f8fa", cursor: "pointer", fontWeight: 700 }}>{u.role}</button>
        ))}
      </div>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#3d4152", marginBottom: 6 }}>Username</label>
          <input aria-label="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="your.username" style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #e6e9ef", outline: "none", fontSize: 14 }} />
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#3d4152", marginBottom: 6 }}>Password</label>
          <input aria-label="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="• • • • • • • •" style={{ width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #e6e9ef", outline: "none", fontSize: 14 }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7080" }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 14, height: 14 }} /> Remember me
          </label>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("Forgot password flow (demo)"); }} style={{ fontSize: 13, color: "#1a56db", textDecoration: "none" }}>Forgot?</a>
        </div>

        {error && <div style={{ color: "#dc2626", marginBottom: 10, fontSize: 13 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ flex: 1, padding: "11px 14px", borderRadius: 8, background: "#0b74ff", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer", fontSize: 14 }}>Sign In</button>
          <button type="button" onClick={() => { setUsername(''); setPassword(''); setError(''); }} style={{ padding: "11px 14px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)", background: "#fff", cursor: "pointer", fontWeight: 700 }}>Clear</button>
        </div>
      </form>

      <div style={{ height: 1, background: "#eef0f4", margin: "16px 0" }} />
      <div style={{ fontSize: 12, color: "#6b7080", textAlign: "center" }}>Need access? <a href="#" onClick={(e) => { e.preventDefault(); alert("Contact school admin"); }} style={{ color: "#1a56db", textDecoration: "none" }}>Contact admin</a></div>
    </div>
  );
}

/* ── root ── */
export default function CoreSchool() {
  const [active, setActive] = useState("dashboard");
  const [user, setUser] = useState(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const raw = window.localStorage.getItem('cs_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user) window.localStorage.setItem('cs_user', JSON.stringify(user));
        else window.localStorage.removeItem('cs_user');
      }
    } catch (e) { /* ignore storage errors */ }
  }, [user]);

  const Page = PAGES[active];

  function handleLogin(username, password) {
    const u = USERS.find(s => s.username === username && s.password === password);
    if (u) {
      setUser(u);
      setActive(ROLE_DEFAULT_PAGE[u.role] || 'dashboard');
      return true;
    }
    return false;
  }

  function handleQuickLogin(username) {
    const u = USERS.find(s => s.username === username);
    if (u) {
      setUser(u);
      setActive(ROLE_DEFAULT_PAGE[u.role] || 'dashboard');
    }
  }

  function logout() {
    setUser(null);
    try { if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem('cs_user'); } catch (e) {}
    setActive('dashboard');
  }

  function canAccess(pageId) {
    if (!user) return false;
    if (user.role === 'admin') return true;
    const allowed = ALLOWED_PAGES[user.role] || [];
    return allowed.includes(pageId);
  }

  const visibleNav = user ? NAV.filter(n => canAccess(n.id)) : NAV.filter(n => n.id === 'dashboard');
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg,#f7fbff 0%,#f4f5f7 100%)", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: "86%", maxWidth: 980, display: "grid", gridTemplateColumns: "1fr 420px", gap: 28, alignItems: "center", padding: "36px 28px" }}>
          <div style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: "#0b74ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 22, fontWeight: 800 }}>CS</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f1724" }}>CoreSchool</div>
                <div style={{ color: "#6b7080", marginTop: 4 }}>School operating system for modern campuses</div>
              </div>
            </div>

            <div style={{ marginTop: 8, color: "#334155" }}>
              <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>Welcome back</h3>
              <p style={{ marginTop: 0, color: "#475569", lineHeight: 1.6 }}>Access student records, attendance, fee management, and AI-driven insights. Sign in with your school account to continue to the dashboard.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginTop: 18 }}>
              <div style={{ background: "#fff", padding: 14, borderRadius: 12, boxShadow: "0 6px 20px rgba(2,6,23,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Secure by design</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Two-step verification and role-based access controls keep your data safe.</div>
              </div>
              <div style={{ background: "#fff", padding: 14, borderRadius: 12, boxShadow: "0 6px 20px rgba(2,6,23,0.04)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>Smart alerts</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Instant notifications for attendance, fee reminders, and academic alerts.</div>
              </div>
            </div>
          </div>

          <div>
            <LoginPanel onLogin={handleLogin} onQuickLogin={handleQuickLogin} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", background: "#f4f5f7", fontSize: 14, lineHeight: 1.6, color: "#0f1117" }}>

      {/* SIDEBAR */}
      <aside style={{ width: 220, background: "#0f1117", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 18px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ width: 32, height: 32, background: "#1a56db", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: -0.5 }}>CS</span>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", letterSpacing: -0.3 }}>Core<span style={{ color: "#60a5fa" }}>School</span></div>
            <span style={{ fontSize: 9, fontWeight: 600, background: "rgba(96,165,250,0.15)", color: "#60a5fa", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5, display: "block", marginTop: 2 }}>School OS v1.0</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {visibleNav.map((n, i) => (
            <div key={n.id}>
              {n.section && (
                <div style={{ padding: "14px 10px 6px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "rgba(255,255,255,0.3)" }}>{n.section}</div>
              )}
              <div onClick={() => canAccess(n.id) ? setActive(n.id) : alert('Access denied — sign in with appropriate role.') } style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", margin: "1px 8px", borderRadius: 8, cursor: canAccess(n.id)?"pointer":"not-allowed", color: active===n.id?"#fff":"rgba(255,255,255,0.55)", fontSize: 13, fontWeight: 500, background: active===n.id?"#1a56db":"transparent", transition: "all .15s", userSelect: "none" }}>
                <span style={{ fontSize: 15, width: 18, textAlign: "center", flexShrink: 0 }}>{n.icon}</span>
                <span>{n.label}</span>
                {n.badge && <span style={{ marginLeft: "auto", background: active===n.id?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.8)", fontSize: 10, fontWeight: 600, padding: "1px 7px", borderRadius: 10 }}>{n.badge}</span>}
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.05)", cursor: "pointer" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{user ? user.init : 'AK'}</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{user ? user.name : 'Guest User'}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{user ? user.role : 'Not signed in'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ marginLeft: 220, flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* TOPBAR */}
        <div style={{ background: "#fff", borderBottom: "0.5px solid rgba(0,0,0,0.12)", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3 }}>{PAGE_TITLES[active]}</div>
            <div style={{ fontSize: 12, color: "#6b7080" }}>GKM Matriculation School, Chennai · Academic Year 2024–25</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "0.5px solid rgba(0,0,0,0.08)", background: "#f7f8fa", color: "#3d4152", fontFamily: "inherit" }}>📥 Import data</button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: "#1a56db", color: "#fff", fontFamily: "inherit" }}>+ Add student</button>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "#f7f8fa", border: "0.5px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, position: "relative" }}>
              🔔
              <div style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, borderRadius: "50%", background: "#dc2626", border: "1.5px solid #fff" }} />
            </div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                <button onClick={logout} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer' }}>Logout</button>
              </div>
            ) : (
              <Btn onClick={() => { /* overlay shown when user is null */ }}>{'Sign in'}</Btn>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: "24px 28px", flex: 1 }}>
          <Page key={active} />
        </div>
      </main>
    </div>
  );
}
