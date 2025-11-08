import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  QrCode,
  Palette,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { posthog, POSTHOG_ENABLED } from '../lib/posthog';
import { FEATURE_FLAGS } from '../lib/featureFlags';

type LandingVariantKey = 'control' | 'page1' | 'page2' | 'page3' | 'page4' | 'page5';

type VariantCopy = {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroFootnote: string;
};

const VALID_VARIANTS: LandingVariantKey[] = ['control', 'page1', 'page2', 'page3', 'page4', 'page5'];

const VARIANT_COPY: Record<LandingVariantKey, VariantCopy> = {
  control: {
    heroBadge: 'Honest pricing • Unlimited scans • Real analytics',
    heroTitle: 'Launch premium QR experiences without enterprise pricing',
    heroDescription:
      'Build branded QR codes with polished landing pages, update content any time, and understand every scan. Just $5/month, cancel whenever you want.',
    primaryCtaLabel: 'Start building now',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See how it works',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Simple, honest pricing. Cancel anytime.'
  },
  page1: {
    heroBadge: 'Flat $5/month • Unlimited scans • No paywalls',
    heroTitle: 'Collect leads with QR forms included in the $5 plan',
    heroDescription:
      'Launch lead capture QR pages with custom branding, routing, and automations—everything runs on the same predictable $5/month membership.',
    primaryCtaLabel: 'Build lead-form QR pages',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Preview lead templates',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Unlimited responses. Zero hidden fees. Cancel anytime.'
  },
  page2: {
    heroBadge: 'No hidden fees • Unlimited automations',
    heroTitle: 'Automate QR follow-ups for $5/month',
    heroDescription:
      'Schedule reminders, rotate offers, and trigger emails right after a scan. All automations are part of the same flat $5 membership—no add-ons required.',
    primaryCtaLabel: 'Automate QR campaigns',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Explore automation playbooks',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Unlimited scans and workflows. One transparent plan.'
  },
  page3: {
    heroBadge: 'Brand-safe • Unlimited designs • $5/month',
    heroTitle: 'Ship on-brand QR landing pages without agency costs',
    heroDescription:
      'Upload fonts, gradients, and logos to deliver polished QR microsites. All design features are included in the flat $5/month plan—no premium tiers to unlock.',
    primaryCtaLabel: 'Design branded QR pages',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Browse template gallery',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Unlimited revisions. One honest monthly price.'
  },
  page4: {
    heroBadge: 'Events love flat pricing • Unlimited attendees',
    heroTitle: 'Run event QR check-ins with a simple $5 membership',
    heroDescription:
      'Power badge scans, live agendas, and sponsor offers without per-attendee invoices. Your entire event stack runs on the same $5/month plan.',
    primaryCtaLabel: 'Launch event QR workspace',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Download event checklist',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Unlimited scans, sessions, and updates. Cancel anytime.'
  },
  page5: {
    heroBadge: 'Executive dashboards • Honest pricing • No surprises',
    heroTitle: 'Get executive QR analytics without enterprise contracts',
    heroDescription:
      'Track scan trends, ROI, and at-risk campaigns in dashboards your leadership understands—all included in one transparent $5/month plan.',
    primaryCtaLabel: 'Unlock analytics workspace',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See reporting tour',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Unlimited dashboards and alerts. Flat $5/month.'
  }
};

type VariantStatsCard = {
  label: string;
  value: string;
  helper: string;
};

type VariantTheme = {
  wrapper: string;
  text: string;
  subtext: string;
  badge: string;
  badgeText: string;
  navText: string;
  primaryButton: string;
  primaryButtonHover: string;
  secondaryButton: string;
  secondaryButtonHover: string;
  card: string;
  softCard: string;
  outline: string;
  sectionBorder: string;
};

const ICON_MAP = {
  qr: QrCode,
  palette: Palette,
  analytics: BarChart3,
  settings: Settings,
  shield: Shield,
  zap: Zap
} as const;

type VariantIconKey = keyof typeof ICON_MAP;

type VariantFeature = {
  icon: VariantIconKey;
  title: string;
  description: string;
};

type VariantHighlight = {
  eyebrow: string;
  title: string;
  description: string;
  metricValue: string;
  metricLabel: string;
  footnote: string;
};

type VariantPricing = {
  eyebrow: string;
  title: string;
  description: string;
  price: string;
  suffix: string;
  bullet: string[];
  footnote: string;
};

type VariantTestimonial = {
  quote: string;
  author: string;
  role: string;
};

