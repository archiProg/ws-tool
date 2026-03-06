import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PayloadRow } from "../constants/types";

type Props = {
  autoFocus?: boolean;
  onFocused?: (id: string) => void;
  row: PayloadRow;
  onChangeText: (id: string, text: string) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function PayloadRowItem({ row, onChangeText, onSend, onDelete, autoFocus, onFocused }: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        value={row.text}
        onChangeText={(t) => onChangeText(row.id, t)}
        autoFocus={!!autoFocus}
        onFocus={() => onFocused?.(row.id)}
        placeholder='e.g. {"type":"ping"}'
        placeholderTextColor="#7f8aa3"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        multiline
      />
      <TouchableOpacity style={[styles.actionBtn, styles.sendBtn]} onPress={() => onSend(row.id)}>
        <Text style={styles.actionText}>Send</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionBtn, styles.delBtn]} onPress={() => onDelete(row.id)}>
        <Text style={styles.actionText}>Del</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0f1625",
    color: "white",
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: 64,
    alignItems: "center",
  },
  sendBtn: { backgroundColor: "#1f2937", borderColor: "#334155" },
  delBtn: { backgroundColor: "#111827", borderColor: "#334155" },
  actionText: { color: "white", fontWeight: "700" },
});
