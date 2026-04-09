"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Receipt,
  Shield,
  Calendar,
  Pencil,
  X,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { providerCommitmentOptions, providerContactChannelOptions, providerLanguageOptions, providerResponseTimeOptions } from "@/lib/providers/public-profile-metadata";

type EditableProfileFormProps = {
  tradingName: string;
  profileImageUrl: string;
  profileImageType: string;
  headline: string;
  bio: string;
  yearsExperience: string;
  contactEmail: string;
  phone: string;
  registeredAddress: string;
  companyNumber: string;
  vatNumber: string;
  supportedContactChannels: string;
  contactDetails: Partial<Record<"WhatsApp" | "SMS" | "Phone" | "Telegram" | "Email", string>>;
  responseTimeLabel: string;
  serviceCommitments: string;
  languagesSpoken: string;
  legalName: string;
  memberSince: string | null;
  approvedAt: string | null;
  updateAction: (formData: FormData) => Promise<void>;
};

export function EditableProfileForm({
  tradingName,
  profileImageUrl,
  profileImageType,
  headline,
  bio,
  yearsExperience,
  contactEmail,
  phone,
  registeredAddress,
  companyNumber,
  vatNumber,
  supportedContactChannels,
  contactDetails,
  responseTimeLabel,
  serviceCommitments,
  languagesSpoken,
  legalName,
  memberSince,
  approvedAt,
  updateAction,
}: EditableProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [editTradingName, setEditTradingName] = useState(tradingName);
  const [editProfileImageUrl, setEditProfileImageUrl] = useState(profileImageUrl);
  const [editProfileImageType, setEditProfileImageType] = useState(profileImageType || "logo");
  const [editHeadline, setEditHeadline] = useState(headline);
  const [editBio, setEditBio] = useState(bio);
  const [editYearsExperience, setEditYearsExperience] = useState(yearsExperience);
  const [editPhone, setEditPhone] = useState(phone);
  const [editAddress, setEditAddress] = useState(registeredAddress);
  const [editVat, setEditVat] = useState(vatNumber);
  const [editSupportedContactChannels, setEditSupportedContactChannels] = useState<string[]>(supportedContactChannels.split(", ").filter(Boolean));
  const [editContactDetails, setEditContactDetails] = useState(contactDetails);
  const [editResponseTimeLabel, setEditResponseTimeLabel] = useState(responseTimeLabel);
  const [editServiceCommitments, setEditServiceCommitments] = useState<string[]>(serviceCommitments.split(", ").filter(Boolean));
  const [editLanguagesSpoken, setEditLanguagesSpoken] = useState<string[]>(languagesSpoken.split(", ").filter(Boolean));

  function handleCancel() {
    setEditTradingName(tradingName);
    setEditProfileImageUrl(profileImageUrl);
    setEditProfileImageType(profileImageType || "logo");
    setEditHeadline(headline);
    setEditBio(bio);
    setEditYearsExperience(yearsExperience);
    setEditPhone(phone);
    setEditAddress(registeredAddress);
    setEditVat(vatNumber);
    setEditSupportedContactChannels(supportedContactChannels.split(", ").filter(Boolean));
    setEditContactDetails(contactDetails);
    setEditResponseTimeLabel(responseTimeLabel);
    setEditServiceCommitments(serviceCommitments.split(", ").filter(Boolean));
    setEditLanguagesSpoken(languagesSpoken.split(", ").filter(Boolean));
    setIsEditing(false);
    setError(null);
  }

  function handleSave() {
    if (!editTradingName.trim()) {
      setError("Trading name is required");
      return;
    }

    setError(null);
    const fd = new FormData();
    fd.set("tradingName", editTradingName.trim());
    fd.set("profileImageUrl", editProfileImageUrl.trim());
    fd.set("profileImageType", editProfileImageType.trim());
    fd.set("headline", editHeadline.trim());
    fd.set("bio", editBio.trim());
    fd.set("yearsExperience", editYearsExperience.trim());
    fd.set("phone", editPhone.trim());
    fd.set("registeredAddress", editAddress.trim());
    fd.set("vatNumber", editVat.trim());
    editSupportedContactChannels.forEach((value) => fd.append("supportedContactChannels", value));
    fd.set("responseTimeLabel", editResponseTimeLabel.trim());
    editServiceCommitments.forEach((value) => fd.append("serviceCommitments", value));
    editLanguagesSpoken.forEach((value) => fd.append("languagesSpoken", value));
    fd.set("whatsappContact", editContactDetails.WhatsApp || "");
    fd.set("smsContact", editContactDetails.SMS || "");
    fd.set("phoneContact", editContactDetails.Phone || "");
    fd.set("telegramContact", editContactDetails.Telegram || "");
    fd.set("emailContact", editContactDetails.Email || "");

    startTransition(async () => {
      try {
        await updateAction(fd);
        setIsEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 4000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Company Details</h2>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <Check className="size-3" />
              Saved
            </span>
          )}
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleCancel}
                disabled={isPending}
              >
                <X className="size-3.5" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white gap-1.5 text-xs"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                {isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Fields */}
      <div className="p-4 space-y-4">
        <FieldRow icon={<Building2 className="size-4" />} label="Profile image URL" value={editProfileImageUrl} editing={isEditing} onChange={setEditProfileImageUrl} placeholder="https://..." />
        <FieldRow icon={<Building2 className="size-4" />} label="Image type" value={editProfileImageType} editing={isEditing} onChange={setEditProfileImageType} placeholder="logo or person" />
        <FieldRow icon={<Building2 className="size-4" />} label="Headline" value={editHeadline} editing={isEditing} onChange={setEditHeadline} placeholder="Short public headline" />
        <FieldRow icon={<Building2 className="size-4" />} label="Bio" value={editBio} editing={isEditing} onChange={setEditBio} placeholder="Short public description" />
        <FieldRow icon={<Building2 className="size-4" />} label="Years of experience" value={editYearsExperience} editing={isEditing} onChange={setEditYearsExperience} placeholder="e.g. 5" />
        {/* Trading name — editable */}
        <FieldRow
          icon={<Building2 className="size-4" />}
          label="Trading name"
          value={editTradingName}
          editing={isEditing}
          onChange={setEditTradingName}
          required
        />

        {/* Legal name — read-only */}
        <FieldRow
          icon={<Shield className="size-4" />}
          label="Legal name"
          value={legalName || "Not set"}
          editing={false}
          readOnlyHint="Contact admin to change"
        />

        {/* Email — read-only */}
        <FieldRow
          icon={<Mail className="size-4" />}
          label="Email"
          value={contactEmail}
          editing={false}
          readOnlyHint="Contact admin to change"
        />

        {/* Phone — editable */}
        <FieldRow
          icon={<Phone className="size-4" />}
          label="Phone"
          value={editPhone}
          editing={isEditing}
          onChange={setEditPhone}
          placeholder="e.g. 07700 900123"
        />

        {/* Address — editable */}
        <FieldRow
          icon={<MapPin className="size-4" />}
          label="Registered address"
          value={editAddress}
          editing={isEditing}
          onChange={setEditAddress}
          placeholder="Enter your business address"
        />

        {/* Company number — read-only */}
        <FieldRow
          icon={<Hash className="size-4" />}
          label="Company number"
          value={companyNumber || "Not set"}
          editing={false}
          readOnlyHint="Contact admin to change"
        />

        {/* VAT — editable */}
        <FieldRow
          icon={<Receipt className="size-4" />}
          label="VAT number"
          value={editVat}
          editing={isEditing}
          onChange={setEditVat}
          placeholder="e.g. GB123456789"
        />
        <OptionGroup
          icon={<Mail className="size-4" />}
          label="Supported contact channels"
          editing={isEditing}
          options={providerContactChannelOptions as unknown as string[]}
          values={editSupportedContactChannels}
          onToggle={(value) => setEditSupportedContactChannels((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}
        />
        {editSupportedContactChannels.length > 0 ? (
          <div className="grid gap-3 rounded-lg bg-muted/10 p-3 sm:grid-cols-2">
            {editSupportedContactChannels.map((channel) => (
              <FieldRow
                key={channel}
                icon={<Phone className="size-4" />}
                label={`${channel} contact detail`}
                value={editContactDetails[channel as keyof typeof editContactDetails] || ""}
                editing={isEditing}
                onChange={(value) => setEditContactDetails((current) => ({ ...current, [channel]: value }))}
                placeholder={`Internal ${channel} contact detail`}
              />
            ))}
          </div>
        ) : null}
        <SelectRow
          icon={<Calendar className="size-4" />}
          label="Typical response time"
          value={editResponseTimeLabel}
          editing={isEditing}
          onChange={setEditResponseTimeLabel}
          options={providerResponseTimeOptions as unknown as string[]}
        />
        <OptionGroup
          icon={<Shield className="size-4" />}
          label="Service commitments"
          editing={isEditing}
          options={providerCommitmentOptions as unknown as string[]}
          values={editServiceCommitments}
          onToggle={(value) => setEditServiceCommitments((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}
        />
        <OptionGroup
          icon={<Building2 className="size-4" />}
          label="Languages spoken"
          editing={isEditing}
          options={providerLanguageOptions as unknown as string[]}
          values={editLanguagesSpoken}
          onToggle={(value) => setEditLanguagesSpoken((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value])}
        />

        {/* Dates — always read-only */}
        {memberSince && (
          <FieldRow
            icon={<Calendar className="size-4" />}
            label="Member since"
            value={memberSince}
            editing={false}
          />
        )}

        {approvedAt && (
          <FieldRow
            icon={<Check className="size-4" />}
            label="Approved on"
            value={approvedAt}
            editing={false}
          />
        )}
      </div>
    </div>
  );
}

function OptionGroup({ icon, label, options, values, editing, onToggle }: { icon: React.ReactNode; label: string; options: string[]; values: string[]; editing: boolean; onToggle: (value: string) => void; }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {options.map((option) => {
            const active = values.includes(option);
            return editing ? (
              <button key={option} type="button" onClick={() => onToggle(option)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                {option}
              </button>
            ) : active ? (
              <span key={option} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">{option}</span>
            ) : null;
          })}
          {!editing && values.length === 0 ? <p className="text-sm text-muted-foreground">Not set</p> : null}
        </div>
      </div>
    </div>
  );
}

function SelectRow({ icon, label, value, editing, onChange, options }: { icon: React.ReactNode; label: string; value: string; editing: boolean; onChange?: (value: string) => void; options: string[]; }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {editing && onChange ? (
          <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-md bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-100">
            <option value="">Select response time</option>
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        ) : (
          <p className={`text-sm mt-2 ${value ? "font-medium" : "text-muted-foreground"}`}>{value || "Not set"}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Field Row ─── */

function FieldRow({
  icon,
  label,
  value,
  editing,
  onChange,
  placeholder,
  required,
  readOnlyHint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  onChange?: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  readOnlyHint?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            {label}
          </label>
          {readOnlyHint && editing === false && (
            <span className="text-[10px] text-muted-foreground/60 italic">
              {readOnlyHint}
            </span>
          )}
        </div>
        {editing && onChange ? (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            required={required}
            className="mt-0.5 w-full rounded-md bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-100"
          />
        ) : (
          <p className={`text-sm mt-0.5 ${value && value !== "Not set" ? "font-medium" : "text-muted-foreground"}`}>
            {value || "Not set"}
          </p>
        )}
      </div>
    </div>
  );
}
