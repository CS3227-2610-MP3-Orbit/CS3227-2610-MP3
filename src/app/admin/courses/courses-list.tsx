import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Course } from "@/features/admin/courses/validation";

import CourseRow from "./course-row";
import CourseTableRow from "./course-table-row";

/**
 * SH-07-R14 / SH-07-AC17: the same courses, in the same order, render as a `Table` at `>= md`
 * and as stacked `Card`s below it -- both halves always render (Tailwind's `hidden`/
 * `md:hidden` toggles which one is in the accessibility tree and on screen for the current
 * viewport).
 */
export default function CoursesList({
  courses,
  eligibleLecturers,
}: {
  courses: Course[];
  eligibleLecturers: { id: string; label: string }[];
}) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lecturers</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <CourseTableRow
                key={course.id}
                course={course}
                eligibleLecturers={eligibleLecturers}
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-3 md:hidden">
        {courses.map((course) => (
          <CourseRow key={course.id} course={course} eligibleLecturers={eligibleLecturers} />
        ))}
      </ul>
    </>
  );
}
