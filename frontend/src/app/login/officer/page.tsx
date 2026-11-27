"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  RefreshCw,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { CcislsgCrest } from "@/components/ccislsg-crest";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  AuthStatusResponse,
  CaptchaChallenge,
  fetchAuthStatus,
  fetchCaptchaChallenge,
  fetchCurrentUser,
  loginRequest,
} from "@/lib/auth-api";

export default function OfficerLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [captcha, setCaptcha] = React.useState<CaptchaChallenge | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = React.useState("");
  const [isLoadingCaptcha, setIsLoadingCaptcha] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [authStatus, setAuthStatus] =
    React.useState<AuthStatusResponse | null>(null);

  const loadCaptcha = React.useCallback(async () => {
    setIsLoadingCaptcha(true);
    try {
      const challenge = await fetchCaptchaChallenge();
      setCaptcha(challenge);
    } catch {
      setCaptcha(null);
    } finally {
      setIsLoadingCaptcha(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    fetchCurrentUser().then((session) => {
      if (mounted && session) {
        router.replace("/dashboard");
      }
    });
    fetchAuthStatus().then((status) => {
      if (mounted) setAuthStatus(status);
    });
    fetchCaptchaChallenge()
      .then((challenge) => {
        if (mounted) setCaptcha(challenge);
      })
      .catch(() => {
        if (mounted) setCaptcha(null);
      })
      .finally(() => {
        if (mounted) setIsLoadingCaptcha(false);
      });
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleRefreshCaptcha() {
    setCaptchaAnswer("");
    await loadCaptcha();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!captcha?.captchaToken) {
      setError(
        "Unable to load CAPTCHA challenge. Make sure the NestJS backend is running on port 4000, then click New Code."
      );
      await loadCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      await loginRequest(
        identifier,
        password,
        captcha.captchaToken,
        captchaAnswer
      );
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Check that the NestJS backend is running on port 4000."
      );
      setCaptchaAnswer("");
      await loadCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-ccis-ink/95 via-ccis-espresso to-ccis-ink p-4 sm:p-6">
      {/* Executive warm gold ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ccis-orange/25 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden border-ccis-primary/35 bg-ccis-paper shadow-2xl">
        {/* Executive Dark Banner Header inside the single centered card */}
        <div className="flex flex-col items-center space-y-2.5 border-b border-ccis-ink/15 bg-gradient-to-b from-ccis-ink to-ccis-espresso px-6 py-6 text-center text-ccis-cream">
          <Badge variant="orange" className="gap-1.5 px-3 py-0.5">
            <Shield className="h-3 w-3" />
            <span>Executive &amp; Officer Governance</span>
          </Badge>

          <CcislsgCrest className="h-16 w-16" />

          <div className="space-y-0.5">
            <h1 className="font-display text-3xl tracking-tight text-ccis-paper">
              Officer Sign In
            </h1>
            <p className="font-subtext text-[11px] text-ccis-cream/80">
              CCISLSG Governor • Council &amp; Organization Officers
            </p>
          </div>
        </div>

        <CardContent className="pt-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Officer Email or Username</Label>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                placeholder="e.g. charrielmae.ayuban@carsu.edu.ph"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Officer Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter officer password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ccis-espresso/70 transition-colors hover:text-ccis-orange"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="captchaAnswer"
                  className="inline-flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-ccis-orange" />
                  <span>Security Check</span>
                </Label>
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  disabled={isLoadingCaptcha}
                  className="inline-flex items-center gap-1 font-subtext text-[11px] text-ccis-espresso/80 transition-colors hover:text-ccis-orange disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isLoadingCaptcha ? "animate-spin" : ""}`}
                  />
                  <span>New Code</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  title="Click to generate a new CAPTCHA code"
                  aria-label="Refresh CAPTCHA image"
                  className="relative flex h-11 w-36 shrink-0 items-center justify-center overflow-hidden rounded-md border border-ccis-ink/20 bg-ccis-cream/60 shadow-sm transition-colors hover:border-ccis-orange focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ccis-orange"
                >
                  {isLoadingCaptcha ? (
                    <Loader2 className="h-4 w-4 animate-spin text-ccis-orange" />
                  ) : captcha?.imageDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={captcha.imageDataUrl}
                      alt="CAPTCHA security code"
                      className="h-full w-full select-none object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span className="px-2 text-center font-subtext text-[10px] leading-tight text-ccis-espresso/80">
                      API offline (:4000) • Tap to retry
                    </span>
                  )}
                </button>

                <Input
                  id="captchaAnswer"
                  name="captchaAnswer"
                  type="text"
                  maxLength={5}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="5-char code"
                  value={captchaAnswer}
                  onChange={(e) =>
                    setCaptchaAnswer(e.target.value.toUpperCase())
                  }
                  className="font-subtext uppercase tracking-[0.22em] placeholder:normal-case placeholder:tracking-normal"
                  required
                />
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-ccis-orange/50 bg-ccis-orange/10 px-3.5 py-2.5 font-subtext text-xs text-ccis-ink"
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Enter Officer Workspace
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-col items-stretch gap-2.5 pt-4">
          {authStatus?.mode !== "supabase" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setIdentifier("charrielmae.ayuban@carsu.edu.ph");
                setPassword("06162005");
                setError(null);
              }}
            >
              <KeyRound className="h-3.5 w-3.5 text-ccis-orange" />
              <span>Quick-Fill CCISLSG Governor</span>
            </Button>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-headline text-xs font-medium text-ccis-espresso transition-colors hover:text-ccis-orange"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Student ID Login (No Password)</span>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
