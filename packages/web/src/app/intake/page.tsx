'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { VoiceRecorder, isVoiceSupported } from '@/lib/voice';
import { cachePlan } from '@/lib/offline';
import { generateReentryPlan } from '@/app/actions/generate-plan';
import { transcribeVoice } from '@/app/actions/transcribe';
import { CONVICTION_TYPES, IMMEDIATE_NEEDS, US_STATES, PILOT_STATES } from '@reentry/shared';
import Link from 'next/link';

type IntakeStage =
  | 'welcome'
  | 'name'
  | 'state'
  | 'conviction'
  | 'release_date'
  | 'immediate_needs'
  | 'family'
  | 'skills'
  | 'supervision'
  | 'review'
  | 'generating';

interface IntakeData {
  fullName: string;
  state: string;
  convictionType: string;
  releaseDate: string;
  immediateNeeds: string[];
  hasChildren: boolean;
  numberOfChildren: number;
  hasSupportNetwork: boolean;
  workHistory: string;
  education: string;
  supervisionType: string;
  checkInFrequency: string;
}

const STAGE_ORDER: IntakeStage[] = [
  'welcome', 'name', 'state', 'conviction', 'release_date',
  'immediate_needs', 'family', 'skills', 'supervision', 'review', 'generating',
];

const STAGE_PROGRESS: Record<IntakeStage, number> = {
  welcome: 0,
  name: 10,
  state: 20,
  conviction: 30,
  release_date: 40,
  immediate_needs: 50,
  family: 60,
  skills: 70,
  supervision: 80,
  review: 90,
  generating: 100,
};

const STAGE_QUESTIONS: Record<IntakeStage, string> = {
  welcome: "Welcome to REENTRY. I'm here to build your personal action plan. Let's start — what's your name?",
  name: "What state were you released in (or will be released in)?",
  state: "What type of conviction are you dealing with? This helps me find the right programs for you.",
  conviction: "When were you released (or when will you be released)?",
  release_date: "What do you need right now? Select everything that applies.",
  immediate_needs: "Do you have children? And do you have a support network — family or friends who can help?",
  family: "Tell me about your work experience. What did you do before? Any skills or certifications?",
  skills: "Are you on parole or probation? How often do you check in?",
  supervision: "Here's what I have. Let's review it and then I'll build your plan.",
  review: "",
  generating: "Building your personalized action plan...",
};

