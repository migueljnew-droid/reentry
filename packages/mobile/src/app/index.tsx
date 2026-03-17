import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const stats = [
  { value: '700K', label: 'Released every year' },
  { value: '43%', label: 'Return within 3 years' },
  { value: '100+', label: 'Programs we screen' },
  { value: '$0', label: 'Always free' },
];

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>
          <Text style={styles.brand}>REENTRY</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            You did your time.{'\n'}
            <Text style={styles.heroAccent}>Now get your life back.</Text>
          </Text>
          <Text style={styles.heroSubtitle}>
            Tell us your situation. Get a personalized action plan covering ID,
            benefits, housing, employment, and legal obligations.
          </Text>
        </View>

        {/* CTA */}
        <Link href="/intake" asChild>
          <TouchableOpacity style={styles.ctaButton}>
            <Text style={styles.ctaText}>Start My Plan — It&apos;s Free</Text>
          </TouchableOpacity>
        </Link>

        <Text style={styles.subtitle}>
          No account needed. No email required. Just your voice.
        </Text>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Three steps. That&apos;s it.</Text>

          {[
            { num: '1', title: 'Tell Us Your Situation', desc: 'Voice or text — 10 minutes.' },
            { num: '2', title: 'Get Your Action Plan', desc: 'AI generates your personalized roadmap.' },
            { num: '3', title: 'Start Checking Off', desc: 'Step-by-step instructions. Track your progress.' },
          ].map((step) => (
            <View key={step.num} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{step.num}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            REENTRY is a project of FathersCAN, Inc., a 501(c)(3) nonprofit.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 16 },
  logo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#dbeffe', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 16, fontWeight: '800', color: '#1d62d8' },
  brand: { fontSize: 18, fontWeight: '800', color: '#172b54' },

  hero: { paddingVertical: 24 },
  heroTitle: { fontSize: 34, fontWeight: '800', color: '#172b54', lineHeight: 40 },
  heroAccent: { color: '#3b95f6' },
  heroSubtitle: { fontSize: 17, color: '#666', lineHeight: 24, marginTop: 12 },

  ctaButton: {
    backgroundColor: '#2577eb', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 8,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  subtitle: { textAlign: 'center', color: '#999', fontSize: 13, marginTop: 12 },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 32,
  },
  statCard: {
    width: '47%', backgroundColor: '#f8fafc', borderRadius: 16,
    padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: '#172b54' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },

  section: { marginTop: 40 },
  sectionTitle: { fontSize: 24, fontWeight: '800', color: '#172b54', marginBottom: 16 },

  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  stepNumber: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#dbeffe',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumberText: { fontSize: 18, fontWeight: '800', color: '#1d62d8' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: '#172b54' },
  stepDesc: { fontSize: 14, color: '#666', marginTop: 4 },

  footer: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  footerText: { textAlign: 'center', fontSize: 12, color: '#aaa' },
});
