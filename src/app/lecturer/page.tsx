import { listLecturerRequests } from "@/features/lecturer/requests-server";
import { RequestCard } from "./request-card";
export default async function LecturerDashboardPage() {
  const result = await listLecturerRequests();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Consultation requests</h1>
      {result.kind === "success" ? (
        result.requests.length ? (
          <ul className="space-y-3">
            {result.requests.map((request) => (
              <RequestCard key={request.bookingId} request={request} />
            ))}
          </ul>
        ) : (
          <p role="status">No pending consultation requests.</p>
        )
      ) : (
        <p role="alert">Requests are temporarily unavailable. Please retry.</p>
      )}
    </div>
  );
}