export default function IntakePage() {
  const [stage, setStage] = useState<IntakeStage>('welcome');
  const [data, setData] = useState<IntakeData>({
    fullName: '',
    state: '',
    convictionType: '',
    releaseDate: '',
    immediateNeeds: [],
    hasChildren: false,
    numberOfChildren: 0,
    hasSupportNetwork: false,
    workHistory: '',
    education: '',
    supervisionType: '',
    checkInFrequency: '',
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setVoiceSupported(isVoiceSupported());
    recorderRef.current = new VoiceRecorder();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [stage]);

  const nextStage = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex < STAGE_ORDER.length - 1) {
      setStage(STAGE_ORDER[currentIndex + 1]);
    }
  }, [stage]);

  const prevStage = useCallback(() => {
    const currentIndex = STAGE_ORDER.indexOf(stage);
    if (currentIndex > 0) {
      setStage(STAGE_ORDER[currentIndex - 1]);
    }
  }, [stage]);

  const [transcribing, setTranscribing] = useState(false);

  const toggleRecording = async () => {
    if (!recorderRef.current) return;

    if (isRecording) {
      const blob = await recorderRef.current.stop();
      setIsRecording(false);
      setTranscribing(true);

      try {
        // Send to Whisper API for transcription
        const formData = new FormData();
        formData.append('audio', blob, 'recording.webm');
        const result = await transcribeVoice(formData);

        if (result.transcript) {
          // Auto-fill the current field based on stage
          const text = result.transcript.trim();
          if (stage === 'welcome' && !data.fullName) {
            setData((prev) => ({ ...prev, fullName: text }));
          } else if (stage === 'family') {
            setData((prev) => ({ ...prev, workHistory: prev.workHistory ? `${prev.workHistory} ${text}` : text }));
          }
          // For other stages, voice is used to navigate — show transcript
          console.log('Transcription:', text);
        }
      } catch (err) {
        console.error('Transcription error:', err);
      } finally {
        setTranscribing(false);
      }
    } else {
      await recorderRef.current.start();
      setIsRecording(true);
    }
  };

  const toggleNeed = (need: string) => {
    setData((prev) => ({
      ...prev,
      immediateNeeds: prev.immediateNeeds.includes(need)
        ? prev.immediateNeeds.filter((n) => n !== need)
        : [...prev.immediateNeeds, need],
    }));
  };

  const pilotStates = PILOT_STATES as readonly string[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50" role="banner">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="REENTRY home">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
              R
            </div>
            <span className="font-bold text-primary-950">REENTRY</span>
          </Link>
          <ProgressBar value={STAGE_PROGRESS[stage]} showPercentage={false} />
        </div>
      </header>

      {/* Chat-style intake */}
      <main className="max-w-2xl mx-auto px-6 py-8 pb-32">
        {/* Assistant message */}
        <div className="animate-fade-in mb-8" aria-live="polite" aria-atomic="true">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-lg flex-shrink-0" aria-hidden="true">
              🤝
            </div>
            <div className="bg-white rounded-2xl rounded-tl-md p-5 shadow-sm border border-gray-100 max-w-[85%]">
              <p className="text-lg text-gray-800 leading-relaxed">
                {STAGE_QUESTIONS[stage]}
              </p>
            </div>
          </div>
        </div>

        {/* Input area per stage */}
        <div className="animate-slide-up">
          {stage === 'welcome' && (
            <div className="space-y-4">
              <label htmlFor="intake-name" className="sr-only">Your name</label>
              <input
                id="intake-name"
                type="text"
                placeholder="Your name"
                aria-label="Your name"
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-100 outline-none"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                autoFocus
              />
              <Button
                size="lg"
                className="w-full"
                disabled={!data.fullName.trim()}
                onClick={nextStage}
              >
                Continue
              </Button>
            </div>
          )}

          {stage === 'name' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(US_STATES)
                  .filter(([code]) => pilotStates.includes(code))
                  .map(([code, name]) => (
                    <button
                      key={code}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        data.state === code
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                      onClick={() => setData({ ...data, state: code })}
                    >
                      <div className="font-semibold">{name}</div>
                      <div className="text-sm text-gray-500">{code}</div>
                    </button>
                  ))}
                <button
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    data.state === 'FED'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setData({ ...data, state: 'FED' })}
                >
                  <div className="font-semibold">Federal</div>
                  <div className="text-sm text-gray-500">BOP</div>
                </button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                More states coming soon. Currently available: Georgia, California, Tennessee.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={!data.state}
                  onClick={nextStage}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {stage === 'state' && (
            <div className="space-y-3">
              {CONVICTION_TYPES.map((type: { value: string; label: string }) => (
                <button
                  key={type.value}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    data.convictionType === type.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setData({ ...data, convictionType: type.value })}
                >
                  <div className="font-semibold">{type.label}</div>
                </button>
              ))}
              <p className="text-xs text-gray-400 text-center mt-2">
                This helps determine which programs you qualify for and any employment restrictions.
                Your information is private and encrypted.
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={!data.convictionType}
                  onClick={nextStage}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {stage === 'conviction' && (
            <div className="space-y-4">
              <label htmlFor="intake-release-date" className="sr-only">Release date</label>
              <input
                id="intake-release-date"
                type="date"
                aria-label="Release date"
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-100 outline-none"
                value={data.releaseDate}
                onChange={(e) => setData({ ...data, releaseDate: e.target.value })}
              />
              <Button
                variant="ghost"
                className="text-primary-600"
                onClick={() => {
                  setData({ ...data, releaseDate: new Date().toISOString().split('T')[0] });
                }}
              >
                I was already released
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>
                  Back
                </Button>
                <Button
                  size="lg"
                  className="flex-1"
                  disabled={!data.releaseDate}
                  onClick={nextStage}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {stage === 'release_date' && (
            <div className="space-y-3">
              {IMMEDIATE_NEEDS.map((need: { value: string; label: string; icon: string }) => (
                <button
                  key={need.value}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                    data.immediateNeeds.includes(need.value)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => toggleNeed(need.value)}
                >
                  <span className="text-2xl">{need.icon}</span>
                  <span className="font-medium">{need.label}</span>
                  {data.immediateNeeds.includes(need.value) && (
                    <span className="ml-auto text-primary-600">✓</span>
                  )}
                </button>
              ))}
              <div className="flex gap-3 mt-4">
                <Button variant="ghost" onClick={prevStage}>
                  Back
                </Button>
                <Button size="lg" className="flex-1" onClick={nextStage}>
                  {data.immediateNeeds.length > 0
                    ? `Continue (${data.immediateNeeds.length} selected)`
                    : "Skip \u2014 I\u2019m okay for now"}
                </Button>
              </div>
            </div>
          )}

          {stage === 'immediate_needs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    data.hasChildren
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setData({ ...data, hasChildren: true })}
                >
                  <div className="text-2xl mb-1">👶</div>
                  <div className="font-semibold">Yes, I have children</div>
                </button>
                <button
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    !data.hasChildren
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => setData({ ...data, hasChildren: false })}
                >
                  <div className="text-2xl mb-1">—</div>
                  <div className="font-semibold">No children</div>
                </button>
              </div>
              {data.hasChildren && (
                <>
                  <label htmlFor="intake-children-count" className="sr-only">Number of children</label>
                  <input
                    id="intake-children-count"
                    type="number"
                    min="1"
                    max="20"
                    placeholder="How many children?"
                    aria-label="Number of children"
                    className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-primary-400 outline-none"
                    value={data.numberOfChildren || ''}
                    onChange={(e) =>
                      setData({ ...data, numberOfChildren: parseInt(e.target.value) || 0 })
                    }
                  />
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    data.hasSupportNetwork
                      ? 'border-accent-500 bg-accent-50'
                      : 'border-gray-200 hover:border-accent-300'
                  }`}
                  onClick={() => setData({ ...data, hasSupportNetwork: true })}
                >
                  <div className="font-semibold">I have support</div>
                  <div className="text-sm text-gray-500">Family or friends</div>
                </button>
                <button
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    !data.hasSupportNetwork
                      ? 'border-warm-500 bg-warm-50'
                      : 'border-gray-200 hover:border-warm-300'
                  }`}
                  onClick={() => setData({ ...data, hasSupportNetwork: false })}
                >
                  <div className="font-semibold">On my own</div>
                  <div className="text-sm text-gray-500">No support network</div>
                </button>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>Back</Button>
                <Button size="lg" className="flex-1" onClick={nextStage}>Continue</Button>
              </div>
            </div>
          )}

          {stage === 'family' && (
            <div className="space-y-4">
              <label htmlFor="intake-work-history" className="sr-only">Work history and skills</label>
              <textarea
                id="intake-work-history"
                placeholder="What kind of work did you do before? Any trades, skills, or certifications? (Example: 'I did construction for 5 years and have a CDL')"
                aria-label="Work history and skills"
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-primary-400 outline-none resize-none"
                rows={4}
                value={data.workHistory}
                onChange={(e) => setData({ ...data, workHistory: e.target.value })}
              />
              <label htmlFor="intake-education" className="sr-only">Education level</label>
              <select
                id="intake-education"
                aria-label="Education level"
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-primary-400 outline-none"
                value={data.education}
                onChange={(e) => setData({ ...data, education: e.target.value })}
              >
                <option value="">Education level</option>
                <option value="none">No diploma</option>
                <option value="ged">GED</option>
                <option value="high_school">High school diploma</option>
                <option value="some_college">Some college</option>
                <option value="associates">Associate degree</option>
                <option value="bachelors">Bachelor&apos;s degree</option>
                <option value="graduate">Graduate degree</option>
              </select>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>Back</Button>
                <Button size="lg" className="flex-1" onClick={nextStage}>
                  {data.workHistory ? 'Continue' : 'Skip for now'}
                </Button>
              </div>
            </div>
          )}

          {stage === 'skills' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {['parole', 'probation', 'none'].map((type: string) => (
                  <button
                    key={type}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      data.supervisionType === type
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setData({ ...data, supervisionType: type })}
                  >
                    <div className="font-semibold capitalize">{type}</div>
                  </button>
                ))}
              </div>
              {data.supervisionType && data.supervisionType !== 'none' && (
                <>
                  <label htmlFor="intake-check-in" className="sr-only">Check-in frequency</label>
                  <select
                    id="intake-check-in"
                    aria-label="Check-in frequency"
                    className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:border-primary-400 outline-none"
                    value={data.checkInFrequency}
                    onChange={(e) => setData({ ...data, checkInFrequency: e.target.value })}
                  >
                    <option value="">How often do you check in?</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every two weeks</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="unknown">I&apos;m not sure</option>
                </select>
                </>
              )}
              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>Back</Button>
                <Button size="lg" className="flex-1" onClick={nextStage}>
                  Review My Info
                </Button>
              </div>
            </div>
          )}

          {stage === 'supervision' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="font-bold text-lg mb-4 text-primary-950">Your Information</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="font-medium">{data.fullName}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">State</dt>
                    <dd className="font-medium">{US_STATES[data.state] || data.state}</dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Conviction Type</dt>
                    <dd className="font-medium">
                      {CONVICTION_TYPES.find((t: { value: string; label: string }) => t.value === data.convictionType)?.label}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Release Date</dt>
                    <dd className="font-medium">{data.releaseDate}</dd>
                  </div>
                  {data.immediateNeeds.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-500">Immediate Needs</dt>
                      <dd className="font-medium text-right">
                        {data.immediateNeeds.join(', ')}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Children</dt>
                    <dd className="font-medium">
                      {data.hasChildren ? `Yes (${data.numberOfChildren})` : 'No'}
                    </dd>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <dt className="text-gray-500">Supervision</dt>
                    <dd className="font-medium capitalize">
                      {data.supervisionType || 'None'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" onClick={prevStage}>
                  Edit
                </Button>
                <Button
                  variant="accent"
                  size="lg"
                  className="flex-1"
                  loading={isGenerating}
                  onClick={async () => {
                    setStage('generating');
                    setIsGenerating(true);
                    setGenerationProgress(20);

                    try {
                      setGenerationProgress(40);
                      const plan = await generateReentryPlan(data);
                      setGenerationProgress(80);

                      // Cache plan offline
                      cachePlan(plan.id, plan as unknown as Record<string, unknown>);
                      setGenerationProgress(100);

                      // Store in sessionStorage for the plan page
                      sessionStorage.setItem('reentry-plan', JSON.stringify(plan));

                      // Navigate to plan
                      router.push(`/plan/${plan.id}`);
                    } catch (err) {
                      console.error('Plan generation failed:', err);
                      setIsGenerating(false);
                      setStage('review');
                    }
                  }}
                >
                  Build My Action Plan
                </Button>
              </div>
            </div>
          )}

          {stage === 'generating' && (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6 animate-pulse-gentle">
                <span className="text-3xl">🧠</span>
              </div>
              <h2 className="text-2xl font-bold text-primary-950 mb-3">
                Building your plan...
              </h2>
              <p className="text-gray-600 mb-8">
                Cross-referencing {US_STATES[data.state] || 'your state'} requirements,
                screening benefits, and finding resources near you.
              </p>
              <ProgressBar value={generationProgress} label="Generating action plan" color="primary" />
              <p className="text-sm text-gray-400 mt-4">
                This usually takes less than 60 seconds.
              </p>
            </div>
          )}
        </div>

        {/* Voice button (floating) */}
        {voiceSupported && stage !== 'generating' && stage !== 'supervision' && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <button
              className={
                transcribing
                  ? 'voice-btn animate-pulse-gentle'
                  : isRecording
                  ? 'voice-btn-recording'
                  : 'voice-btn'
              }
              onClick={toggleRecording}
              disabled={transcribing}
              aria-label={
                transcribing
                  ? 'Processing voice...'
                  : isRecording
                  ? 'Stop recording'
                  : 'Start voice input'
              }
            >
              {transcribing ? (
                <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : isRecording ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
                </svg>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              {transcribing ? 'Processing...' : isRecording ? 'Listening...' : 'Tap to speak'}
            </p>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>
    </div>
  );
}
