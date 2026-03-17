import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

type Stage = 'name' | 'state' | 'conviction' | 'needs' | 'review';

const STATES = [
  { code: 'GA', name: 'Georgia' },
  { code: 'CA', name: 'California' },
  { code: 'TN', name: 'Tennessee' },
];

const CONVICTIONS = [
  { value: 'nonviolent_drug', label: 'Non-violent Drug' },
  { value: 'violent', label: 'Violent' },
  { value: 'property', label: 'Property Crime' },
  { value: 'dui', label: 'DUI/DWI' },
  { value: 'other', label: 'Other' },
];

const NEEDS = [
  { value: 'shelter', label: 'Place to stay', emoji: '🏠' },
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'phone', label: 'Phone', emoji: '📱' },
  { value: 'transportation', label: 'Transportation', emoji: '🚌' },
];

export default function Intake() {
  const [stage, setStage] = useState<Stage>('name');
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [conviction, setConviction] = useState('');
  const [needs, setNeeds] = useState<string[]>([]);

  const toggleNeed = (need: string) => {
    setNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Assistant message */}
        <View style={styles.assistantBubble}>
          <View style={styles.assistantIcon}>
            <Text style={{ fontSize: 20 }}>🤝</Text>
          </View>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>
              {stage === 'name' && "Welcome to REENTRY. I'm here to build your personal action plan. What's your name?"}
              {stage === 'state' && `Nice to meet you, ${name}. What state were you released in?`}
              {stage === 'conviction' && 'What type of conviction? This helps find the right programs.'}
              {stage === 'needs' && 'What do you need right now? Select all that apply.'}
              {stage === 'review' && "Here's what I have. Ready to build your plan?"}
            </Text>
          </View>
        </View>

        {/* Input area */}
        {stage === 'name' && (
          <View style={styles.inputArea}>
            <TextInput
              style={styles.textInput}
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoFocus
              placeholderTextColor="#999"
            />
            <TouchableOpacity
              style={[styles.nextBtn, !name && styles.nextBtnDisabled]}
              disabled={!name}
              onPress={() => setStage('state')}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'state' && (
          <View style={styles.inputArea}>
            {STATES.map((s) => (
              <TouchableOpacity
                key={s.code}
                style={[styles.optionCard, state === s.code && styles.optionSelected]}
                onPress={() => setState(s.code)}
              >
                <Text style={[styles.optionText, state === s.code && styles.optionTextSelected]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextBtn, !state && styles.nextBtnDisabled]}
              disabled={!state}
              onPress={() => setStage('conviction')}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'conviction' && (
          <View style={styles.inputArea}>
            {CONVICTIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.optionCard, conviction === c.value && styles.optionSelected]}
                onPress={() => setConviction(c.value)}
              >
                <Text style={[styles.optionText, conviction === c.value && styles.optionTextSelected]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.nextBtn, !conviction && styles.nextBtnDisabled]}
              disabled={!conviction}
              onPress={() => setStage('needs')}
            >
              <Text style={styles.nextBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'needs' && (
          <View style={styles.inputArea}>
            {NEEDS.map((n) => (
              <TouchableOpacity
                key={n.value}
                style={[styles.optionCard, needs.includes(n.value) && styles.optionSelected]}
                onPress={() => toggleNeed(n.value)}
              >
                <Text style={{ fontSize: 20, marginRight: 8 }}>{n.emoji}</Text>
                <Text style={[styles.optionText, needs.includes(n.value) && styles.optionTextSelected]}>
                  {n.label}
                </Text>
                {needs.includes(n.value) && <Text style={{ marginLeft: 'auto', color: '#2577eb' }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setStage('review')}
            >
              <Text style={styles.nextBtnText}>
                {needs.length > 0 ? `Continue (${needs.length})` : 'Skip'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {stage === 'review' && (
          <View style={styles.inputArea}>
            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Name</Text>
              <Text style={styles.reviewValue}>{name}</Text>
              <Text style={styles.reviewLabel}>State</Text>
              <Text style={styles.reviewValue}>{STATES.find((s) => s.code === state)?.name}</Text>
              <Text style={styles.reviewLabel}>Conviction</Text>
              <Text style={styles.reviewValue}>{CONVICTIONS.find((c) => c.value === conviction)?.label}</Text>
              {needs.length > 0 && (
                <>
                  <Text style={styles.reviewLabel}>Immediate Needs</Text>
                  <Text style={styles.reviewValue}>{needs.join(', ')}</Text>
                </>
              )}
            </View>
            <TouchableOpacity style={styles.generateBtn}>
              <Text style={styles.generateBtnText}>Build My Action Plan</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Voice button */}
      <View style={styles.voiceBtnContainer}>
        <TouchableOpacity style={styles.voiceBtn}>
          <Text style={{ fontSize: 28, color: '#fff' }}>🎤</Text>
        </TouchableOpacity>
        <Text style={styles.voiceHint}>Tap to speak</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 24, paddingBottom: 120 },

  assistantBubble: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 24 },
  assistantIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#dbeffe',
    alignItems: 'center', justifyContent: 'center',
  },
  bubble: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, borderTopLeftRadius: 4,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  bubbleText: { fontSize: 17, color: '#333', lineHeight: 24 },

  inputArea: { gap: 12 },
  textInput: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, fontSize: 18,
    borderWidth: 2, borderColor: '#e2e8f0', color: '#172b54',
  },

  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 18, borderWidth: 2, borderColor: '#e2e8f0',
  },
  optionSelected: { borderColor: '#2577eb', backgroundColor: '#eff8ff' },
  optionText: { fontSize: 17, fontWeight: '600', color: '#333' },
  optionTextSelected: { color: '#1d62d8' },

  nextBtn: {
    backgroundColor: '#2577eb', borderRadius: 16, paddingVertical: 18,
    alignItems: 'center', marginTop: 8,
  },
  nextBtnDisabled: { backgroundColor: '#94a3b8' },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  reviewCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  reviewLabel: { fontSize: 13, color: '#888', marginTop: 12 },
  reviewValue: { fontSize: 17, fontWeight: '600', color: '#172b54', marginTop: 2 },

  generateBtn: {
    backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 20,
    alignItems: 'center', marginTop: 8,
  },
  generateBtnText: { color: '#fff', fontSize: 18, fontWeight: '800' },

  voiceBtnContainer: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    alignItems: 'center',
  },
  voiceBtn: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#2577eb',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#2577eb', shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  voiceHint: { fontSize: 12, color: '#888', marginTop: 6 },
});
