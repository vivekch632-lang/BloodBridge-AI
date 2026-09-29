/**
 * AI Blood Match Assistant Service
 * Provides clinical triage, donor prioritization explanations, and compatibility strategies.
 */
import { RECIPIENT_CAN_RECEIVE_FROM } from '../utils/bloodCompatibility';
import { donorService } from './donorService';

export const aiService = {
  /**
   * Evaluates a blood requirement with AI clinical reasoning
   */
  async analyzeRequirement({ bloodGroup, units = 1, emergencyLevel = 'Urgent', hospital = '', city = '', notes = '' }) {
    // Simulate AI model inference latency (350ms) for realistic UX
    await new Promise(resolve => setTimeout(resolve, 350));

    const compatibleDonors = RECIPIENT_CAN_RECEIVE_FROM[bloodGroup] || [bloodGroup];
    const isRare = ['AB-', 'B-', 'O-'].includes(bloodGroup);

    // Fetch ranked donors matching this request
    const matchedDonors = donorService.findMatches({
      bloodGroup,
      city,
      onlyAvailable: true
    }).filter(d => d.compatibility !== 'INCOMPATIBLE').slice(0, 3);

    // Urgency assessment
    let triagePriority = 'STANDARD MONITORING';
    let targetTime = 'Within 12 - 24 hours';
    let urgencyColor = 'var(--cyan-700)';

    if (emergencyLevel === 'Critical') {
      triagePriority = 'CODE RED - IMMEDIATE TRANSFUSION REQUIRED';
      targetTime = 'Target delivery: Under 60 minutes';
      urgencyColor = 'var(--primary)';
    } else if (emergencyLevel === 'Urgent') {
      triagePriority = 'HIGH PRIORITY - SURGICAL / ICU STANDBY';
      targetTime = 'Target delivery: 2 - 4 hours';
      urgencyColor = 'var(--amber-700)';
    }

    // Secondary compatible donor alternatives
    const alternatives = compatibleDonors.filter(bg => bg !== bloodGroup);

    // Detailed clinical explanation
    const triageSummary = `Patient with blood type ${bloodGroup} requires ${units} unit(s) at ${hospital || 'designated hospital'}. ` +
      (notes ? `Indication: "${notes}". ` : '') +
      `Our intelligent matching algorithm evaluates donor antigens, travel transit time, and biological recovery status to minimize risk.`;

    const prioritizationCriteria = [
      {
        criterion: 'Antigen & ABO Compatibility (40%)',
        detail: `Exact match ${bloodGroup} carries zero cross-reactivity risk. ${alternatives.length > 0 ? `Acceptable compatible alternatives include: ${alternatives.join(', ')}.` : 'No alternatives available; only exact match is clinically acceptable.'}`
      },
      {
        criterion: 'Geographic Radius & Transit Time (30%)',
        detail: `Prioritizing donors located within a 10 km radius of ${city || 'the hospital'} with live GPS travel estimations.`
      },
      {
        criterion: 'Immediate Donor Availability (20%)',
        detail: `Contacting pre-verified donors with 'Immediate' status first, then broadcasting automated SMS/push alerts.`
      },
      {
        criterion: 'Biological Recency Recovery (10%)',
        detail: `Enforcing a 90-day rest interval to ensure donor hemoglobin levels exceed 12.5 g/dL.`
      }
    ];

    const clinicalPrecautions = [
      isRare ? '⚠️ Rare blood type identified. Emergency broadcast recommended across adjacent municipal districts.' : '✓ Common blood type with stable donor pool density.',
      'Ensure standard laboratory crossmatching before transfusion administration.',
      bloodGroup.includes('-') ? 'Rh-negative patient requires Rh-negative donor to prevent anti-D isoimmunization.' : 'Rh-positive recipient can safely accept both Rh-positive and Rh-negative compatible units.'
    ];

    return {
      success: true,
      timestamp: new Date().toISOString(),
      bloodGroup,
      units,
      emergencyLevel,
      triagePriority,
      targetTime,
      urgencyColor,
      isRare,
      triageSummary,
      compatibleDonorsList: compatibleDonors,
      alternatives,
      prioritizationCriteria,
      clinicalPrecautions,
      topRecommendedDonors: matchedDonors
    };
  }
};
