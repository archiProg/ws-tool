import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

type Props = {
  onSendAll: () => void;
  onOpenConfig: () => void;
  disabled?: boolean;
};

export default function SendAllBar({ onSendAll, onOpenConfig, disabled }: Props) {
  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.bigBtn, disabled ? styles.disabled : styles.primary]} onPress={onSendAll} disabled={disabled}>
        <Text style={styles.btnText}>Send All</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.smallBtn, disabled ? styles.disabled : styles.secondary]} onPress={onOpenConfig} disabled={disabled}>
        <Text style={styles.btnText}>⋯</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  bigBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  smallBtn: { width: 54, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  primary: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  secondary: { backgroundColor: "#0f1625", borderColor: "#263043" },
  disabled: { opacity: 0.5 },
  btnText: { color: "white", fontWeight: "800" },
});
