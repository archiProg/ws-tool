import { useNavigation } from "@react-navigation/native";
import * as Application from "expo-application";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function AboutScreen() {
  const navigation = useNavigation<any>();
  const info = useMemo(() => {
    return {
      appName: "WebSocket Tester",
      version: Application.nativeApplicationVersion ?? "1.0.1",
      build: Application.nativeBuildVersion ?? "-",
      applicationId: Application.applicationId ?? "-",
    };
  }, []);

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.h1}>{info.appName}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Version</Text>
        <Text style={styles.value}>{info.version}</Text>

        <Text style={styles.label}>Build</Text>
        <Text style={styles.value}>{info.build}</Text>

        <Text style={styles.label}>App ID</Text>
        <Text style={styles.value}>{info.applicationId}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.h2}>What this app does</Text>
        <Text style={styles.p}>
          Quick WebSocket testing tool: connect to an endpoint, send payloads, run sequences (Send All), and view logs.
        </Text>

        <Text style={styles.h2}>Storage</Text>
        <Text style={styles.p}>
          Endpoints + payload rows are saved locally per group. Logs are not saved.
        </Text>

        <Text style={styles.h2}>How to use</Text>
        <Text style={styles.p}>1) Select a group (preset){"\n"}2) Connect{"\n"}3) Send a row or Send All with delay</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "flex-start" },
  backBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: "#263043", backgroundColor: "#0f1625" },
  backText: { color: "white", fontWeight: "800" },
  page: { flex: 1, backgroundColor: "#0b1020" },
  content: { padding: 16, gap: 12 },
  h1: { color: "white", fontSize: 26, fontWeight: "900" },
  h2: { color: "white", fontSize: 16, fontWeight: "800", marginTop: 8 },
  p: { color: "#cbd5e1", marginTop: 6, lineHeight: 20 },
  card: {
    backgroundColor: "#0f1625",
    borderWidth: 1,
    borderColor: "#263043",
    borderRadius: 16,
    padding: 14,
  },
  label: { color: "#94a3b8", marginTop: 10, fontWeight: "700" },
  value: { color: "white", marginTop: 4, fontWeight: "800" },
});
