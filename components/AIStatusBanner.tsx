import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface Props {
  pendingCount: number;
}

export function AIStatusBanner({ pendingCount }: Props) {
  if (pendingCount === 0) return null;

  return (
    <View style={styles.banner}>
      <ActivityIndicator size="small" color="#888" style={styles.spinner} />
      <Text style={styles.text}>
        Categorizing {pendingCount} {pendingCount === 1 ? 'note' : 'notes'}…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    fontSize: 13,
    color: '#666',
  },
});