type VariantClosing = {
  title: string;
  description: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

type VariantLandingConfig = {
  theme: VariantTheme;
  hero: {
    layout: 'split' | 'reverse' | 'stacked';
    supporting: string;
    stats: VariantStatsCard[];
    visual: 'glow' | 'cards' | 'dashboard' | 'beams' | 'rings';
  };
  supportingLayout: 'stack' | 'grid' | 'timeline';
  supportingPoints: string[];
  featureLayout: 'grid' | 'columns' | 'stacked';
  features: VariantFeature[];
  highlight: VariantHighlight;
  pricing: VariantPricing;
  testimonial: VariantTestimonial;
  closing: VariantClosing;
};

const landingVariantConfigs: Record<Exclude<LandingVariantKey, 'control'>, VariantLandingConfig> = {
  page1: {
    theme: {
      wrapper: 'min-h-screen bg-gradient-to-br from-white via-sky-50 to-emerald-100 text-slate-900',
      text: 'text-slate-900',
      subtext: 'text-slate-500',
      badge: 'bg-emerald-100 border border-emerald-300',
      badgeText: 'text-emerald-700',
      navText: 'text-slate-900',
      primaryButton: 'bg-emerald-500 text-white',
      primaryButtonHover: 'hover:bg-emerald-600',
      secondaryButton: 'bg-white text-emerald-700 border border-emerald-200',
      secondaryButtonHover: 'hover:bg-emerald-50',
      card: 'bg-white shadow-xl border border-emerald-100',
      softCard: 'bg-emerald-50 border border-emerald-100',
      outline: 'border border-emerald-200',
      sectionBorder: 'border-emerald-200'
    },
    hero: {
      layout: 'split',
      supporting: 'Lead capture forms, route logic, and thank-you flows included in the $5 membership.',
      stats: [
        { label: 'Average setup time', value: '7 min', helper: 'From scan to live form' },
        { label: 'Leads captured', value: '+42%', helper: 'Compared to static codes' },
        { label: 'Extra fees', value: '$0', helper: 'All included in $5/month' }
      ],
      visual: 'cards'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Unlimited QR landing forms with custom fields & validation.',
      'Route submissions to email, Slack, or your CRM instantly.',
      'Automated thank-you pages and coupon drops without add-ons.'
    ],
    featureLayout: 'grid',
    features: [
      { icon: 'qr', title: 'Form-ready templates', description: 'Launch from lead captures, RSVPs, surveys, or waitlists in one click.' },
      { icon: 'palette', title: 'Brand-safe design', description: 'Upload logos, choose fonts, and match your colors without upsells.' },
      { icon: 'analytics', title: 'Live submission analytics', description: 'Track conversion rates, locations, and devices in real time.' }
    ],
    highlight: {
      eyebrow: 'Case study · Fitness studio',
      title: 'Converted walk-ins at the door with QR forms',
      description: 'UrbanFit replaced their paper waivers with a QR code form, collecting 380 new leads in two weeks.',
      metricValue: '380',
      metricLabel: 'New leads in 14 days',
      footnote: 'No premium plan required. Flat $5 membership.'
    },
    pricing: {
      eyebrow: 'All features included',
      title: 'The $5/month lead capture plan',
      description: 'Unlimited forms, unlimited scans, and full analytics. Cancel anytime with one click.',
      price: '$5',
      suffix: '/month',
      bullet: ['Unlimited QR forms & landing layouts', 'Automations, integrations, and exports', 'No per-lead or per-form fees'],
      footnote: 'You own the data. Export at any time.'
    },
    testimonial: {
      quote:
        '“We tested three QR tools. generatecodeqr was the only one that let us build branded forms and automations without hidden fees.”',
      author: 'Lena Ortiz',
      role: 'Growth Lead @ FlowCollective'
    },
    closing: {
      title: 'Launch a lead capture QR page today',
      description: 'Spin up your first form-backed QR experience in under 10 minutes. Keep everything under the $5 plan.',
      primaryCtaLabel: 'Create a lead QR page',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'View template gallery',
      secondaryCtaHref: '/faq'
    }
  },
  page2: {
    theme: {
      wrapper: 'min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-rose-900 text-white',
      text: 'text-white',
      subtext: 'text-white/70',
      badge: 'bg-white/10 border border-white/20',
      badgeText: 'text-white/80',
      navText: 'text-white',
      primaryButton: 'bg-pink-500 text-white',
      primaryButtonHover: 'hover:bg-pink-400',
      secondaryButton: 'bg-white/10 text-white border border-white/20',
      secondaryButtonHover: 'hover:bg-white/20',
      card: 'bg-white/5 border border-white/10',
      softCard: 'bg-white/10 border border-white/20',
      outline: 'border border-white/15',
      sectionBorder: 'border-white/10'
    },
    hero: {
      layout: 'reverse',
      supporting: 'Automated follow-ups, rotating offers, and trigger-based content — all in the $5 membership.',
      stats: [
        { label: 'Follow-up automations', value: 'Unlimited', helper: 'Included in plan' },
        { label: 'Repeat visits', value: '+24%', helper: 'Hospitality benchmark' },
        { label: 'Setup time', value: '15 min', helper: 'To schedule first campaign' }
      ],
      visual: 'glow'
    },
    supportingLayout: 'timeline',
    supportingPoints: [
      'Schedule campaigns around time of day, location, or returning customers.',
      'Prompt staff with live alerts when VIP or repeat customers scan.',
      'Swap promotions live without changing the printed code or paying per campaign.'
    ],
    featureLayout: 'columns',
    features: [
      { icon: 'analytics', title: 'Performance timeline', description: 'See how each campaign performs across locations and times.' },
      { icon: 'settings', title: 'Smart content rules', description: 'Swap landing content by daypart, referral source, or audience tags.' },
      { icon: 'zap', title: 'Instant alerts', description: 'Get notified the moment VIP or high-value customers scan.' }
    ],
    highlight: {
      eyebrow: 'Playbook · Hospitality',
      title: 'Turn QR scans into repeat guests',
      description: 'A boutique hotel used scheduled QR offers to bring back 1 in 3 guests within 45 days.',
      metricValue: '32%',
      metricLabel: 'Return rate from QR campaigns',
      footnote: 'Same $5 plan. No upsell tiers.'
    },
    pricing: {
      eyebrow: 'Predictable automation pricing',
      title: 'Automate every QR journey',
      description: 'Dynamic routing, timed content, and integrations included. Cancel whenever you like.',
      price: '$5',
      suffix: '/month',
      bullet: ['Unlimited rotating campaigns & live updates', 'Staff notifications included', 'Analytics for every campaign'],
      footnote: 'Test campaigns before going live with sandbox modes.'
    },
    testimonial: {
      quote:
        '“Our QR campaigns finally feel dynamic. We rotate promos daily without begging finance for another software approval.”',
      author: 'Marcus Lee',
      role: 'Ops Director @ Ember Lounge Group'
    },
    closing: {
      title: 'Build your first automated QR campaign',
      description: 'Launch rotating offers and follow-ups today — everything runs on the same $5 membership.',
      primaryCtaLabel: 'Automate a QR touchpoint',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'See automation ideas',
      secondaryCtaHref: '/faq'
    }
  },
  page3: {
    theme: {
      wrapper: 'min-h-screen bg-white text-slate-900',
      text: 'text-slate-900',
      subtext: 'text-slate-500',
      badge: 'bg-slate-900 text-white',
      badgeText: 'text-white',
      navText: 'text-slate-900',
      primaryButton: 'bg-slate-900 text-white',
      primaryButtonHover: 'hover:bg-slate-800',
      secondaryButton: 'bg-white text-slate-900 border border-slate-900/20',
      secondaryButtonHover: 'hover:bg-slate-100',
      card: 'bg-slate-100 border border-slate-200',
      softCard: 'bg-white border border-slate-200',
      outline: 'border border-slate-200',
      sectionBorder: 'border-slate-200'
    },
    hero: {
      layout: 'stacked',
      supporting: 'Deliver agency-level design without agency retainers. Everything stays inside the $5/month plan.',
      stats: [
        { label: 'Brand kits uploaded', value: 'Unlimited', helper: 'Fonts, colors, logos' },
        { label: 'Time to iterate', value: 'x4 faster', helper: 'vs. designer queue' },
        { label: 'Hidden fees', value: '$0', helper: 'Flat monthly pricing' }
      ],
      visual: 'beams'
    },
    supportingLayout: 'stack',
    supportingPoints: [
      'Drag and drop layouts designed for menus, products, events, and more.',
      'Upload brand fonts, color tokens, and components once — reuse forever.',
      'Share preview links with stakeholders for approvals before printing.'
    ],
    featureLayout: 'grid',
    features: [
      { icon: 'palette', title: 'Brand kits', description: 'Fonts, gradients, iconography, and button styles stored in one place.' },
      { icon: 'qr', title: 'Reusable sections', description: 'Mix hero, gallery, FAQ, and CTA blocks unique to QR experiences.' },
      { icon: 'shield', title: 'Design guardrails', description: 'Lock colors, spacing, and typography to stay exactly on-brand.' }
    ],
    highlight: {
      eyebrow: 'Creative teams',
      title: 'Roll out polished QR experiences at scale',
      description: 'A retail brand launched 18 QR experiences in 48 hours for a nationwide pop-up campaign.',
      metricValue: '18',
      metricLabel: 'Landing pages approved in 2 days',
      footnote: 'Cost stayed $5/month total.'
    },
    pricing: {
      eyebrow: 'One transparent plan',
      title: 'Design without limits',
      description: 'Unlimited branded pages, exports, and stakeholders sharing the same membership.',
      price: '$5',
      suffix: '/month',
      bullet: ['Unlimited brand kits and layouts', 'Version history & approvals', 'Responsive previews included'],
      footnote: 'No watermark. No upgrade prompts.'
    },
    testimonial: {
      quote:
        '“We ditched mockups and just share live QR previews with clients. generatecodeqr feels like a design system in a box.”',
      author: 'Courtney Ellis',
      role: 'Creative Director @ Signal Studio'
    },
    closing: {
      title: 'Spin up a branded QR experience',
      description: 'Craft a polished, on-brand page today with zero upsells or per-brand charges.',
      primaryCtaLabel: 'Design a QR page',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'View style presets',
      secondaryCtaHref: '/faq'
    }
  },
  page4: {
    theme: {
      wrapper: 'min-h-screen bg-gradient-to-br from-amber-900 via-rose-900 to-purple-950 text-white',
      text: 'text-white',
      subtext: 'text-white/75',
      badge: 'bg-white/10 border border-white/20',
      badgeText: 'text-white/80',
      navText: 'text-white',
      primaryButton: 'bg-amber-400 text-slate-900',
      primaryButtonHover: 'hover:bg-amber-300',
      secondaryButton: 'bg-transparent text-white border border-white/30',
      secondaryButtonHover: 'hover:bg-white/10',
      card: 'bg-white/10 border border-white/20',
      softCard: 'bg-black/30 border border-white/10',
      outline: 'border border-white/15',
      sectionBorder: 'border-white/15'
    },
    hero: {
      layout: 'split',
      supporting: 'Check-ins, agendas, and sponsor promos — smooth for attendees, simple for ops teams, all for $5/month.',
      stats: [
        { label: 'Attendees supported', value: 'Unlimited', helper: 'No per-head billing' },
        { label: 'Check-in speed', value: '-63%', helper: 'Faster than manual lists' },
        { label: 'Sponsor scans', value: '+29%', helper: 'Instant landing updates' }
      ],
      visual: 'dashboard'
    },
    supportingLayout: 'timeline',
    supportingPoints: [
      'Instant badge scanning with VIP routing and capacity tracking.',
      'Swap session schedules and room maps live without reprinting signage.',
      'Deliver sponsor promos or surveys immediately after sessions.'
    ],
    featureLayout: 'columns',
    features: [
      { icon: 'qr', title: 'Badge command center', description: 'Monitor live check-ins and capacity from any device.' },
      { icon: 'analytics', title: 'Session analytics', description: 'See engagement by track, speaker, and sponsor instantly.' },
      { icon: 'settings', title: 'Smart updates', description: 'Push emergency alerts or last-minute changes from one dashboard.' }
    ],
    highlight: {
      eyebrow: 'Conference spotlight',
      title: 'Scaled to 4,200 attendee scans without extra fees',
      description: 'A SaaS summit used QR badges for entry, agendas, and sponsor capture in a single workspace.',
      metricValue: '4,200',
      metricLabel: 'Attendees powered on $5/month',
      footnote: 'No event surcharges or premium invoices.'
    },
    pricing: {
      eyebrow: 'Event-ready pricing',
      title: 'Run every event on one plan',
      description: 'Unlimited attendees, schedules, and sponsor spaces. Cancel after the event if you need to.',
      price: '$5',
      suffix: '/month',
      bullet: ['Unlimited events & attendee check-ins', 'Sponsor pages & analytics included', 'Live updates and alerts'],
      footnote: 'Spin up your next event in minutes.'
    },
    testimonial: {
      quote:
        '“We stopped paying per attendee. generatecodeqr gave us better analytics and happier sponsors for a fraction of the cost.”',
      author: 'Priya Anand',
      role: 'Event Lead @ LaunchCon'
    },
    closing: {
      title: 'Transform your next event experience',
      description: 'Every attendee touchpoint can run through one QR workspace that still costs $5/month.',
      primaryCtaLabel: 'Build an event workspace',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'Try it free today',
      secondaryCtaHref: '/signup'
    }
  },
  page5: {
    theme: {
      wrapper: 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white',
      text: 'text-white',
      subtext: 'text-white/70',
      badge: 'bg-slate-700 border border-slate-500',
      badgeText: 'text-white',
      navText: 'text-white',
      primaryButton: 'bg-cyan-400 text-slate-900',
      primaryButtonHover: 'hover:bg-cyan-300',
      secondaryButton: 'bg-transparent text-white border border-white/30',
      secondaryButtonHover: 'hover:bg-white/10',
      card: 'bg-slate-900/80 border border-white/10',
      softCard: 'bg-slate-900/60 border border-white/5',
      outline: 'border border-white/10',
      sectionBorder: 'border-white/10'
    },
    hero: {
      layout: 'reverse',
      supporting: 'Executive dashboards and funnel analytics included in the same $5 membership.',
      stats: [
        { label: 'Campaign ROI tracked', value: '+37%', helper: 'Better scan attribution' },
        { label: 'Dashboards shared', value: 'Unlimited', helper: 'Invite stakeholders' },
        { label: 'Data sources', value: 'PostHog + Stripe', helper: 'All included' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Executive-ready dashboards with scans, click-throughs, and revenue impact.',
      'Compare performance across channels, creative, and QR destinations.',
      'Export board-ready PDFs or schedule email summaries for stakeholders.'
    ],
    featureLayout: 'stacked',
    features: [
      { icon: 'analytics', title: 'Attribution clarity', description: 'Tie scans to conversions and revenue with built-in tracking.' },
      { icon: 'shield', title: 'Governance controls', description: 'Role-based access, audit logs, and compliant data handling.' },
      { icon: 'settings', title: 'Connected data', description: 'Bring in PostHog and Stripe metrics without paying for another tool.' }
    ],
    highlight: {
      eyebrow: 'Executive dashboard rollout',
      title: 'Gave leadership weekly QR performance clarity',
      description: 'A franchise network replaced spreadsheets with real-time landing analytics across 120 locations.',
      metricValue: '120',
      metricLabel: 'Locations unified under one dashboard',
      footnote: 'Analytics packaged inside the $5 plan.'
    },
    pricing: {
      eyebrow: 'Analytics without enterprise pricing',
      title: 'Executive visibility for $5/month',
      description: 'Dashboards, exports, and alerts all live in the same honest plan. Cancel whenever you decide.',
      price: '$5',
      suffix: '/month',
      bullet: ['Unlimited dashboards & exports', 'Share links with leadership', 'Alerts for dips or anomalies'],
      footnote: 'No sales calls. Sign up and start tracking.'
    },
    testimonial: {
      quote:
        '“Our exec team finally understands QR performance. Everything lives in one dashboard that costs less than coffee.”',
      author: 'Nikhil Patel',
      role: 'Head of Analytics @ Beacon Retail'
    },
    closing: {
      title: 'Unlock executive-grade QR insights',
      description: 'Track every scan, click, and conversion in dashboards designed for leadership — still $5/month.',
      primaryCtaLabel: 'Get analytics workspace',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'See reporting tour',
      secondaryCtaHref: '/faq'
    }
  }
};

export function HomePage() {
  useSEO({
    title: 'generatecodeqr - Create Dynamic QR Codes with Advanced Analytics | $5/Month',
    description:
      'Generate dynamic QR codes with real-time analytics, advanced customization, and tracking. Simple $5/month pricing with no hidden fees or scams. Create QR codes for websites, vCard, WiFi, social media, and more.',
    keywords:
      'qr code generator, dynamic qr codes, qr code analytics, qr code creator, business qr codes, qr code tracking, qr code maker, free qr code, honest pricing',
    url: 'https://qrgenerator-liart.vercel.app/'
  });

  const features = [
    {
      icon: Palette,
      title: 'Advanced customization',
      description: 'Custom colors, frames, gradients, CTAs, and branded templates ready to go.'
    },
    {
      icon: BarChart3,
      title: 'Real-time analytics',
      description: 'Understand who scans, when, and where with dashboards that auto-update.'
    },
    {
      icon: Settings,
      title: 'Dynamic content',
      description: 'Edit destinations after printing and switch campaigns without reprinting a code.'
    },
    {
      icon: Shield,
      title: 'Secure & reliable',
      description: 'Enterprise-grade infrastructure with uptime monitoring and privacy-first tracking.'
    }
  ];

  const workflow = [
    {
      step: '01',
      title: 'Pick the perfect template',
      copy: 'Start from WiFi, vCard, menus, coupons, or build from scratch. Every experience is mobile-ready.'
    },
    {
      step: '02',
      title: 'Customize in minutes',
      copy: 'Add your logo, pick the colors, drop in media, and preview on desktop and mobile instantly.'
    },
    {
      step: '03',
      title: 'Launch and track',
      copy: 'Share the code anywhere and watch analytics roll in with detailed engagement insights.'
    }
  ];

  const useCases = [
    'Restaurants & menus',
    'Events & ticketing',
    'Retail coupons & promos',
    'Business cards & networking',
    'Product packaging',
    'Real estate listings'
  ];

  const testimonials = [
    {
      quote:
        '“We replaced four different QR tools with generatecodeqr. It took 10 minutes to launch branded menus with analytics that made sense.”',
      author: 'Melissa Carter',
      role: 'Marketing Lead @ GreenFork Hospitality'
    },
    {
      quote:
        '“The $5 plan is unbelievably fair compared to everyone else. Unlimited scans plus the live landing pages make our campaigns feel high end.”',
      author: 'James Nakamura',
      role: 'Founder @ UrbanFit Studios'
    }
  ];

  const getQueryVariant = (): LandingVariantKey | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    const value = new URLSearchParams(window.location.search).get('landing_variant');
    if (!value) {
      return null;
    }
    if (value === 'control') {
      return 'control';
    }
    if (VALID_VARIANTS.includes(value as LandingVariantKey)) {
      return value as LandingVariantKey;
    }
    return null;
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState<LandingVariantKey>(() => getQueryVariant() ?? 'control');
  const variantCopy = useMemo(() => VARIANT_COPY[activeVariant], [activeVariant]);

  useEffect(() => {
    const queryVariant = getQueryVariant();

    if (queryVariant) {
      setActiveVariant(queryVariant);
      if (POSTHOG_ENABLED) {
        try {
          posthog.featureFlags.overrideFeatureFlags({
            [FEATURE_FLAGS.LANDINGPAGE_CONVERSION]: queryVariant
          });
          posthog.reloadFeatureFlags();
        } catch (error) {
          console.warn('[LandingPage] Failed to override PostHog flag with query variant', error);
        }
      }
      return;
    }

    if (!POSTHOG_ENABLED) {
      setActiveVariant('control');
      return;
    }

    const applyFlag = (value: unknown) => {
      if (value === 'control') {
        setActiveVariant('control');
        return;
      }
      if (typeof value === 'string' && VALID_VARIANTS.includes(value as LandingVariantKey)) {
        setActiveVariant(value as LandingVariantKey);
        return;
      }
      setActiveVariant('control');
    };

    const handleFlagChange = () => {
      const flagValue = posthog.getFeatureFlag(FEATURE_FLAGS.LANDINGPAGE_CONVERSION);
      applyFlag(flagValue);
    };

    handleFlagChange();
    const unsubscribe = posthog.onFeatureFlags(handleFlagChange);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const isControl = activeVariant === 'control';
  const variantConfig = !isControl
    ? landingVariantConfigs[activeVariant as Exclude<LandingVariantKey, 'control'>]
    : null;

  if (!isControl && variantConfig) {
    return (
      <VariantLanding
        variantKey={activeVariant as Exclude<LandingVariantKey, 'control'>}
        copy={variantCopy}
        config={variantConfig}
      />
    );
  }

  const qrTypes = [
    { name: 'Website', icon: '🌐', description: 'Link to any website URL' },
    { name: 'PDF', icon: '📄', description: 'Show a PDF' },
    { name: 'Images', icon: '🖼️', description: 'Share multiple images' },
    { name: 'Video', icon: '🎥', description: 'Show a video' },
    { name: 'WiFi', icon: '📶', description: 'Connect to a Wi-Fi network' },
    { name: 'Menu', icon: '🍽️', description: 'Create a restaurant menu' },
    { name: 'Business', icon: '💼', description: 'Share business information' },
    { name: 'vCard', icon: '👤', description: 'Share a digital business card' },
    { name: 'MP3', icon: '🎵', description: 'Share an audio file' },
    { name: 'Apps', icon: '📱', description: 'Redirect to an app store' },
    { name: 'List of Links', icon: '🔗', description: 'Share multiple links' },
    { name: 'Coupon', icon: '🎫', description: 'Share a coupon' },
    { name: 'Facebook', icon: '👥', description: 'Share your Facebook page' },
    { name: 'Instagram', icon: '📷', description: 'Share your Instagram' },
    { name: 'Social Media', icon: '🌟', description: 'Share your social channels' },
    { name: 'WhatsApp', icon: '💬', description: 'Get WhatsApp messages' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <nav className="container mx-auto px-4 py-4 md:px-6 md:py-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <QrCode className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
          <span className="text-xl md:text-2xl font-bold">generatecodeqr</span>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/faq" className="hover:text-purple-300 transition">FAQ</Link>
          <Link to="/login" className="hover:text-purple-300 transition">Log In</Link>
          <Link
            to="/signup"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition"
          >
            Sign Up
          </Link>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-purple-900/95 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 space-y-3">
            <Link to="/faq" className="block py-2 hover:text-purple-300 transition" onClick={() => setMobileMenuOpen(false)}>
              FAQ
            </Link>
            <Link to="/login" className="block py-2 hover:text-purple-300 transition" onClick={() => setMobileMenuOpen(false)}>
              Log In
            </Link>
            <Link
              to="/signup"
              className="block bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl p-3 md:p-4 mb-4 md:mb-6 inline-block">
              <span className="font-bold text-xs md:text-sm">✓ Honest Pricing • No Scams • No Hidden Fees</span>
            </div>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              The Only QR Generator That Doesn't Scam You
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-300 mb-4 max-w-3xl">
              Unlike other QR generators with fake "free" trials and hidden charges, we charge a simple{' '}
              <strong className="text-white">$5/month</strong>. No surprises, no tricks, no scams. What you see is what you pay.
            </p>
            <p className="text-sm md:text-base lg:text-lg text-gray-400 mb-6 md:mb-8 max-w-3xl">
              Create dynamic QR codes with advanced analytics, customization, and tracking. Perfect for businesses, marketing, and events.
            </p>
            <Link
              to="/signup"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold text-base md:text-lg px-6 md:px-10 py-3 md:py-4 rounded-lg transition transform hover:scale-105 mb-3 md:mb-4"
            >
              Start generating QR codes - $5/month
            </Link>
            <p className="text-gray-400 text-sm md:text-base">Simple, honest pricing. Cancel anytime.</p>
          </div>
          <div className="hidden md:block">
            <div className="w-full h-full min-h-[320px] rounded-xl shadow-2xl transform hover:scale-[1.02] transition duration-500 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 border border-white/10 flex items-center justify-center p-8">
              <div className="w-full h-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-md p-6 flex flex-col justify-between text-left text-white">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/70">Live analytics</p>
                  <p className="text-2xl font-bold mt-2">Campaign overview</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center mt-6">
                  <div className="bg-white/10 rounded-lg py-4">
                    <p className="text-2xl font-bold text-white">3.2k</p>
                    <p className="text-xs text-white/80">Scans</p>
                  </div>
                  <div className="bg-white/10 rounded-lg py-4">
                    <p className="text-2xl font-bold text-white">72%</p>
                    <p className="text-xs text-white/80">Mobile</p>
                  </div>
                  <div className="bg-white/10 rounded-lg py-4">
                    <p className="text-2xl font-bold text-white">38%</p>
                    <p className="text-xs text-white/80">CTA Clicks</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20 mt-6 text-sm text-white/80">
                  Live dashboards update in real time with every scan — no refresh required.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">
          Create QR Codes With Our Step-by-Step System
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 mb-12 md:mb-16">
          {qrTypes.map((type) => (
            <div
              key={type.name}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 text-center hover:bg-white/20 transition cursor-pointer"
              title={type.description}
            >
              <div className="text-2xl md:text-4xl mb-1 md:mb-2">{type.icon}</div>
              <div className="text-xs md:text-sm font-semibold break-words">{type.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-4 px-4">Why We're Different</h2>
        <p className="text-center text-base md:text-lg text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto px-4">
          Most QR generators trick you with "free" trials that auto-bill you for hundreds of dollars. We don't do that. We're
          honest about our $5/month fee upfront.
        </p>
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-4 md:p-8 mb-8 md:mb-12 max-w-4xl mx-auto text-slate-900">
          <h3 className="text-lg md:text-2xl font-bold text-red-900 mb-3 md:mb-4">❌ Other QR Generators Scam You</h3>
          <ul className="space-y-2 text-sm md:text-base text-red-800 mb-4">
            <li>• Fake "free" trials that auto-charge $99+ after</li>
            <li>• Hidden fees buried in terms</li>
            <li>• Confusing pricing tiers</li>
            <li>• Credit card required for "free" trial</li>
          </ul>
          <h3 className="text-lg md:text-2xl font-bold text-green-900 mb-3 md:mb-4 mt-6">✅ We're Honest & Transparent</h3>
          <ul className="space-y-2 text-sm md:text-base text-green-800">
            <li>• Simple $5/month - no surprises</li>
            <li>• No hidden fees - what you see is what you pay</li>
            <li>• Cancel anytime - no tricks</li>
            <li>• Clear pricing upfront - no scams</li>
          </ul>
        </div>

        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">QR Codes to Boost Your Business</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 hover:bg-white/20 transition border border-white/10 shadow-lg"
              >
                <div className="text-purple-400 mb-3 md:mb-4">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm md:text-base text-gray-300">{description}</p>
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="w-full h-full min-h-[320px] rounded-xl shadow-2xl border-4 border-purple-500/50 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-8 flex items-center justify-center">
              <div className="w-full h-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-lg p-6 text-white">
                <h3 className="text-xl font-semibold mb-4">Detailed analytics dashboard</h3>
                <p className="text-sm text-white/80">
                  Understand who scans, when, and where with dashboards that update automatically. Filter by campaign, location,
                  or device in seconds.
                </p>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-white/70">
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-wide text-white/60">Top campaign</p>
                    <p className="text-lg font-semibold text-white">Menu QR</p>
                    <p className="text-xs text-white/60">+184% scans</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs uppercase tracking-wide text-white/60">Engagement</p>
                    <p className="text-lg font-semibold text-white">42%</p>
                    <p className="text-xs text-white/60">CTA clicks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="bg-white/5 border border-white/10 rounded-3xl px-6 md:px-10 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">Launch in minutes, not weeks</h2>
              <p className="text-base md:text-lg text-slate-200 max-w-2xl">
                Our guided builder, live preview, and ready-made experiences keep you shipping fast—no designer or developer required.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-100 px-4 py-2 rounded-full border border-purple-400/30">
              <Zap className="w-5 h-5" />
              No tech team needed
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {workflow.map((item) => (
              <div key={item.step} className="relative bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="absolute -top-4 left-6 w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center font-semibold text-white text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-200">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Perfect for every industry</h2>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-lg transition"
            >
              Create your QR space
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
          <p className="text-base text-slate-200 max-w-3xl mb-6">
            Spin up digital menus, link-in-bio hubs, coupon offers, onboarding flows, and more. generatecodeqr gives you the polish of an agency build with the speed of a DIY editor.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase) => (
              <div key={useCase} className="bg-white/10 border border-white/10 rounded-2xl px-5 py-6 text-center text-sm font-semibold tracking-wide text-slate-100 uppercase">
                {useCase}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">
          Teams love the speed and clarity
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <div key={testimonial.author} className="bg-white/10 border border-white/10 rounded-3xl p-6 md:p-8">
              <p className="text-sm md:text-base text-slate-100/90 mb-4">{testimonial.quote}</p>
              <div className="text-sm font-semibold text-white">{testimonial.author}</div>
              <div className="text-xs uppercase tracking-wide text-slate-300">{testimonial.role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-20 text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
          Join today and launch your first QR experience in minutes
        </h2>
        <p className="text-base md:text-lg text-slate-200 max-w-2xl mx-auto mb-6">
          Everything is included for $5/month. Unlimited scans, live editing, full analytics, and no contracts.
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold text-base md:text-lg px-6 md:px-10 py-3 md:py-4 rounded-lg transition"
        >
          Get started for $5
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <footer className="border-t border-white/10 py-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/pricing" className="hover:text-white transition">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/privacy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/contact" className="hover:text-white transition">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Language</h4>
              <select className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white w-full">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
          <div className="text-center mt-8 text-slate-400 text-sm">
            © 2025 generatecodeqr. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

type VariantLandingProps = {
  variantKey: Exclude<LandingVariantKey, 'control'>;
  copy: VariantCopy;
  config: VariantLandingConfig;
};

function VariantLanding({ variantKey, copy, config }: VariantLandingProps) {
  const renderHeroVisual = () => {
    switch (config.hero.visual) {
      case 'cards':
        return (
          <div className="relative mx-auto max-w-lg">
            <div className="absolute -top-8 -left-6 h-32 w-32 rounded-full bg-emerald-200/50 blur-3xl" />
            <div className={`relative rounded-3xl p-6 shadow-2xl ${config.theme.card}`}>
              <p className="text-sm font-semibold text-emerald-600">Lead capture</p>
              <h3 className="mt-2 text-lg font-bold text-emerald-900">Summer Giveaway</h3>
              <div className="mt-4 space-y-3 text-sm text-emerald-800">
                <div className="flex items-center justify-between">
                  <span>Name & email</span>
                  <span>Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Offer selected</span>
                  <span>10% off</span>
                </div>
              </div>
              <div className="mt-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700">
                Automations: Send welcome email + Slack alert
              </div>
            </div>
            <div className={`absolute -bottom-8 right-0 w-56 rounded-2xl p-4 shadow-xl ${config.theme.softCard}`}>
              <p className="text-xs font-semibold text-emerald-700">New submissions</p>
              <p className="text-2xl font-bold text-emerald-900">127</p>
              <p className="text-xs text-emerald-600">Past 7 days</p>
            </div>
          </div>
        );
      case 'glow':
        return (
          <div className="relative mx-auto max-w-md">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-pink-500/40 via-purple-500/40 to-rose-500/40 blur-3xl" />
            <div className={`relative overflow-hidden rounded-3xl border border-white/15 p-6 shadow-2xl ${config.theme.softCard}`}>
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Automation timeline</span>
                <span>Today</span>
              </div>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-pink-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">Scan triggers welcome offer</p>
                    <p className="text-xs text-white/80">Sent to email + SMS</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-purple-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">24h reminder configured</p>
                    <p className="text-xs text-white/80">Offer rotation: weekday lunch</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-rose-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">VIP alert</p>
                    <p className="text-xs text-white/80">Notify Slack channel instantly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'beams':
        return (
          <div className="relative mx-auto max-w-4xl">
            <div className="relative h-72 rounded-[3rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_55%)]" />
              <div className="absolute inset-0 flex items-center justify-center gap-8 px-8">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-48 w-32 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-sm shadow-lg"
                  />
                ))}
              </div>
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white/80">
                Brand layouts preview
              </div>
            </div>
          </div>
        );
      case 'dashboard':
        return (
          <div className="relative mx-auto max-w-2xl">
            <div className="absolute -top-10 right-0 h-36 w-36 rounded-full bg-amber-300/40 blur-3xl" />
            <div className={`relative rounded-3xl border border-white/20 p-6 shadow-2xl ${config.theme.softCard}`}>
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Event control · Live</span>
                <span>Room capacity</span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-4 text-white">
                <div>
                  <p className="text-lg font-semibold">1,820</p>
                  <p className="text-xs text-white/80">Checked in</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">12</p>
                  <p className="text-xs text-white/80">VIP alerts</p>
                </div>
                <div>
                  <p className="text-lg font-semibold">+29%</p>
                  <p className="text-xs text-white/80">Sponsor scans</p>
                </div>
              </div>
              <div className="mt-6 space-y-3 text-xs text-white/80">
                <div className="flex items-center justify-between">
                  <span>Main Stage</span>
                  <span>82% capacity</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Workshop A</span>
                  <span>Seat change pushed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Expo Hall</span>
                  <span>New sponsor spotlight</span>
                </div>
              </div>
            </div>
          </div>
        );
      case 'rings':
      default:
        return (
          <div className="relative mx-auto max-w-xl">
            <div className="absolute inset-0 -rotate-2 rounded-[3rem] border border-white/10" />
            <div className="absolute inset-0 rotate-3 rounded-[3rem] border border-white/5" />
            <div className={`relative rounded-[3rem] p-8 shadow-2xl ${config.theme.softCard}`}>
              <p className="text-xs uppercase tracking-wider text-white/70">Executive dashboard</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">Campaign performance</h3>
              <div className="mt-6 grid grid-cols-2 gap-4 text-white">
                <div className="rounded-2xl border border-white/15 p-4">
                  <p className="text-xs text-white/70">Total scans</p>
                  <p className="text-2xl font-bold">48,210</p>
                  <p className="text-xs text-white/70">+12% vs last week</p>
                </div>
                <div className="rounded-2xl border border-white/15 p-4">
                  <p className="text-xs text-white/70">Conversion rate</p>
                  <p className="text-2xl font-bold">8.4%</p>
                  <p className="text-xs text-white/70">Click-to-action</p>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-white/10 p-4 text-xs text-white/80">
                <span>PostHog → generatecodeqr</span>
                <span>Stripe revenue connected</span>
              </div>
            </div>
          </div>
        );
    }
  };

  const renderSupportingPoints = () => {
    if (config.supportingLayout === 'grid') {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {config.supportingPoints.map((point) => (
            <div key={point} className={`rounded-2xl p-5 text-sm ${config.theme.card}`}>
              {point}
            </div>
          ))}
        </div>
      );
    }

    if (config.supportingLayout === 'timeline') {
      return (
        <div className="relative border-l border-dashed border-white/20 pl-6">
          {config.supportingPoints.map((point, index) => (
            <div key={point} className="relative mb-6 pl-4 last:mb-0">
              <div className="absolute -left-[1.45rem] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white/80">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-white/80">{point}</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {config.supportingPoints.map((point, index) => (
          <div key={point} className={`flex items-start gap-4 rounded-2xl p-5 ${config.theme.softCard}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {index + 1}
            </div>
            <p className={`text-sm leading-relaxed ${config.theme.subtext}`}>{point}</p>
          </div>
        ))}
      </div>
    );
  };

  const featureGridClass =
    config.featureLayout === 'columns'
      ? 'grid gap-6 md:grid-cols-2'
      : config.featureLayout === 'stacked'
        ? 'space-y-4'
        : 'grid gap-6 md:grid-cols-3';

  const renderFeatureCard = (feature: VariantFeature) => {
    const Icon = ICON_MAP[feature.icon];
    const iconBg =
      variantKey === 'page3'
        ? 'bg-slate-900 text-white'
        : variantKey === 'page1'
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-white/10 text-white';

    return (
      <div key={feature.title} className={`rounded-3xl border ${config.theme.outline} p-6 shadow-lg ${config.theme.softCard}`}>
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className={`text-lg font-semibold ${config.theme.text}`}>{feature.title}</h3>
        <p className={`mt-3 text-sm leading-relaxed ${config.theme.subtext}`}>{feature.description}</p>
      </div>
    );
  };

  return (
    <div className={`${config.theme.wrapper}`}>
      <div className="relative">
        {variantKey === 'page2' && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
        )}
        {variantKey === 'page5' && (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />
        )}

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-6">
            <div className={`flex items-center gap-2 ${config.theme.navText}`}>
              <QrCode className="h-6 w-6" />
              <span className="text-xl font-semibold tracking-tight">generatecodeqr</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/faq" className={`text-sm transition ${config.theme.subtext} hover:opacity-80`}>
                FAQ
              </Link>
              <Link to="/login" className={`text-sm transition ${config.theme.subtext} hover:opacity-80`}>
                Log In
              </Link>
              <Link
                to="/signup"
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
              >
                Sign Up
              </Link>
            </div>
          </nav>

          <section className="py-16 md:py-24">
            {config.hero.layout === 'stacked' ? (
              <div className="mx-auto max-w-3xl text-center space-y-8">
                <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${config.theme.badge}`}>
                  <Sparkles className="h-4 w-4" />
                  <span className={config.theme.badgeText}>{copy.heroBadge}</span>
                </div>
                <h1 className={`text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl ${config.theme.text}`}>
                  {copy.heroTitle}
                </h1>
                <p className={`text-base sm:text-lg leading-relaxed ${config.theme.subtext}`}>{copy.heroDescription}</p>
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-center">
                  <Link
                    to={copy.primaryCtaHref}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                  >
                    {copy.primaryCtaLabel}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    to={copy.secondaryCtaHref}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition ${config.theme.secondaryButton} ${config.theme.secondaryButtonHover}`}
                  >
                    {copy.secondaryCtaLabel}
                  </Link>
                </div>
                <p className={`text-sm ${config.theme.subtext}`}>{config.hero.supporting}</p>
                <div className="mx-auto max-w-4xl">{renderHeroVisual()}</div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {config.hero.stats.map((stat) => (
                    <div key={stat.label} className={`rounded-3xl p-5 text-left ${config.theme.card}`}>
                      <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
                      <p className={`mt-2 text-2xl font-semibold ${config.theme.text}`}>{stat.value}</p>
                      <p className={`text-xs ${config.theme.subtext}`}>{stat.helper}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid items-center gap-12 lg:gap-16 md:grid-cols-2">
                <div
                  className={`space-y-6 ${config.hero.layout === 'reverse' ? 'md:order-2 md:text-left text-left' : 'text-left'}`}
                >
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${config.theme.badge}`}>
                    <Sparkles className="h-4 w-4" />
                    <span className={config.theme.badgeText}>{copy.heroBadge}</span>
                  </div>
                  <h1 className={`text-4xl font-extrabold tracking-tight sm:text-5xl ${config.theme.text}`}>{copy.heroTitle}</h1>
                  <p className={`text-base sm:text-lg leading-relaxed ${config.theme.subtext}`}>{copy.heroDescription}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                    <Link
                      to={copy.primaryCtaHref}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                    >
                      {copy.primaryCtaLabel}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                      to={copy.secondaryCtaHref}
                      className={`mt-3 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition sm:mt-0 ${config.theme.secondaryButton} ${config.theme.secondaryButtonHover}`}
                    >
                      {copy.secondaryCtaLabel}
                    </Link>
                  </div>
                  <p className={`text-sm ${config.theme.subtext}`}>{config.hero.supporting}</p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {config.hero.stats.map((stat) => (
                      <div key={stat.label} className={`rounded-3xl p-5 ${config.theme.card}`}>
                        <p className={`text-xs uppercase tracking-wider ${config.theme.subtext}`}>{stat.label}</p>
                        <p className={`mt-2 text-2xl font-semibold ${config.theme.text}`}>{stat.value}</p>
                        <p className={`text-xs ${config.theme.subtext}`}>{stat.helper}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={config.hero.layout === 'reverse' ? 'md:order-1' : ''}>{renderHeroVisual()}</div>
              </div>
            )}
          </section>

          <section className="py-12 md:py-16">
            <div className={`mb-8 flex items-center gap-3 text-sm font-semibold ${config.theme.subtext}`}>
              <div className="h-1 w-12 rounded-full bg-current opacity-60" />
              Lead journeys powered by $5/month
            </div>
            {renderSupportingPoints()}
          </section>

          <section className="py-12 md:py-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className={`text-2xl font-bold md:text-3xl ${config.theme.text}`}>Everything built into the platform</h2>
                <p className={`mt-2 text-sm ${config.theme.subtext}`}>
                  Unlimited scans, live editing, and analytics stay under the same $5 membership.
                </p>
              </div>
              <Link
                to={copy.primaryCtaHref}
                className={`inline-flex items-center gap-2 text-sm font-semibold transition ${config.theme.secondaryButton} ${config.theme.secondaryButtonHover} rounded-full px-5 py-2`}
              >
                Explore builder
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className={featureGridClass}>{config.features.map(renderFeatureCard)}</div>
          </section>

          <section className="py-12 md:py-16">
            <div className={`rounded-[2.5rem] overflow-hidden border px-6 py-8 md:px-10 md:py-12 ${config.theme.outline} ${config.theme.softCard}`}>
              <div className="grid gap-10 md:grid-cols-2 md:items-center">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${config.theme.subtext}`}>{config.highlight.eyebrow}</p>
                  <h3 className={`mt-3 text-3xl font-bold ${config.theme.text}`}>{config.highlight.title}</h3>
                  <p className={`mt-4 text-sm leading-relaxed ${config.theme.subtext}`}>{config.highlight.description}</p>
                </div>
                <div className={`rounded-3xl p-6 ${config.theme.card}`}>
                  <p className={`text-sm uppercase tracking-wider ${config.theme.subtext}`}>{config.highlight.metricLabel}</p>
                  <p className={`mt-2 text-4xl font-bold ${config.theme.text}`}>{config.highlight.metricValue}</p>
                  <p className={`mt-3 text-xs ${config.theme.subtext}`}>{config.highlight.footnote}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className={`grid gap-8 md:grid-cols-[1.2fr_1fr]`}>
              <div className={`rounded-3xl border p-8 md:p-10 ${config.theme.outline} ${config.theme.softCard}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${config.theme.subtext}`}>{config.pricing.eyebrow}</p>
                <h3 className={`mt-3 text-3xl font-bold ${config.theme.text}`}>{config.pricing.title}</h3>
                <p className={`mt-3 text-sm ${config.theme.subtext}`}>{config.pricing.description}</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className={`text-4xl font-extrabold ${config.theme.text}`}>{config.pricing.price}</span>
                  <span className={`text-sm ${config.theme.subtext}`}>{config.pricing.suffix}</span>
                </div>
                <ul className={`mt-6 space-y-3 text-sm ${config.theme.subtext}`}>
                  {config.pricing.bullet.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-current" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={copy.primaryCtaHref}
                  className={`mt-8 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                >
                  {copy.primaryCtaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <p className={`mt-4 text-xs ${config.theme.subtext}`}>{config.pricing.footnote}</p>
              </div>
              <div className={`rounded-3xl border p-8 ${config.theme.outline} ${config.theme.card}`}>
                <p className="text-sm italic leading-relaxed">{config.testimonial.quote}</p>
                <div className="mt-6 text-sm font-semibold">{config.testimonial.author}</div>
                <div className={`text-xs uppercase tracking-wide ${config.theme.subtext}`}>{config.testimonial.role}</div>
              </div>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className={`rounded-3xl border px-6 py-10 text-center md:py-14 ${config.theme.outline} ${config.theme.softCard}`}>
              <h2 className={`text-3xl font-bold ${config.theme.text}`}>{config.closing.title}</h2>
              <p className={`mx-auto mt-4 max-w-2xl text-sm leading-relaxed ${config.theme.subtext}`}>{config.closing.description}</p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to={config.closing.primaryCtaHref}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                >
                  {config.closing.primaryCtaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {config.closing.secondaryCtaHref && config.closing.secondaryCtaLabel && (
                  <Link
                    to={config.closing.secondaryCtaHref}
                    className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-semibold transition ${config.theme.secondaryButton} ${config.theme.secondaryButtonHover}`}
                  >
                    {config.closing.secondaryCtaLabel}
                  </Link>
                )}
              </div>
            </div>
          </section>

          <footer className="py-10">
            <div className="grid gap-6 text-sm md:grid-cols-4">
              <div>
                <h4 className={`mb-3 font-semibold ${config.theme.text}`}>Product</h4>
                <ul className={`space-y-2 ${config.theme.subtext}`}>
                  <li>
                    <Link to="/pricing" className="transition hover:opacity-80">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link to="/faq" className="transition hover:opacity-80">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className={`mb-3 font-semibold ${config.theme.text}`}>Legal</h4>
                <ul className={`space-y-2 ${config.theme.subtext}`}>
                  <li>
                    <Link to="/privacy" className="transition hover:opacity-80">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link to="/terms" className="transition hover:opacity-80">
                      Terms of Service
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className={`mb-3 font-semibold ${config.theme.text}`}>Support</h4>
                <ul className={`space-y-2 ${config.theme.subtext}`}>
                  <li>
                    <Link to="/contact" className="transition hover:opacity-80">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className={`mb-3 font-semibold ${config.theme.text}`}>Language</h4>
                <select className="w-full rounded border border-white/20 bg-transparent px-3 py-2 text-sm">
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
            <p className={`mt-8 text-center text-xs ${config.theme.subtext}`}>© 2025 generatecodeqr. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}


