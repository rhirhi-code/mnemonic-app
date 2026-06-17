import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface Props {
  pendingCount: number;
  errorCount: number;
}

export function AIStatusBanner({ pendingCount, errorCount }: Props) {
  if (pendingCount === 0 && errorCount === 0) return null;

  return (
    <View style={styles.banner}>
      {pendingCount > 0 && (
        <>
          <ActivityIndicator size="small" color="#888" style={styles.spinner} />
          <Text style={styles.text}>
            Categorizing {pendingCount} {pendingCount === 1 ? 'note' : 'notes'}…
          </Text>
        </>
      )}
      {errorCount > 0 && (
        <Text style={[styles.text, styles.errorText, pendingCount > 0 && styles.errorSpacer]}>
          {errorCount} {errorCount === 1 ? 'note' : 'notes'} failed to categorize
        </Text>
      )}
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
  errorText: {
    color: '#C0392B',
  },
  errorSpacer: {
    marginLeft: 12,
  },
});
