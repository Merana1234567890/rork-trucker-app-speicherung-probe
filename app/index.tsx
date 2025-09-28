import { Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default function Index() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Redirect href="/(tabs)/dashboard" />
    </View>
  );
}