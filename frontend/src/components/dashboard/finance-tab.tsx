"use client";

import * as React from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Users,
  Wallet,
  X,
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
  checkoutPaymentApi,
  createFeeItemApi,
  deleteFeeItemApi,
  formatCentavos,
  HubFeeItem,
  HubOrganization,
  HubPayment,
} from "@/lib/auth-api";

const PAYMENT_MODES = [
  { value: "PayMongo", label: "PayMongo (All Channels)" },
  { value: "PayMongo-GCash", label: "PayMongo • GCash" },
  { value: "PayMongo-Maya", label: "PayMongo • Maya" },
  { value: "PayMongo-QRPh", label: "PayMongo • QR Ph / Card" },
  { value: "Cash", label: "Cash / Council Office" },
] as const;

function formatPaymentModeFromRef(checkoutId: string | null): string {
  if (!checkoutId) return "PayMongo";
  if (checkoutId.includes("paymongogcash") || checkoutId.includes("gcash"))
    return "PayMongo • GCash";
  if (checkoutId.includes("paymongomaya") || checkoutId.includes("maya"))
    return "PayMongo • Maya";
  if (checkoutId.includes("paymongoqrph") || checkoutId.includes("qrph"))
    return "PayMongo • QR Ph";
  if (checkoutId.includes("cash")) return "Cash / Council Office";
  return "PayMongo";
}

interface FinanceTabProps {
  currentUserId: string;
  feeItems: HubFeeItem[];
  payments: HubPayment[];
  organizations: HubOrganization[];
  isStaff: boolean;
  onRefresh: () => Promise<void>;
}

