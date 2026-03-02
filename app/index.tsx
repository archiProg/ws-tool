// App.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';


import { SafeAreaView } from 'react-native-safe-area-context';
const { height } = Dimensions.get('window');
const LOG_HEIGHT = height * 0.3;

export default function App() {
  const ws = useRef<WebSocket | null>(null);

//   const [endpoint, setEndpoint] = useState('wss://echo.websocket.events');
  const [endpoint, setEndpoint] = useState('ws://192.168.1.20:8000/echo');
  const [connected, setConnected] = useState(false);
  const [rows, setRows] = useState<string[]>(['Hello 👋', '{"type":"ping"}','{"cmd":1, "param":{"username":"test","password":"1111111"}}']);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (text: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${text}`]);
  };

  // โหลดค่าที่เคย save ไว้
  useEffect(() => {
    (async () => {
      const savedEndpoint = await AsyncStorage.getItem('endpoint');
      const savedRows = await AsyncStorage.getItem('rows');

      if (savedEndpoint) setEndpoint(savedEndpoint);
      if (savedRows) setRows(JSON.parse(savedRows));
    })();
  }, []);

  // save endpoint + rows ทุกครั้งที่เปลี่ยน (ไม่ save log)
  useEffect(() => {
    AsyncStorage.setItem('endpoint', endpoint);
  }, [endpoint]);

  useEffect(() => {
    (async () => {
      await AsyncStorage.setItem('rows', JSON.stringify(rows));
      console.log(5555555555555555555);
    })();
  }, [rows]);

  const toggleConnect = () => {
    if (connected) {
      ws.current?.close();
      ws.current = null;
      setConnected(false);
      addLog('🔌 Disconnected');
      return;
    }

    ws.current = new WebSocket(endpoint);

    ws.current.onopen = () => {
      setConnected(true);
      addLog('✅ Connected');
    };

    ws.current.onmessage = (e) => {
      addLog(`📩 ${e.data}`);
    };

    ws.current.onerror = () => {
      addLog('❌ Error');
    };

    ws.current.onclose = () => {
      setConnected(false);
      addLog('🔌 Disconnected');
      ws.current = null;
    };
  };

  const sendOne = (msg: string) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      addLog('⚠️ Not connected');
      return;
    }
    ws.current.send(msg);
    addLog(`📤 ${msg}`);
  };

  const sendAll = () => {
    rows.forEach(sendOne);
  };

  const updateRow = (i: number, value: string) => {
    const copy = [...rows];
    copy[i] = value;
    setRows(copy);
  };

  const addRow = () => setRows(prev => [...prev, '']);
  const removeRow = (i: number) =>
    setRows(prev => prev.filter((_, idx) => idx !== i));

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Section */}
      <View style={styles.top}>
        <Text style={styles.title}>WebSocket Tester (RN)</Text>

        <Text style={styles.label}>Endpoint</Text>
        <TextInput
          style={styles.input}
          value={endpoint}
          onChangeText={setEndpoint}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.connectBtn, connected && styles.disconnectBtn]}
          onPress={toggleConnect}
        >
          <Text style={styles.connectText}>
            {connected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>

        <View style={styles.rowHeader}>
          <TouchableOpacity onPress={addRow}>
            <Text style={styles.addBtn}>＋ Add row</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={sendAll}>
            <Text style={styles.sendAllBtn}>Send All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.payloads}>
          {rows.map((r, i) => (
            <View key={i} style={styles.payloadRow}>
              <TextInput
                style={styles.payloadInput}
                value={r}
                onChangeText={(v) => updateRow(i, v)}
                placeholder="Payload..."
                placeholderTextColor="#64748b"
              />
              <TouchableOpacity onPress={() => sendOne(r)}>
                <Text style={styles.sendBtn}>Send</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeRow(i)}>
                <Text style={styles.deleteBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Log Fixed Bottom 30% */}
      <View style={[styles.logBox, { height: LOG_HEIGHT }]}>
        <Text style={styles.logTitle}>Log</Text>
        <ScrollView>
          {logs.map((l, i) => (
            <Text key={i} style={styles.logText}>{l}</Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  top: { flex: 1, padding: 12 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  label: { color: '#cbd5f5', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    color: 'white',
    marginTop: 4,
  },
  connectBtn: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  disconnectBtn: { backgroundColor: '#dc2626' },
  connectText: { color: 'white', fontWeight: '600' },

  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  addBtn: { color: '#38bdf8' },
  sendAllBtn: { color: '#22c55e' },

  payloads: { marginTop: 8 },
  payloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  payloadInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 8,
    color: 'white',
  },
  sendBtn: { color: '#22c55e', paddingHorizontal: 6 },
  deleteBtn: { color: '#ef4444', paddingHorizontal: 6 },

  logBox: {
    borderTopWidth: 1,
    borderColor: '#1e293b',
    padding: 8,
    backgroundColor: '#020617',
  },
  logTitle: { color: '#cbd5f5', marginBottom: 4 },
  logText: { color: '#e5e7eb', fontSize: 12, marginBottom: 2 },
});