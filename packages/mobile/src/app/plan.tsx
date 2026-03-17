import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Step {
  id: string;
  title: string;
  icon: string;
  instructions: string[];
  deadline: string;
  completed: boolean;
}

interface Phase {
  id: string;
  label: string;
  description: string;
  color: string;
  steps: Step[];
}

const DEMO_PHASES: Phase[] = [
  {
    id: 'immediate',
    label: 'First 72 Hours',
    description: 'Emergency needs',
    color: '#ef4444',
    steps: [
      {
        id: '1', title: 'Find emergency shelter', icon: '🏠',
        instructions: ['Call Atlanta Mission: 404-367-2493', 'Bring release paperwork'],
        deadline: 'Today', completed: false,
      },
      {
        id: '2', title: 'Get free phone (Lifeline)', icon: '📱',
        instructions: ['Apply at lifelinesupport.org', 'Bring proof of income or SNAP enrollment'],
        deadline: 'Within 3 days', completed: false,
      },
      {
        id: '3', title: 'Report to parole officer', icon: '📋',
        instructions: ['Within 72 hours of release', 'Bring release documents + proof of address'],
        deadline: 'Within 72 hours', completed: false,
      },
    ],
  },
  {
    id: 'week_1',
    label: 'Week 1',
    description: 'ID and healthcare',
    color: '#f97316',
    steps: [
      {
        id: '4', title: 'Replace Social Security card', icon: '🪪',
        instructions: ['Visit local SSA office', 'FREE — processing ~14 days'],
        deadline: 'This week', completed: false,
      },
      {
        id: '5', title: 'Apply for Medicaid', icon: '🏥',
        instructions: ['Apply at gateway.ga.gov', 'Most returning citizens auto-qualify'],
        deadline: 'This week', completed: false,
      },
    ],
  },
  {
    id: 'month_1',
    label: 'Month 1',
    description: 'Benefits and employment',
    color: '#3b82f6',
    steps: [
      {
        id: '6', title: 'Get State ID', icon: '🪪',
        instructions: ['Visit DDS with birth cert + SSN card + proof of address', 'Fee: $32 (waiver available)'],
        deadline: 'Within 30 days', completed: false,
      },
      {
        id: '7', title: 'Apply for SNAP', icon: '💰',
        instructions: ['Apply at gateway.ga.gov', 'Benefits: $234-$1,751/month'],
        deadline: 'Within 30 days', completed: false,
      },
      {
        id: '8', title: 'Start job search', icon: '💼',
        instructions: ['Visit Goodwill: 404-420-9900', 'Amazon, Walmart, FedEx hire with records'],
        deadline: 'Month 1', completed: false,
      },
    ],
  },
];

export default function PlanScreen() {
  const [phases, setPhases] = useState(DEMO_PHASES);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalSteps = phases.reduce((acc, p) => acc + p.steps.length, 0);
  const completedSteps = phases.reduce(
    (acc, p) => acc + p.steps.filter((s) => s.completed).length, 0
  );
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const toggleStep = (phaseId: string, stepId: string) => {
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, steps: p.steps.map((s) => s.id === stepId ? { ...s, completed: !s.completed } : s) }
          : p
      )
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>
            {completedSteps} of {totalSteps} steps completed
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressPercent}>{progress}%</Text>
        </View>

        {/* Phases */}
        {phases.map((phase) => (
          <View key={phase.id} style={styles.phaseSection}>
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
              <Text style={styles.phaseLabel}>{phase.label}</Text>
              <Text style={styles.phaseCount}>
                {phase.steps.filter((s) => s.completed).length}/{phase.steps.length}
              </Text>
            </View>

            {phase.steps.map((step) => (
              <TouchableOpacity
                key={step.id}
                style={[styles.stepCard, step.completed && styles.stepCompleted]}
                onPress={() => setExpandedId(expandedId === step.id ? null : step.id)}
              >
                <TouchableOpacity
                  style={[styles.checkbox, step.completed && styles.checkboxChecked]}
                  onPress={() => toggleStep(phase.id, step.id)}
                >
                  {step.completed && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <View style={styles.stepContent}>
                  <View style={styles.stepTitleRow}>
                    <Text style={{ fontSize: 18 }}>{step.icon}</Text>
                    <Text style={[styles.stepTitle, step.completed && styles.stepTitleDone]}>
                      {step.title}
                    </Text>
                  </View>
                  <Text style={styles.stepDeadline}>{step.deadline}</Text>
                  {expandedId === step.id && (
                    <View style={styles.instructions}>
                      {step.instructions.map((inst, i) => (
                        <View key={i} style={styles.instructionRow}>
                          <View style={styles.instructionNum}>
                            <Text style={styles.instructionNumText}>{i + 1}</Text>
                          </View>
                          <Text style={styles.instructionText}>{inst}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40 },

  progressCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  progressLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  progressBar: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 5 },
  progressPercent: { fontSize: 24, fontWeight: '800', color: '#172b54', marginTop: 8, textAlign: 'right' },

  phaseSection: { marginBottom: 24 },
  phaseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  phaseDot: { width: 10, height: 10, borderRadius: 5 },
  phaseLabel: { fontSize: 18, fontWeight: '700', color: '#172b54', flex: 1 },
  phaseCount: { fontSize: 13, color: '#999' },

  stepCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 8,
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  stepCompleted: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },

  checkbox: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },

  stepContent: { flex: 1 },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepTitle: { fontSize: 16, fontWeight: '600', color: '#172b54', flex: 1 },
  stepTitleDone: { color: '#9ca3af', textDecorationLine: 'line-through' },
  stepDeadline: { fontSize: 12, color: '#999', marginTop: 4 },

  instructions: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  instructionNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#dbeffe',
    alignItems: 'center', justifyContent: 'center',
  },
  instructionNumText: { fontSize: 11, fontWeight: '700', color: '#1d62d8' },
  instructionText: { fontSize: 14, color: '#555', flex: 1, lineHeight: 20 },
});
