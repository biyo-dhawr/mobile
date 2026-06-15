import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';

const KEYS = [
  [{ label: '1' }, { label: '2' }, { label: '3' }],
  [{ label: '4' }, { label: '5' }, { label: '6' }],
  [{ label: '7' }, { label: '8' }, { label: '9' }],
  [{ label: '*' }, { label: '0' }, { label: '#' }],
];

export default function DialerScreen({ onDial }) {
  const [code, setCode] = useState('');

  const handleKey = (val) => setCode((p) => p + val);
  const handleDelete = () => setCode((p) => p.slice(0, -1));
  const handleCall = () => {
    if (code.trim() === '') return;
    onDial(code.trim());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>OGAAL</Text>
        <Text style={styles.headerSub}>Nidaamka Biyaha Reer Miyi</Text>
      </View>

      {/* ── Display ── */}
      <View style={styles.displayBox}>
        <Text style={[styles.displayText, code === '' && styles.placeholder]}>
          {code === '' ? 'Garaac *999#' : code}
        </Text>
        {code.length > 0 && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteIcon}>⌫</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Hint ── */}
      <Text style={styles.hint}>*999# ku dhufo si aad u gashid</Text>

      {/* ── Keypad ── */}
      <View style={styles.keypad}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((k) => (
              <TouchableOpacity
                key={k.label}
                style={styles.key}
                activeOpacity={0.6}
                onPress={() => handleKey(k.label)}
              >
                <Text style={styles.keyLabel}>{k.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* ── Call button ── */}
        <View style={styles.callRow}>
          <TouchableOpacity
            style={[styles.callBtn, code === '' && styles.callBtnDisabled]}
            activeOpacity={0.75}
            onPress={handleCall}
            disabled={code === ''}
          >
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callLabel}>WAC (Call)</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    paddingBottom: Platform.OS === 'android' ? 30 : 0,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 10,
  },
  headerLabel: {
    color: '#00e5ff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 6,
  },
  headerSub: {
    color: '#546e7a',
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1,
  },
  // Display
  displayBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 30,
    marginTop: 30,
    marginBottom: 6,
    backgroundColor: '#16213e',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#00e5ff33',
    minHeight: 60,
  },
  displayText: {
    flex: 1,
    color: '#00e5ff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  placeholder: {
    color: '#37474f',
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
  },
  deleteBtn: {
    padding: 6,
  },
  deleteIcon: {
    color: '#ff5252',
    fontSize: 20,
  },
  // Hint
  hint: {
    textAlign: 'center',
    color: '#37474f',
    fontSize: 12,
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  // Keypad
  keypad: {
    paddingHorizontal: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3460',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  keyLabel: {
    color: '#e0e0e0',
    fontSize: 26,
    fontWeight: '600',
  },
  // Call button
  callRow: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00897b',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 40,
    gap: 10,
    elevation: 5,
    shadowColor: '#00897b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  callBtnDisabled: {
    backgroundColor: '#1c3035',
    shadowOpacity: 0,
    elevation: 0,
  },
  callIcon: {
    fontSize: 20,
  },
  callLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
