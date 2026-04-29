import { Alert, Pressable, RefreshControl, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { useProviderAvailability } from "@/state/provider-data";
import { useAuth } from "@/state/auth";
import {
  createProviderMobileOverride,
  deleteProviderMobileOverride,
  updateProviderMobileAvailability,
  type MobileProviderAvailabilityDay,
} from "@/lib/provider-api";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { CardEmpty } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = Array.from({ length: 30 }, (_, i) => {
  const h = Math.floor(i / 2) + 6; // 06:00 – 20:30
  const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

type DraftDay = { dayOfWeek: number; isAvailable: boolean; startTime: string; endTime: string };

export default function AvailabilityScreen() {
  const { token } = useAuth();
  const { schedule, overrides, settings, loading, error, refresh } = useProviderAvailability();
  const [refreshing, setRefreshing] = useState(false);

  // --- schedule editing state ---
  const [draft, setDraft] = useState<DraftDay[]>([]);
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [saving, setSaving] = useState(false);

  // --- settings editing state ---
  const [editingSettings, setEditingSettings] = useState(false);
  const [draftLeadTime, setDraftLeadTime] = useState("");
  const [draftMaxJobs, setDraftMaxJobs] = useState("");

  // --- new override form state ---
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideDate, setOverrideDate] = useState("");
  const [overrideAvailable, setOverrideAvailable] = useState(false);
  const [overrideStart, setOverrideStart] = useState("09:00");
  const [overrideEnd, setOverrideEnd] = useState("17:00");
  const [overrideNote, setOverrideNote] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);

  // sync server schedule -> draft when schedule changes or editing starts
  useEffect(() => {
    if (schedule.length > 0) {
      setDraft(buildDraft(schedule));
    }
  }, [schedule]);

  useEffect(() => {
    setDraftLeadTime(settings.leadTimeHours != null ? String(settings.leadTimeHours) : "24");
    setDraftMaxJobs(settings.maxJobsPerDay != null ? String(settings.maxJobsPerDay) : "");
  }, [settings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refresh(); } finally { setRefreshing(false); }
  }, [refresh]);

  // --- schedule helpers ---
  function buildDraft(source: MobileProviderAvailabilityDay[]): DraftDay[] {
    const map = new Map(source.map((d) => [d.dayOfWeek, d]));
    return Array.from({ length: 7 }, (_, i) => {
      const existing = map.get(i);
      return {
        dayOfWeek: i,
        isAvailable: existing?.isAvailable ?? false,
        startTime: existing?.startTime || "09:00",
        endTime: existing?.endTime || "17:00",
      };
    });
  }

  function updateDay(dayOfWeek: number, patch: Partial<DraftDay>) {
    setDraft((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));
  }

  async function saveSchedule() {
    if (!token) return;
    // validate
    for (const d of draft) {
      if (d.isAvailable && d.startTime >= d.endTime) {
        Alert.alert("Invalid time", `${DAY_NAMES[d.dayOfWeek]}: start time must be before end time.`);
        return;
      }
    }
    try {
      setSaving(true);
      await updateProviderMobileAvailability(token, {
        schedule: draft,
        settings: {
          leadTimeHours: draftLeadTime ? Number(draftLeadTime) : null,
          maxJobsPerDay: draftMaxJobs ? Number(draftMaxJobs) : null,
        },
      });
      await refresh();
      setEditingSchedule(false);
      setEditingSettings(false);
    } catch (err) {
      Alert.alert("Save failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // --- override helpers ---
  async function saveOverride() {
    if (!token) return;
    if (!overrideDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Invalid date", "Enter a date in YYYY-MM-DD format.");
      return;
    }
    if (overrideAvailable && overrideStart >= overrideEnd) {
      Alert.alert("Invalid time", "Start time must be before end time.");
      return;
    }
    try {
      setSavingOverride(true);
      await createProviderMobileOverride(token, {
        date: overrideDate,
        isAvailable: overrideAvailable,
        startTime: overrideAvailable ? overrideStart : undefined,
        endTime: overrideAvailable ? overrideEnd : undefined,
        note: overrideNote || undefined,
      });
      await refresh();
      setShowOverrideForm(false);
      resetOverrideForm();
    } catch (err) {
      Alert.alert("Save failed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setSavingOverride(false);
    }
  }

  async function removeOverride(id: string) {
    if (!token) return;
    Alert.alert("Delete override", "Remove this date override?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProviderMobileOverride(token, id);
            await refresh();
          } catch (err) {
            Alert.alert("Delete failed", err instanceof Error ? err.message : "Please try again.");
          }
        },
      },
    ]);
  }

  function resetOverrideForm() {
    setOverrideDate("");
    setOverrideAvailable(false);
    setOverrideStart("09:00");
    setOverrideEnd("17:00");
    setOverrideNote("");
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppTheme.colors.ink} />}>
        <View style={{ gap: 14 }}>
          <Text style={AppTheme.text.pageTitle}>Availability</Text>
          <Text style={AppTheme.text.bodyMuted}>
            Set your weekly hours, booking settings, and date-specific overrides.
          </Text>
          {loading ? <Text style={AppTheme.text.caption}>Refreshing...</Text> : null}
          {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error}</Text> : null}

          {/* ── Weekly schedule ── */}
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={AppTheme.text.sectionTitle}>Weekly schedule</Text>
              {!editingSchedule ? (
                <Pressable onPress={() => setEditingSchedule(true)}>
                  <Text style={{ color: AppTheme.colors.accent, fontSize: 14, fontWeight: "700" }}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ gap: 12, marginTop: 14 }}>
              {draft.map((day) => (
                <View key={day.dayOfWeek} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <Text style={AppTheme.text.cardTitle}>{DAY_NAMES[day.dayOfWeek]}</Text>
                    {editingSchedule ? (
                      <Switch
                        value={day.isAvailable}
                        onValueChange={(v) => updateDay(day.dayOfWeek, { isAvailable: v })}
                        trackColor={{ false: AppTheme.colors.line, true: AppTheme.colors.accent }}
                        thumbColor="#fff"
                      />
                    ) : (
                      <Pill label={day.isAvailable ? "Open" : "Off"} subtle={!day.isAvailable} />
                    )}
                  </View>
                  {editingSchedule && day.isAvailable ? (
                    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                      <TimePicker value={day.startTime} onChange={(v) => updateDay(day.dayOfWeek, { startTime: v })} />
                      <Text style={AppTheme.text.caption}>to</Text>
                      <TimePicker value={day.endTime} onChange={(v) => updateDay(day.dayOfWeek, { endTime: v })} />
                    </View>
                  ) : !editingSchedule ? (
                    <Text style={AppTheme.text.caption}>{day.isAvailable ? `${day.startTime} - ${day.endTime}` : "Unavailable"}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </Card>

          {/* ── Booking settings ── */}
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={AppTheme.text.sectionTitle}>Booking settings</Text>
              {!editingSettings && !editingSchedule ? (
                <Pressable onPress={() => { setEditingSettings(true); setEditingSchedule(true); }}>
                  <Text style={{ color: AppTheme.colors.accent, fontSize: 14, fontWeight: "700" }}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ gap: 10, marginTop: 14 }}>
              {editingSchedule ? (
                <>
                  <View style={{ gap: 6 }}>
                    <Text style={AppTheme.text.caption}>Lead time (hours)</Text>
                    <TextInput
                      value={draftLeadTime}
                      onChangeText={setDraftLeadTime}
                      keyboardType="number-pad"
                      placeholder="24"
                      placeholderTextColor={AppTheme.colors.muted}
                      style={inputStyle}
                    />
                  </View>
                  <View style={{ gap: 6 }}>
                    <Text style={AppTheme.text.caption}>Max jobs per day (blank = unlimited)</Text>
                    <TextInput
                      value={draftMaxJobs}
                      onChangeText={setDraftMaxJobs}
                      keyboardType="number-pad"
                      placeholder="Unlimited"
                      placeholderTextColor={AppTheme.colors.muted}
                      style={inputStyle}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={AppTheme.text.body}>Lead time: {settings.leadTimeHours ?? 24} hours</Text>
                  <Text style={AppTheme.text.body}>Max jobs per day: {settings.maxJobsPerDay ?? "Unlimited"}</Text>
                </>
              )}
            </View>
          </Card>

          {/* ── Save schedule button ── */}
          {editingSchedule ? (
            <View style={{ gap: 10 }}>
              <Pressable
                onPress={saveSchedule}
                disabled={saving}
                style={{ backgroundColor: AppTheme.colors.ink, borderRadius: 18, paddingVertical: 16, alignItems: "center", opacity: saving ? 0.6 : 1 }}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>{saving ? "Saving..." : "Save schedule"}</Text>
              </Pressable>
              <Pressable
                onPress={() => { setEditingSchedule(false); setEditingSettings(false); setDraft(buildDraft(schedule)); }}
                style={{ alignItems: "center", paddingVertical: 12 }}
              >
                <Text style={{ color: AppTheme.colors.muted, fontSize: 14, fontWeight: "600" }}>Cancel</Text>
              </Pressable>
            </View>
          ) : null}

          {/* ── Overrides ── */}
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={AppTheme.text.sectionTitle}>Date overrides</Text>
              {!showOverrideForm ? (
                <Pressable onPress={() => setShowOverrideForm(true)}>
                  <Text style={{ color: AppTheme.colors.accent, fontSize: 14, fontWeight: "700" }}>+ Add</Text>
                </Pressable>
              ) : null}
            </View>

            {showOverrideForm ? (
              <View style={{ gap: 10, marginTop: 14, borderTopWidth: 1, borderTopColor: AppTheme.colors.line, paddingTop: 14 }}>
                <View style={{ gap: 6 }}>
                  <Text style={AppTheme.text.caption}>Date (YYYY-MM-DD)</Text>
                  <TextInput
                    value={overrideDate}
                    onChangeText={setOverrideDate}
                    placeholder="2026-04-20"
                    placeholderTextColor={AppTheme.colors.muted}
                    style={inputStyle}
                  />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={AppTheme.text.body}>Available on this day?</Text>
                  <Switch
                    value={overrideAvailable}
                    onValueChange={setOverrideAvailable}
                    trackColor={{ false: AppTheme.colors.line, true: AppTheme.colors.accent }}
                    thumbColor="#fff"
                  />
                </View>
                {overrideAvailable ? (
                  <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                    <TimePicker value={overrideStart} onChange={setOverrideStart} />
                    <Text style={AppTheme.text.caption}>to</Text>
                    <TimePicker value={overrideEnd} onChange={setOverrideEnd} />
                  </View>
                ) : null}
                <View style={{ gap: 6 }}>
                  <Text style={AppTheme.text.caption}>Note (optional)</Text>
                  <TextInput
                    value={overrideNote}
                    onChangeText={setOverrideNote}
                    placeholder="e.g. Bank holiday"
                    placeholderTextColor={AppTheme.colors.muted}
                    style={inputStyle}
                  />
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    onPress={saveOverride}
                    disabled={savingOverride}
                    style={{ flex: 1, backgroundColor: AppTheme.colors.ink, borderRadius: 18, paddingVertical: 14, alignItems: "center", opacity: savingOverride ? 0.6 : 1 }}
                  >
                    <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>{savingOverride ? "Saving..." : "Save override"}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => { setShowOverrideForm(false); resetOverrideForm(); }}
                    style={{ paddingVertical: 14, paddingHorizontal: 16 }}
                  >
                    <Text style={{ color: AppTheme.colors.muted, fontSize: 14, fontWeight: "600" }}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={{ gap: 10, marginTop: 14 }}>
              {overrides.length === 0 && !showOverrideForm ? (
                <Text style={AppTheme.text.bodyMuted}>No upcoming overrides. Tap "+ Add" to block or change a specific date.</Text>
              ) : null}
              {overrides.map((item) => (
                <View key={item.id} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={AppTheme.text.cardTitle}>{item.date}</Text>
                    <Text style={AppTheme.text.body}>{item.note || (item.isAvailable ? "Custom hours" : "Day off")}</Text>
                    <Text style={AppTheme.text.caption}>{item.isAvailable ? `${item.startTime} - ${item.endTime}` : "Unavailable"}</Text>
                  </View>
                  <Pressable onPress={() => removeOverride(item.id)} style={{ paddingVertical: 4, paddingHorizontal: 8 }}>
                    <Text style={{ color: "#b42318", fontSize: 13, fontWeight: "600" }}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}

/* ── Inline time picker (scrollable option row) ── */
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Pressable onPress={() => setOpen(true)} style={[inputStyle, { paddingVertical: 10, minWidth: 80 }]}>
        <Text style={{ color: AppTheme.colors.ink, fontSize: 14, fontWeight: "600", textAlign: "center" }}>{value}</Text>
      </Pressable>
    );
  }

  return (
    <View style={{ borderWidth: 1, borderColor: AppTheme.colors.accent, borderRadius: 16, backgroundColor: "#fff", maxHeight: 160 }}>
      <ScrollView showsVerticalScrollIndicator nestedScrollEnabled>
        {TIME_OPTIONS.map((t) => (
          <Pressable
            key={t}
            onPress={() => { onChange(t); setOpen(false); }}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              backgroundColor: t === value ? AppTheme.colors.accentSoft : "transparent",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: t === value ? "700" : "500", color: AppTheme.colors.ink }}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: AppTheme.colors.line,
  borderRadius: 16,
  paddingHorizontal: 14,
  paddingVertical: 14,
  backgroundColor: "#fff",
  color: AppTheme.colors.ink,
  fontSize: 14,
} as const;
