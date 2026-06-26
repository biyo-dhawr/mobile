import React, { useState, useCallback, useEffect } from 'react';
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
  REPORT_DISTRICT: 'REPORT_DISTRICT',
  REPORT_VILLAGE: 'REPORT_VILLAGE',
  REPORT_SOURCE: 'REPORT_SOURCE',
  REPORT_ISSUE: 'REPORT_ISSUE',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

// Deegaannada la oggol yahay — ID-yada backend-ka laga soo qaadaa
const ALLOWED_REGIONS = ['Borama', 'Baki', 'Saylac'];

export default function USSDMenuScreen({ onClose }) {
  const [step, setStep] = useState(STEPS.REPORT_DISTRICT);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [reportResponse, setReportResponse] = useState(null);

  // Regions (filtered from backend — ID-yada saxda ah)
  const [deegaanno, setDeegaanno] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);

  // Dropdown state
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Data lists
  const [districts, setDistricts] = useState([]);
  const [villages, setVillages] = useState([]);
  const [waterSources, setWaterSources] = useState([]);

  // Selected IDs
  const [selectedVillageId, setSelectedVillageId] = useState(null);
  const [selectedSourceId, setSelectedSourceId] = useState(null);

  // ─── Load regions to find Awdal, then load its districts ───────────────────────────
  useEffect(() => {
    setLoading(true);
    getRegions()
      .then(async (regions) => {
        // Find Awdal region dynamically to ensure we have the correct ID
        const awdal = regions.find(r => r.name.toLowerCase().includes('awdal'));
        const regionId = awdal ? awdal.id : 1;
        const districtData = await getDistricts(regionId);
        setDistricts(districtData);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Cilad ayaa dhacday');
        setStep(STEPS.ERROR);
      })
      .finally(() => setLoading(false));
  }, []);

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

  // ─── Handle region selection from dropdown ───────────────────────────────────
  const handleRegionSelect = useCallback(
    (region) => {
      setSelectedRegion(region);
      setRegionDropdownOpen(false);
      doFetch(
        () => getDistricts(region.id),
        setDistricts,
        STEPS.REPORT_DISTRICT,
      );
    },
    [doFetch],
  );

  // ─── Handler: user selects an option ────────────────────────────────────────
  const handleSelect = useCallback(
    async (item) => {
      switch (step) {
        case STEPS.REPORT_DISTRICT:
          doFetch(() => getVillages(item.id), setVillages, STEPS.REPORT_VILLAGE);
          break;

        case STEPS.REPORT_VILLAGE:
          setSelectedVillageId(item.id);
          doFetch(() => getWaterSources(item.id), setWaterSources, STEPS.REPORT_SOURCE);
          break;

        case STEPS.REPORT_SOURCE:
          setSelectedSourceId(item.id);
          setStep(STEPS.REPORT_ISSUE);
          break;

        case STEPS.REPORT_ISSUE: {
          const isBroken = item.key === '1';
          const content = isBroken
            ? 'ceelka ma shaqaynayo waa jaban yahay'
            : 'ceelka waa maran yahay waa biyo la\'aan';
          const sourceStatus = isBroken ? 'Broken' : 'Needed Maintenance';
          const sourceWaterLevel = isBroken ? null : 0;
          
          setLoading(true);
          try {
            const response = await submitPublicReport(selectedVillageId, selectedSourceId, content, sourceStatus, sourceWaterLevel);
            setReportResponse(response);
            setSuccessMsg('Waa la gudbiyey cabashadaada, mahadsanid');
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
          title: '★ Biyo-dhowr *999# ★',
          subtitle: 'Dooro Deegaankaaga:',
          items: [],
          showRegionDropdown: true,
        };
      case STEPS.REPORT_DISTRICT:
        return {
          title: 'Degmada',
          subtitle: 'Dooro Degmadaada:',
          items: districts.map((d, i) => ({ key: String(i + 1), label: d.name, id: d.id })),
        };
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
            { key: '1', label: 'ceelka ma shaqaynayo waa jaban yahay' },
            { key: '2', label: 'ceelka waa maran yahay waa biyo la\'aan' },
          ],
        };
      case STEPS.SUCCESS:
        return { title: '✓ Guul!', subtitle: successMsg, items: [], report: reportResponse };
      case STEPS.ERROR:
        return { title: '✗ Cilad', subtitle: errorMsg, items: [] };
      default:
        return { title: '', subtitle: '', items: [] };
    }
  }, [step, districts, villages, waterSources, successMsg, errorMsg]);

  const menu = getMenuData();

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
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              keyboardShouldPersistTaps="handled"
            >
              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="large" color="#1428A0" />
                  <Text style={styles.loadingText}>Fadlan sug...</Text>
                </View>
              ) : (
                <>
                  {/* Subtitle */}
                  {menu.subtitle ? (
                    <Text style={styles.subtitle}>{menu.subtitle}</Text>
                  ) : null}

                  {/* ── Region Dropdown (Main Menu only) ── */}
                  {menu.showRegionDropdown && (
                    <View style={styles.dropdownWrapper}>
                      {regionsLoading ? (
                        <View style={styles.regionsLoadingBox}>
                          <ActivityIndicator size="small" color="#1428A0" />
                          <Text style={styles.regionsLoadingText}>
                            Deegaannada waa la soo qaadayaa...
                          </Text>
                        </View>
                      ) : (
                        <>
                          {/* Dropdown Button */}
                          <TouchableOpacity
                            style={[
                              styles.dropdownBtn,
                              regionDropdownOpen && styles.dropdownBtnOpen,
                            ]}
                            onPress={() => setRegionDropdownOpen((v) => !v)}
                            activeOpacity={0.8}
                          >
                            <Text
                              style={[
                                styles.dropdownBtnText,
                                !selectedRegion && styles.dropdownPlaceholder,
                              ]}
                            >
                              {selectedRegion ? selectedRegion.name : 'Dooro Deegaanka...'}
                            </Text>
                            <Text style={styles.dropdownArrow}>
                              {regionDropdownOpen ? '▲' : '▼'}
                            </Text>
                          </TouchableOpacity>

                          {/* Dropdown List */}
                          {regionDropdownOpen && (
                            <View style={styles.dropdownList}>
                              {deegaanno.map((region, idx) => (
                                <TouchableOpacity
                                  key={region.id}
                                  style={[
                                    styles.dropdownItem,
                                    idx === deegaanno.length - 1 && styles.dropdownItemLast,
                                    selectedRegion?.id === region.id && styles.dropdownItemActive,
                                  ]}
                                  onPress={() => handleRegionSelect(region)}
                                  activeOpacity={0.7}
                                >
                                  <View style={styles.dropdownItemDot} />
                                  <Text
                                    style={[
                                      styles.dropdownItemText,
                                      selectedRegion?.id === region.id && styles.dropdownItemTextActive,
                                    ]}
                                  >
                                    {region.name}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </>
                      )}
                    </View>
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

                  {/* ── Report Response Card (Removed per user request) ── */}
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 50 : 34,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    overflow: 'hidden',
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#d0d5e8',
    shadowColor: '#1428A0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  // Header
  header: {
    backgroundColor: '#1428A0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Body
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 18,
    paddingBottom: 10,
  },
  subtitle: {
    color: '#3a3a5c',
    fontSize: 14,
    marginBottom: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  // Loading
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    color: '#6e7a8a',
    fontSize: 15,
    marginTop: 10,
  },
  // Regions loading/error
  regionsLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d5e8',
  },
  regionsLoadingText: {
    color: '#6e7a8a',
    fontSize: 14,
  },
  regionsErrorBox: {
    alignItems: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  regionsErrorText: {
    color: '#e53935',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#e8ecf8',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#1428A0',
  },
  retryBtnText: {
    color: '#1428A0',
    fontWeight: '600',
    fontSize: 14,
  },
  // ── Dropdown ─────────────────────────────────────────────────────────────────
  dropdownWrapper: {
    marginBottom: 10,
    zIndex: 99,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: '#1428A0',
    justifyContent: 'space-between',
  },
  dropdownBtnOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomColor: '#d0d5e8',
  },
  dropdownBtnText: {
    color: '#1428A0',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#a0aab8',
    fontWeight: '400',
  },
  dropdownArrow: {
    color: '#1428A0',
    fontSize: 12,
    marginLeft: 8,
  },
  dropdownList: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#1428A0',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#1428A0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f2f8',
    gap: 10,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemActive: {
    backgroundColor: '#e8ecf8',
  },
  dropdownItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1428A0',
    opacity: 0.5,
  },
  dropdownItemText: {
    color: '#1a1a2e',
    fontSize: 15,
    fontWeight: '500',
  },
  dropdownItemTextActive: {
    color: '#1428A0',
    fontWeight: '700',
  },
  emptyDropdown: {
    color: '#a0aab8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 16,
  },
  // Regions loading
  regionsLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d0d5e8',
  },
  regionsLoadingText: {
    color: '#6e7a8a',
    fontSize: 14,
  },
  // Option rows
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f6fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d0d5e8',
    gap: 12,
  },
  optionBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1428A0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionBadgeText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  optionLabel: {
    color: '#1a1a2e',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  // Footer
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf8',
    alignItems: 'flex-end',
    backgroundColor: '#fafbff',
  },
  cancelBtn: {
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e53935',
  },
  cancelBtnText: {
    color: '#e53935',
    fontWeight: '600',
    fontSize: 14,
  },
  // ── Report card (backend response) ───────────────────────────────────────────
  reportCard: {
    marginTop: 14,
    backgroundColor: '#f0f4ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c5d0f0',
    overflow: 'hidden',
  },
  reportCardTitle: {
    backgroundColor: '#1428A0',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 14,
    letterSpacing: 0.5,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#dde4f5',
    gap: 8,
  },
  reportKey: {
    color: '#5a6a9a',
    fontSize: 12,
    fontWeight: '600',
    width: 100,
    flexShrink: 0,
  },
  reportVal: {
    color: '#1a1a2e',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});
