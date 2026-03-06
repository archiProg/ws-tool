import React from "react";
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from "react-native";

type Props = {
  endpoint: string;
  setEndpoint: (v: string) => void;
  connected: boolean;
  onToggleConnect: () => void;
  onPressAbout: () => void;
};

export default function EndpointBar({
  endpoint,
  setEndpoint,
  connected,
  onToggleConnect,
  onPressAbout,
}: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        value={endpoint}
        onChangeText={setEndpoint}
        placeholder="wss://echo.websocket.events"
        placeholderTextColor="#7f8aa3"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity style={[styles.btn, connected ? styles.btnDanger : styles.btnPrimary]} onPress={onToggleConnect}>
        <Text style={styles.btnText}>{connected ? "Disconnect" : "Connect"}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.aboutBtn} onPress={onPressAbout}>
        <Text style={styles.aboutText}>?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0f1625",
    color: "white",
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnPrimary: { backgroundColor: "#3b82f6", borderColor: "#3b82f6" },
  btnDanger: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  btnText: { color: "white", fontWeight: "700" },
  aboutBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0f1625",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutText: { color: "white", fontWeight: "800", fontSize: 18 },
});
