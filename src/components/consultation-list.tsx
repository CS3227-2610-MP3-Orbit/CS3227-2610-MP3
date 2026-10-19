import type { Consultation } from "@/features/lecturer/consultations/validation";

export function ConsultationList({ consultations }: { consultations: Consultation[] }) {
  if (consultations.length === 0) return <p role="status">No consultations found.</p>;
  return (
    <ul aria-label="Consultations" className="grid gap-4">
      {consultations.map((item) => (
        <li key={item.bookingId} className="rounded border p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <h2 className="font-semibold">
              {item.courseCode} — {item.topic}
            </h2>
            <span
              aria-label={`Status: ${item.displayStatus}`}
              className="rounded bg-slate-100 px-2 py-1 text-sm"
            >
              {item.displayStatus === "rejected" && item.rejectionReason
                ? `Rejected: ${item.rejectionReason}`
                : item.displayStatus}
            </span>
          </div>
          <p>
            {new Date(item.startsAt).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })} –{" "}
            {new Date(item.endsAt).toLocaleTimeString("en-SG", { timeZone: "Asia/Singapore" })}
          </p>
          <p>
            Student: {item.studentName} ({item.studentEmail})
          </p>
          <p>Questions: {item.questions}</p>
          <p className="text-sm text-slate-600">{item.courseName}</p>
        </li>
      ))}
    </ul>
  );
}
