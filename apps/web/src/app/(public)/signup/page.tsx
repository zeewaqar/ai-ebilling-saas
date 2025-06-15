"use client";

import { useFormState } from "react-dom";
import { signUpAction } from "@/lib/auth-actions";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  /* server action returns { ok, email, pwd, error? } */
  const [state, formAction] = useFormState(signUpAction, {
    ok: false,
    error: undefined,
    email: "",
    pwd: ""
  });

  /* once server action succeeds, log the user in client-side */
  useEffect(() => {
    if (state.ok) {
      signIn("credentials", {
        email: state.email,
        password: state.pwd,
        callbackUrl: "/dashboard"
      });
    }
  }, [state]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-[360px] p-8">
        <CardContent className="space-y-4">
          <h1 className="text-xl font-semibold text-center">Create account</h1>

          {state.error && (
            <p className="text-destructive text-sm text-center">{state.error}</p>
          )}

          <form action={formAction} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full">Get started</Button>
          </form>

          <p className="text-center text-sm">
            Have an account?{" "}
            <a href="/login" className="underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
