import { Playbook } from '../types';

export const DEFAULT_PLAYBOOKS: Playbook[] = [
  {
    id: 'pb-saas-enterprise',
    title: 'Enterprise SaaS Pricing & Terms',
    scenarioType: 'sales',
    description: 'Defense against competitor discount claims, procurement anchors, and payment term concessions.',
    isDefault: true,
    updatedAt: new Date().toISOString(),
    walkAwayGuardrails: [
      'Maximum discount without VP approval is 15% (only in exchange for 3-year upfront commitment).',
      'Never concede net-60 payment terms without adding a 2% monthly late fee clause.',
      'Do not include custom development or dedicated support without $20k ARR minimum.'
    ],
    rules: [
      {
        id: 'rule-comp-discount',
        triggerTopic: 'Competitor offering 20-30% lower pricing',
        counterMove: 'Anchor on verified 99.99% uptime and zero-cost onboarding. Offer 10% multi-year lock instead of cash discount.',
        proofPoint: 'IDC study proved 3.2x ROI within 6 months compared to competitor migration costs.'
      },
      {
        id: 'rule-budget-freeze',
        triggerTopic: 'Budget freeze or procurement pushing to next quarter',
        counterMove: 'Propose phased deployment: 25 seats now to lock legacy pricing, remaining 75 seats billing Q1 next fiscal year.',
        proofPoint: 'Avoids budget committee re-approval while securing procurement slot.'
      },
      {
        id: 'rule-sla-penalty',
        triggerTopic: 'Prospect demanding financial penalty on SLA breach',
        counterMove: 'Agree to standard 10% service credit for downtime exceeding 0.1%, capped at monthly fee. Reject liquidated damages.',
        proofPoint: 'Industry standard for Tier 1 cloud SaaS.'
      },
      {
        id: 'rule-pilot-free',
        triggerTopic: 'Demanding free 60-day pilot before contract',
        counterMove: 'Offer 14-day Paid Sandbox with 100% money-back guarantee against mutually defined success criteria.',
        proofPoint: 'Filters unserious buyers while eliminating financial risk for their committee.'
      }
    ]
  },
  {
    id: 'pb-startup-valuation',
    title: 'Seed / Series A Term-Sheet Negotiation',
    scenarioType: 'fundraising',
    description: 'Protecting cap table, founder control, and liquidation preference during investor pitches.',
    isDefault: false,
    updatedAt: new Date().toISOString(),
    walkAwayGuardrails: [
      'Maximum dilution this round is 18%.',
      'Reject participating preferred stock or >1x liquidation preference.',
      'No investor board seat if check size is under 20% of the total round.'
    ],
    rules: [
      {
        id: 'rule-valuation-pushback',
        triggerTopic: 'Investor claims valuation is 25% too high based on recent market comps',
        counterMove: 'Point to 28% MoM organic MRR growth and 118% net revenue retention. Offer advisory warrants for hands-on value.',
        proofPoint: 'Top-quartile SaaS metrics command 75th-percentile multiples.'
      },
      {
        id: 'rule-board-control',
        triggerTopic: 'Lead investor requests 2 board seats or blocking rights on hiring',
        counterMove: 'Counter with 2 Founder seats, 1 Lead Investor seat, and 1 mutually agreed Independent Industry seat.',
        proofPoint: 'Preserves executive velocity while providing institutional governance.'
      },
      {
        id: 'rule-pro-rata',
        triggerTopic: 'Angel or small fund demanding super pro-rata rights',
        counterMove: 'Grant standard pro-rata only to major investors ($250k+ checks). Cap small checks to information rights.',
        proofPoint: 'Prevents cap table crowding in Series A syndicate.'
      }
    ]
  },
  {
    id: 'pb-executive-comp',
    title: 'Executive Compensation & Offer Negotiation',
    scenarioType: 'recruiting',
    description: 'Structuring base, sign-on equity, severance, and acceleration triggers.',
    isDefault: false,
    updatedAt: new Date().toISOString(),
    walkAwayGuardrails: [
      'Base salary floor: $220,000.',
      'Equity grant must have double-trigger change-of-control acceleration.',
      'Minimum 6 months severance for termination without cause.'
    ],
    rules: [
      {
        id: 'rule-salary-band-cap',
        triggerTopic: 'Recruiter states base salary is at top of internal band',
        counterMove: 'Accept base at band ceiling in exchange for a $35k guaranteed Year-1 sign-on bonus and performance milestone review at month 6.',
        proofPoint: 'Satisfies HR equity parity while bridging total cash compensation.'
      },
      {
        id: 'rule-equity-cliff',
        triggerTopic: 'Standard 4-year vesting with 1-year cliff',
        counterMove: 'Request quarterly vesting after month 6 and a 50% accelerated single-trigger upon acquisition.',
        proofPoint: 'Standard for VP and Director executive hires.'
      }
    ]
  },
  {
    id: 'pb-sla-liability',
    title: 'Enterprise SLA & Liability Guardrails',
    scenarioType: 'vendor',
    description: 'Defense against uncapped indemnification, consequential damages, and liquidated penalty demands.',
    isDefault: false,
    updatedAt: new Date().toISOString(),
    walkAwayGuardrails: [
      'Liability cap strictly limited to 12 months trailing fees paid.',
      'Refuse unlimited indemnity for third-party intellectual property infringement without explicit willful misconduct.',
      'Downtime service credits capped at 15% of annual license.'
    ],
    rules: [
      {
        id: 'rule-uncapped-liability',
        triggerTopic: 'Enterprise procurement demands uncapped consequential and indirect damages',
        counterMove: 'Enforce standard enterprise liability cap equal to 1x annual contract value; offer mutual 2x super-cap solely for confidentiality breaches.',
        proofPoint: '98% of Fortune 500 SaaS contracts accept 1x annual contract value liability ceiling.'
      },
      {
        id: 'rule-net90-payment',
        triggerTopic: 'Client procurement mandates standard Net-90 payment terms before issuing purchase order',
        counterMove: 'Counter with Net-45 standard; offer 2% discount incentive for 10-day settlement or require quarterly prepayment.',
        proofPoint: 'Preserves working capital while providing procurement a quantifiable financial discount win.'
      }
    ]
  }
];
