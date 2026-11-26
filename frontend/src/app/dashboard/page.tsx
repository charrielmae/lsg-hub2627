"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  CreditCard,
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
import { Separator } from "@/components/ui/separator";
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
  | "organizations"
  | "memberships"
  | "announcements"
  | "finance"
  | "clearances"
  | "profile";

const NAV_ITEMS: Array<{
  key: DashboardTab;
  label: string;
  tableHint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    key: "overview",
    label: "Hub Overview",
    tableHint: "All Modules",
    icon: LayoutDashboard,
  },
  {
    key: "organizations",
    label: "Organizations",
    tableHint: "orgs • officers",
    icon: Building2,
  },
  {
    key: "memberships",
    label: "Memberships",
    tableHint: "reqs • files",
    icon: Users,
  },
  {
    key: "announcements",
    label: "Announcements",
    tableHint: "dispatches",
    icon: Megaphone,
  },
  {
    key: "finance",
    label: "Fees & Payments",
    tableHint: "paymongo • OR",
    icon: CreditCard,
  },
  {
    key: "clearances",
    label: "Clearances",
    tableHint: "college status",
    icon: ClipboardCheck,
  },
  {
    key: "profile",
    label: "Student Profile",
    tableHint: "PSGC • ID",
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
    clearSession();
    router.replace("/login");
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
    <div className="flex min-h-screen bg-ccis-cream/40">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col justify-between border-r border-ccis-ink/15 bg-gradient-to-b from-ccis-primary/85 via-ccis-primary/45 to-ccis-cream p-6 lg:flex">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CcislsgCrest className="h-10 w-10" />
            <div>
              <p className="font-headline text-base font-semibold leading-none text-ccis-ink">
                CCISLSG Hub
              </p>
              <p className="mt-1 font-subtext text-[10px] uppercase tracking-widest text-ccis-espresso">
                {user.college?.code || "CCIS"} Governance Portal
              </p>
            </div>
          </div>

          <Separator />

          <nav className="space-y-1" aria-label="ERD Module Navigation">
            <p className="px-2.5 pb-1.5 font-subtext text-[10px] uppercase tracking-widest text-ccis-espresso/80">
              Governance Modules
            </p>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={
                    isActive
                      ? "flex w-full items-center justify-between rounded-lg border border-ccis-ink/20 bg-ccis-paper px-3 py-2.5 text-left font-headline text-sm font-semibold text-ccis-ink shadow-sm"
                      : "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-headline text-sm text-ccis-espresso/85 transition-colors hover:bg-ccis-paper/65 hover:text-ccis-ink"
                  }
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-ccis-orange" />
                    {item.label}
                  </span>
                  <span className="font-subtext text-[10px] text-ccis-espresso/65">
                    {item.tableHint}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4 rounded-xl border border-ccis-ink/15 bg-ccis-paper/85 p-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-headline text-sm font-medium text-ccis-ink">
                {user.fullName}
              </p>
              <p className="truncate font-subtext text-[11px] text-ccis-espresso/80">
                {user.studentProfile?.student_no || user.username || user.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleSignOut}
          >
            <LogOut className="h-3.5 w-3.5 text-ccis-orange" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-ccis-ink/15 bg-ccis-paper/90 px-6 py-4 backdrop-blur-sm sm:px-8">
          <div className="flex items-center gap-3">
            <div className="lg:hidden">
              <CcislsgCrest className="h-9 w-9" />
            </div>
            <div>
              <p className="font-subtext text-[11px] uppercase tracking-widest text-ccis-espresso/75">
                {user.college?.name ||
                  "College of Computing and Information Sciences"}
              </p>
              <h1 className="font-headline text-lg font-semibold text-ccis-ink">
                CCISLSG Digital Hub • AY 2026–2027
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Badge variant={authMode === "supabase" ? "orange" : "default"}>
              {authMode === "supabase" ? "Supabase PostgreSQL" : "Demo Store"}
            </Badge>
            <Badge variant="cream">{formatRoleLabel(user.role)}</Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={loadSnapshot}
              aria-label="Refresh hub data"
              title="Refresh data"
            >
              <RefreshCw
                className={`h-4 w-4 text-ccis-espresso ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5 text-ccis-orange" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Mobile Nav Strip */}
        <div className="flex gap-1.5 overflow-x-auto border-b border-ccis-ink/10 bg-ccis-cream/55 px-4 py-2.5 lg:hidden">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.key}
              type="button"
              size="sm"
              variant={activeTab === item.key ? "brand" : "outline"}
              onClick={() => setActiveTab(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-6 sm:p-8">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Welcome Banner */}
              <section className="relative overflow-hidden rounded-2xl border border-ccis-ink/20 bg-gradient-to-r from-ccis-primary via-ccis-primary/80 to-ccis-cream p-6 shadow-sm sm:p-8">
                <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-ccis-ink/15 bg-ccis-paper/85 px-3 py-1">
                      <Shield className="h-3.5 w-3.5 text-ccis-orange" />
                      <span className="font-subtext text-[11px] uppercase tracking-wider text-ccis-ink">
                        {formatRoleLabel(user.role)} •{" "}
                        {user.college?.code || "CCIS"}
                      </span>
                    </div>
                    <h2 className="font-display text-4xl leading-none tracking-tight text-ccis-ink sm:text-5xl">
                      Welcome back, {user.fullName.split(" ")[0]}.
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
                      {user.studentProfile?.city_name || "Update Profile"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Summary Metric Cards */}
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                      LSG &amp; accredited CCIS guilds
                    </p>
                  </CardContent>
                </Card>

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
            <ProfileTab user={user} onUserUpdated={(u) => setUser(u)} />
          )}
        </main>
      </div>
    </div>
  );
}
