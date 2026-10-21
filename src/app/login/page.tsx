import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex w-full flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          {/* A real heading, not CardTitle's <div>: student e2e asserts getByRole("heading"). */}
          <h1 className="font-heading text-2xl leading-snug font-medium">Sign in</h1>
          <CardDescription>Sign in to manage your consultations.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
