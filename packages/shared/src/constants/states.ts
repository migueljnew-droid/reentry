export const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
  FED: 'Federal',
};

export const PILOT_STATES = ['GA', 'CA', 'TN'] as const;
export type PilotState = typeof PILOT_STATES[number];

export const CONVICTION_TYPES = [
  { value: 'nonviolent_drug', label: 'Non-violent Drug Offense' },
  { value: 'violent', label: 'Violent Offense' },
  { value: 'sex_offense', label: 'Sex Offense' },
  { value: 'property', label: 'Property Crime' },
  { value: 'dui', label: 'DUI/DWI' },
  { value: 'white_collar', label: 'White Collar / Financial' },
  { value: 'other', label: 'Other' },
] as const;

export const IMMEDIATE_NEEDS = [
  { value: 'shelter', label: 'I need a place to stay tonight', icon: '🏠' },
  { value: 'food', label: 'I need food', icon: '🍽️' },
  { value: 'phone', label: 'I need a phone', icon: '📱' },
  { value: 'transportation', label: 'I need transportation', icon: '🚌' },
  { value: 'clothing', label: 'I need clothing', icon: '👕' },
  { value: 'medication', label: 'I need medication', icon: '💊' },
  { value: 'mental_health', label: 'I need to talk to someone', icon: '🧠' },
] as const;
