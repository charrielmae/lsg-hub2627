"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Megaphone,
  RefreshCw,
  Shield,
  ShieldCheck,
  UserCircle2,
  Users,
} from "lucide-react";
import { CcislsgCrest } from "@/components/ccislsg-crest";
import { AnnouncementsTab } from "@/components/dashboard/announcements-tab";
import { ClearancesTab } from "@/components/dashboard/clearances-tab";
import { FinanceTab } from "@/components/dashboard/finance-tab";
import { MembershipsTab } from "@/components/dashboard/memberships-tab";
import { OrganizationsTab } from "@/components/dashboard/organizations-tab";
import { ProfileTab } from "@/components/dashboard/profile-tab";
import { StudentsTab } from "@/components/dashboard/students-tab";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  clearSession,
  fetchCurrentUser,
  fetchHubSnapshot,
  formatCentavos,
  formatRoleLabel,
  HubSnapshot,
  isStaffUser,
  UserProfile,
} from "@/lib/auth-api";

type DashboardTab =
  | "overview"
  | "students"
  | "organizations"
  | "memberships"
  | "announcements"
  | "finance"
  | "clearances"
  | "profile";

const NAV_ITEMS: Array<{
  key: DashboardTab;
  label: string;
  staffOnly?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}> = [
    {
      key: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      key: "students",
      label: "Students",
      staffOnly: true,
      icon: GraduationCap,
    },
    {
      key: "organizations",
      label: "Organizations",
      icon: Building2,
    },
    {
      key: "memberships",
      label: "Memberships",
      icon: Users,
    },
    {
      key: "announcements",
      label: "Announcements",
      icon: Megaphone,
    },
    {
      key: "finance",
      label: "Fees & Payments",
      icon: CreditCard,
    },
    {
      key: "clearances",
      label: "Clearances",
      icon: ClipboardCheck,
    },
    {
      key: "profile",
      label: "Profile",
      icon: UserCircle2,
    },
  ];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = React.useState<"supabase" | "demo">("demo");
  const [snapshot, setSnapshot] = React.useState<HubSnapshot | null>(null);
  const [activeTab, setActiveTab] = React.useState<DashboardTab>("overview");
  const [preselectedOrgId, setPreselectedOrgId] = React.useState<string | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadSnapshot = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchHubSnapshot();
      setSnapshot(data);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Automatically sync Admin <-> Student changes in real time (on tab focus & every 5s)
  React.useEffect(() => {
    if (!user) return;

    const silentSync = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const data = await fetchHubSnapshot();
        setSnapshot(data);
      } catch {
        // Ignore transient background poll errors
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void silentSync();
      }
    };

    window.addEventListener("focus", silentSync);
    document.addEventListener("visibilitychange", handleVisibility);
    const intervalId = window.setInterval(silentSync, 5000);

    return () => {
      window.removeEventListener("focus", silentSync);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.clearInterval(intervalId);
    };
  }, [user]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const session = await fetchCurrentUser();
      if (!mounted) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setUser(session.user);
      setAuthMode(session.mode);
      try {
        const data = await fetchHubSnapshot();
        if (mounted) setSnapshot(data);
      } catch {
        // Keep shell mounted even if snapshot retries
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  function handleSignOut() {
    const goOfficer = isStaffUser(user);
    clearSession();
    router.replace(goOfficer ? "/login/officer" : "/login");
  }

  if (loading || !user || !snapshot) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ccis-cream/55">
        <div className="flex flex-col items-center gap-3">
          <CcislsgCrest className="animate-pulse" />
          <p className="font-subtext text-xs uppercase tracking-widest text-ccis-espresso">
            Loading CCISLSG Hub Modules...
          </p>
        </div>
      </div>
    );
  }

  const isStaff = isStaffUser(user);
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.staffOnly || isStaff
  );
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const myClearance = snapshot.clearances.find((c) => c.user_id === user.id);
  const myPaidTotal = snapshot.payments
    .filter((p) => p.user_id === user.id && p.status === "PAID")
    .reduce((acc, p) => acc + p.amount_centavos, 0);
  const pendingMembershipsCount = snapshot.memberships.filter(
    (m) => m.status === "PENDING"
  ).length;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ccis-cream/40">
      {/* Static Top Header */}
      <header className="z-30 shrink-0 border-b border-ccis-ink/15 bg-gradient-to-r from-ccis-primary/85 via-ccis-primary/55 to-ccis-cream shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          {/* Brand Identity */}
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className="flex shrink-0 items-center gap-2.5 text-left focus:outline-none"
          >
            <CcislsgCrest className="h-9 w-9" />
            <div>
              <p className="font-headline text-sm font-semibold leading-none text-ccis-ink">
                CCISLSG Hub
              </p>
              <p className="mt-0.5 font-subtext text-[9px] uppercase tracking-wider text-ccis-espresso">
                {user.college?.code || "CCIS"} Governance Portal
              </p>
            </div>
          </button>

          {/* Horizontal Governance Modules Navigation */}
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <nav
              aria-label="Governance Modules"
              className="mx-auto flex w-max items-center gap-1"
            >
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={
                      isActive
                        ? "inline-flex shrink-0 items-center gap-1.5 rounded-md border border-ccis-ink/20 bg-ccis-paper px-2.5 py-1.5 font-headline text-xs font-semibold leading-none text-ccis-ink shadow-sm"
                        : "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 font-headline text-xs leading-none text-ccis-espresso/85 transition-colors hover:bg-ccis-paper/65 hover:text-ccis-ink"
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-ccis-orange" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Refresh Action */}
          <div className="flex shrink-0 items-center gap-1.5">
            <Badge
              variant={authMode === "supabase" ? "orange" : "default"}
              className="hidden px-2 py-0.5 text-[10px] lg:inline-flex"
            >
              {authMode === "supabase" ? "Supabase" : "Demo"}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={loadSnapshot}
              aria-label="Refresh hub data"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-ccis-espresso ${refreshing ? "animate-spin" : ""
                  }`}
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl space-y-6 p-6 sm:p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <section className="relative overflow-hidden rounded-2xl border border-ccis-ink/20 bg-gradient-to-r from-ccis-primary via-ccis-primary/80 to-ccis-cream p-6 shadow-sm sm:p-8">
                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div className="space-y-2">
                    <div className="inline-flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 rounded-full border border-ccis-ink/15 bg-ccis-paper/85 px-3 py-1">
                        <Shield className="h-3.5 w-3.5 text-ccis-orange" />
                        <span className="font-subtext text-[11px] uppercase tracking-wider text-ccis-ink">
                          {formatRoleLabel(user.role)} •{" "}
                          {user.college?.code || "CCIS"}
                        </span>
                      </div>
                      {user.studentEnrollment && (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-ccis-ink/15 bg-ccis-paper/90 px-3 py-1">
                          <GraduationCap className="h-3.5 w-3.5 text-ccis-orange" />
                          <span className="font-subtext text-[11px] text-ccis-ink">
                            {user.studentEnrollment.program} •{" "}
                            {user.studentEnrollment.yearLevel} Year •{" "}
                            {user.studentEnrollment.organizationName}
                          </span>
                        </div>
                      )}
                    </div>
                    <h2 className="font-display text-4xl leading-none tracking-tight text-ccis-ink sm:text-5xl">
                      Welcome back, {user.fullName.replace(",", "").split(" ")[0]}.
                    </h2>
                    <p className="max-w-2xl font-headline text-sm text-ccis-espresso sm:text-base">
                      Manage CCIS organizations, membership verifications,
                      council announcements, PayMongo fee settlements, and
                      semesterly clearances from one unified hub.
                    </p>
                  </div>

                  <div className="rounded-xl border border-ccis-ink/15 bg-ccis-paper/90 px-4 py-3">
                    <p className="font-subtext text-[10px] uppercase tracking-widest text-ccis-espresso/75">
                      Student Profile (`student_no`)
                    </p>
                    <p className="mt-0.5 font-subtext text-sm font-medium text-ccis-ink">
                      {user.studentProfile?.student_no || "Unassigned"} •{" "}
                      {user.studentProfile?.barangay_name
                        ? `${user.studentProfile.barangay_name}, `
                        : ""}
                      {user.studentProfile?.city_name || "Butuan City"}
                      {user.studentProfile?.city_code
                        ? ` (${user.studentProfile.city_code})`
                        : ""}
                    </p>
                  </div>
                </div>
              </section>

              {/* Summary Metric Cards */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isStaff ? (
                  <Card
                    className="cursor-pointer bg-ccis-paper transition-colors hover:border-ccis-orange"
                    onClick={() => setActiveTab("students")}
                  >
                    <CardHeader className="pb-2">
                      <CardDescription>ENROLLED STUDENTS</CardDescription>
                      <CardTitle className="flex items-center justify-between text-2xl">
                        <span>
                          {(snapshot.studentCounts?.total ?? 1817).toLocaleString()}
                        </span>
                        <GraduationCap className="h-5 w-5 text-ccis-orange" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-subtext text-xs text-ccis-espresso">
                        BSIT ({snapshot.studentCounts?.BSIT ?? 925}) • BSIS (
                        {snapshot.studentCounts?.BSIS ?? 483}) • BSCS (
                        {snapshot.studentCounts?.BSCS ?? 409})
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    className="cursor-pointer bg-ccis-paper transition-colors hover:border-ccis-orange"
                    onClick={() => setActiveTab("organizations")}
                  >
                    <CardHeader className="pb-2">
                      <CardDescription>ORGANIZATIONS</CardDescription>
                      <CardTitle className="flex items-center justify-between text-2xl">
                        <span>{snapshot.organizations.length}</span>
                        <Building2 className="h-5 w-5 text-ccis-orange" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-subtext text-xs text-ccis-espresso">
                        Recognized CCIS student organizations
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card
                  className="cursor-pointer bg-ccis-paper transition-colors hover:border-ccis-orange"
                  onClick={() => setActiveTab("memberships")}
                >
                  <CardHeader className="pb-2">
                    <CardDescription>MEMBERSHIPS</CardDescription>
                    <CardTitle className="flex items-center justify-between text-2xl">
                      <span>{snapshot.memberships.length}</span>
                      <Users className="h-5 w-5 text-ccis-orange" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-subtext text-xs text-ccis-espresso">
                      {pendingMembershipsCount} pending verification
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer bg-ccis-paper transition-colors hover:border-ccis-orange"
                  onClick={() => setActiveTab("finance")}
                >
                  <CardHeader className="pb-2">
                    <CardDescription>SETTLED FEES</CardDescription>
                    <CardTitle className="flex items-center justify-between text-2xl">
                      <span>{formatCentavos(myPaidTotal)}</span>
                      <CreditCard className="h-5 w-5 text-ccis-orange" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-subtext text-xs text-ccis-espresso">
                      {snapshot.feeItems.length} active semester fee items
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="cursor-pointer bg-ccis-paper transition-colors hover:border-ccis-orange"
                  onClick={() => setActiveTab("clearances")}
                >
                  <CardHeader className="pb-2">
                    <CardDescription>CLEARANCE STATUS</CardDescription>
                    <CardTitle className="flex items-center justify-between text-2xl">
                      <span>{myClearance?.status || "PENDING"}</span>
                      <ShieldCheck className="h-5 w-5 text-ccis-orange" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-subtext text-xs text-ccis-espresso">
                      1st Semester AY 2026–2027
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Recent Announcements + Quick Actions */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <Card className="bg-ccis-paper lg:col-span-7">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <CardDescription>LATEST DISPATCHES</CardDescription>
                      <CardTitle className="text-lg">
                        Recent Announcements
                      </CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab("announcements")}
                    >
                      View All
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {snapshot.announcements.slice(0, 3).map((ann) => (
                      <div
                        key={ann.id}
                        className="rounded-lg border border-ccis-ink/15 bg-ccis-cream/40 p-3.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="cream">
                            {ann.organization?.name || "CCISLSG"}
                          </Badge>
                          <span className="font-subtext text-[11px] text-ccis-espresso/75">
                            {new Date(ann.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-2 font-headline text-sm font-semibold text-ccis-ink">
                          {ann.title}
                        </p>
                        <p className="mt-1 line-clamp-2 font-headline text-xs text-ccis-espresso/85">
                          {ann.body}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="bg-ccis-paper lg:col-span-5">
                  <CardHeader className="pb-3">
                    <CardDescription>CONSTITUENT WORKFLOWS</CardDescription>
                    <CardTitle className="text-lg">Quick Module Jump</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setActiveTab("memberships")}
                    >
                      <span>Submit Organization Membership</span>
                      <ArrowRight className="h-4 w-4 text-ccis-orange" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setActiveTab("finance")}
                    >
                      <span>Pay Council Fees &amp; View Receipts</span>
                      <ArrowRight className="h-4 w-4 text-ccis-orange" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setActiveTab("clearances")}
                    >
                      <span>Check / Sign Semester Clearance</span>
                      <ArrowRight className="h-4 w-4 text-ccis-orange" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => setActiveTab("profile")}
                    >
                      <span>Update PSGC Address &amp; Student No.</span>
                      <ArrowRight className="h-4 w-4 text-ccis-orange" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "students" && isStaff && <StudentsTab />}

          {activeTab === "organizations" && (
            <OrganizationsTab
              organizations={snapshot.organizations}
              colleges={snapshot.colleges}
              directoryUsers={snapshot.directoryUsers}
              isStaff={isStaff}
              onRefresh={loadSnapshot}
              onNavigateApply={(orgId) => {
                setPreselectedOrgId(orgId);
                setActiveTab("memberships");
              }}
            />
          )}

          {activeTab === "memberships" && (
            <MembershipsTab
              organizations={snapshot.organizations}
              memberships={snapshot.memberships}
              isStaff={isStaff}
              preselectedOrgId={preselectedOrgId}
              onRefresh={loadSnapshot}
            />
          )}

          {activeTab === "announcements" && (
            <AnnouncementsTab
              announcements={snapshot.announcements}
              organizations={snapshot.organizations}
              isStaff={isStaff}
              onRefresh={loadSnapshot}
            />
          )}

          {activeTab === "finance" && (
            <FinanceTab
              currentUserId={user.id}
              feeItems={snapshot.feeItems}
              payments={snapshot.payments}
              organizations={snapshot.organizations}
              isStaff={isStaff}
              onRefresh={loadSnapshot}
            />
          )}

          {activeTab === "clearances" && (
            <ClearancesTab
              currentUserId={user.id}
              clearances={snapshot.clearances}
              colleges={snapshot.colleges}
              directoryUsers={snapshot.directoryUsers}
              isStaff={isStaff}
              onRefresh={loadSnapshot}
            />
          )}

          {activeTab === "profile" && (
            <ProfileTab
              user={user}
              memberships={snapshot.memberships}
              onUserUpdated={(u) => setUser(u)}
            />
          )}
        </div>
      </main>

      {/* Static Bottom Footer with Sign Out Card */}
      <footer className="z-30 shrink-0 border-t border-ccis-ink/15 bg-gradient-to-r from-ccis-cream/95 via-ccis-primary/45 to-ccis-primary/75 px-4 py-2.5 shadow-sm sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          {/* Institutional Footer Info */}
          <div className="hidden items-center gap-2.5 sm:flex">
            <CcislsgCrest className="h-7 w-7" />
            <div>
              <p className="font-headline text-xs font-semibold text-ccis-ink">
                {user.college?.name ||
                  "College of Computing and Information Sciences"}
              </p>
              <p className="font-subtext text-[10px] uppercase tracking-wider text-ccis-espresso/80">
                CCISLSG Digital Hub • AY 2026–2027 •{" "}
                {formatRoleLabel(user.role)}
              </p>
            </div>
          </div>

          {/* User & Sign Out Card */}
          <div className="ml-auto flex w-full items-center justify-between gap-3 rounded-xl border border-ccis-ink/15 bg-ccis-paper/95 px-3.5 py-2 shadow-sm sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className="flex min-w-0 items-center gap-2.5 text-left transition-opacity hover:opacity-85"
              title="Open Student Profile"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-headline text-sm font-medium leading-tight text-ccis-ink">
                  {user.fullName}
                </p>
                <p className="truncate font-subtext text-[11px] text-ccis-espresso/80">
                  {user.studentProfile?.student_no ||
                    user.username ||
                    user.email}
                </p>
              </div>
            </button>

            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5 text-ccis-orange" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
