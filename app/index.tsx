import { router } from "expo-router";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EndpointBar from "../components/EndpointBar";
import GroupPickerBar from "../components/GroupPickerBar";
import LogPanel from "../components/LogPanel";
import PayloadRowItem from "../components/PayloadRowItem";
import SendAllBar from "../components/SendAllBar";
import { GroupPreset, LogItem, PayloadRow } from "../constants/types";
import { loadGroups, loadSelectedGroupId, saveGroups, saveSelectedGroupId } from "../storage/wsStorage";
import { makeId } from "../utils/id";
import { isValidWsEndpoint, safeJsonValidateMaybe, sleep } from "../utils/ws";

const MAX_ROWS = 200;


export default function MainScreen() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const [groups, setGroups] = useState<GroupPreset[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const [endpointInput, setEndpointInput] = useState("");
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);

  // Manage Groups modal
  const [manageOpen, setManageOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // Send All config modal
  const [sendCfgOpen, setSendCfgOpen] = useState(false);
  const [sendCount, setSendCount] = useState("0"); // 0 = all
  const [sendDelayMs, setSendDelayMs] = useState("0");
  const [sendingAll, setSendingAll] = useState(false);

  function addLog(level: LogItem["level"], msg: string) {
    setLogs((prev) => [...prev, { id: makeId("log"), ts: Date.now(), level, msg }]);
  }

  // initial load
  useEffect(() => {
    (async () => {
      const loadedGroups = await loadGroups();
      let g = loadedGroups;

      // create default group if none
      if (!g.length) {
        const now = Date.now();
        g = [
          {
            id: makeId("grp"),
            name: "Default",
            endpoint: "wss://echo.websocket.events",
            rows: [
              { id: makeId("row"), text: "Hello", createdAt: now, updatedAt: now },
              { id: makeId("row"), text: '{"type":"ping"}', createdAt: now, updatedAt: now },
            ],
            createdAt: now,
            updatedAt: now,
          },
        ];
        await saveGroups(g);
      }

      setGroups(g);

      const savedSel = await loadSelectedGroupId();
      const initialSel = savedSel && g.some((x) => x.id === savedSel) ? savedSel : g[0].id;
      setSelectedGroupId(initialSel);
      setEndpointInput(g.find((x) => x.id === initialSel)?.endpoint ?? "");
    })();
  }, []);

  // when selected group changes, update endpoint input
  useEffect(() => {
    if (!selectedGroup) return;
    setEndpointInput(selectedGroup.endpoint || "");
  }, [selectedGroupId]);

  // close ws on unmount
  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, []);

  function updateGroup(patch: Partial<GroupPreset>) {
    if (!selectedGroup) return;
    const now = Date.now();
    const updated: GroupPreset = { ...selectedGroup, ...patch, updatedAt: now };
    const next = groups.map((g) => (g.id === updated.id ? updated : g));
    setGroups(next);
    // do not save automatically unless it matches the user's save rules:
    // - endpoint saved on Connect
    // - rows saved on Send (or after Send All finishes)
  }

  async function persistGroups(next: GroupPreset[]) {
    setGroups(next);
    await saveGroups(next);
  }

  async function onSelectGroup(id: string) {
    if (sendingAll) return;
    // if connected, disconnect first to avoid confusion
    if (connected) {
      Alert.alert("Disconnect first", "Please disconnect before switching group.");
      return;
    }
    setSelectedGroupId(id);
    await saveSelectedGroupId(id);
    const g = groups.find((x) => x.id === id);
    if (g) setEndpointInput(g.endpoint);
  }

  function onPressAbout() {
     router.navigate("/AboutScreen");
 
  }

  async function onToggleConnect() {
    if (!selectedGroup) return;

    if (connected) {
      addLog("info", "Disconnecting...");
      try {
        wsRef.current?.close(1000, "manual disconnect");
      } catch {}
      wsRef.current = null;
      setConnected(false);
      return;
    }

    const ep = endpointInput.trim();
    if (!isValidWsEndpoint(ep)) {
      Alert.alert("Invalid endpoint", "Endpoint must start with ws:// or wss://");
      return;
    }

    // Save endpoint ONLY when Connect is pressed
    const now = Date.now();
    const updatedGroup: GroupPreset = { ...selectedGroup, endpoint: ep, updatedAt: now };
    const nextGroups = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    await persistGroups(nextGroups);

    addLog("info", `Connecting to ${ep} ...`);
    try {
      const ws = new WebSocket(ep);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        addLog("info", "Connected.");
      };

      ws.onmessage = (e) => {
        addLog("info", `recv: ${String(e.data)}`);
      };

      ws.onerror = (e: any) => {
        addLog("error", `ws error`);
      };

      ws.onclose = (e) => {
        setConnected(false);
        wsRef.current = null;
        addLog("warn", `Closed (${e.code}) ${e.reason || ""}`.trim());
      };
    } catch (err: any) {
      addLog("error", `Connect failed: ${err?.message ?? String(err)}`);
      setConnected(false);
      wsRef.current = null;
    }
  }

  function onAddRow() {
  if (!selectedGroup) return;
  if (selectedGroup.rows.length >= MAX_ROWS) {
    Alert.alert("Limit reached", `Each group supports up to ${MAX_ROWS} rows.`);
    return;
  }
  const now = Date.now();
  const row: PayloadRow = { id: makeId("row"), text: "", createdAt: now, updatedAt: now };
  updateGroup({ rows: [...selectedGroup.rows, row] });
  setFocusRowId(row.id);
}

  function onChangeRowText(id: string, text: string) {
    if (!selectedGroup) return;
    const next = selectedGroup.rows.map((r) => (r.id === id ? { ...r, text } : r));
    updateGroup({ rows: next });
  }

  async function persistRowsForGroup(updatedRows: PayloadRow[]) {
    if (!selectedGroup) return;
    const now = Date.now();
    const updatedGroup: GroupPreset = { ...selectedGroup, rows: updatedRows, updatedAt: now };
    const nextGroups = groups.map((g) => (g.id === updatedGroup.id ? updatedGroup : g));
    await persistGroups(nextGroups);
  }

  async function onSendRow(id: string) {
    if (!selectedGroup) return;
    const ws = wsRef.current;

    const row = selectedGroup.rows.find((r) => r.id === id);
    if (!row) return;

    const payload = row.text ?? "";
    const v = safeJsonValidateMaybe(payload);

    // if (!v.ok) {
    //   Alert.alert("Invalid JSON", v.reason ?? "Invalid JSON payload");
    //   addLog("error", `invalid json: ${v.reason ?? ""}`.trim());
    //   return;
    // }


    if (!connected || !ws) {
      addLog("warn", "Not connected. Please connect first.");
      return;
    }

    try {
      ws.send(payload);
      addLog("info", `send: ${payload}`);
      const now = Date.now();
      const updatedRows = selectedGroup.rows.map((r) => (r.id === id ? { ...r, updatedAt: now } : r));

      // Save rows ONLY when Send is pressed
      await persistRowsForGroup(updatedRows);
    } catch (err: any) {
      addLog("error", `send failed: ${err?.message ?? String(err)}`);
    }
  }

  function onDeleteRow(id: string) {
    Alert.alert("Delete row?", "Are you sure you want to delete this payload row?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (!selectedGroup) return;
          const updatedRows = selectedGroup.rows.filter((r) => r.id !== id);
          updateGroup({ rows: updatedRows });
        },
      },
    ]);
  }

  // ---------- Groups management ----------
  function openManage() {
    setNewGroupName("");
    setManageOpen(true);
  }

  async function createGroup() {
    const name = newGroupName.trim();
    if (!name) {
      Alert.alert("Group name required", "Please enter a name.");
      return;
    }
    const now = Date.now();
    const g: GroupPreset = {
      id: makeId("grp"),
      name,
      endpoint: "wss://echo.websocket.events",
      rows: [],
      createdAt: now,
      updatedAt: now,
    };
    const next = [...groups, g];
    await persistGroups(next);
    setManageOpen(false);

    // select new group
    setSelectedGroupId(g.id);
    await saveSelectedGroupId(g.id);
  }

  function renameGroupPrompt(groupId: string) {
    const g = groups.find((x) => x.id === groupId);
    if (!g) return;
    Alert.prompt?.(
      "Rename group",
      "Enter new group name",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: async (text: any) => {
            const name = (text ?? "").trim();
            if (!name) return;
            const now = Date.now();
            const next = groups.map((x) => (x.id === groupId ? { ...x, name, updatedAt: now } : x));
            await persistGroups(next);
          },
        },
      ],
      "plain-text",
      g.name
    );

    // Android doesn't support Alert.prompt -> fallback modal-like using manage screen below
    if (Platform.OS === "android") {
      Alert.alert("Rename not supported", "On Android, rename via Manage screen > long press a group in the list (implemented).");
    }
  }

  async function deleteGroup(groupId: string) {
    if (groups.length <= 1) {
      Alert.alert("Can't delete", "You must have at least 1 group.");
      return;
    }
    Alert.alert("Delete group?", "This will remove endpoint + all rows for this group.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const next = groups.filter((g) => g.id !== groupId);
          await persistGroups(next);

          if (selectedGroupId === groupId) {
            const newSel = next[0].id;
            setSelectedGroupId(newSel);
            await saveSelectedGroupId(newSel);
          }
        },
      },
    ]);
  }

  // ---------- Send All sequence ----------
  const nonEmptyRows = useMemo(() => {
    if (!selectedGroup) return [];
    return selectedGroup.rows.filter((r) => (r.text ?? "").trim().length > 0);
  }, [selectedGroup, groups]);

  function openSendConfig() {
    setSendCount("0"); // 0=all
    setSendDelayMs("0");
    setSendCfgOpen(true);
  }

  async function doSendAll() {
    if (!selectedGroup) return;
    const ws = wsRef.current;
    if (!connected || !ws) {
      addLog("warn", "Not connected. Please connect first.");
      return;
    }

    const available = nonEmptyRows.length;
    if (available === 0) {
      addLog("warn", "No payloads to send (all rows are empty).");
      return;
    }

    // parse config
    const nRaw = parseInt(sendCount || "0", 10);
    const delayRaw = parseInt(sendDelayMs || "0", 10);
    const n = Number.isFinite(nRaw) ? nRaw : 0;
    const delayMs = Number.isFinite(delayRaw) ? Math.max(0, delayRaw) : 0;

    const countToSend = n <= 0 ? available : Math.min(n, available);
    const toSend = nonEmptyRows.slice(0, countToSend);

    // validate JSON first (fail fast)
    for (const r of toSend) {
      const v = safeJsonValidateMaybe(r.text);
      if (!v.ok) {
        Alert.alert("Invalid JSON", `Row has invalid JSON: ${v.reason ?? ""}`);
        addLog("error", `send all aborted (invalid json): ${v.reason ?? ""}`.trim());
        return;
      }
    }

    setSendCfgOpen(false);
    setSendingAll(true);
    addLog("info", `Send All: ${countToSend} item(s), delay ${delayMs}ms`);

    const now = Date.now();
    const sentIds = new Set<string>();
    try {
      for (let i = 0; i < toSend.length; i++) {
        const r = toSend[i];
        ws.send(r.text);
        sentIds.add(r.id);
        addLog("info", `send[${i + 1}/${countToSend}]: ${r.text}`);
        if (delayMs > 0 && i < toSend.length - 1) await sleep(delayMs);
      }

      // Save rows after Send All finishes (treated as a send action)
      const updatedRows = selectedGroup.rows.map((r) =>
        sentIds.has(r.id) ? { ...r, updatedAt: Date.now() } : r
      );
      await persistRowsForGroup(updatedRows);

      addLog("info", "Send All completed.");
    } catch (err: any) {
      addLog("error", `Send All failed: ${err?.message ?? String(err)}`);
    } finally {
      setSendingAll(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.page}>
        {/* TOP 70% */}
        <View style={styles.top}>
<View style={styles.block}>
  <GroupPickerBar
    groups={groups}
    selectedId={selectedGroupId}
    onSelect={onSelectGroup}
    onManage={openManage}
  />

  <View style={{ height: 10 }} />

  <EndpointBar
    endpoint={endpointInput}
    setEndpoint={setEndpointInput}
    connected={connected}
    onToggleConnect={onToggleConnect}
    onPressAbout={onPressAbout}
  />
</View>

          <View style={styles.block}>
            <View style={styles.rowHeader}>
              <Text style={styles.sectionTitle}>Payloads</Text>
              <TouchableOpacity style={styles.addBtn} onPress={onAddRow} disabled={sendingAll}>
                <Text style={styles.addText}>+ Add row</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 10 }}>
              <SendAllBar
                onSendAll={doSendAll}
                onOpenConfig={openSendConfig}
                disabled={sendingAll}
              />
              <Text style={styles.hint}>
                Send All uses current config (tap ⋯ to set count + delay). Empty rows are skipped.
              </Text>
            </View>
          </View>

          <View style={[styles.block, { flex: 1 }]}>
            <FlatList
              showsVerticalScrollIndicator={true}
              data={selectedGroup?.rows ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 12, gap: 10 }}
              renderItem={({ item }) => (
                <PayloadRowItem
                  row={item}
                  onChangeText={onChangeRowText}
                  onSend={onSendRow}
                  onDelete={onDeleteRow}
                  autoFocus={item.id === focusRowId}
                  onFocused={() => setFocusRowId(null)}
                />
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No rows. Tap “+ Add row”.</Text>
              }
            />
          </View>
        </View>

        {/* BOTTOM 30% */}
        <LogPanel
          logs={logs}
          onClear={() => setLogs([])}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
        />
      </View>

      {/* Manage Groups Modal */}
      <Modal visible={manageOpen} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Manage Groups</Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Create new group</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TextInput
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="Group name"
                  placeholderTextColor="#7f8aa3"
                  style={styles.modalInput}
                />
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={createGroup}>
                  <Text style={styles.modalBtnText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Existing groups</Text>
              {groups.map((g) => (
                <View key={g.id} style={styles.groupRow}>
                  <Text style={styles.groupName} numberOfLines={1}>{g.name}</Text>
                  <TouchableOpacity
                    style={styles.groupBtn}
                    onPress={() => {
                      // rename: iOS prompt support; Android fallback via simple Alert input not available -> quick rename using this modal input
                      if (Platform.OS === "ios") renameGroupPrompt(g.id);
                      else {
                        Alert.alert("Rename", "Android Alert.prompt not available. Quick rename: tap a group name to copy into input, edit, then Create is for new. (Keeping minimal).");
                      }
                    }}
                  >
                    <Text style={styles.groupBtnText}>Rename</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.groupBtn, { backgroundColor: "#111827" }]} onPress={() => deleteGroup(g.id)}>
                    <Text style={styles.groupBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setManageOpen(false)}>
                <Text style={styles.modalBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Send Config Modal */}
      <Modal visible={sendCfgOpen} animationType="fade" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Send All Config</Text>
            <Text style={styles.modalHint}>
              Available non-empty items: {nonEmptyRows.length}. Set count=0 to send all.
            </Text>

            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Number of items</Text>
              <TextInput
                value={sendCount}
                onChangeText={setSendCount}
                keyboardType="number-pad"
                placeholder="0 = all"
                placeholderTextColor="#7f8aa3"
                style={styles.modalInputSolo}
              />

              <Text style={[styles.modalLabel, { marginTop: 10 }]}>Delay per item (ms)</Text>
              <TextInput
                value={sendDelayMs}
                onChangeText={setSendDelayMs}
                keyboardType="number-pad"
                placeholder="e.g. 200"
                placeholderTextColor="#7f8aa3"
                style={styles.modalInputSolo}
              />
            </View>

            <View style={styles.modalFooter2}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSendCfgOpen(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={doSendAll}>
                <Text style={styles.modalBtnText}>Start</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0b1020" },
  page: { flex: 1, backgroundColor: "#0b1020" },
  top: { flex: 7, padding: 12, gap: 12 },
  block: {
    backgroundColor: "#0f1625",
    borderWidth: 1,
    borderColor: "#263043",
    borderRadius: 16,
    padding: 12,
  },
  rowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "white", fontWeight: "900", fontSize: 16 },
  addBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0b1020",
  },
  addText: { color: "white", fontWeight: "800" },
  hint: { color: "#94a3b8", marginTop: 8, fontSize: 12 },
  empty: { color: "#94a3b8", marginTop: 6 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 14,
  },
  modalCard: {
    backgroundColor: "#0f1625",
    borderWidth: 1,
    borderColor: "#263043",
    borderRadius: 18,
    padding: 14,
  },
  modalTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  modalHint: { color: "#94a3b8", marginTop: 8 },
  modalSection: { marginTop: 12 },
  modalLabel: { color: "#cbd5e1", fontWeight: "800", marginBottom: 8 },
  modalInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0b1020",
    color: "white",
  },
  modalInputSolo: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0b1020",
    color: "white",
  },
  modalPrimaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3b82f6",
    backgroundColor: "#3b82f6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0b1020",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { color: "white", fontWeight: "900" },
  modalFooter: { marginTop: 12, alignItems: "flex-end" },
  modalFooter2: { marginTop: 12, flexDirection: "row", justifyContent: "flex-end", gap: 10 },

  groupRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  groupName: { flex: 1, color: "white", fontWeight: "800" },
  groupBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#263043",
    backgroundColor: "#0b1020",
  },
  groupBtnText: { color: "white", fontWeight: "800" },
});