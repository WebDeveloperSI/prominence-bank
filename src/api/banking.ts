import { supabase } from "@/integrations/supabase/client";

export type Account = {
  id: string; owner_id: string; account_number: string; nickname: string;
  currency: string; status: "active" | "frozen" | "closed";
  available_cents: number; held_cents: number; created_at: string;
};
export type Beneficiary = {
  id: string; owner_id: string; name: string; bank_name: string;
  iban: string; swift: string; country: string; created_at: string;
};
export type TxnStatus =
  | "draft" | "awaiting_otp" | "awaiting_approval" | "approved"
  | "rejected" | "settled" | "failed" | "cancelled";
export type TxnKind =
  | "internal_transfer" | "external_wire" | "withdrawal" | "deposit" | "fee" | "adjustment" | "loan_disbursement";
export type Transaction = {
  id: string; reference: string; kind: TxnKind; status: TxnStatus;
  initiator_id: string; from_account_id: string; to_account_id: string | null;
  beneficiary_id: string | null; amount_cents: number; currency: string;
  memo: string | null; approved_by: string | null; approved_at: string | null;
  rejected_reason: string | null; created_at: string; updated_at: string;
};
export type AuditEntry = {
  id: string; actor_id: string | null; actor_role: string | null;
  action: string; entity: string; entity_id: string | null;
  meta: Record<string, unknown>; created_at: string;
};
export type LedgerEntry = {
  id: string; transaction_id: string; account_id: string;
  direction: "debit" | "credit"; amount_cents: number;
  balance_after_cents: number; posted_at: string;
};

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ---------------- Accounts & Beneficiaries ---------------- */

export async function listAccounts(): Promise<Account[]> {
  const r = await supabase.from("accounts").select("*").order("created_at", { ascending: true });
  return unwrap(r) ?? [];
}
export async function listBeneficiaries(): Promise<Beneficiary[]> {
  const r = await supabase.from("beneficiaries").select("*").order("created_at", { ascending: false });
  return unwrap(r) ?? [];
}
export async function addBeneficiary(input: Omit<Beneficiary, "id" | "created_at" | "owner_id">) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const r = await supabase.from("beneficiaries").insert({ ...input, owner_id: u.user.id }).select().single();
  return unwrap(r);
}
export async function deleteBeneficiary(id: string) {
  const r = await supabase.from("beneficiaries").delete().eq("id", id);
  if (r.error) throw new Error(r.error.message);
}

/* ---------------- Transactions ---------------- */

export async function listTransactions(): Promise<Transaction[]> {
  const r = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(50);
  return unwrap(r) ?? [];
}
export async function listPendingApprovals(): Promise<Transaction[]> {
  const r = await supabase
    .from("transactions")
    .select("*")
    .in("status", ["awaiting_approval", "awaiting_otp"])
    .order("created_at", { ascending: false });
  return unwrap(r) ?? [];
}
export async function listLedgerForAccount(accountId: string): Promise<LedgerEntry[]> {
  const r = await supabase.from("ledger_entries").select("*")
    .eq("account_id", accountId).order("posted_at", { ascending: false }).limit(20);
  return (unwrap(r) ?? []) as LedgerEntry[];
}

/* ---------------- RPC wrappers ---------------- */

export async function submitTransfer(input: {
  fromAccountId: string;
  kind: TxnKind;
  amountCents: number;
  toAccountId?: string | null;
  beneficiaryId?: string | null;
  memo?: string | null;
}): Promise<Transaction> {
  const r = await supabase.rpc("submit_transfer", {
    _from_account: input.fromAccountId,
    _kind: input.kind,
    _amount_cents: input.amountCents,
    _to_account: input.toAccountId ?? undefined,
    _beneficiary: input.beneficiaryId ?? undefined,
    _memo: input.memo ?? undefined,
  });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as Transaction;
}

export async function issueOtp(purpose: "login" | "transfer" | "sensitive", refId?: string): Promise<{ id: string; code: string; expires_at: string }> {
  const r = await supabase.rpc("issue_otp", { _purpose: purpose, _ref: refId ?? undefined });
  if (r.error) throw new Error(r.error.message);
  // returns table -> array
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  return row as { id: string; code: string; expires_at: string };
}

export async function confirmTransferOtp(txnId: string, otpId: string, code: string): Promise<Transaction> {
  const r = await supabase.rpc("confirm_transfer_otp", { _txn: txnId, _otp_id: otpId, _code: code });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as Transaction;
}

export async function approveTransfer(id: string): Promise<Transaction> {
  const r = await supabase.rpc("approve_transfer", { _txn: id });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as Transaction;
}
export async function rejectTransfer(id: string, reason: string): Promise<Transaction> {
  const r = await supabase.rpc("reject_transfer", { _txn: id, _reason: reason });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as Transaction;
}

export async function cancelTransfer(id: string): Promise<Transaction> {
  const r = await supabase.rpc("cancel_transfer", { _txn: id });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as Transaction;
}

/* ---------------- Audit ---------------- */

export async function listAuditLog(limit = 50): Promise<AuditEntry[]> {
  const r = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  return (unwrap(r) ?? []) as unknown as AuditEntry[];
}

/* ---------------- Admin: deposits / holds ---------------- */

