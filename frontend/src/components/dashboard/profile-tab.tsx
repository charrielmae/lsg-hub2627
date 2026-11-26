"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Save, UserCircle2 } from "lucide-react";
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
  updateStudentProfileApi,
  UserProfile,
} from "@/lib/auth-api";

interface ProfileTabProps {
  user: UserProfile;
  onUserUpdated: (updated: UserProfile) => void;
}

export function ProfileTab({ user, onUserUpdated }: ProfileTabProps) {
  const sp = user.studentProfile;

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
      setSavedMessage("Account and student_profiles record saved.");
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
            Manage `users` identity fields and `student_profiles` PSGC address &amp; contact record.
          </p>
        </div>
        <Badge variant="default">{formatRoleLabel(user.role)}</Badge>
      </div>

      {(savedMessage || error) && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 font-subtext text-xs ${
            error
              ? "border-ccis-orange/60 bg-ccis-orange/10 text-ccis-ink"
              : "border-ccis-ink/20 bg-ccis-primary/40 text-ccis-ink"
          }`}
        >
          {!error && <CheckCircle2 className="h-4 w-4 text-ccis-orange" />}
          <span>{error || savedMessage}</span>
        </div>
      )}

      <Card className="bg-ccis-paper">
        <CardHeader>
          <CardDescription>USERS + STUDENT_PROFILES TABLES</CardDescription>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle2 className="h-5 w-5 text-ccis-orange" />
            {user.email} • {user.college?.name || "CCIS"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof-fullname">Full Name (`users.full_name`)</Label>
                <Input
                  id="prof-fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-username">Username (`users.username`)</Label>
                <Input
                  id="prof-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. mateo.villanueva"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-studentno">
                  Student No. (`student_no`)
                </Label>
                <Input
                  id="prof-studentno"
                  value={studentNo}
                  onChange={(e) => setStudentNo(e.target.value)}
                  placeholder="e.g. 2024-00418"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prof-contact">Contact No. (`contact_no`)</Label>
                <Input
                  id="prof-contact"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  placeholder="e.g. 0918-555-0418"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="font-subtext text-xs uppercase tracking-wider text-ccis-espresso/80">
                Philippine Standard Geographic Code (PSGC) Address Fields
              </p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="reg-name">Region Name</Label>
                  <Input
                    id="reg-name"
                    value={regionName}
                    onChange={(e) => setRegionName(e.target.value)}
                    placeholder="e.g. NCR"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="reg-code">Region Code</Label>
                  <Input
                    id="reg-code"
                    value={regionCode}
                    onChange={(e) => setRegionCode(e.target.value)}
                    placeholder="130000000"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prov-name">Province Name</Label>
                  <Input
                    id="prov-name"
                    value={provinceName}
                    onChange={(e) => setProvinceName(e.target.value)}
                    placeholder="e.g. Metro Manila"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="prov-code">Province Code</Label>
                  <Input
                    id="prov-code"
                    value={provinceCode}
                    onChange={(e) => setProvinceCode(e.target.value)}
                    placeholder="137400000"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="city-name">City / Municipality Name</Label>
                  <Input
                    id="city-name"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="e.g. Quezon City"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city-code">City Code</Label>
                  <Input
                    id="city-code"
                    value={cityCode}
                    onChange={(e) => setCityCode(e.target.value)}
                    placeholder="137404000"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brgy-name">Barangay Name</Label>
                  <Input
                    id="brgy-name"
                    value={barangayName}
                    onChange={(e) => setBarangayName(e.target.value)}
                    placeholder="e.g. Diliman"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="brgy-code">Barangay Code</Label>
                  <Input
                    id="brgy-code"
                    value={barangayCode}
                    onChange={(e) => setBarangayCode(e.target.value)}
                    placeholder="137404001"
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
