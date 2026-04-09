import { ScrollView, Text, View } from "react-native";
import { useProviderAvailability } from "@/state/provider-data";
import { AppTheme } from "@/ui/theme";
import { Card } from "@/ui/card";
import { Pill } from "@/ui/pill";
import { Screen } from "@/ui/screen";

export default function AvailabilityScreen() {
  const { schedule, overrides, settings, loading, error } = useProviderAvailability();

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ gap: 12 }}>
          <Text style={AppTheme.text.pageTitle}>Availability</Text>
          <Text style={AppTheme.text.bodyMuted}>
            Mobile-first schedule editing is planned next. This screen already maps to the provider availability model in the web app.
          </Text>
          {loading ? <Text style={AppTheme.text.caption}>Refreshing availability...</Text> : null}
          {error ? <Text style={{ color: "#b42318", fontSize: 13 }}>{error} Showing fallback preview data.</Text> : null}

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Weekly schedule</Text>
            <View style={{ gap: 10, marginTop: 14 }}>
              {schedule.map((day) => (
                <View key={day.dayOfWeek} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ gap: 2 }}>
                    <Text style={AppTheme.text.cardTitle}>{dayNames[day.dayOfWeek]}</Text>
                    <Text style={AppTheme.text.caption}>{day.isAvailable ? `${day.startTime} - ${day.endTime}` : "Unavailable"}</Text>
                  </View>
                  <Pill label={day.isAvailable ? "Open" : "Off"} subtle={!day.isAvailable} />
                </View>
              ))}
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Booking settings</Text>
            <View style={{ gap: 8, marginTop: 14 }}>
              <Text style={AppTheme.text.body}>Lead time: {settings.leadTimeHours ?? 24} hours</Text>
              <Text style={AppTheme.text.body}>Max jobs per day: {settings.maxJobsPerDay ?? "Unlimited"}</Text>
            </View>
          </Card>

          <Card>
            <Text style={AppTheme.text.sectionTitle}>Upcoming overrides</Text>
            <View style={{ gap: 10, marginTop: 14 }}>
              {overrides.map((item) => (
                <View key={item.id} style={{ gap: 4 }}>
                  <Text style={AppTheme.text.cardTitle}>{item.date}</Text>
                  <Text style={AppTheme.text.body}>{item.note || "No note"}</Text>
                  <Text style={AppTheme.text.caption}>{item.isAvailable ? `${item.startTime} - ${item.endTime}` : "Unavailable"}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
