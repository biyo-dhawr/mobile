import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
  Modal,
} from 'react-native';
import {
  getRegions,
  getDistricts,
  getVillages,
  getWaterSources,
  submitPublicReport,
} from '../api';

// ─── USSD step constants ──────────────────────────────────────────────────────
const STEPS = {
  MAIN_MENU: 'MAIN_MENU',
  // Status flow
  STATUS_REGION: 'STATUS_REGION',
  STATUS_DISTRICT: 'STATUS_DISTRICT',
  STATUS_VILLAGE: 'STATUS_VILLAGE',
  SHOW_STATUS: 'SHOW_STATUS',
  // Report flow
  REPORT_REGION: 'REPORT_REGION',
  REPORT_DISTRICT: 'REPORT_DISTRICT',
  REPORT_VILLAGE: 'REPORT_VILLAGE',
  REPORT_SOURCE: 'REPORT_SOURCE',
  REPORT_ISSUE: 'REPORT_ISSUE',
  // Results
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

export default function USSDMenuScreen({ onClose }) {
  const [step, setStep] = useState(STEPS.MAIN_MENU);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Data lists
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [waterSources, setWaterSources] = useState([]);

  // Selected IDs
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [selectedSourceId, setSelectedSourceId] = useState(null);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const doFetch = useCallback(async (fn, setter, nextStep) => {
    setLoading(true);
    try {
      const data = await fn();
      setter(data);
      setStep(nextStep);
    } catch (err) {
      setErrorMsg(err.message || 'Cilad ayaa dhacday');
      setStep(STEPS.ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Handler: user selects an option ────────────────────────────────────────
  const handleSelect = useCallback(
    async (item) => {
      switch (step) {
        // ── Main menu ──────────────────────────────────────────────────────────
        case STEPS.MAIN_MENU:
          if (item.key === '1') {
            doFetch(getRegions, setRegions, STEPS.STATUS_REGION);
          } else if (item.key === '2') {
            doFetch(getRegions, setRegions, STEPS.REPORT_REGION);
          }
          break;

        // ── Status: region → district ──────────────────────────────────────────
        case STEPS.STATUS_REGION:
          doFetch(
            () => getDistricts(item.id),
            setDistricts,
            STEPS.STATUS_DISTRICT,
          );
          break;

        // ── Status: district → village ─────────────────────────────────────────
        case STEPS.STATUS_DISTRICT:
          doFetch(
            () => getVillages(item.id),
            setVillages,
            STEPS.STATUS_VILLAGE,
          );
          break;

        // ── Status: village → show water sources status ────────────────────────
        case STEPS.STATUS_VILLAGE:
          setSelectedVillageId(item.id);
          doFetch(
            () => getWaterSources(item.id),
            setWaterSources,
            STEPS.SHOW_STATUS,
          );
          break;

        // ── Report: region → district ──────────────────────────────────────────
        case STEPS.REPORT_REGION:
          doFetch(
            () => getDistricts(item.id),
            setDistricts,
            STEPS.REPORT_DISTRICT,
          );
          break;

        // ── Report: district → village ─────────────────────────────────────────
        case STEPS.REPORT_DISTRICT:
          doFetch(
            () => getVillages(item.id),
            setVillages,
            STEPS.REPORT_VILLAGE,
          );
          break;

        // ── Report: village → water source ─────────────────────────────────────
        case STEPS.REPORT_VILLAGE:
          setSelectedVillageId(item.id);
          doFetch(
            () => getWaterSources(item.id),
            setWaterSources,
            STEPS.REPORT_SOURCE,
          );
          break;

        // ── Report: water source → issue type ──────────────────────────────────
        case STEPS.REPORT_SOURCE:
          setSelectedSourceId(item.id);
          setStep(STEPS.REPORT_ISSUE);
          break;

        // ── Report: issue type → submit ─────────────────────────────────────────
        case STEPS.REPORT_ISSUE: {
          const content =
            item.key === '1'
              ? 'Ceelku wuu jabay / shaqaynayo' + ' (USSD Report)'
              : 'Ceelku wuu maran yahay / biyaha ayaa dhacay (USSD Report)';
          setLoading(true);
          try {
            await submitPublicReport(selectedVillageId, selectedSourceId, content);
            setSuccessMsg(
              'Warbixintaadu si guul leh ayay ugu gudbisay.\nMahadsanid, waxaad ka caawisay bulshada!',
            );
            setStep(STEPS.SUCCESS);
          } catch (err) {
            setErrorMsg(err.message || 'Gudbinta waxay ku guul-daraysatay');
            setStep(STEPS.ERROR);
          } finally {
            setLoading(false);
          }
          break;
        }

        default:
          onClose();
      }
    },
    [step, selectedVillageId, selectedSourceId, doFetch, onClose],
  );

  // ─── Build menu items for each step ─────────────────────────────────────────
  const getMenuData = useCallback(() => {
    switch (step) {
      case STEPS.MAIN_MENU:
        return {
          title: '★ OGAAL USSD *999# ★',
          subtitle: 'Dooro fursad:',
          items: [
            { key: '1', label: 'Hubi xaaladda biyaha tuuladaada' },
            { key: '2', label: 'Soo sheeg ceel jabay ama maran' },
          ],
        };
      case STEPS.STATUS_REGION:
      case STEPS.REPORT_REGION:
        return {
          title: step === STEPS.STATUS_REGION ? 'Xaaladda Biyaha' : 'Soo Sheeg Cillad',
          subtitle: 'Dooro Gobolkaaga:',
          items: regions.map((r, i) => ({ key: String(i + 1), label: r.name, id: r.id })),
        };
      case STEPS.STATUS_DISTRICT:
      case STEPS.REPORT_DISTRICT:
        return {
          title: 'Degmada',
          subtitle: 'Dooro Degmadaada:',
          items: districts.map((d, i) => ({ key: String(i + 1), label: d.name, id: d.id })),
        };
      case STEPS.STATUS_VILLAGE:
      case STEPS.REPORT_VILLAGE:
        return {
          title: 'Tuulada',
          subtitle: 'Dooro Tuuladaada:',
          items: villages.map((v, i) => ({ key: String(i + 1), label: v.name, id: v.id })),
        };
      case STEPS.REPORT_SOURCE:
        return {
          title: 'Dooro Ceelka',
          subtitle: 'Ceelka aad ku sheegi doonto:',
          items: waterSources.map((s, i) => ({
            key: String(i + 1),
            label: `${s.name} (${s.type})`,
            id: s.id,
          })),
        };
      case STEPS.REPORT_ISSUE:
        return {
          title: 'Nooca Cillada',
          subtitle: 'Maxaa ceelka ka haya?',
          items: [
            { key: '1', label: 'Ceelku ma shaqaynayo / wuu jabay' },
            { key: '2', label: 'Ceelku wuu maran yahay / biyaha ayaa dhacay' },
          ],
        };
      case STEPS.SHOW_STATUS:
        return {
          title: 'Xaaladda Biyaha',
          subtitle: null,
          items: [],
          statusList: waterSources,
        };
      case STEPS.SUCCESS:
        return { title: '✓ Guul!', subtitle: successMsg, items: [] };
      case STEPS.ERROR:
        return { title: '✗ Cilad', subtitle: errorMsg, items: [] };
      default:
        return { title: '', subtitle: '', items: [] };
    }
  }, [step, regions, districts, villages, waterSources, successMsg, errorMsg]);

  // ─── Status colour helper ────────────────────────────────────────────────────
  const statusColor = (s) => {
    if (!s) return '#90a4ae';
    const lower = s.toLowerCase();
    if (lower === 'working') return '#00e676';
    if (lower === 'broken') return '#ff5252';
    if (lower === 'needed maintenance') return '#ffab40';
    return '#90a4ae';
  };

  const statusLabel = (s, waterLevel) => {
    if (!s) return 'Aan la garanayn';
    const lower = s.toLowerCase();
    // Check if water level indicates empty well
    const level = typeof waterLevel === 'number' ? waterLevel : null;
    if (lower === 'working') {
      if (level !== null && level <= 10) return 'Biyaha ayaa dhamaaday (maran) ⚠';
      return 'Waa fiican yahay ✓';
    }
    if (lower === 'broken') return 'Wuu jabay / ma shaqaynayo ✗';
    if (lower === 'needed maintenance') return 'Daryeel ayuu u baahan yahay ⚠';
    return s;
  };

  const waterLevelColor = (level) => {
    if (level === null || level === undefined) return '#546e7a';
    if (level > 60) return '#00e676';
    if (level > 30) return '#ffab40';
    return '#ff5252';
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  const menu = getMenuData();
  const isTerminal =
    step === STEPS.SUCCESS ||
    step === STEPS.ERROR ||
    step === STEPS.SHOW_STATUS;

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.dialog}>
            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{menu.title}</Text>
            </View>

            {/* ── Body ── */}
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#00e5ff" />
                  <Text style={styles.loadingText}>Fadlan sug...</Text>
                </View>
              ) : (
                <>
                  {/* Subtitle / description */}
                  {menu.subtitle ? (
                    <Text style={styles.subtitle}>{menu.subtitle}</Text>
                  ) : null}

                  {/* Status list (special case) */}
                  {step === STEPS.SHOW_STATUS && (
                    <>
                      {waterSources.length === 0 ? (
                        <Text style={styles.emptyText}>
                          Ma jiraan ceelal diiwaangashan tuuladan.
                        </Text>
                      ) : (
                        waterSources.map((src) => (
                          <View key={src.id} style={styles.statusRow}>
                            <View style={styles.sourceHeader}>
                              <Text style={styles.sourceName}>{src.name}</Text>
                              <Text style={styles.sourceType}>{src.type}</Text>
                            </View>

                            {/* Status badge */}
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: statusColor(src.status) + '20', borderColor: statusColor(src.status) + '60', borderWidth: 1 },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusBadgeText,
                                  { color: statusColor(src.status) },
                                ]}
                              >
                                {statusLabel(src.status, src.waterLevel)}
                              </Text>
                            </View>

                            {/* Water level bar */}
                            {src.waterLevel !== null && src.waterLevel !== undefined && (
                              <View style={styles.waterLevelBox}>
                                <View style={styles.waterLevelLabelRow}>
                                  <Text style={styles.waterLevelLabel}>Heerka Biyaha</Text>
                                  <Text style={[styles.waterLevelPct, { color: waterLevelColor(src.waterLevel) }]}>
                                    {src.waterLevel}%
                                  </Text>
                                </View>
                                <View style={styles.waterLevelTrack}>
                                  <View
                                    style={[
                                      styles.waterLevelFill,
                                      {
                                        width: `${Math.max(2, src.waterLevel)}%`,
                                        backgroundColor: waterLevelColor(src.waterLevel),
                                      },
                                    ]}
                                  />
                                </View>
                              </View>
                            )}
                          </View>
                        ))
                      )}
                    </>
                  )}

                  {/* Selectable option items */}
                  {menu.items.map((item) => (
                    <TouchableOpacity
                      key={item.key}
                      style={styles.optionRow}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(item)}
                    >
                      <View style={styles.optionBadge}>
                        <Text style={styles.optionBadgeText}>{item.key}</Text>
                      </View>
                      <Text style={styles.optionLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>

            {/* ── Footer ── */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>✕  Xir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 50 : 34,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#00e5ff33',
  },
  // Header
  header: {
    backgroundColor: '#16213e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#00e5ff33',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#00e5ff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Body
  body: {
    maxHeight: 420,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 8,
  },
  subtitle: {
    color: '#b0bec5',
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 20,
  },
  // Loading
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#b0bec5',
    fontSize: 15,
    marginTop: 10,
  },
  // Option rows
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
    gap: 12,
  },
  optionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00e5ff22',
    borderWidth: 1,
    borderColor: '#00e5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadgeText: {
    color: '#00e5ff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabel: {
    color: '#e0e0e0',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  // Status rows
  statusRow: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#0f3460',
  },
  sourceName: {
    color: '#e0e0e0',
    fontSize: 15,
    fontWeight: '600',
  },
  sourceType: {
    color: '#78909c',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  statusBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    color: '#78909c',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  // Footer
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#0f3460',
    alignItems: 'flex-end',
  },
  cancelBtn: {
    backgroundColor: '#ff525222',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#ff5252',
  },
  cancelBtnText: {
    color: '#ff5252',
    fontWeight: '600',
    fontSize: 14,
  },
});
