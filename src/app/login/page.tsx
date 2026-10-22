import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { OrbitMark } from "@/components/orbit-mark";

import { LoginForm } from "./login-form";

/**
 * Polish pass: a soft brand background and the Orbit mark/wordmark + a friendly tagline above
 * the sign-in card. The form itself (labels, button name, error message) and the card's own
 * heading/description text are byte-for-byte unchanged.
 */
export default function LoginPage() {
  return (
    <main className="flex w-full flex-1 items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <OrbitMark className="size-6" />
          </span>
          <div>
            <p className="font-semibold tracking-tight">Orbit</p>
            <p className="text-sm text-muted-foreground">Consultations, organised around you.</p>
          </div>
        </div>
        <Card className="w-full">
          <CardHeader>
            {/* A real heading, not CardTitle's <div>: student e2e asserts getByRole("heading"). */}
            <h1 className="font-heading text-2xl leading-snug font-medium">Sign in</h1>
            <CardDescription>Sign in to manage your consultations.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
