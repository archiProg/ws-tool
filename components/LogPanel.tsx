import React, { useEffect, useRef } from "react";
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { LogItem } from "../constants/types";

type Props = {
  logs: LogItem[];
  onClear: () => void;
  autoScroll: boolean;
  setAutoScroll: (v: boolean) => void;
};

export default function LogPanel({ logs, onClear, autoScroll, setAutoScroll }: Props) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    if (!autoScroll) return;
    // scroll after render
    requestAnimationFrame(() => ref.current?.scrollToEnd({ animated: true }));
  }, [logs, autoScroll]);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Log</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.clearBtn} onPress={onClear}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
          <View style={styles.switchWrap}>
            <Text style={styles.switchText}>Auto</Text>
            <Switch value={autoScroll} onValueChange={setAutoScroll} />
          </View>
        </View>
      </View>

      <ScrollView ref={ref} style={styles.body} contentContainerStyle={styles.bodyContent}>
        {logs.map((l) => (
          <Text key={l.id} style={[styles.line, l.level === "error" ? styles.err : l.level === "warn" ? styles.warn : null]}>
            [{new Date(l.ts).toLocaleTimeString()}] {l.msg}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 3,
    borderTopWidth: 1,
    borderColor: "#1f2a3d",
    backgroundColor: "#0b1020",
    padding: 10,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: "white", fontWeight: "800", fontSize: 16 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0f1625",
  },
  clearText: { color: "white", fontWeight: "700" },
  switchWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  switchText: { color: "#cbd5e1", fontWeight: "700" },
  body: { marginTop: 8 },
  bodyContent: { paddingBottom: 10 },
  line: { color: "#cbd5e1", fontFamily: undefined, marginBottom: 4 },
  err: { color: "#fecaca" },
  warn: { color: "#fde68a" },
});
