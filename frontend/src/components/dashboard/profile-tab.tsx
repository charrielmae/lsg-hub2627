"use client";

import * as React from "react";
import {
  Building2,
  CalendarCheck2,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Save,
  UserCircle2,
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
  formatRoleLabel,
  HubMembership,
  Program,
  updateStudentProfileApi,
  UserProfile,
} from "@/lib/auth-api";

const PROGRAM_DETAILS: Record<
  Program,
  { fullDegree: string; designatedOrg: string }
> = {
  BSIT: {
    fullDegree: "Bachelor of Science in Information Technology",
    designatedOrg: "Society of Information Technology Students",
  },
  BSIS: {
    fullDegree: "Bachelor of Science in Information Systems",
    designatedOrg: "Information System Students",
  },
  BSCS: {
    fullDegree: "Bachelor of Science in Computer Science",
    designatedOrg: "Computer Science Students",
  },
};

interface ProfileTabProps {
  user: UserProfile;
  memberships?: HubMembership[];
  onUserUpdated: (updated: UserProfile) => void;
}

export function ProfileTab({
  user,
  memberships = [],
  onUserUpdated,
}: ProfileTabProps) {
  const sp = user.studentProfile;
  const enrollment = user.studentEnrollment;

  const [fullName, setFullName] = React.useState(user.fullName || "");
  const [username, setUsername] = React.useState(user.username || "");
  const [studentNo, setStudentNo] = React.useState(sp?.student_no || "");
  const [contactNo, setContactNo] = React.useState(sp?.contact_no || "");
  const [regionCode, setRegionCode] = React.useState(sp?.region_code || "");
  const [regionName, setRegionName] = React.useState(sp?.region_name || "");
  const [provinceCode, setProvinceCode] = React.useState(
    sp?.province_code || ""
  );
  const [provinceName, setProvinceName] = React.useState(
    sp?.province_name || ""
  );
  const [cityCode, setCityCode] = React.useState(sp?.city_code || "");
  const [cityName, setCityName] = React.useState(sp?.city_name || "");
  const [barangayCode, setBarangayCode] = React.useState(
    sp?.barangay_code || ""
  );
  const [barangayName, setBarangayName] = React.useState(
    sp?.barangay_name || ""
  );

  const [saving, setSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFullName(user.fullName || "");
    setUsername(user.username || "");
    setStudentNo(user.studentProfile?.student_no || "");
    setContactNo(user.studentProfile?.contact_no || "");
    setRegionCode(user.studentProfile?.region_code || "");
    setRegionName(user.studentProfile?.region_name || "");
    setProvinceCode(user.studentProfile?.province_code || "");
    setProvinceName(user.studentProfile?.province_name || "");
    setCityCode(user.studentProfile?.city_code || "");
    setCityName(user.studentProfile?.city_name || "");
    setBarangayCode(user.studentProfile?.barangay_code || "");
    setBarangayName(user.studentProfile?.barangay_name || "");
  }, [user]);

  // Resolve the student's member organization among the 3 program organizations
  const approvedProgramMembership = memberships.find(
    (m) =>
      m.user_id === user.id &&
      m.status === "APPROVED" &&
      m.organization?.type === "ORG"
  );

  const programCode = enrollment?.program ?? null;
  const programMeta = programCode ? PROGRAM_DETAILS[programCode] : null;
  const yearLevelDisplay = enrollment?.yearLevel
    ? `${enrollment.yearLevel} Year`
    : "Not Assigned";
  const memberOrganizationName =
    enrollment?.organizationName ||
    programMeta?.designatedOrg ||
    approvedProgramMembership?.organization?.name ||
    "Unassigned Organization";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedMessage(null);
    setSaving(true);
    try {
      const updated = await updateStudentProfileApi({
        fullName,
        username,
        studentNo,
        contactNo,
        regionCode,
        regionName,
        provinceCode,
        provinceName,
        cityCode,
        cityName,
        barangayCode,
        barangayName,
      });
      onUserUpdated(updated);
      setSavedMessage("Student profile saved successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            Constituent Account &amp; Student Profile
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Academic program, year level, designated student organization, and Caraga Region address record.
          </p>
        </div>
        <Badge variant="default">{formatRoleLabel(user.role)}</Badge>
      </div>

      {/* Academic Program, Year Level & Designated Organization Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-ccis-paper/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>ACADEMIC PROGRAM</span>
              <GraduationCap className="h-4 w-4 text-ccis-orange" />
            </CardDescription>
            <CardTitle className="text-2xl text-ccis-ink">
              {programCode || "CCIS Constituent"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-headline text-xs text-ccis-espresso/85">
              {programMeta?.fullDegree ||
                "College of Computing and Information Sciences"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-ccis-paper/95 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>YEAR LEVEL</span>
              <CalendarCheck2 className="h-4 w-4 text-ccis-orange" />
            </CardDescription>
            <CardTitle className="text-2xl text-ccis-ink">
              {yearLevelDisplay}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-subtext text-xs text-ccis-espresso/85">
              AY 2026–2027 • 1st Semester Roster
            </p>
          </CardContent>
        </Card>

        <Card className="border-ccis-orange/45 bg-gradient-to-br from-ccis-paper via-ccis-cream/75 to-ccis-primary/35 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center justify-between">
              <span>MEMBER ORGANIZATION</span>
              <Building2 className="h-4 w-4 text-ccis-orange" />
            </CardDescription>
            <CardTitle className="text-lg leading-snug text-ccis-ink">
              {memberOrganizationName}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-1.5">
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Official Member</span>
            </Badge>
          </CardContent>
        </Card>
      </div>

      {(savedMessage || error) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-subtext text-xs ${error
            ? "border-ccis-orange/60 bg-ccis-paper text-ccis-ink"
            : "border-ccis-ink/20 bg-ccis-paper text-ccis-ink"
            }`}
        >
          {!error && <CheckCircle2 className="h-4 w-4 text-ccis-orange" />}
          <span>{error || savedMessage}</span>
        </div>
      )}

      <Card className="bg-ccis-paper/95 backdrop-blur-sm">
        <CardHeader>
          <CardDescription>PERSONAL &amp; ENROLLMENT DETAILS</CardDescription>
          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
            <UserCircle2 className="h-5 w-5 text-ccis-orange" />
            <span>
              {user.email} •{" "}
              {user.college?.name ||
                "College of Computing and Information Sciences"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-fullname">Full Name</Label>
                <Input
                  id="prof-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-username">Username</Label>
                <Input
                  id="prof-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 261-01458"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-studentno">Student ID Number</Label>
                <Input
                  id="prof-studentno"
                  value={studentNo}
                  onChange={(e) => setStudentNo(e.target.value)}
                  placeholder="e.g. 261-01458"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-contact">Contact Number</Label>
                <Input
                  id="prof-contact"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="e.g. 0918-555-0418"
                />
              </div>
            </div>

            {/* Read-only Program, Year Level & Organization Fields inside Profile Form */}
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-ccis-ink/15 bg-ccis-cream/45 p-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label>Program</Label>
                <Input
                  value={
                    programCode
                      ? `${programCode} — ${programMeta?.fullDegree}`
                      : "CCIS"
                  }
                  readOnly
                  className="bg-white/75 font-medium"
                />
              </div>
              <div className="space-y-1">
                <Label>Year Level</Label>
                <Input
                  value={yearLevelDisplay}
                  readOnly
                  className="bg-white/75 font-medium"
                />
              </div>
              <div className="space-y-1">
                <Label>Member Organization (CCIS)</Label>
                <Input
                  value={memberOrganizationName}
                  readOnly
                  className="bg-white/75 font-medium"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-subtext text-xs uppercase tracking-wider text-ccis-espresso/80">
                Address, Region &amp; Postal Code Fields
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="reg-name">Region Name</Label>
                  <Input
                    id="reg-name"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    placeholder="e.g. Caraga Region (Region XIII)"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-code">Region Code</Label>
                  <Input
                    id="reg-code"
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    placeholder="160000000"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prov-name">Province Name</Label>
                  <Input
                    id="prov-name"
                    value={provinceName}
                    onChange={(e) => setProvinceName(e.target.value)}
                    placeholder="e.g. Agusan del Norte"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prov-code">Province Code</Label>
                  <Input
                    id="prov-code"
                    value={provinceCode}
                    onChange={(e) => setProvinceCode(e.target.value)}
                    placeholder="160200000"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="city-name">City / Municipality</Label>
                  <Input
                    id="city-name"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Butuan City"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city-code">Postal / City Code</Label>
                  <Input
                    id="city-code"
                    value={cityCode}
                    onChange={(e) => setCityCode(e.target.value)}
                    placeholder="8600"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brgy-name">Barangay Name</Label>
                  <Input
                    id="brgy-name"
                    value={barangayName}
                    onChange={(e) => setBarangayName(e.target.value)}
                    placeholder="e.g. Ampayon"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brgy-code">Barangay Code</Label>
                  <Input
                    id="brgy-code"
                    value={barangayCode}
                    onChange={(e) => setBarangayCode(e.target.value)}
                    placeholder="160202003"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="brand" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Student Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
