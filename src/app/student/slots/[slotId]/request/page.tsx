import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { getRequestSlot } from "@/features/student/bookings/request-server";
import RequestForm from "./request-form";

export default async function RequestPage({ params }: { params: Promise<{ slotId: string }> }) {
  await requireRole("student");
  const { slotId } = await params;
  const result = await getRequestSlot({ slotId });
  return (
    <div className="space-y-6 min-w-0">
      <Link href="/student/slots" className="underline focus-visible:outline-2">
        Back to available slots
      </Link>
      <h1 className="text-2xl font-semibold">Request a consultation</h1>
      {result.kind === "success" ? (
        <RequestForm initialSlot={result.slot} />
      ) : (
        <div role="alert" className="rounded-lg border border-destructive p-4">
          <p>
            {result.kind === "temporarily_unavailable"
              ? "Slots are temporarily unavailable. Please retry."
              : "This slot is unavailable. Choose another available slot."}
          </p>
          {result.kind === "temporarily_unavailable" && (
            <Link className="underline" href={`/student/slots/${slotId}/request`}>
              Retry
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
