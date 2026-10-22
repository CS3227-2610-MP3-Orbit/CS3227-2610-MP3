"use client";

import { BookPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import CreateCourseForm from "./create-course-form";

/**
 * SH-07-R14: the "Create course" form (unchanged field names, labels, validation and success
 * messages -- see create-course-form.tsx) now opens from a "New course" button into a
 * `Dialog`, instead of rendering inline on the page.
 */
export default function CreateCourseDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" />}>
        <BookPlus aria-hidden="true" />
        New course
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create course</DialogTitle>
        </DialogHeader>
        <CreateCourseForm />
      </DialogContent>
    </Dialog>
  );
}