export function FinanceTab({
  currentUserId,
  feeItems,
  payments,
  organizations,
  isStaff,
  onRefresh,
}: FinanceTabProps) {
  const [organizationId, setOrganizationId] = React.useState(
    organizations[0]?.id || ""
  );
  const [feeName, setFeeName] = React.useState("");
  const [amountPesos, setAmountPesos] = React.useState("");
  const [semester, setSemester] = React.useState("1st Semester");
  const [schoolYear, setSchoolYear] = React.useState("2026-2027");
  const [adminDefaultMode, setAdminDefaultMode] = React.useState("PayMongo");
  const [creatingFee, setCreatingFee] = React.useState(false);
  const [deletingFeeId, setDeletingFeeId] = React.useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = React.useState<string>("PayMongo");
  const [payingFeeId, setPayingFeeId] = React.useState<string | null>(null);
  const [selectedReceiptPayment, setSelectedReceiptPayment] =
    React.useState<HubPayment | null>(null);
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!organizationId && organizations[0]?.id) {
      setOrganizationId(organizations[0].id);
    }
  }, [organizations, organizationId]);

  const myPaidFeeIds = new Set(
    payments
      .filter((p) => p.user_id === currentUserId && p.status === "PAID")
      .map((p) => p.fee_item_id)
  );

  // Students only see fees they still need to pay; Admins see all posted fee items
  const displayedFees = isStaff
    ? feeItems
    : feeItems.filter((f) => !myPaidFeeIds.has(f.id));

  const selectedModeLabel =
    PAYMENT_MODES.find((m) => m.value === paymentMethod)?.label || "PayMongo";

  async function handleAddPayableFee(e: React.FormEvent) {
    e.preventDefault();
    if (!isStaff) return;
    setError(null);
    setFeedback(null);

    const parsedPesos = Number(amountPesos);
    if (Number.isNaN(parsedPesos) || parsedPesos < 1) {
      setError("Please enter a valid PHP amount (at least ₱1.00).");
      return;
    }

    setCreatingFee(true);
    try {
      await createFeeItemApi({
        organizationId,
        name: feeName,
        amountCentavos: Math.round(parsedPesos * 100),
        semester,
        schoolYear,
      });
      setFeeName("");
      setAmountPesos("");
      setFeedback(
        `Fee item added with ${adminDefaultMode} checkout enabled for eligible students.`
      );
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish fee.");
    } finally {
      setCreatingFee(false);
    }
  }

  async function handleDeleteFee(id: string) {
    if (!isStaff) return;
    setError(null);
    setFeedback(null);
    setDeletingFeeId(id);
    try {
      await deleteFeeItemApi(id);
      setFeedback("Fee item removed.");
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove fee item."
      );
    } finally {
      setDeletingFeeId(null);
    }
  }

  async function handlePayFee(feeItemId: string) {
    setError(null);
    setFeedback(null);
    setPayingFeeId(feeItemId);
    try {
      await checkoutPaymentApi(feeItemId, paymentMethod);
      setFeedback(
        `Payment completed via ${selectedModeLabel} and official digital receipt issued!`
      );
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPayingFeeId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            {isStaff
              ? "Manage Fees, PayMongo Payments & Receipts"
              : "My Payable Fees & PayMongo Checkout"}
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            {isStaff
              ? "Publish council or organization fee items with PayMongo mode of payment and track receipts."
              : "Select your preferred PayMongo mode of payment to settle assigned council and program fees."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="orange">PayMongo Enabled</Badge>
          <Badge variant="default">
            {isStaff
              ? `${displayedFees.length} Published Fees`
              : `${displayedFees.length} Fees Due`}
          </Badge>
          <Badge variant="cream">{payments.length} Receipts</Badge>
        </div>
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

      {selectedReceiptPayment?.receipt && (
        <Card className="border-ccis-orange bg-gradient-to-br from-ccis-paper via-ccis-cream/65 to-ccis-primary/35 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="orange">OFFICIAL DIGITAL RECEIPT</Badge>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedReceiptPayment(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="font-subtext text-lg">
              {selectedReceiptPayment.receipt.receipt_no}
            </CardTitle>
            <CardDescription>
              Issued by{" "}
              {selectedReceiptPayment.feeItem?.organizationName || "CCISLSG"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-4">
            <div>
              <p className="font-subtext uppercase text-ccis-espresso/70">
                Payor
              </p>
              <p className="font-medium text-ccis-ink">
                {selectedReceiptPayment.payer?.fullName} (
                {selectedReceiptPayment.payer?.studentNo ||
                  selectedReceiptPayment.payer?.email}
                )
              </p>
            </div>
            <div>
              <p className="font-subtext uppercase text-ccis-espresso/70">
                Fee Item &amp; Amount
              </p>
              <p className="font-medium text-ccis-ink">
                {selectedReceiptPayment.feeItem?.name} —{" "}
                {formatCentavos(selectedReceiptPayment.amount_centavos)}
              </p>
            </div>
            <div>
              <p className="font-subtext uppercase text-ccis-espresso/70">
                Mode of Payment
              </p>
              <p className="font-medium text-ccis-ink">
                {formatPaymentModeFromRef(
                  selectedReceiptPayment.paymongo_checkout_id
                )}
              </p>
            </div>
            <div>
              <p className="font-subtext uppercase text-ccis-espresso/70">
                PayMongo Reference
              </p>
              <p className="font-subtext text-ccis-ink">
                {selectedReceiptPayment.paymongo_payment_id ||
                  selectedReceiptPayment.paymongo_checkout_id}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ADMIN / OFFICER ONLY: Add Fee Payment Card (6-field layout including Mode of Payment) */}
      {isStaff && (
        <Card className="bg-ccis-paper">
          <CardHeader className="pb-3">
            <CardDescription>ADMIN / OFFICER FEE MANAGEMENT</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-4 w-4 text-ccis-orange" />
              Add Fee Payment Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPayableFee} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="fee-org">Organization</Label>
                  <select
                    id="fee-org"
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink focus:outline-none focus:ring-2 focus:ring-ccis-orange"
                  >
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fee-name">Fee Purpose / Description</Label>
                  <Input
                    id="fee-name"
                    placeholder="e.g. Membership Fee, College Shirt, Council Fee"
                    value={feeName}
                    onChange={(e) => setFeeName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fee-amount">Amount (PHP)</Label>
                  <Input
                    id="fee-amount"
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="e.g. 150.00"
                    value={amountPesos}
                    onChange={(e) => setAmountPesos(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fee-sem">Semester</Label>
                  <select
                    id="fee-sem"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink focus:outline-none focus:ring-2 focus:ring-ccis-orange"
                  >
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fee-sy">School Year</Label>
                  <Input
                    id="fee-sy"
                    value={schoolYear}
                    onChange={(e) => setSchoolYear(e.target.value)}
                    placeholder="2026-2027"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="fee-mode">Mode of Payment</Label>
                  <select
                    id="fee-mode"
                    value={adminDefaultMode}
                    onChange={(e) => setAdminDefaultMode(e.target.value)}
                    className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink focus:outline-none focus:ring-2 focus:ring-ccis-orange"
                  >
                    {PAYMENT_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="brand" disabled={creatingFee}>
                  {creatingFee ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Fee Payment
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* STUDENT MODE OF PAYMENT SELECTOR BAR (Always visible in Student Interface) */}
      {!isStaff && (
        <Card className="border-ccis-ink/15 bg-gradient-to-r from-ccis-paper via-ccis-cream/50 to-ccis-primary/25">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-2.5">
              <Wallet className="h-5 w-5 text-ccis-orange" />
              <div>
                <p className="font-headline text-sm font-semibold text-ccis-ink">
                  Mode of Payment (PayMongo Gateway)
                </p>
                <p className="font-subtext text-[11px] text-ccis-espresso/80">
                  Choose your payment channel before settling an assigned fee below.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {PAYMENT_MODES.map((mode) => (
                <Button
                  key={mode.value}
                  type="button"
                  size="sm"
                  variant={paymentMethod === mode.value ? "brand" : "outline"}
                  onClick={() => setPaymentMethod(mode.value)}
                >
                  {mode.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fees List: Students see ONLY unpaid fees assigned to them; Admins see all published fees */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-headline text-base font-semibold text-ccis-ink">
            {isStaff ? "Published Fee Items" : "Fees You Need to Pay"}
          </h3>
          <span className="inline-flex items-center gap-1 font-subtext text-xs text-ccis-espresso/80">
            <ShieldCheck className="h-3.5 w-3.5 text-ccis-orange" />
            {isStaff
              ? "PayMongo Checkout Active"
              : `Selected Mode: ${selectedModeLabel}`}
          </span>
        </div>

        {displayedFees.length === 0 ? (
          <Card className="border-dashed border-ccis-ink/20 bg-ccis-paper/75">
            <CardContent className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
              {!isStaff && payments.length > 0 && (
                <CheckCircle2 className="h-5 w-5 text-ccis-orange" />
              )}
              <p className="font-headline text-sm text-ccis-espresso/80">
                {isStaff
                  ? "No fee items published yet. Use 'Add Fee Payment Item' above to assign fees to students."
                  : payments.length > 0
                    ? "All assigned fees have been paid! View your official PayMongo receipts below."
                    : "You currently have no unpaid fees due."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {displayedFees.map((fee) => (
              <Card
                key={fee.id}
                className="flex flex-col justify-between bg-ccis-paper"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="cream">
                      {fee.semester} • {fee.school_year}
                    </Badge>
                    {isStaff ? (
                      <div className="flex items-center gap-1.5">
                        <Badge variant="default">
                          <Users className="mr-1 h-3 w-3" />
                          {fee.paidCount ?? 0} Paid
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={deletingFeeId === fee.id}
                          onClick={() => handleDeleteFee(fee.id)}
                          title="Remove fee item"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-ccis-orange" />
                        </Button>
                      </div>
                    ) : (
                      <Badge variant="orange">Unpaid</Badge>
                    )}
                  </div>
                  <CardTitle className="pt-2 text-base">{fee.name}</CardTitle>
                  <CardDescription>
                    {fee.organization?.name || "Local Student Government"}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="font-display text-3xl text-ccis-ink">
                    {formatCentavos(fee.amount_centavos)}
                  </p>
                  {isStaff ? (
                    <p className="font-subtext text-[11px] text-ccis-espresso/75">
                      Mode: PayMongo (GCash / Maya / QR Ph / Cash)
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant="brand"
                      size="sm"
                      className="w-full"
                      disabled={payingFeeId === fee.id}
                      onClick={() => handlePayFee(fee.id)}
                    >
                      {payingFeeId === fee.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="h-4 w-4" />
                      )}
                      Pay via {selectedModeLabel}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Paid Receipts / Transactions Ledger */}
      <Card className="bg-ccis-paper">
        <CardHeader className="pb-3">
          <CardDescription>
            {isStaff
              ? "ALL CONSTITUENT PAYMENTS & PAYMONGO RECEIPTS"
              : "MY PAID FEES & OFFICIAL PAYMONGO RECEIPTS"}
          </CardDescription>
          <CardTitle className="text-lg">
            {isStaff ? "Recorded Transactions" : "Payment History"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />
          {payments.length === 0 ? (
            <p className="py-6 text-center font-headline text-sm text-ccis-espresso/75">
              No completed payments recorded yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-ccis-ink/15 bg-ccis-cream/35 px-4 py-3"
                >
                  <div className="space-y-0.5">
                    <p className="font-headline text-sm font-medium text-ccis-ink">
                      {p.feeItem?.name || "Council Fee"} •{" "}
                      <span className="font-semibold">
                        {formatCentavos(p.amount_centavos)}
                      </span>
                    </p>
                    <p className="font-subtext text-[11px] text-ccis-espresso/80">
                      {p.feeItem?.organizationName || "CCISLSG"} •{" "}
                      {p.payer?.fullName} (
                      {p.payer?.studentNo || p.payer?.email}) •{" "}
                      {formatPaymentModeFromRef(p.paymongo_checkout_id)} • Ref:{" "}
                      {p.paymongo_payment_id || p.paymongo_checkout_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "PAID" ? "default" : "cream"}>
                      {p.status}
                    </Badge>
                    {p.receipt && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceiptPayment(p)}
                      >
                        <Receipt className="h-3.5 w-3.5 text-ccis-orange" />
                        {p.receipt.receipt_no}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
