import { z } from "zod";

const consultationSchema = z.strictObject({
  bookingId: z.string().uuid(),
  slotId: z.string().uuid(),
  lecturerId: z.string().uuid(),
  lecturerName: z.string(),
  courseCode: z.string(),
  courseName: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  studentName: z.string(),
  studentEmail: z.string(),
  topic: z.string(),
  questions: z.string(),
  bookingStatus: z.enum(["pending", "approved", "rejected", "cancelled", "completed"]),
  rejectionReason: z.string().nullable(),
  displayStatus: z.enum(["pending", "upcoming", "ongoing", "rejected", "cancelled", "completed"]),
});

export const consultationResultSchema = z.strictObject({
  kind: z.literal("success"),
  consultations: z.array(consultationSchema),
});

export type Consultation = z.infer<typeof consultationSchema>;
export type ConsultationResult = z.infer<typeof consultationResultSchema>;
