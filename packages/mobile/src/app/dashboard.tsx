import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

const DEADLINES = [
  { id: '1', title: 'Parole check-in', date: 'March 24', days: 7, category: '📋' },
  { id: '2', title: 'Pick up SS card', date: 'March 31', days: 14, category: '🪪' },
  { id: '3', title: 'SNAP recertification', date: 'April 15', days: 29, category: '💰' },
];

const CATEGORIES = [
  { name: 'ID', icon: '🪪', progress: 66 },
  { name: 'Benefits', icon: '💰', progress: 40 },
  { name: 'Housing', icon: '🏠', progress: 20 },
  { name: 'Employment', icon: '💼', progress: 10 },
  { name: 'Supervision', icon: '📋', progress: 50 },
  { name: 'Healthcare', icon: '🏥', progress: 80 },
];

export default function Dashboard() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Welcome back</Text>

        {/* Overall progress */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: '#22c55e' }]}>5</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: '#3b82f6' }]}>3</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: '#9ca3af' }]}>6</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>By Category</Text>
          {CATEGORIES.map((cat) => (
            <View key={cat.name} style={styles.catRow}>
              <Text style={{ fontSize: 18, width: 30 }}>{cat.icon}</Text>
              <Text style={styles.catName}>{cat.name}</Text>
              <View style={styles.catBar}>
                <View style={[styles.catFill, { width: `${cat.progress}%`, backgroundColor: cat.progress >= 70 ? '#22c55e' : '#3b82f6' }]} />
              </View>
              <Text style={styles.catPercent}>{cat.progress}%</Text>
            </View>
          ))}
        </View>

        {/* Deadlines */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Deadlines</Text>
          {DEADLINES.map((d) => (
            <View
              key={d.id}
              style={[
                styles.deadlineRow,
                d.days <= 3 ? styles.deadlineUrgent : d.days <= 7 ? styles.deadlineWarn : {},
              ]}
            >
              <Text style={{ fontSize: 18 }}>{d.category}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.deadlineTitle}>{d.title}</Text>
                <Text style={styles.deadlineDate}>{d.date}</Text>
              </View>
              <View style={[
                styles.daysBadge,
                d.days <= 3 ? { backgroundColor: '#fee2e2' } : d.days <= 7 ? { backgroundColor: '#fef3c7' } : {},
              ]}>
                <Text style={[
                  styles.daysText,
                  d.days <= 3 ? { color: '#dc2626' } : d.days <= 7 ? { color: '#d97706' } : {},
                ]}>
                  {d.days}d
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <Link href="/plan" style={styles.actionCard}>
            <Text style={{ fontSize: 24, textAlign: 'center' }}>📋</Text>
            <Text style={styles.actionText}>View Plan</Text>
          </Link>
          <Link href="/intake" style={styles.actionCard}>
            <Text style={{ fontSize: 24, textAlign: 'center' }}>🔄</Text>
            <Text style={styles.actionText}>Update Info</Text>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: '800', color: '#172b54', marginBottom: 20 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#172b54', marginBottom: 12 },

  progressBar: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 5 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  catName: { fontSize: 14, color: '#555', width: 80 },
  catBar: { flex: 1, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
  catFill: { height: '100%', borderRadius: 4 },
  catPercent: { fontSize: 13, fontWeight: '700', color: '#172b54', width: 35, textAlign: 'right' },

  deadlineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  deadlineUrgent: { backgroundColor: '#fef2f2', marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 8 },
  deadlineWarn: { backgroundColor: '#fffbeb', marginHorizontal: -20, paddingHorizontal: 20, borderRadius: 8 },
  deadlineTitle: { fontSize: 15, fontWeight: '600', color: '#172b54' },
  deadlineDate: { fontSize: 12, color: '#888', marginTop: 2 },
  daysBadge: { backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  daysText: { fontSize: 13, fontWeight: '700', color: '#666' },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  actionText: { fontSize: 14, fontWeight: '600', color: '#172b54', marginTop: 8, textAlign: 'center' },
});
