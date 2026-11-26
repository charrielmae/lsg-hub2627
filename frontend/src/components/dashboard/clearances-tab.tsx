"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ClearanceStatus,
  CollegeRecord,
  DirectoryUser,
  HubClearance,
  upsertClearanceApi,
} from "@/lib/auth-api";

interface ClearancesTabProps {
  currentUserId: string;
  clearances: HubClearance[];
  colleges: CollegeRecord[];
  directoryUsers: DirectoryUser[];
  isStaff: boolean;
  onRefresh: () => Promise<void>;
}

export function ClearancesTab({
  currentUserId,
  clearances,
  colleges,
  directoryUsers,
  isStaff,
  onRefresh,
}: ClearancesTabProps) {
  const [userId, setUserId] = React.useState(directoryUsers[0]?.id || "");
  const [semester, setSemester] = React.useState("1st Semester AY 2026-2027");
  const [status, setStatus] = React.useState<ClearanceStatus>("CLEARED");
  const [saving, setSaving] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!userId && directoryUsers[0]?.id) {
      setUserId(directoryUsers[0].id);
    }
  }, [directoryUsers, userId]);

  const myLatestClearance = clearances.find((c) => c.user_id === currentUserId);

  async function handleIssueClearance(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      await upsertClearanceApi({
        userId,
        collegeId: colleges[0]?.id,
        semester,
        status,
      });
      setFeedback("College clearance record updated in clearances table.");
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update clearance."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickStatus(
    record: HubClearance,
    nextStatus: ClearanceStatus
  ) {
    setError(null);
    setFeedback(null);
    setUpdatingId(record.id);
    try {
      await upsertClearanceApi({
        userId: record.user_id,
        collegeId: record.college_id,
        semester: record.semester,
        status: nextStatus,
      });
      setFeedback(
        `Updated ${record.student?.fullName || "student"} clearance to ${nextStatus}.`
      );
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            College Clearances
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Semesterly CCIS clearance issuance and status verification (`clearances`).
          </p>
        </div>
        <Badge variant="cream">{clearances.length} Clearance Records</Badge>
      </div>

      {(feedback || error) && (
        <div
          className={`rounded-lg border px-4 py-2.5 font-subtext text-xs ${
            error
              ? "border-ccis-orange/60 bg-ccis-orange/10 text-ccis-ink"
              : "border-ccis-ink/20 bg-ccis-primary/40 text-ccis-ink"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <Card className="border-ccis-ink/20 bg-gradient-to-r from-ccis-primary/65 via-ccis-cream/75 to-ccis-paper">
        <CardHeader className="pb-2">
          <CardDescription>YOUR CURRENT COLLEGE CLEARANCE</CardDescription>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <CardTitle className="font-display text-3xl">
              {myLatestClearance
                ? `${myLatestClearance.college?.code || "CCIS"} • ${myLatestClearance.semester}`
                : "1st Semester AY 2026-2027"}
            </CardTitle>
            <Badge
              variant={
                myLatestClearance?.status === "CLEARED"
                  ? "default"
                  : myLatestClearance?.status === "HOLD"
                    ? "orange"
                    : "cream"
              }
              className="px-3 py-1 text-xs"
            >
              {myLatestClearance?.status === "CLEARED" && (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              {myLatestClearance?.status === "PENDING" && (
                <Clock className="mr-1.5 h-3.5 w-3.5" />
              )}
              {myLatestClearance?.status === "HOLD" && (
                <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
              )}
              {myLatestClearance?.status || "PENDING"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="font-subtext text-xs text-ccis-espresso">
            {myLatestClearance
              ? `Issued by ${myLatestClearance.issuedByName} on ${new Date(
                  myLatestClearance.issued_at
                ).toLocaleDateString()}`
              : "No clearance certificate issued for your account yet."}
          </p>
        </CardContent>
      </Card>

      {isStaff && (
        <Card className="bg-ccis-paper">
          <CardHeader className="pb-3">
            <CardDescription>ISSUE / UPDATE CLEARANCE</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-4 w-4 text-ccis-orange" />
              Sign Constituent Clearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleIssueClearance}
              className="grid grid-cols-1 gap-3 sm:grid-cols-4"
            >
              <div className="space-y-1">
                <Label htmlFor="clr-user">Student / Constituent</Label>
                <select
                  id="clr-user"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                >
                  {directoryUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.studentNo || u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clr-sem">Semester</Label>
                <Input
                  id="clr-sem"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="clr-status">Status (ClearanceStatus)</Label>
                <select
                  id="clr-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ClearanceStatus)}
                  className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                >
                  <option value="CLEARED">CLEARED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="HOLD">HOLD</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="brand"
                  className="h-11 w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  Save Clearance
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2.5">
        {clearances.map((c) => (
          <Card key={c.id} className="bg-ccis-paper">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="space-y-0.5">
                <p className="font-headline text-sm font-semibold text-ccis-ink">
                  {c.student?.fullName || "CCIS Student"}{" "}
                  <span className="font-subtext text-xs font-normal text-ccis-espresso/75">
                    ({c.student?.studentNo || c.student?.email})
                  </span>
                </p>
                <p className="font-subtext text-xs text-ccis-espresso/80">
                  {c.college?.code || "CCIS"} • {c.semester} • Signed by{" "}
                  {c.issuedByName}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={
                    c.status === "CLEARED"
                      ? "default"
                      : c.status === "HOLD"
                        ? "orange"
                        : "cream"
                  }
                >
                  {c.status}
                </Badge>

                {isStaff && (
                  <div className="flex items-center gap-1">
                    {(["CLEARED", "PENDING", "HOLD"] as ClearanceStatus[]).map(
                      (st) => (
                        <Button
                          key={st}
                          type="button"
                          size="sm"
                          variant={c.status === st ? "secondary" : "outline"}
                          disabled={updatingId === c.id || c.status === st}
                          onClick={() => handleQuickStatus(c, st)}
                        >
                          {st}
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
