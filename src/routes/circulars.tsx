import { createFileRoute } from "@tanstack/react-router";
import { Bookmark, FileText, Image as ImageIcon, CheckCheck } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/circulars")({
  head: () => ({ meta: [{ title: "Circulars — SchoolConnect AI" }] }),
  component: CircularsPage,
});

const feed = [
  { title: "Annual Sports Day on 5 July", body: "Dear parents, the annual sports day will be held on 5 July. Please ensure students wear house t-shirts.", time: "12 min ago", tag: "Event", tagTone: "bg-secondary/10 text-secondary", attach: "img", unread: true },
  { title: "Parent-Teacher meeting — Grade 6", body: "Scheduled this Saturday, 10 AM to 1 PM. Slot booking opens tomorrow.", time: "2 h ago", tag: "PTM", tagTone: "bg-info/10 text-info", attach: "pdf", unread: true },
  { title: "Summer break announcement", body: "School reopens on 8 July. Holiday homework list attached.", time: "Yesterday", tag: "Notice", tagTone: "bg-warning/10 text-warning", attach: "pdf", unread: false },
  { title: "Updated bus route — Route 12", body: "Pickup time changed from 7:25 to 7:30 AM starting Monday.", time: "2 d ago", tag: "Transport", tagTone: "bg-success/10 text-success", attach: null, unread: false },
];

export default function CircularsPage() {
  return (
    <PhoneShell subtitle="School updates" title="Circulars">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {["All", "Unread", "Events", "Notices", "PTM"].map((t, i) => (
          <button key={t} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition ${i === 0 ? "bg-primary text-white border-primary" : "bg-surface text-muted-foreground border-border hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      <ul className="mt-4 rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
        {feed.map((c, i) => (
          <li key={i} className="p-4 relative">
            {c.unread && <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />}
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className={`px-2 py-0.5 rounded-md ${c.tagTone}`}>{c.tag}</span>
              <span className="text-muted-foreground font-medium">{c.time}</span>
              {!c.unread && <span className="ml-auto inline-flex items-center gap-0.5 text-muted-foreground"><CheckCheck className="h-3.5 w-3.5" /> Read</span>}
            </div>
            <p className="mt-2 font-medium text-[15px] leading-snug pr-6">{c.title}</p>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.body}</p>
            <div className="mt-2.5 flex items-center justify-between">
              {c.attach === "img" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><ImageIcon className="h-4 w-4" /> 2 images</span>
              )}
              {c.attach === "pdf" && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><FileText className="h-4 w-4" /> PDF · 240 KB</span>
              )}
              {!c.attach && <span />}
              <button className="text-muted-foreground hover:text-foreground"><Bookmark className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </PhoneShell>
  );
}
