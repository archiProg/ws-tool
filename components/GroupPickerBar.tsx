import { Picker } from "@react-native-picker/picker";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GroupPreset } from "../constants/types";

type Props = {
  groups: GroupPreset[];
  selectedId: string;
  onSelect: (id: string) => void;
  onManage: () => void;
};

export default function GroupPickerBar({ groups, selectedId, onSelect, onManage }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.pickerWrap}>
        <Picker
          selectedValue={selectedId}
          onValueChange={(v) => onSelect(String(v))}
          dropdownIconColor="#cbd5e1"
          style={styles.picker}
        >
          {groups.map((g) => (
            <Picker.Item key={g.id} label={g.name} value={g.id} />
          ))}
        </Picker>
      </View>

      <TouchableOpacity style={styles.manageBtn} onPress={onManage}>
        <Text style={styles.manageText}>Manage</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  pickerWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0f1625",
    overflow: "hidden",
  },
  picker: { color: "white" },
  manageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0f1625",
  },
  manageText: { color: "white", fontWeight: "700" },
});
