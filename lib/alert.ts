import { Alert, Platform } from 'react-native';

// Cross-platform confirm dialog — Alert.alert is a no-op on web
export function confirm(
  title: string,
  message: string,
  onConfirm: () => void,
  destructive = false
) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'OK', style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  }
}

export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
}
