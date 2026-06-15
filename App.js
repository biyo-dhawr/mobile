import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import DialerScreen from './screens/DialerScreen';
import USSDMenuScreen from './screens/USSDMenuScreen';

export default function App() {
  const [ussdSession, setUssdSession] = useState(false);

  const handleDial = (code) => {
    if (code === '*999#') {
      setUssdSession(true);
    } else {
      Alert.alert(
        'Koodh Khaldan',
        'Koodh aan saxsanayn ayaad galaysay.\nFadlan ku garaac *999# si aad u gelid nidaamka.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleCloseSession = () => {
    setUssdSession(false);
  };

  return (
    <View style={styles.container}>
      <DialerScreen onDial={handleDial} />
      {ussdSession && (
        <USSDMenuScreen onClose={handleCloseSession} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
});
