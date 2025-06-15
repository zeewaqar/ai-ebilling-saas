"use client";

import { useFormState } from "react-dom";
import { checkUserExists } from "@/lib/auth-actions";
import { signIn } from "next-auth/react";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction] = useFormState(checkUserExists, {
    ok: false,
    error: undefined,
    email: "",
    pwd: ""
  });

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
        <CardContent className="space-y-6">
          <h1 className="text-xl font-semibold text-center">Sign in</h1>

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
            <Button className="w-full">Continue</Button>
          </form>

          <p className="text-center text-sm">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
