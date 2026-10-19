import { ConsultationList } from "@/components/consultation-list";
import { listStaffConsultations } from "@/features/lecturer/consultations/server";

export default async function LecturerDashboardPage() {
  const [result, history] = await Promise.all([
    listStaffConsultations("lecturer", false),
    listStaffConsultations("lecturer", true),
  ]);
  return (
    <main className="grid gap-6">
      <h1 className="text-2xl font-semibold">Lecturer consultations</h1>
      {result.kind === "success" ? (
        <>
          <section aria-labelledby="active-consultations">
            <h2 id="active-consultations" className="text-xl font-semibold">
              Active consultations
            </h2>
            <ConsultationList consultations={result.consultations} />
          </section>
          <section aria-labelledby="past-consultations">
            <h2 id="past-consultations" className="text-xl font-semibold">
              Past consultations
            </h2>
            {history.kind === "success" ? (
              <ConsultationList consultations={history.consultations} />
            ) : (
              <p role="alert">Past consultations are temporarily unavailable.</p>
            )}
          </section>
        </>
      ) : (
        <p role="alert">Consultations are temporarily unavailable. Please try again.</p>
      )}
    </main>
  );
}
