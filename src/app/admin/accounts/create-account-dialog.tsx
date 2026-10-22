"use client";

import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import CreateAccountForm from "./create-account-form";

/**
 * SH-07-R14: the "Create account" form (unchanged field names, labels, validation and success
 * messages -- see create-account-form.tsx) now opens from a "New account" button into a
 * `Dialog`, instead of rendering inline on the page.
 */
export default function CreateAccountDialog() {
  return (
    <Dialog>
      <DialogTrigger render={<Button type="button" />}>
        <UserPlus aria-hidden="true" />
        New account
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create account</DialogTitle>
        </DialogHeader>
        <CreateAccountForm />
      </DialogContent>
    </Dialog>
  );
}
