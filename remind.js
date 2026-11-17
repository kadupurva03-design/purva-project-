import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const marks = (process.env.REMIND_HOURS || "24,2").split(",").map(Number);
const tz = process.env.TIMEZONE || "UTC";
const fmt = (iso) => new Date(iso).toLocaleString("en-IN", {
  timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
});

const { data, error } = await sb.from("assignments").select("*").eq("done", false);
if (error) throw error;

const byEmail = {};
for (const a of data) {
  if (!a.email) continue;
  const hrs = (new Date(a.due) - Date.now()) / 36e5;
  const sent = a.sent || [];
  let tag = null, add = [];
  if (hrs < 0) {
    if (hrs > -72 && !sent.includes("over")) { tag = "over"; add = ["over", ...marks.map((m) => "m" + m)]; }
  } else {
    const hit = marks.filter((m) => hrs <= m);
    if (hit.length) {
      const t = Math.min(...hit);
      if (!sent.includes("m" + t)) { tag = "m" + t; add = marks.filter((m) => m >= t).map((m) => "m" + m); }
    }
  }
  if (!tag) continue;
  (byEmail[a.email] ??= []).push({ a, add, hrs });
}

const emails = Object.keys(byEmail);
if (!emails.length) { console.log("No reminders due."); process.exit(0); }

const mail = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
});

for (const to of emails) {
  const rows = byEmail[to].sort((x, y) => new Date(x.a.due) - new Date(y.a.due));
  const line = ({ a, hrs }) => {
    const left = hrs < 0 ? "OVERDUE" : hrs < 2 ? Math.max(1, Math.round(hrs * 60)) + " min left" : Math.round(hrs) + " hr left";
    return `${a.title}${a.course ? " (" + a.course + ")" : ""} - due ${fmt(a.due)} - ${left}`;
  };
  await mail.sendMail({
    from: `Deadline Desk <${process.env.GMAIL_USER}>`,
    to,
    subject: `Deadline reminder: ${rows.length} assignment${rows.length > 1 ? "s" : ""} due soon`,
    text: "These assignments need your attention:\n\n" + rows.map((r) => "- " + line(r)).join("\n"),
    html: "<p>These assignments need your attention:</p><ul>" + rows.map((r) => "<li>" + line(r).replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</li>").join("") + "</ul>",
  });
  for (const { a, add } of rows) {
    await sb.from("assignments").update({ sent: [...new Set([...(a.sent || []), ...add])] }).eq("id", a.id);
  }
  console.log("Sent reminder to", to, "for", rows.length, "assignment(s).");
}
