"use client";

import * as React from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  Receipt,
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
  formatCentavos,
  HubFeeItem,
  HubOrganization,
  HubPayment,
} from "@/lib/auth-api";

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
  const [amountPesos, setAmountPesos] = React.useState("150");
  const [semester, setSemester] = React.useState("1st Semester");
  const [schoolYear, setSchoolYear] = React.useState("2026-2027");
  const [creatingFee, setCreatingFee] = React.useState(false);

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

  async function handleCreateFee(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    const parsedPesos = Number(amountPesos);
    if (Number.isNaN(parsedPesos) || parsedPesos < 1) {
      setError("Enter a valid PHP amount (at least ₱1.00).");
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
      setFeedback("New fee item published to fee_items.");
      await onRefresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create fee item."
      );
    } finally {
      setCreatingFee(false);
    }
  }

  async function handlePayMongoCheckout(feeItemId: string) {
    setError(null);
    setFeedback(null);
    setPayingFeeId(feeItemId);
    try {
      await checkoutPaymentApi(feeItemId);
      setFeedback(
        "PayMongo payment confirmed and official digital receipt issued!"
      );
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setPayingFeeId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-ccis-ink">
            Fees, PayMongo Payments &amp; Official Receipts
          </h2>
          <p className="font-headline text-sm text-ccis-espresso/85">
            Semesterly council fees (`fee_items`), PayMongo settlements (`payments`), and digital receipts (`receipts`).
          </p>
        </div>
        <Badge variant="cream">{feeItems.length} Active Fee Items</Badge>
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
              Issued by {selectedReceiptPayment.feeItem?.organizationName || "CCISLSG"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
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

      {isStaff && (
        <Card className="bg-ccis-paper">
          <CardHeader className="pb-3">
            <CardDescription>FEE_ITEMS TABLE</CardDescription>
            <CardTitle className="text-lg">Create Semester Fee Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleCreateFee}
              className="grid grid-cols-1 gap-3 sm:grid-cols-5"
            >
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="fee-name">Fee Name</Label>
                <Input
                  id="fee-name"
                  placeholder="e.g. 2nd Sem Council Fee"
                  value={feeName}
                  onChange={(e) => setFeeName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fee-org">Organization</Label>
                <select
                  id="fee-org"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-ccis-ink/20 bg-white/90 px-3 text-sm text-ccis-ink"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.type === "LSG" ? "CCISLSG" : org.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fee-amount">Amount (PHP)</Label>
                <Input
                  id="fee-amount"
                  type="number"
                  min={1}
                  step="0.01"
                  value={amountPesos}
                  onChange={(e) => setAmountPesos(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fee-sem">Term</Label>
                <div className="flex gap-2">
                  <Input
                    id="fee-sem"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    placeholder="1st Semester"
                    required
                  />
                  <Button type="submit" variant="brand" disabled={creatingFee}>
                    {creatingFee ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <input
                  type="hidden"
                  value={schoolYear}
                  onChange={(e) => setSchoolYear(e.target.value)}
                />
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {feeItems.map((fee) => {
          const isPaid = myPaidFeeIds.has(fee.id);
          return (
            <Card
              key={fee.id}
              className="flex flex-col justify-between bg-ccis-paper"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="cream">
                    {fee.semester} • {fee.school_year}
                  </Badge>
                  {isPaid && (
                    <Badge variant="default">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Settled
                    </Badge>
                  )}
                </div>
                <CardTitle className="pt-2 text-base">{fee.name}</CardTitle>
                <CardDescription>
                  {fee.organization?.name || "CCISLSG"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-display text-3xl text-ccis-ink">
                  {formatCentavos(fee.amount_centavos)}
                </p>
                <Button
                  type="button"
                  variant={isPaid ? "outline" : "brand"}
                  size="sm"
                  className="w-full"
                  disabled={isPaid || payingFeeId === fee.id}
                  onClick={() => handlePayMongoCheckout(fee.id)}
                >
                  {payingFeeId === fee.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  {isPaid ? "Paid via PayMongo" : "Pay via PayMongo"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-ccis-paper">
        <CardHeader className="pb-3">
          <CardDescription>PAYMENTS &amp; RECEIPTS LEDGER</CardDescription>
          <CardTitle className="text-lg">Recorded Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Separator />
          {payments.length === 0 ? (
            <p className="py-6 text-center font-headline text-sm text-ccis-espresso/75">
              No payment transactions recorded yet.
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
                      {p.payer?.fullName} ({p.payer?.studentNo || p.payer?.email}
                      ) • Ref: {p.paymongo_payment_id || p.paymongo_checkout_id}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={p.status === "PAID" ? "default" : "cream"}
                    >
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
