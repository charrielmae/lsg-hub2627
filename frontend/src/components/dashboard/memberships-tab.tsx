"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Send,
  XCircle,
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
  applyMembershipApi,
  HubMembership,
  HubOrganization,
  MembershipStatus,
  updateMembershipStatusApi,
} from "@/lib/auth-api";

interface MembershipsTabProps {
  organizations: HubOrganization[];
  memberships: HubMembership[];
  isStaff: boolean;
  preselectedOrgId: string | null;
  onRefresh: () => Promise<void>;
}

export function MembershipsTab({
  organizations,
  memberships,
  isStaff,
  preselectedOrgId,
  onRefresh,
}: MembershipsTabProps) {
  const [organizationId, setOrganizationId] = React.useState(
    preselectedOrgId || organizations[0]?.id || ""
  );
  const [remarks, setRemarks] = React.useState("");
  const [fileUrls, setFileUrls] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedOrgId) {
      setOrganizationId(preselectedOrgId);
    } else if (!organizationId && organizations[0]?.id) {
      setOrganizationId(organizations[0].id);
    }
  }, [preselectedOrgId, organizations, organizationId]);

  const selectedOrg = organizations.find((o) => o.id === organizationId);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!organizationId) return;
    setError(null);
    setFeedback(null);
    setSubmitting(true);

    try {
      const files = (selectedOrg?.requirements || [])
        .map((req) => {
          const url = fileUrls[req.id]?.trim();
          if (!url) return null;
          const fileName = url.split("/").pop() || `${req.id}.pdf`;
          return {
            requirementId: req.id,
            fileUrl: url,
            fileKey: `submissions/${organizationId}/${fileName}`,
          };
        })
        .filter(
          (
            item
          ): item is {
            requirementId: string;
            fileUrl: string;
            fileKey: string;
          } => item !== null
        );

      await applyMembershipApi({
        organizationId,
        remarks,
        files,
      });
      setRemarks("");
      setFileUrls({});
      setFeedback("Membership application submitted for officer verification.");
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit membership."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(
    membershipId: string,
    status: MembershipStatus
  ) {
    setError(null);
    setFeedback(null);
    setUpdatingId(membershipId);
    try {
      await updateMembershipStatusApi(membershipId, {
        status,
        remarks:
          status === "APPROVED"
            ? "Requirements verified and approved by council officer."
            : "Application requires updated requirement documents.",
      });
      setFeedback(`Membership marked as ${status}.`);
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            Organization Memberships
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Submit accreditation requirements (`membership_files`) and track verification status.
          </p>
        </div>
        <Badge variant="cream">{memberships.length} Applications</Badge>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Card className="bg-ccis-paper lg:col-span-5">
          <CardHeader>
            <CardDescription>MEMBERSHIPS + MEMBERSHIP_FILES</CardDescription>
            <CardTitle>Apply to an Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApply} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="apply-org">Target Organization</Label>
                <select
                  id="apply-org"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.type})
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrg && selectedOrg.requirements.length > 0 && (
                <div className="space-y-3 rounded-lg border border-ccis-ink/15 bg-ccis-cream/45 p-3.5">
                  <p className="font-subtext text-[11px] uppercase tracking-wider text-ccis-espresso">
                    Required Document Links (membership_files)
                  </p>
                  {selectedOrg.requirements.map((req) => (
                    <div key={req.id} className="space-y-1">
                      <Label htmlFor={`req-${req.id}`} className="text-xs">
                        {req.name}
                      </Label>
                      <Input
                        id={`req-${req.id}`}
                        placeholder="https://drive.google.com/... or storage URL"
                        value={fileUrls[req.id] || ""}
                        onChange={(e) =>
                          setFileUrls((prev) => ({
                            ...prev,
                            [req.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="apply-remarks">Applicant Remarks</Label>
                <Input
                  id="apply-remarks"
                  placeholder="Optional note (e.g. Year & Section, committee interest)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="brand"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit Membership Application
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3 lg:col-span-7">
          {memberships.length === 0 ? (
            <Card className="bg-ccis-paper">
              <CardContent className="py-10 text-center font-headline text-sm text-ccis-espresso/75">
                No membership records yet. Submit an application on the left to begin.
              </CardContent>
            </Card>
          ) : (
            memberships.map((m) => (
              <Card key={m.id} className="bg-ccis-paper">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge
                      variant={
                        m.status === "APPROVED"
                          ? "default"
                          : m.status === "REJECTED"
                            ? "orange"
                            : "cream"
                      }
                    >
                      {m.status === "APPROVED" && (
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                      )}
                      {m.status === "PENDING" && (
                        <Clock className="mr-1 h-3 w-3" />
                      )}
                      {m.status === "REJECTED" && (
                        <XCircle className="mr-1 h-3 w-3" />
                      )}
                      {m.status}
                    </Badge>
                    <span className="font-subtext text-[11px] text-ccis-espresso/75">
                      Applied {new Date(m.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="pt-1 text-lg">
                    {m.organization?.name || "Organization"}
                  </CardTitle>
                  {m.applicant && (
                    <CardDescription>
                      Applicant: {m.applicant.fullName} (
                      {m.applicant.studentNo || m.applicant.email})
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3">
                  {m.remarks && (
                    <p className="rounded-md bg-ccis-cream/50 px-3 py-2 text-xs text-ccis-ink">
                      {m.remarks}
                    </p>
                  )}

                  {m.files.length > 0 && (
                    <div className="space-y-1">
                      <p className="font-subtext text-[10px] uppercase tracking-wider text-ccis-espresso/75">
                        Attached Requirement Files
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {m.files.map((f) => (
                          <a
                            key={f.id}
                            href={f.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-md border border-ccis-ink/20 bg-white px-2.5 py-1 font-subtext text-xs text-ccis-ink hover:border-ccis-orange hover:text-ccis-orange"
                          >
                            <FileText className="h-3.5 w-3.5 text-ccis-orange" />
                            <span>{f.requirementName}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="font-subtext text-[11px] text-ccis-espresso/70">
                      {m.verifiedByName
                        ? `Verified by ${m.verifiedByName}`
                        : "Awaiting officer verification"}
                    </span>

                    {isStaff && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={
                            updatingId === m.id || m.status === "APPROVED"
                          }
                          onClick={() => handleStatusChange(m.id, "APPROVED")}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={
                            updatingId === m.id || m.status === "REJECTED"
                          }
                          onClick={() => handleStatusChange(m.id, "REJECTED")}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
