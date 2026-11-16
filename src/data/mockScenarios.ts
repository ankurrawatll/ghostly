import { CallScenario } from '../types';

export const MOCK_SCENARIOS: CallScenario[] = [
  {
    id: 'scenario-saas',
    title: 'Enterprise SaaS Renewal & Discount Defense',
    category: 'Enterprise SaaS',
    recommendedPlaybookId: 'pb-saas-enterprise',
    description: 'Simulates a high-stakes renewal call on Google Meet where the procurement lead pushes back with a 28% competitor discount claim.',
    turns: [
      {
        id: 'turn-1',
        speaker: 'USER',
        durationSec: 4,
        text: 'Thanks for hopping on, Marcus. Excited to review our Q4 expansion and lock in the renewal timeline.'
      },
      {
        id: 'turn-2',
        speaker: 'COUNTERPARTY',
        durationSec: 6,
        text: 'Glad to connect. We love the team, but our CFO asked us to scrutinize all vendor licenses this quarter.'
      },
      {
        id: 'turn-3',
        speaker: 'COUNTERPARTY',
        durationSec: 8,
        expectedObjection: 'competitor',
        text: 'To be candid, Acme Cloud offered us a 28% discount if we migrate to their suite this month. We cannot justify paying your list price right now.'
      },
      {
        id: 'turn-4',
        speaker: 'USER',
        durationSec: 7,
        text: 'I completely understand budget pressures. However, migrating means rebuilding custom integrations and retraining 200 engineers.'
      },
      {
        id: 'turn-5',
        speaker: 'COUNTERPARTY',
        durationSec: 5,
        expectedObjection: 'sla',
        text: 'Understood, but if we stay, our legal counsel demands a 5% financial liquidated damages penalty for any downtime over 15 minutes.'
      },
      {
        id: 'turn-6',
        speaker: 'USER',
        durationSec: 6,
        text: 'We are happy to provide our standard Tier 1 service credit clause with a 10% credit, capped at the monthly fee.'
      },
      {
        id: 'turn-7',
        speaker: 'COUNTERPARTY',
        durationSec: 5,
        text: 'Fair enough. If you can do a 10% multi-year lock on a 3-year term, I will sign the agreement before Friday.'
      }
    ]
  },
  {
    id: 'scenario-startup',
    title: 'Seed Round Cap Table & Valuation Pushback',
    category: 'Startup Valuation',
    recommendedPlaybookId: 'pb-startup-valuation',
    description: 'Simulates an investor partner meeting where a partner questions the valuation cap and asks for 2 board seats.',
    turns: [
      {
        id: 'turn-s1',
        speaker: 'USER',
        durationSec: 5,
        text: 'Thanks for the time today. We are closing the seed round with 85% of our allocation spoken for.'
      },
      {
        id: 'turn-s2',
        speaker: 'COUNTERPARTY',
        durationSec: 7,
        expectedObjection: 'valuation',
        text: 'We like your AI architecture, but a $14M post-money cap feels 25% too rich given current seed market multiples.'
      },
      {
        id: 'turn-s3',
        speaker: 'COUNTERPARTY',
        durationSec: 6,
        expectedObjection: 'governance',
        text: 'Also, if we lead with a $1.5M check, our investment committee requires two board seats and veto rights on executive hiring.'
      },
      {
        id: 'turn-s4',
        speaker: 'USER',
        durationSec: 7,
        text: 'Our 28% month-over-month organic MRR growth puts us in the top decile of enterprise infrastructure startups.'
      },
      {
        id: 'turn-s5',
        speaker: 'COUNTERPARTY',
        durationSec: 4,
        text: 'That growth rate is impressive. Let us review the term sheet with our general partners tonight.'
      }
    ]
  },
  {
    id: 'scenario-executive',
    title: 'VP Engineering Offer & Sign-on Bonus Negotiation',
    category: 'Executive Comp',
    recommendedPlaybookId: 'pb-executive-comp',
    description: 'Simulates an offer negotiation with an executive recruiter who claims the base salary is capped at the top of the internal band.',
    turns: [
      {
        id: 'turn-e1',
        speaker: 'COUNTERPARTY',
        durationSec: 6,
        text: 'The executive committee was unanimous: we want you as our new VP of Engineering. We are offering $200k base with a 4-year grant.'
      },
      {
        id: 'turn-e2',
        speaker: 'USER',
        durationSec: 5,
        text: 'I am thrilled about the vision and the team. Based on my track record scaling systems to 10M users, my base target is $230k.'
      },
      {
        id: 'turn-e3',
        speaker: 'COUNTERPARTY',
        durationSec: 6,
        expectedObjection: 'salary_band',
        text: 'Unfortunately $200k is the absolute hard ceiling for this level across our entire corporate band structure.'
      },
      {
        id: 'turn-e4',
        speaker: 'USER',
        durationSec: 6,
        text: 'I appreciate the band constraints. How about we bridge the gap with a $35k guaranteed sign-on bonus and a performance review at month 6?'
      },
      {
        id: 'turn-e5',
        speaker: 'COUNTERPARTY',
        durationSec: 5,
        text: 'That is a constructive solution. I will get approval for the $35k sign-on bonus and send the revised offer letter.'
      }
    ]
  }
];
