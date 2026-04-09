import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "@/state/auth";
import { useProviderAccount } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";
import { updateProviderMobilePassword, updateProviderMobileProfile } from "@/lib/provider-api";

export default function AccountScreen() {
  const account = useProviderAccount();
  const { signOut, provider, token, refreshProfile } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [tradingName, setTradingName] = useState("");
  const [phone, setPhone] = useState("");
  const [registeredAddress, setRegisteredAddress] = useState("");
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setTradingName(provider?.tradingName || provider?.displayName || "");
    setPhone(provider?.phone || "");
    setRegisteredAddress(provider?.registeredAddress || "");
    setHeadline(provider?.headline || "");
    setBio(provider?.bio || "");
    setYearsExperience(provider?.yearsExperience != null ? String(provider.yearsExperience) : "");
  }, [provider]);

  async function saveProfile() {
    if (!token) return;
    try {
      setSavingProfile(true);
      await updateProviderMobileProfile(token, {
        tradingName,
        phone,
        registeredAddress,
        headline,
        bio,
        yearsExperience,
      });
      await refreshProfile();
      Alert.alert("Profile updated", "Your provider profile has been updated.");
    } catch (error) {
      Alert.alert("Update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (!token) return;
    try {
      setSavingPassword(true);
      await updateProviderMobilePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Your provider password has been changed.");
    } catch (error) {
      Alert.alert("Password update failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: 12 }}>
          <Card tone="hero">
            <Text style={AppTheme.text.eyebrow}>Provider account</Text>
            <Text style={AppTheme.text.heroTitle}>{account.displayName}</Text>
            <Text style={AppTheme.text.heroBody}>{account.email}</Text>
            <View style={{ marginTop: 10, alignSelf: "flex-start" }}>
              <Pill label={account.statusLabel} />
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Operational snapshot</Text>
            <View style={{ gap: 12, marginTop: 14 }}>
              <Text style={AppTheme.text.body}>Coverage: {account.coverageSummary}</Text>
              <Text style={AppTheme.text.body}>Pricing: {account.pricingSummary}</Text>
              <Text style={AppTheme.text.body}>Payouts: {account.payoutSummary}</Text>
              {provider?.headline ? <Text style={AppTheme.text.body}>Headline: {provider.headline}</Text> : null}
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Edit profile</Text>
            <View style={{ gap: 12, marginTop: 14 }}>
              <Field label="Trading name" value={tradingName} onChangeText={setTradingName} />
              <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <Field label="Registered address" value={registeredAddress} onChangeText={setRegisteredAddress} multiline />
              <Field label="Headline" value={headline} onChangeText={setHeadline} />
              <Field label="Short bio" value={bio} onChangeText={setBio} multiline />
              <Field label="Years of experience" value={yearsExperience} onChangeText={setYearsExperience} keyboardType="number-pad" />
              <Pressable
                onPress={saveProfile}
                disabled={savingProfile || !tradingName.trim()}
                style={{
                  backgroundColor: AppTheme.colors.ink,
                  borderRadius: 18,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: savingProfile ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>{savingProfile ? "Saving..." : "Save profile"}</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Change password</Text>
            <View style={{ gap: 12, marginTop: 14 }}>
              <Field label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
              <Field label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              <Pressable
                onPress={savePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                style={{
                  backgroundColor: AppTheme.colors.accentSoft,
                  borderRadius: 18,
                  paddingHorizontal: 18,
                  paddingVertical: 16,
                  alignItems: "center",
                  opacity: savingPassword ? 0.6 : 1,
                }}
              >
                <Text style={{ color: AppTheme.colors.ink, fontSize: 15, fontWeight: "700" }}>{savingPassword ? "Updating..." : "Update password"}</Text>
              </Pressable>
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Next actions</Text>
            <View style={{ gap: 10, marginTop: 14 }}>
              {account.nextActions.map((item) => (
                <Text key={item} style={AppTheme.text.body}>- {item}</Text>
              ))}
            </View>
          </Card>

          <Pressable
            onPress={signOut}
            style={{
              backgroundColor: AppTheme.colors.ink,
              borderRadius: 18,
              paddingHorizontal: 18,
              paddingVertical: 16,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  secureTextEntry,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "number-pad";
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={AppTheme.text.caption}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        keyboardType={keyboardType}
        placeholder={label}
        placeholderTextColor={AppTheme.colors.muted}
        style={{
          minHeight: multiline ? 92 : undefined,
          borderWidth: 1,
          borderColor: AppTheme.colors.line,
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: 14,
          backgroundColor: "#fff",
          color: AppTheme.colors.ink,
          textAlignVertical: multiline ? "top" : "center",
        }}
      />
    </View>
  );
}
