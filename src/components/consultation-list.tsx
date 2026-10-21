import type { Consultation } from "@/features/lecturer/consultations/validation";
import { Badge } from "@/components/ui/badge";
import { BriefingButton } from "./briefing-button";

export function ConsultationList({ consultations }: { consultations: Consultation[] }) {
  if (consultations.length === 0) return <p role="status">No consultations found.</p>;
  return (
    <ul aria-label="Consultations" className="grid gap-4">
      {consultations.map((item) => (
        <li key={item.bookingId} className="rounded-lg border bg-card p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="font-semibold">
              {item.courseCode} — {item.topic}
            </h2>
            <Badge variant="secondary" aria-label={`Status: ${item.displayStatus}`}>
              {item.displayStatus === "rejected" && item.rejectionReason
                ? `Rejected: ${item.rejectionReason}`
                : item.displayStatus}
            </Badge>
          </div>
          <p>
            {new Date(item.startsAt).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })} –{" "}
            {new Date(item.endsAt).toLocaleTimeString("en-SG", { timeZone: "Asia/Singapore" })}
          </p>
          <p>
            Student: {item.studentName} ({item.studentEmail})
          </p>
          <p>Questions: {item.questions}</p>
          <p className="text-sm text-muted-foreground">{item.courseName}</p>
          {item.displayStatus === "upcoming" && <BriefingButton bookingId={item.bookingId} />}
        </li>
      ))}
    </ul>
  );
}