export async function adminListAllAccounts() {
  const r = await supabase.from("accounts").select("*").order("created_at", { ascending: true });
  return unwrap(r) ?? [];
}
export async function adminListProfiles() {
  const r = await supabase.from("profiles").select("id, full_name").order("full_name");
  return unwrap(r) ?? [];
}
export async function adminCreditAccount(accountId: string, amountCents: number, memo?: string) {
  const r = await supabase.rpc("admin_credit_account", { _account: accountId, _amount_cents: amountCents, _memo: memo ?? undefined });
  if (r.error) throw new Error(r.error.message);
  return r.data;
}
export async function adminPlaceHold(accountId: string, amountCents: number, memo?: string) {
  const r = await supabase.rpc("admin_place_hold", { _account: accountId, _amount_cents: amountCents, _memo: memo ?? undefined });
  if (r.error) throw new Error(r.error.message);
  return r.data;
}
export async function adminReleaseHold(accountId: string, amountCents: number, memo?: string) {
  const r = await supabase.rpc("admin_release_hold", { _account: accountId, _amount_cents: amountCents, _memo: memo ?? undefined });
  if (r.error) throw new Error(r.error.message);
  return r.data;
}

/* ---------------- Loans ---------------- */
export type LoanStatus = "pending" | "approved" | "rejected" | "disbursed" | "closed";
export type LoanApplication = {
  id: string; applicant_id: string; account_id: string; purpose: string;
  amount_cents: number; term_months: number; interest_rate: number;
  status: LoanStatus; notes: string | null; decided_by: string | null; decided_at: string | null;
  created_at: string; updated_at: string;
};
export async function listMyLoans(): Promise<LoanApplication[]> {
  const r = await supabase.from("loan_applications").select("*").order("created_at",{ascending:false});
  return (unwrap(r) ?? []) as LoanApplication[];
}
export async function listAllLoans(): Promise<LoanApplication[]> {
  return listMyLoans();
}
export async function submitLoanApplication(input: { accountId: string; amountCents: number; termMonths: number; purpose: string; rate?: number }) {
  const r = await supabase.rpc("submit_loan_application", {
    _account: input.accountId, _amount_cents: input.amountCents,
    _term_months: input.termMonths, _purpose: input.purpose, _rate: input.rate ?? 6.20,
  });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as LoanApplication;
}
export async function adminDecideLoan(loanId: string, approve: boolean, notes?: string) {
  const r = await supabase.rpc("admin_decide_loan", { _loan: loanId, _approve: approve, _notes: notes ?? undefined });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as LoanApplication;
}
export async function adminDisburseLoan(loanId: string) {
  const r = await supabase.rpc("admin_disburse_loan", { _loan: loanId });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as LoanApplication;
}

/* ---------------- Instruments ---------------- */
export type InstrumentStatus = "pending" | "active" | "expired" | "cancelled";
export type BankInstrument = {
  id: string; reference: string; owner_id: string; code: string; beneficiary: string;
  face_value_cents: number; currency: string; issue_date: string; expiry_date: string | null;
  status: InstrumentStatus; notes: string | null; issued_by: string | null;
  created_at: string; updated_at: string;
};
export async function listInstruments(): Promise<BankInstrument[]> {
  const r = await supabase.from("bank_instruments").select("*").order("created_at",{ascending:false});
  return (unwrap(r) ?? []) as BankInstrument[];
}
export async function adminIssueInstrument(input: {
  ownerId: string; code: string; beneficiary: string; faceValueCents: number;
  currency?: string; expiry?: string | null; notes?: string | null;
}) {
  const r = await supabase.rpc("admin_issue_instrument", {
    _owner: input.ownerId, _code: input.code, _beneficiary: input.beneficiary,
    _face_value_cents: input.faceValueCents, _currency: input.currency ?? "USD",
    _expiry: input.expiry ?? undefined, _notes: input.notes ?? undefined,
  });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as BankInstrument;
}

/* ---------------- Support ---------------- */
export type TicketStatus = "open" | "in_progress" | "awaiting_client" | "resolved" | "closed";
export type SupportTicket = {
  id: string; reference: string; owner_id: string; subject: string; body: string;
  category: string; priority: string; status: TicketStatus;
  created_at: string; updated_at: string;
};
export type SupportMessage = {
  id: string; ticket_id: string; author_id: string; author_role: string;
  body: string; created_at: string;
};
export async function listTickets(): Promise<SupportTicket[]> {
  const r = await supabase.from("support_tickets").select("*").order("updated_at",{ascending:false});
  return (unwrap(r) ?? []) as SupportTicket[];
}
export async function listTicketMessages(ticketId: string): Promise<SupportMessage[]> {
  const r = await supabase.from("support_messages").select("*").eq("ticket_id", ticketId).order("created_at",{ascending:true});
  return (unwrap(r) ?? []) as SupportMessage[];
}
export async function submitSupportTicket(input: { subject: string; body: string; category?: string; priority?: string }) {
  const r = await supabase.rpc("submit_support_ticket", {
    _subject: input.subject, _body: input.body,
    _category: input.category ?? "general", _priority: input.priority ?? "normal",
  });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as SupportTicket;
}
export async function postSupportMessage(ticketId: string, body: string) {
  const r = await supabase.rpc("post_support_message", { _ticket: ticketId, _body: body });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as SupportMessage;
}
export async function adminUpdateTicketStatus(ticketId: string, status: TicketStatus) {
  const r = await supabase.rpc("admin_update_ticket_status", { _ticket: ticketId, _status: status });
  if (r.error) throw new Error(r.error.message);
  return r.data as unknown as SupportTicket;
}