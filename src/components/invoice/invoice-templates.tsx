"use client";

import { useRef } from "react";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  bookingRef: string;
  serviceDate: string;
  serviceTime: string;
  serviceType: string;
  serviceAddress: string;
  durationHours: number;

  // Customer info
  customerName: string;
  customerEmail: string;

  // Provider info
  providerName: string;
  providerEmail?: string;
  providerAddress?: string;
  providerVat?: string;

  // Financials (all in GBP)
  providerServiceAmount: number;
  platformBookingFee: number;
  platformCommissionAmount: number;
  platformMarkupAmount: number;
  optionalExtrasAmount: number;
  customerTotalAmount: number;
  providerExpectedPayout: number;

  // Booking status
  bookingStatus: string;
  paymentStatus?: string;
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function money(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Customer Receipt
// ---------------------------------------------------------------------------

export function CustomerInvoice({ data }: { data: InvoiceData }) {
  const printRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={printRef} className="invoice-document">
      <InvoiceHeader
        title="Receipt"
        invoiceNumber={data.invoiceNumber}
        invoiceDate={data.invoiceDate}
      />

      <div className="invoice-parties">
        <div>
          <p className="invoice-label">From</p>
          <p className="invoice-value">AreaSorted</p>
          <p className="invoice-muted">London, United Kingdom</p>
        </div>
        <div>
          <p className="invoice-label">To</p>
          <p className="invoice-value">{data.customerName}</p>
          <p className="invoice-muted">{data.customerEmail}</p>
        </div>
      </div>

      <ServiceSummary data={data} />

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="invoice-text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Service — {data.serviceType}</td>
            <td className="invoice-text-right">{money(data.providerServiceAmount)}</td>
          </tr>
          {data.optionalExtrasAmount > 0 && (
            <tr>
              <td>Optional extras</td>
              <td className="invoice-text-right">{money(data.optionalExtrasAmount)}</td>
            </tr>
          )}
          <tr>
            <td>Booking fee</td>
            <td className="invoice-text-right">{money(data.platformBookingFee)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="invoice-total-row">
            <td>Total paid</td>
            <td className="invoice-text-right">{money(data.customerTotalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <InvoiceFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Provider Remittance Advice
// ---------------------------------------------------------------------------

export function ProviderInvoice({ data }: { data: InvoiceData }) {
  return (
    <div className="invoice-document">
      <InvoiceHeader
        title="Remittance Advice"
        invoiceNumber={data.invoiceNumber}
        invoiceDate={data.invoiceDate}
      />

      <div className="invoice-parties">
        <div>
          <p className="invoice-label">From</p>
          <p className="invoice-value">AreaSorted</p>
          <p className="invoice-muted">London, United Kingdom</p>
        </div>
        <div>
          <p className="invoice-label">To</p>
          <p className="invoice-value">{data.providerName}</p>
          {data.providerEmail && <p className="invoice-muted">{data.providerEmail}</p>}
          {data.providerAddress && <p className="invoice-muted">{data.providerAddress}</p>}
          {data.providerVat && <p className="invoice-muted">VAT: {data.providerVat}</p>}
        </div>
      </div>

      <ServiceSummary data={data} />

      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="invoice-text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Service amount — {data.serviceType}</td>
            <td className="invoice-text-right">{money(data.providerServiceAmount)}</td>
          </tr>
          <tr className="invoice-deduction-row">
            <td>Platform commission</td>
            <td className="invoice-text-right">-{money(data.platformCommissionAmount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="invoice-total-row">
            <td>Your payout</td>
            <td className="invoice-text-right">{money(data.providerExpectedPayout)}</td>
          </tr>
        </tfoot>
      </table>

      <div className="invoice-note">
        <p>
          <strong>Note:</strong> Payout will be processed to your connected Stripe account
          within 2-5 business days of job completion.
        </p>
      </div>

      <InvoiceFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Reconciliation View
// ---------------------------------------------------------------------------

export function AdminInvoice({ data }: { data: InvoiceData }) {
  const platformRevenue = data.platformBookingFee + data.platformCommissionAmount + data.platformMarkupAmount;

  return (
    <div className="invoice-document">
      <InvoiceHeader
        title="Booking Reconciliation"
        invoiceNumber={data.invoiceNumber}
        invoiceDate={data.invoiceDate}
      />

      <div className="invoice-parties">
        <div>
          <p className="invoice-label">Customer</p>
          <p className="invoice-value">{data.customerName}</p>
          <p className="invoice-muted">{data.customerEmail}</p>
        </div>
        <div>
          <p className="invoice-label">Provider</p>
          <p className="invoice-value">{data.providerName}</p>
          {data.providerEmail && <p className="invoice-muted">{data.providerEmail}</p>}
        </div>
      </div>

      <ServiceSummary data={data} />

      {/* Customer side */}
      <h3 className="invoice-section-title">Customer charges</h3>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="invoice-text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Service — {data.serviceType}</td>
            <td className="invoice-text-right">{money(data.providerServiceAmount)}</td>
          </tr>
          {data.optionalExtrasAmount > 0 && (
            <tr>
              <td>Optional extras</td>
              <td className="invoice-text-right">{money(data.optionalExtrasAmount)}</td>
            </tr>
          )}
          <tr>
            <td>Booking fee</td>
            <td className="invoice-text-right">{money(data.platformBookingFee)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="invoice-total-row">
            <td>Customer total</td>
            <td className="invoice-text-right">{money(data.customerTotalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Provider side */}
      <h3 className="invoice-section-title">Provider settlement</h3>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="invoice-text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Service amount</td>
            <td className="invoice-text-right">{money(data.providerServiceAmount)}</td>
          </tr>
          <tr className="invoice-deduction-row">
            <td>Platform commission</td>
            <td className="invoice-text-right">-{money(data.platformCommissionAmount)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="invoice-total-row">
            <td>Provider payout</td>
            <td className="invoice-text-right">{money(data.providerExpectedPayout)}</td>
          </tr>
        </tfoot>
      </table>

      {/* Platform revenue */}
      <h3 className="invoice-section-title">Platform revenue</h3>
      <table className="invoice-table">
        <thead>
          <tr>
            <th>Source</th>
            <th className="invoice-text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Booking fee</td>
            <td className="invoice-text-right">{money(data.platformBookingFee)}</td>
          </tr>
          <tr>
            <td>Commission</td>
            <td className="invoice-text-right">{money(data.platformCommissionAmount)}</td>
          </tr>
          {data.platformMarkupAmount > 0 && (
            <tr>
              <td>Markup</td>
              <td className="invoice-text-right">{money(data.platformMarkupAmount)}</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="invoice-total-row">
            <td>Total platform revenue</td>
            <td className="invoice-text-right">{money(platformRevenue)}</td>
          </tr>
        </tfoot>
      </table>

      <InvoiceFooter />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Print / Download button
// ---------------------------------------------------------------------------

export function InvoicePrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="invoice-print-btn no-print"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="inline-block mr-1.5"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      Print / Save as PDF
    </button>
  );
}

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function InvoiceHeader({
  title,
  invoiceNumber,
  invoiceDate,
}: {
  title: string;
  invoiceNumber: string;
  invoiceDate: string;
}) {
  return (
    <div className="invoice-header">
      <div>
        <h1 className="invoice-brand">AreaSorted</h1>
        <p className="invoice-title">{title}</p>
      </div>
      <div className="invoice-header-meta">
        <p>
          <span className="invoice-label">Invoice #</span>{" "}
          <span className="invoice-value">{invoiceNumber}</span>
        </p>
        <p>
          <span className="invoice-label">Date</span>{" "}
          <span className="invoice-value">{invoiceDate}</span>
        </p>
      </div>
    </div>
  );
}

function ServiceSummary({ data }: { data: InvoiceData }) {
  return (
    <div className="invoice-service-summary">
      <div className="invoice-service-grid">
        <div>
          <p className="invoice-label">Booking Ref</p>
          <p className="invoice-value">{data.bookingRef}</p>
        </div>
        <div>
          <p className="invoice-label">Service</p>
          <p className="invoice-value">{data.serviceType}</p>
        </div>
        <div>
          <p className="invoice-label">Date &amp; Time</p>
          <p className="invoice-value">
            {data.serviceDate} at {data.serviceTime}
          </p>
        </div>
        <div>
          <p className="invoice-label">Duration</p>
          <p className="invoice-value">{data.durationHours} hours</p>
        </div>
        <div className="invoice-service-address">
          <p className="invoice-label">Address</p>
          <p className="invoice-value">{data.serviceAddress}</p>
        </div>
      </div>
    </div>
  );
}

function InvoiceFooter() {
  return (
    <div className="invoice-footer">
      <p>AreaSorted &mdash; London, United Kingdom</p>
      <p>This is a computer-generated document and does not require a signature.</p>
    </div>
  );
}
