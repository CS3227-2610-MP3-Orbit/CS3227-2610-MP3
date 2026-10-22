import { Skeleton } from "@/components/ui/skeleton";

export default function StudentSlotsLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <h1 className="text-2xl font-semibold">Available consultation slots</h1>
      <p>Loading available slots…</p>
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
