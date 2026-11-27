"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  GraduationCap,
  IdCard,
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  studentLoginRequest,
} from "@/lib/auth-api";

const SAMPLE_STUDENT_IDS = [
  { label: "BSIT • 1st Yr", idNo: "261-01458", name: "Ayuban, Charles Gerald" },
  { label: "BSIS • 1st Yr", idNo: "261-01645", name: "Abbu, Lindsay" },
  { label: "BSCS • 1st Yr", idNo: "261-02974", name: "Abuan, Daniela Joy" },
];

export default function StudentLoginPage() {
  const router = useRouter();
  const [studentNo, setStudentNo] = React.useState("");
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
      await studentLoginRequest(
        studentNo,
        captcha.captchaToken,
        captchaAnswer
      );
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Sign-in failed. Check that the NestJS backend is running on port 4000."
      );
      setCaptchaAnswer("");
      await loadCaptcha();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-ccis-cream/85 via-ccis-paper to-ccis-primary/40 p-4 sm:p-6">
      {/* Warm student portal ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ccis-primary/45 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md overflow-hidden border-ccis-ink/20 bg-ccis-paper/95 shadow-xl">
        {/* Top Student Portal Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-ccis-primary via-ccis-secondary to-ccis-orange" />

        <CardHeader className="items-center space-y-2.5 pb-4 pt-6 text-center">
          <Badge variant="cream" className="gap-1.5 px-3 py-1">
            <GraduationCap className="h-3.5 w-3.5 text-ccis-orange" />
            <span>CCIS Student Portal • ID Access</span>
          </Badge>

          <CcislsgCrest className="h-20 w-20" />

          <div className="space-y-1">
            <CardTitle className="font-display text-4xl tracking-tight text-ccis-ink">
              Student Sign In
            </CardTitle>
            <CardDescription className="pt-0.5 text-xs">
              Enter your CSU Student ID Number — no password required
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="studentNo"
                className="inline-flex items-center gap-1.5"
              >
                <IdCard className="h-4 w-4 text-ccis-orange" />
                <span>Student ID Number</span>
              </Label>
              <Input
                id="studentNo"
                name="studentNo"
                type="text"
                autoComplete="off"
                placeholder="e.g. 261-01458"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                className="h-12 text-center font-subtext text-base font-medium tracking-wider placeholder:font-normal placeholder:tracking-normal"
                required
              />
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
                  Verifying Student ID...
                </>
              ) : (
                <>
                  Enter Student Portal
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <Separator />

        <CardFooter className="flex flex-col items-stretch gap-3 pt-4">
          <Link
            href="/login/officer"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-ccis-ink/15 bg-ccis-cream/55 px-3 py-2 font-headline text-xs font-medium text-ccis-espresso transition-colors hover:border-ccis-orange hover:bg-ccis-primary/35 hover:text-ccis-ink"
          >
            <Shield className="h-3.5 w-3.5 text-ccis-orange" />
            <span>LSG / Org Officer? Sign in with Officer Credentials</span>
            <ArrowRight className="h-3.5 w-3.5 text-ccis-orange" />
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
