function normalizeSymptoms(symptoms) {
  if (!symptoms) return [];
  if (Array.isArray(symptoms)) return symptoms.map(String).map(s => s.trim()).filter(Boolean);
  if (typeof symptoms === 'string') {
    return symptoms
      .split(/[,;\n]/g)
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [String(symptoms)].map(s => s.trim()).filter(Boolean);
}

function scoreSpecialties(tokens) {
  const rules = [
    { specialty: 'Cardiology', keywords: ['chest pain', 'palpitations', 'shortness of breath', 'high blood pressure'] },
    { specialty: 'Dermatology', keywords: ['rash', 'itching', 'acne', 'eczema', 'hives'] },
    { specialty: 'Gastroenterology', keywords: ['abdominal pain', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'heartburn'] },
    { specialty: 'Neurology', keywords: ['headache', 'migraine', 'seizure', 'numbness', 'dizziness', 'weakness'] },
    { specialty: 'Orthopedics', keywords: ['joint pain', 'back pain', 'sprain', 'fracture', 'knee pain'] },
    { specialty: 'Pulmonology', keywords: ['cough', 'wheezing', 'asthma', 'shortness of breath'] },
    { specialty: 'ENT', keywords: ['sore throat', 'ear pain', 'sinus', 'runny nose'] },
    { specialty: 'Psychiatry', keywords: ['anxiety', 'depression', 'panic', 'insomnia'] },
    { specialty: 'General Medicine', keywords: ['fever', 'fatigue', 'body ache', 'cold', 'flu'] },
    { specialty: 'Gynecology', keywords: ['pelvic pain', 'irregular period', 'pregnancy'] },
  ];

  const joined = tokens.join(' | ').toLowerCase();
  const scores = new Map();
  for (const rule of rules) {
    let s = 0;
    for (const kw of rule.keywords) {
      if (joined.includes(kw)) s += 1;
    }
    if (s > 0) scores.set(rule.specialty, s);
  }

  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([specialty]) => specialty);
}

function triage(tokens) {
  const joined = tokens.join(' | ').toLowerCase();
  const emergencyFlags = [
    'severe chest pain',
    'difficulty breathing',
    'fainting',
    'stroke',
    'uncontrolled bleeding',
    'severe allergic reaction',
  ];
  if (emergencyFlags.some(f => joined.includes(f))) return 'emergency';

  const urgentFlags = ['chest pain', 'shortness of breath', 'blood in stool', 'high fever', 'severe pain'];
  if (urgentFlags.some(f => joined.includes(f))) return 'urgent';

  return 'routine';
}

function buildSuggestions(level) {
  if (level === 'emergency') {
    return [
      'Seek emergency medical care immediately.',
      'If available, call your local emergency number.',
      'Do not delay care while waiting for an online appointment.',
    ];
  }
  if (level === 'urgent') {
    return [
      'Consider booking an urgent appointment today.',
      'If symptoms worsen, seek in-person evaluation.',
    ];
  }
  return [
    'Book a routine consultation for proper evaluation.',
    'Track symptoms (onset, severity, triggers) to share with your doctor.',
  ];
}

function checkSymptoms(symptoms) {
  const tokens = normalizeSymptoms(symptoms);
  const triageLevel = triage(tokens);
  const recommendedSpecialties = scoreSpecialties(tokens);

  return {
    triageLevel,
    recommendedSpecialties: recommendedSpecialties.length ? recommendedSpecialties : ['General Medicine'],
    suggestions: buildSuggestions(triageLevel),
    disclaimer: 'This is not a medical diagnosis. For emergencies, seek immediate care.',
    tokens,
  };
}

module.exports = { checkSymptoms };

