"use client";

import * as React from "react";
import {
  Building2,
  ClipboardList,
  Loader2,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
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
import { Separator } from "@/components/ui/separator";
import {
  addRequirementApi,
  assignOfficerApi,
  CollegeRecord,
  createOrganizationApi,
  DirectoryUser,
  HubOrganization,
  OrgType,
} from "@/lib/auth-api";

interface OrganizationsTabProps {
  organizations: HubOrganization[];
  colleges: CollegeRecord[];
  directoryUsers: DirectoryUser[];
  isStaff: boolean;
  onRefresh: () => Promise<void>;
  onNavigateApply: (orgId: string) => void;
}

export function OrganizationsTab({
  organizations,
  colleges,
  directoryUsers,
  isStaff,
  onRefresh,
  onNavigateApply,
}: OrganizationsTabProps) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<OrgType>("ORG");
  const [description, setDescription] = React.useState("");
  const [creatingOrg, setCreatingOrg] = React.useState(false);

  const [selectedOrgForOfficer, setSelectedOrgForOfficer] = React.useState("");
  const [selectedUserId, setSelectedUserId] = React.useState("");
  const [assigningOfficer, setAssigningOfficer] = React.useState(false);

  const [selectedOrgForReq, setSelectedOrgForReq] = React.useState("");
  const [reqName, setReqName] = React.useState("");
  const [reqDesc, setReqDesc] = React.useState("");
  const [addingReq, setAddingReq] = React.useState(false);

  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (organizations.length > 0) {
      if (!selectedOrgForOfficer) setSelectedOrgForOfficer(organizations[0].id);
      if (!selectedOrgForReq) setSelectedOrgForReq(organizations[0].id);
    }
  }, [organizations, selectedOrgForOfficer, selectedOrgForReq]);

  React.useEffect(() => {
    if (directoryUsers.length > 0 && !selectedUserId) {
      setSelectedUserId(directoryUsers[0].id);
    }
  }, [directoryUsers, selectedUserId]);

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setCreatingOrg(true);
    try {
      await createOrganizationApi({
        collegeId: colleges[0]?.id,
        name,
        type,
        description,
      });
      setName("");
      setDescription("");
      setFeedback("Organization registered in CCIS directory.");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization.");
    } finally {
      setCreatingOrg(false);
    }
  }

  async function handleAssignOfficer(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgForOfficer || !selectedUserId) return;
    setError(null);
    setFeedback(null);
    setAssigningOfficer(true);
    try {
      await assignOfficerApi(selectedOrgForOfficer, selectedUserId);
      setFeedback("Officer assigned to organization (org_officers).");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign officer.");
    } finally {
      setAssigningOfficer(false);
    }
  }

  async function handleAddRequirement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrgForReq || !reqName.trim()) return;
    setError(null);
    setFeedback(null);
    setAddingReq(true);
    try {
      await addRequirementApi(selectedOrgForReq, {
        name: reqName,
        description: reqDesc,
      });
      setReqName("");
      setReqDesc("");
      setFeedback("Membership requirement added.");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add requirement.");
    } finally {
      setAddingReq(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            College Organizations &amp; Officers
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Accredited CCIS student organizations, council officers, and membership requirements.
          </p>
        </div>
        <Badge variant="cream">
          {organizations.length} Accredited Orgs
        </Badge>
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

      {isStaff && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="bg-ccis-paper">
            <CardHeader className="pb-3">
              <CardDescription>NEW ORGANIZATION</CardDescription>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-ccis-orange" />
                Register Organization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateOrg} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input
                    id="org-name"
                    placeholder="e.g. CCIS Cybersecurity Guild"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="org-type">Type (OrgType)</Label>
                  <select
                    id="org-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as OrgType)}
                    className="flex h-10 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink focus:outline-none focus:ring-2 focus:ring-ccis-orange"
                  >
                    <option value="ORG">ORG — Recognized Student Org</option>
                    <option value="LSG">LSG — Local Student Government</option>
                    <option value="COUNCIL">COUNCIL — Academic Council</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="org-desc">Description</Label>
                  <Input
                    id="org-desc"
                    placeholder="Mandate and scope"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  className="w-full"
                  disabled={creatingOrg}
                >
                  {creatingOrg ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create Organization
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-ccis-paper">
            <CardHeader className="pb-3">
              <CardDescription>ORG_OFFICERS TABLE</CardDescription>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserPlus className="h-4 w-4 text-ccis-orange" />
                Assign Officer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAssignOfficer} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="officer-org">Organization</Label>
                  <select
                    id="officer-org"
                    value={selectedOrgForOfficer}
                    onChange={(e) => setSelectedOrgForOfficer(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="officer-user">Constituent User</Label>
                  <select
                    id="officer-user"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                  >
                    {directoryUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.studentNo || u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={assigningOfficer}
                >
                  {assigningOfficer ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-ccis-orange" />
                  )}
                  Assign to org_officers
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-ccis-paper">
            <CardHeader className="pb-3">
              <CardDescription>MEMBERSHIP_REQUIREMENTS</CardDescription>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4 text-ccis-orange" />
                Add Requirement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddRequirement} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="req-org">Organization</Label>
                  <select
                    id="req-org"
                    value={selectedOrgForReq}
                    onChange={(e) => setSelectedOrgForReq(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="req-name">Requirement Name</Label>
                  <Input
                    id="req-name"
                    placeholder="e.g. Validated COR PDF"
                    value={reqName}
                    onChange={(e) => setReqName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="req-desc">Instructions</Label>
                  <Input
                    id="req-desc"
                    placeholder="Optional submission note"
                    value={reqDesc}
                    onChange={(e) => setReqDesc(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={addingReq}
                >
                  {addingReq ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 text-ccis-orange" />
                  )}
                  Save Requirement
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {organizations.map((org) => (
          <Card key={org.id} className="flex flex-col justify-between bg-ccis-paper">
            <CardHeader className="space-y-2 pb-3">
              <div className="flex items-center justify-between gap-2">
                <Badge variant={org.type === "LSG" ? "orange" : "default"}>
                  {org.type} • {org.college?.code || "CCIS"}
                </Badge>
                <span className="inline-flex items-center gap-1 font-subtext text-xs text-ccis-espresso">
                  <Users className="h-3.5 w-3.5 text-ccis-orange" />
                  {org.approvedMembersCount} Verified
                </span>
              </div>
              <CardTitle className="text-xl">{org.name}</CardTitle>
              <CardDescription className="font-headline text-sm text-ccis-espresso/85">
                {org.description || "Official CCIS student organization."}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Separator />
              <div className="space-y-1.5">
                <p className="font-subtext text-[11px] uppercase tracking-wider text-ccis-espresso/75">
                  Designated Officers ({org.officers.length})
                </p>
                {org.officers.length === 0 ? (
                  <p className="font-subtext text-xs text-ccis-espresso/60">
                    No officers assigned yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {org.officers.map((off) => (
                      <Badge key={off.id} variant="cream">
                        {off.fullName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="font-subtext text-[11px] uppercase tracking-wider text-ccis-espresso/75">
                  Membership Requirements ({org.requirements.length})
                </p>
                {org.requirements.length === 0 ? (
                  <p className="font-subtext text-xs text-ccis-espresso/60">
                    Open accreditation — no file requirements listed.
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {org.requirements.map((req) => (
                      <li
                        key={req.id}
                        className="rounded-md border border-ccis-ink/10 bg-ccis-cream/40 px-2.5 py-1.5 text-xs text-ccis-ink"
                      >
                        <span className="font-medium">{req.name}</span>
                        {req.description && (
                          <span className="block font-subtext text-[11px] text-ccis-espresso/75">
                            {req.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onNavigateApply(org.id)}
              >
                Apply / Manage Membership
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
