"use client";

import type { VariantProps } from "class-variance-authority";
import { Megaphone } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import CreateAnnouncementForm from "./create-announcement-form";

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

/**
 * ADM-03 UI description: a "New announcement" button opens a `Dialog` with kind/title/body
 * fields, mirroring src/app/admin/courses/create-course-dialog.tsx. `variant`/`label` let the
 * empty state's own documented "Create one" link action open this exact same dialog, styled as
 * a link rather than duplicating the dialog/form markup for a second trigger.
 */
export default function CreateAnnouncementDialog({
  label = "New announcement",
  variant = "default",
}: {
  label?: string;
  variant?: ButtonVariant;
}) {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" variant={variant} />}>
        {variant === "default" && <Megaphone aria-hidden="true" />}
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create guideline or announcement</DialogTitle>
        </DialogHeader>
        <CreateAnnouncementForm />
      </DialogContent>
    </Dialog>
  );
}
