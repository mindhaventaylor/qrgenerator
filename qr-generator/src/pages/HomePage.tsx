import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  X,
  Globe,
  FileText,
  Image as ImageIcon,
  Video,
  Wifi,
  Menu as MenuIcon,
  Briefcase,
  User,
  Music,
  Smartphone,
  Link as LinkIcon,
  Ticket,
  Facebook,
  Instagram,
  Share2,
  MessageCircle,
  Download,
  Lock
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';
import { posthog, POSTHOG_ENABLED } from '../lib/posthog';
import { FEATURE_FLAGS } from '../lib/featureFlags';
import { buildQRData } from '../lib/qrGenerator';
import { useAuth } from '../contexts/AuthContext';

type LandingVariantKey = 'control' | 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6';

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

const VALID_VARIANTS: LandingVariantKey[] = ['control', 'page1', 'page2', 'page3', 'page4', 'page5', 'page6'];

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
    heroBadge: 'Try it free • No signup required • Build your QR code now',
    heroTitle: 'Create your QR code instantly—pay only when you\'re ready to save',
    heroDescription:
      'Build, customize, and preview your QR code right here. No account needed until you want to save it. See the value before you commit.',
    primaryCtaLabel: 'Start building now',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See how it works',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Full access to the tool. Sign up only to save your QR codes.'
  },
  page2: {
    heroBadge: 'Try it free • No signup required • Build your QR code now',
    heroTitle: 'Create your QR code instantly—pay only when you\'re ready to save',
    heroDescription:
      'Build, customize, and preview your QR code right here. No account needed until you want to save it. See the value before you commit.',
    primaryCtaLabel: 'Start building now',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See how it works',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Full access to the tool. Sign up only to save your QR codes.'
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
    heroBadge: 'EDITABLE QR CODES • REAL-TIME ANALYTICS • HONEST PRICING',
    heroTitle: 'Get Real-time QR Analytics Without Overpriced Plans or Contracts',
    heroDescription:
      'Track scans, locations, devices, and engagement in clean, easy dashboards. Edit or deactivate any QR anytime — all included in one transparent $5/month plan.',
    primaryCtaLabel: 'Try Now',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'Explore QR Builder',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Unlimited dashboards and alerts. Flat $5/month.'
  },
  page6: {
    heroBadge: 'Try it free • No signup required • Build your QR code now',
    heroTitle: 'Create your QR code instantly—pay only when you\'re ready to save',
    heroDescription:
      'Build, customize, and preview your QR code right here. No account needed until you want to save it. See the value before you commit.',
    primaryCtaLabel: 'Start building now',
    primaryCtaHref: '/signup',
    secondaryCtaLabel: 'See how it works',
    secondaryCtaHref: '/faq',
    heroFootnote: 'Full access to the tool. Sign up only to save your QR codes.'
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
  testimonial?: VariantTestimonial;
  testimonials?: VariantTestimonial[];
  closing: VariantClosing;
};

const landingVariantConfigs: Record<Exclude<LandingVariantKey, 'control'>, VariantLandingConfig> = {
  page1: {
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
      supporting: 'Build your QR code right here. No signup needed until you want to save it.',
      stats: [
        { label: 'Build time', value: '< 2 min', helper: 'From start to preview' },
        { label: 'QR types', value: '16+', helper: 'All available' },
        { label: 'Signup required', value: 'Only to save', helper: 'Try everything first' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Select any QR type and customize it completely.',
      'Preview your QR code in real-time as you build.',
      'Sign up only when you\'re ready to save and track scans.'
    ],
    featureLayout: 'stacked',
    features: [
      { icon: 'qr', title: 'Full tool access', description: 'Use every feature without restrictions until you save.' },
      { icon: 'palette', title: 'Live preview', description: 'See your QR code update as you customize it.' },
      { icon: 'shield', title: 'No commitment', description: 'Build and preview free. Pay only to save your codes.' }
    ],
    highlight: {
      eyebrow: 'Try-before-you-buy',
      title: 'See exactly what you\'re getting before you pay',
      description: 'Build your QR code, customize it, preview it—all without creating an account. Sign up only when you\'re ready to save.',
      metricValue: '100%',
      metricLabel: 'Of features available before signup',
      footnote: 'No watermarks. No limits. Just try it.'
    },
    pricing: {
      eyebrow: 'Pay only when you\'re ready',
      title: 'Try everything, pay only to save',
      description: 'Build unlimited QR codes and preview them all. Sign up and pay $5/month only when you want to save them.',
      price: '$5',
      suffix: '/month',
      bullet: ['Build & preview unlimited QR codes', 'Full customization access', 'Sign up only to save'],
      footnote: 'No credit card needed to try the tool.'
    },
    testimonial: {
      quote:
        '"I built 5 different QR codes before signing up. Being able to see exactly what I was getting made the decision easy."',
      author: 'Sarah Chen',
      role: 'Marketing Manager @ TechStart'
    },
    closing: {
      title: 'Ready to save your QR code?',
      description: 'Sign up now to save your QR code and start tracking scans. Still just $5/month.',
      primaryCtaLabel: 'Sign up to save',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'Keep building',
      secondaryCtaHref: '#'
    }
  },
  page2: {
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
      supporting: 'Build your QR code right here. No signup needed until you want to save it.',
      stats: [
        { label: 'Build time', value: '< 2 min', helper: 'From start to preview' },
        { label: 'QR types', value: '16+', helper: 'All available' },
        { label: 'Signup required', value: 'Only to save', helper: 'Try everything first' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Select any QR type and customize it completely.',
      'Preview your QR code in real-time as you build.',
      'Sign up only when you\'re ready to save and track scans.'
    ],
    featureLayout: 'stacked',
    features: [
      { icon: 'qr', title: 'Full tool access', description: 'Use every feature without restrictions until you save.' },
      { icon: 'palette', title: 'Live preview', description: 'See your QR code update as you customize it.' },
      { icon: 'shield', title: 'No commitment', description: 'Build and preview free. Pay only to save your codes.' }
    ],
    highlight: {
      eyebrow: 'Try-before-you-buy',
      title: 'See exactly what you\'re getting before you pay',
      description: 'Build your QR code, customize it, preview it—all without creating an account. Sign up only when you\'re ready to save.',
      metricValue: '100%',
      metricLabel: 'Of features available before signup',
      footnote: 'No watermarks. No limits. Just try it.'
    },
    pricing: {
      eyebrow: 'Pay only when you\'re ready',
      title: 'Try everything, pay only to save',
      description: 'Build unlimited QR codes and preview them all. Sign up and pay $5/month only when you want to save them.',
      price: '$5',
      suffix: '/month',
      bullet: ['Build & preview unlimited QR codes', 'Full customization access', 'Sign up only to save'],
      footnote: 'No credit card needed to try the tool.'
    },
    testimonial: {
      quote:
        '"I built 5 different QR codes before signing up. Being able to see exactly what I was getting made the decision easy."',
      author: 'Sarah Chen',
      role: 'Marketing Manager @ TechStart'
    },
    closing: {
      title: 'Ready to save your QR code?',
      description: 'Sign up now to save your QR code and start tracking scans. Still just $5/month.',
      primaryCtaLabel: 'Sign up to save',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'Keep building',
      secondaryCtaHref: '#'
    }
  },
  page3: {
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
      supporting: 'Deliver agency-level design without agency retainers. Everything stays inside the $5/month plan.',
      stats: [
        { label: 'Brand kits uploaded', value: 'Unlimited', helper: 'Fonts, colors, logos' },
        { label: 'Time to iterate', value: 'x4 faster', helper: 'vs. designer queue' },
        { label: 'Hidden fees', value: '$0', helper: 'Flat monthly pricing' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Drag and drop layouts designed for menus, products, events, and more.',
      'Upload brand fonts, color tokens, and components once — reuse forever.',
      'Share preview links with stakeholders for approvals before printing.'
    ],
    featureLayout: 'stacked',
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
        '"We ditched mockups and just share live QR previews with clients. generatecodeqr feels like a design system in a box."',
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
      supporting: 'Check-ins, agendas, and sponsor promos — smooth for attendees, simple for ops teams, all for $5/month.',
      stats: [
        { label: 'Attendees supported', value: 'Unlimited', helper: 'No per-head billing' },
        { label: 'Check-in speed', value: '-63%', helper: 'Faster than manual lists' },
        { label: 'Sponsor scans', value: '+29%', helper: 'Instant landing updates' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Instant badge scanning with VIP routing and capacity tracking.',
      'Swap session schedules and room maps live without reprinting signage.',
      'Deliver sponsor promos or surveys immediately after sessions.'
    ],
    featureLayout: 'stacked',
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
        '"We stopped paying per attendee. generatecodeqr gave us better analytics and happier sponsors for a fraction of the cost."',
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
      supporting: 'Unlimited QR Codes, Full Analytics, and Tracking Dashboard — all included in your $5/month plan. No tiers, no tricks.',
      stats: [
        { label: 'MARKETING ROI TRACKED', value: '+37%', helper: 'More accurate scan insights' },
        { label: 'DASHBOARD ACCESS', value: 'Unlimited', helper: 'Share reports with your team' },
        { label: 'REAL-TIME ANALYTICS', value: 'Real-time tracking', helper: 'All features included' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'See total and unique scans, locations, devices, and engagement — all in one simple dashboard.',
      'Compare QR performance across campaigns, materials, or clients to see what drives real engagement.',
      'Export clean PDF reports or schedule email summaries to share performance with clients or your team.'
    ],
    featureLayout: 'stacked',
    features: [
      { icon: 'analytics', title: 'Clear tracking & results', description: 'Tie scans to conversions and revenue with built-in tracking.' },
      { icon: 'shield', title: 'Full control over your QR codes', description: 'Activate, deactivate, or update your QR codes anytime — manage everything easily from your dashboard.' },
      { icon: 'settings', title: 'Real-time analytics', description: 'Track scans, locations, devices, and engagement — all live in your dashboard.`' }
    ],
    highlight: {
      eyebrow: 'REAL BUSINESSES, REAL RESULTS',
      title: 'Gave leadership weeklyQR performance clarity',
      description: 'A restaurant chain switched from manual tracking to live QR dashboards — seeing scan growth and engagement across 120 locations.',
      metricValue: '12,000+',
      metricLabel: 'Trusted by Thousands',
      footnote: 'From small businesses to freelancers — everyone’s using GenerateCodeQR to create, edit, and track their QR codes.'
    },
    pricing: {
      eyebrow: 'Analytics without enterprise pricing',
      title: 'Everything your business needs — for just $5/month',
      description: 'Create, edit, and track unlimited QR codes with full analytics and branded designs. Cancel anytime.',
      price: '$5',
      suffix: '/month',
      bullet: ['Custom branded QR codes (logos, colors, vectors)', 'Editable & trackable dynamic codes', 'Edit content anytime','Real-time analytics dashboard','Unlimited QRs & scans','Activate or pause codes anytime', 'Multiple download formats (PNG, SVG, PDF)', 'Simple all-in-one dashboard', 'Priority support', 'Cancel anytime — no hidden fees'],
      footnote: 'No signup traps. Just $5/month when you’re ready to save your QR.'
    },
    testimonials: [
      {
        quote:
          '“We used to reprint menus every time something changed. Now we just update the QR and it\'s live everywhere, instantly.”',
        author: 'Maria Torres',
        role: 'Owner @ La Vida Café'
      },
      {
        quote:
          '“We added our logo and brand colors in seconds. Clients scan our QR codes on packaging and we can see where the scans come from. It\'s super useful.”',
        author: 'David Kim',
        role: 'Founder @ Urban Cosmetics'
      },
      {
        quote:
          '“Our marketing team finally understands how our QR codes perform. Everything\'s in one live dashboard that costs less than a cup of coffee.”',
        author: 'Nikhil Patel',
        role: 'Marketing Director @ Beacon Retail'
      }
    ],
    closing: {
      title: 'Start creating, editing & tracking your QR codes — all for $5/month',
      description: 'Design branded QR codes, edit them anytime, and see real-time scan analytics — no hidden fees, no fake trials, just an honest QR platform.',
      primaryCtaLabel: 'Create your QR code now',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'See how it works',
      secondaryCtaHref: '/faq'
    }
  },
  page6: {
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
      supporting: 'Build your QR code right here. No signup needed until you want to save it.',
      stats: [
        { label: 'Build time', value: '< 2 min', helper: 'From start to preview' },
        { label: 'QR types', value: '16+', helper: 'All available' },
        { label: 'Signup required', value: 'Only to save', helper: 'Try everything first' }
      ],
      visual: 'rings'
    },
    supportingLayout: 'grid',
    supportingPoints: [
      'Select any QR type and customize it completely.',
      'Preview your QR code in real-time as you build.',
      'Sign up only when you\'re ready to save and track scans.'
    ],
    featureLayout: 'stacked',
    features: [
      { icon: 'qr', title: 'Full tool access', description: 'Use every feature without restrictions until you save.' },
      { icon: 'palette', title: 'Live preview', description: 'See your QR code update as you customize it.' },
      { icon: 'shield', title: 'No commitment', description: 'Build and preview free. Pay only to save your codes.' }
    ],
    highlight: {
      eyebrow: 'Try-before-you-buy',
      title: 'See exactly what you\'re getting before you pay',
      description: 'Build your QR code, customize it, preview it—all without creating an account. Sign up only when you\'re ready to save.',
      metricValue: '100%',
      metricLabel: 'Of features available before signup',
      footnote: 'No watermarks. No limits. Just try it.'
    },
    pricing: {
      eyebrow: 'Pay only when you\'re ready',
      title: 'Try everything, pay only to save',
      description: 'Build unlimited QR codes and preview them all. Sign up and pay $5/month only when you want to save them.',
      price: '$5',
      suffix: '/month',
      bullet: ['Build & preview unlimited QR codes', 'Full customization access', 'Sign up only to save'],
      footnote: 'No credit card needed to try the tool.'
    },
    testimonial: {
      quote:
        '"I built 5 different QR codes before signing up. Being able to see exactly what I was getting made the decision easy."',
      author: 'Sarah Chen',
      role: 'Marketing Manager @ TechStart'
    },
    closing: {
      title: 'Ready to save your QR code?',
      description: 'Sign up now to save your QR code and start tracking scans. Still just $5/month.',
      primaryCtaLabel: 'Sign up to save',
      primaryCtaHref: '/signup',
      secondaryCtaLabel: 'Keep building',
      secondaryCtaHref: '#'
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

  const STORAGE_KEY = 'landing_page_variant';
  const COOKIE_KEY = 'landing_page_variant';

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

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const setCookie = (name: string, value: string, days: number = 365) => {
    if (typeof document === 'undefined') return;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getStoredVariant = (): LandingVariantKey | null => {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      // Check cookie first (more persistent)
      const cookieVariant = getCookie(COOKIE_KEY);
      if (cookieVariant && VALID_VARIANTS.includes(cookieVariant as LandingVariantKey)) {
        return cookieVariant as LandingVariantKey;
      }
      // Fallback to localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_VARIANTS.includes(stored as LandingVariantKey)) {
        return stored as LandingVariantKey;
      }
    } catch (error) {
      console.warn('[LandingPage] Failed to read stored variant', error);
    }
    return null;
  };

  const setStoredVariant = (variant: LandingVariantKey) => {
    if (typeof window === 'undefined') {
      return;
    }
    try {
      // Store in both cookie (for persistence) and localStorage (for immediate access)
      setCookie(COOKIE_KEY, variant, 365); // Store for 1 year
      localStorage.setItem(STORAGE_KEY, variant);
    } catch (error) {
      console.warn('[LandingPage] Failed to store variant', error);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const variantLockedRef = useRef(false); // Prevent PostHog from overriding stored variant
  const [activeVariant, setActiveVariant] = useState<LandingVariantKey>(() => {
    // Priority: query param > stored variant > control
    const queryVariant = getQueryVariant();
    if (queryVariant) {
      variantLockedRef.current = true; // Lock variant when set from query param
      return queryVariant;
    }
    const storedVariant = getStoredVariant();
    if (storedVariant) {
      variantLockedRef.current = true; // Lock variant when set from storage
      return storedVariant;
    }
    return 'control';
  });
  const variantCopy = useMemo(() => VARIANT_COPY[activeVariant], [activeVariant]);

  useEffect(() => {
    const queryVariant = getQueryVariant();

    // Query param takes highest priority (for testing)
    if (queryVariant) {
      variantLockedRef.current = true; // Lock variant to prevent PostHog from changing it
      setActiveVariant(queryVariant);
      setStoredVariant(queryVariant);
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

    // Check for stored variant first (persistence) - this takes priority over PostHog
    const storedVariant = getStoredVariant();
    if (storedVariant) {
      variantLockedRef.current = true; // Lock variant to prevent PostHog from changing it
      setActiveVariant(storedVariant);
      // Override PostHog to match stored variant to prevent conflicts
      if (POSTHOG_ENABLED) {
        try {
          posthog.featureFlags.overrideFeatureFlags({
            [FEATURE_FLAGS.LANDINGPAGE_CONVERSION]: storedVariant
          });
          posthog.reloadFeatureFlags();
        } catch (error) {
          console.warn('[LandingPage] Failed to override PostHog flag with stored variant', error);
        }
      }
      // Don't subscribe to PostHog changes - we want to keep the stored variant
      return;
    }

    // If no stored variant, get from PostHog and store it (only on first visit)
    if (!POSTHOG_ENABLED) {
      setActiveVariant('control');
      setStoredVariant('control');
      return;
    }

    // Only set up PostHog listener if we don't have a stored variant
    let hasStoredVariant = false;
    
    const applyFlag = (value: unknown) => {
      // Don't apply if we already have a stored variant (shouldn't happen, but safety check)
      if (hasStoredVariant) {
        return;
      }
      
      let variant: LandingVariantKey = 'control';
      
      if (value === 'control') {
        variant = 'control';
      } else if (typeof value === 'string' && VALID_VARIANTS.includes(value as LandingVariantKey)) {
        variant = value as LandingVariantKey;
      }
      
      setActiveVariant(variant);
      setStoredVariant(variant); // Store for persistence
    };

    const handleFlagChange = () => {
      // Never override if variant is locked (from query param or storage)
      if (variantLockedRef.current) {
        return;
      }
      
      // Double-check stored variant before applying PostHog value
      const currentStored = getStoredVariant();
      if (currentStored) {
        hasStoredVariant = true;
        variantLockedRef.current = true; // Lock it now
        setActiveVariant(currentStored);
        return;
      }
      
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
            <Link
              to="/signup"
              className="block w-full h-full min-h-[320px] rounded-xl shadow-2xl transform hover:scale-[1.02] transition duration-500 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-500 border border-white/10 flex items-center justify-center p-8 cursor-pointer"
            >
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
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-8 md:mb-12 px-4">
          Create QR Codes With Our Step-by-Step System
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 mb-12 md:mb-16">
          {qrTypes.map((type) => (
            <Link
              key={type.name}
              to="/signup"
              className="bg-white/10 backdrop-blur-sm rounded-lg p-2 md:p-4 text-center hover:bg-white/20 transition cursor-pointer"
              title={type.description}
            >
              <div className="text-2xl md:text-4xl mb-1 md:mb-2">{type.icon}</div>
              <div className="text-xs md:text-sm font-semibold break-words">{type.name}</div>
            </Link>
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
              <Link
                key={title}
                to="/signup"
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 hover:bg-white/20 transition border border-white/10 shadow-lg cursor-pointer block"
              >
                <div className="text-purple-400 mb-3 md:mb-4">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-2">{title}</h3>
                <p className="text-sm md:text-base text-gray-300">{description}</p>
              </Link>
            ))}
          </div>
          <div className="hidden lg:block">
            <Link
              to="/signup"
              className="block w-full h-full min-h-[320px] rounded-xl shadow-2xl border-4 border-purple-500/50 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 p-8 flex items-center justify-center hover:scale-[1.02] transition cursor-pointer"
            >
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
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <Link
          to="/signup"
          className="block bg-white/5 border border-white/10 rounded-3xl px-6 md:px-10 py-10 hover:bg-white/10 hover:scale-[1.01] transition cursor-pointer"
        >
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
              <div
                key={item.step}
                className="relative bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <div className="absolute -top-4 left-6 w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center font-semibold text-white text-lg">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-200">{item.copy}</p>
              </div>
            ))}
          </div>
        </Link>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <Link
          to="/signup"
          className="block bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 hover:bg-white/10 hover:scale-[1.01] transition cursor-pointer"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Perfect for every industry</h2>
            <div className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-3 rounded-lg transition">
              Create your QR space
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-base text-slate-200 max-w-3xl mb-6">
            Spin up digital menus, link-in-bio hubs, coupon offers, onboarding flows, and more. generatecodeqr gives you the polish of an agency build with the speed of a DIY editor.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase) => (
              <Link
                key={useCase}
                to="/signup"
                className="bg-white/10 border border-white/10 rounded-2xl px-5 py-6 text-center text-sm font-semibold tracking-wide text-slate-100 uppercase hover:bg-white/20 hover:scale-[1.02] transition cursor-pointer"
              >
                {useCase}
              </Link>
            ))}
          </div>
        </Link>
      </section>

      <section className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-12">
          Teams love the speed and clarity
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial) => (
            <Link
              key={testimonial.author}
              to="/signup"
              className="bg-white/10 border border-white/10 rounded-3xl p-6 md:p-8 hover:bg-white/20 hover:scale-[1.02] transition cursor-pointer block"
            >
              <p className="text-sm md:text-base text-slate-100/90 mb-4">{testimonial.quote}</p>
              <div className="text-sm font-semibold text-white">{testimonial.author}</div>
              <div className="text-xs uppercase tracking-wide text-slate-300">{testimonial.role}</div>
            </Link>
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
              <h4 className="font-bold mb-4">Get Started</h4>
              <ul className="space-y-2 text-slate-300">
                <li>
                  <Link to="/signup" className="hover:text-white transition font-semibold">
                    Sign Up
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

const QR_TYPES_INLINE = [
  { id: 'website', name: 'Website', icon: Globe, description: 'Link to any website URL' },
  { id: 'vcard', name: 'vCard', icon: User, description: 'Share a digital business card' },
  { id: 'wifi', name: 'WiFi', icon: Wifi, description: 'Connect to a Wi-Fi network' },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageCircle, description: 'Get WhatsApp messages' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, description: 'Share your Facebook page' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, description: 'Share your Instagram' },
];

function InlineQRBuilder({ config }: { config: VariantLandingConfig }) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [content, setContent] = useState<any>({});
  const [qrName, setQrName] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && selectedType && content) {
      try {
        const qrData = buildQRData(selectedType, content);
        if (qrData && qrData.trim() !== '') {
          const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png`;
          setPreviewUrl(qrApiUrl);
        } else {
          setPreviewUrl('');
        }
      } catch (error) {
        console.error('Error generating preview:', error);
        setPreviewUrl('');
      }
    } else {
      setPreviewUrl('');
    }
  }, [step, selectedType, content]);

  const handleSave = () => {
    if (!user) {
      setShowSignupPrompt(true);
      return;
    }
    navigate('/create-qr', { state: { type: selectedType, content, name: qrName } });
  };

  return (
    <section className="py-12 md:py-16">
      <div className={`rounded-3xl border ${config.theme.outline} ${config.theme.softCard} p-8 md:p-12`}>
        <h2 className={`text-3xl font-bold mb-6 ${config.theme.text}`}>Build your QR code now</h2>
        
        {step === 1 && (
          <div>
            <p className={`mb-6 ${config.theme.subtext}`}>Select a QR code type to get started</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {QR_TYPES_INLINE.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type.id);
                      setStep(2);
                    }}
                    className={`p-6 rounded-xl border ${config.theme.outline} hover:border-emerald-400 transition text-center ${config.theme.card}`}
                  >
                    <Icon className={`w-8 h-8 mx-auto mb-3 ${config.theme.text}`} />
                    <h3 className={`font-semibold mb-1 ${config.theme.text}`}>{type.name}</h3>
                    <p className={`text-xs ${config.theme.subtext}`}>{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setStep(1);
                setSelectedType('');
                setContent({});
                setQrName('');
              }}
              className={`text-sm ${config.theme.subtext} hover:opacity-80`}
            >
              ← Back to types
            </button>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className={`text-xl font-semibold ${config.theme.text}`}>Enter your details</h3>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>QR Code Name</label>
                  <input
                    type="text"
                    value={qrName}
                    onChange={(e) => setQrName(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                    placeholder="My QR Code"
                  />
                </div>

                {selectedType === 'website' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Website URL</label>
                    <input
                      type="url"
                      value={content.url || ''}
                      onChange={(e) => setContent({ ...content, url: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                      placeholder="https://example.com"
                    />
                  </div>
                )}

                {selectedType === 'vcard' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>First Name</label>
                        <input
                          type="text"
                          value={content.firstName || ''}
                          onChange={(e) => setContent({ ...content, firstName: e.target.value })}
                          className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Last Name</label>
                        <input
                          type="text"
                          value={content.lastName || ''}
                          onChange={(e) => setContent({ ...content, lastName: e.target.value })}
                          className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Phone</label>
                      <input
                        type="tel"
                        value={content.phone || ''}
                        onChange={(e) => setContent({ ...content, phone: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                        placeholder="+1234567890"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Email</label>
                      <input
                        type="email"
                        value={content.email || ''}
                        onChange={(e) => setContent({ ...content, email: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                        placeholder="john@example.com"
                      />
                    </div>
                  </>
                )}

                {selectedType === 'wifi' && (
                  <>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Network Name (SSID)</label>
                      <input
                        type="text"
                        value={content.ssid || ''}
                        onChange={(e) => setContent({ ...content, ssid: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                        placeholder="MyWiFi"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Password</label>
                      <input
                        type="password"
                        value={content.password || ''}
                        onChange={(e) => setContent({ ...content, password: e.target.value })}
                        className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                        placeholder="password123"
                      />
                    </div>
                  </>
                )}

                {selectedType === 'whatsapp' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Phone Number</label>
                    <input
                      type="tel"
                      value={content.phone || ''}
                      onChange={(e) => setContent({ ...content, phone: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                      placeholder="+1234567890"
                    />
                  </div>
                )}

                {selectedType === 'facebook' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Facebook Page ID or Username</label>
                    <input
                      type="text"
                      value={content.pageId || ''}
                      onChange={(e) => setContent({ ...content, pageId: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                      placeholder="yourpage"
                    />
                  </div>
                )}

                {selectedType === 'instagram' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${config.theme.subtext}`}>Instagram Username</label>
                    <input
                      type="text"
                      value={content.username || ''}
                      onChange={(e) => setContent({ ...content, username: e.target.value })}
                      className={`w-full px-4 py-3 rounded-lg border ${config.theme.outline} ${config.theme.card} ${config.theme.text} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                      placeholder="yourusername"
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className={`rounded-2xl p-8 ${config.theme.card} border ${config.theme.outline}`}>
                  <h4 className={`text-sm font-semibold mb-4 text-center ${config.theme.subtext}`}>Live Preview</h4>
                  {previewUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={previewUrl} alt="QR Code Preview" className="w-64 h-64 rounded-lg" />
                      <p className={`mt-4 text-xs text-center ${config.theme.subtext}`}>
                        Scan this QR code to test it
                      </p>
                    </div>
                  ) : (
                    <div className={`w-64 h-64 rounded-lg border-2 border-dashed ${config.theme.outline} flex items-center justify-center`}>
                      <p className={`text-sm ${config.theme.subtext}`}>Fill in the form to see preview</p>
                    </div>
                  )}
                </div>

                {showSignupPrompt && (
                  <div className={`mt-6 rounded-xl p-6 border ${config.theme.outline} ${config.theme.softCard} text-center`}>
                    <Lock className={`w-8 h-8 mx-auto mb-3 ${config.theme.text}`} />
                    <h4 className={`text-lg font-semibold mb-2 ${config.theme.text}`}>Sign up to save your QR code</h4>
                    <p className={`text-sm mb-4 ${config.theme.subtext}`}>
                      Your QR code is ready! Sign up now to save it and start tracking scans.
                    </p>
                    <Link
                      to="/signup"
                      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                    >
                      Sign up to save
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                )}

                {!showSignupPrompt && previewUrl && (
                  <button
                    onClick={handleSave}
                    className={`mt-6 inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                  >
                    {user ? 'Save QR Code' : 'Sign up to save'}
                    {user ? <Download className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

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
                <span>Live tracking active</span>
                <span>Analytics enabled</span>
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
          {config.supportingPoints.map((point, index) => (
            <Link
              key={point}
              to={copy.primaryCtaHref}
              className={`rounded-2xl p-5 text-sm ${config.theme.card} group hover:scale-[1.02] transition cursor-pointer block`}
            >
              <p className="mb-3">{point}</p>
              <div className={`inline-flex items-center gap-2 text-xs font-semibold transition ${config.theme.text}`}>
                Try now <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      );
    }

    if (config.supportingLayout === 'timeline') {
      return (
        <div className="relative border-l border-dashed border-white/20 pl-6">
          {config.supportingPoints.map((point, index) => (
            <Link
              key={point}
              to={copy.primaryCtaHref}
              className="relative mb-6 pl-4 last:mb-0 block group hover:scale-[1.01] transition cursor-pointer"
            >
              <div className="absolute -left-[1.45rem] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white/80 group-hover:bg-white/25 transition">
                {index + 1}
              </div>
              <p className="text-sm leading-relaxed text-white/80">{point}</p>
              <div className="mt-2 inline-flex items-center gap-2 text-xs font-semibold transition text-white">
                Try now <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {config.supportingPoints.map((point, index) => (
          <Link
            key={point}
            to={copy.primaryCtaHref}
            className={`flex items-start gap-4 rounded-2xl p-5 ${config.theme.softCard} group hover:scale-[1.01] transition cursor-pointer block`}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
              {index + 1}
            </div>
            <div className="flex-1">
              <p className={`text-sm leading-relaxed ${config.theme.subtext}`}>{point}</p>
              <div className={`mt-3 inline-flex items-center gap-2 text-xs font-semibold transition ${config.theme.text}`}>
                Try now <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </Link>
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
    const iconBg = 'bg-white/10 text-white';

    return (
      <Link
        key={feature.title}
        to={copy.primaryCtaHref}
        className={`rounded-3xl border ${config.theme.outline} p-6 shadow-lg ${config.theme.softCard} block hover:scale-[1.02] transition cursor-pointer group`}
      >
        <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
          <Icon className="h-6 w-6" />
        </div>
        <h3 className={`text-lg font-semibold ${config.theme.text}`}>{feature.title}</h3>
        <p className={`mt-3 text-sm leading-relaxed ${config.theme.subtext}`}>{feature.description}</p>
        <div className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold transition opacity-0 group-hover:opacity-100 ${config.theme.text}`}>
          Explore <ArrowRight className="h-3 w-3" />
        </div>
      </Link>
    );
  };

  return (
    <div className={`${config.theme.wrapper}`}>
      <div className="relative">
        {/* Apply page5 radial gradient to all variants */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_60%)]" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between py-6">
            <div className={`flex items-center gap-2 ${config.theme.navText}`}>
              <QrCode className="h-6 w-6" />
              <span className="text-xl font-semibold tracking-tight">generatecodeqr</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {/* Show FAQ link for all variants (like page5) */}
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

          {/* Hero section - show for all variants */}
          <section className="py-16 md:py-24">
              {config.hero.layout === 'stacked' ? (
                <div className="mx-auto max-w-3xl text-center space-y-8">
                  <Link
                    to={copy.primaryCtaHref}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${config.theme.badge} hover:scale-105 transition cursor-pointer`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span className={config.theme.badgeText}>{copy.heroBadge}</span>
                  </Link>
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
                    <Link
                      to={copy.primaryCtaHref}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider ${config.theme.badge} hover:scale-105 transition cursor-pointer`}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span className={config.theme.badgeText}>{copy.heroBadge}</span>
                    </Link>
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
              Track every scan and campaign — powered by one simple $5/month plan.
            </div>
            {renderSupportingPoints()}
            <div className="mt-8 text-center">
              <Link
                to={copy.primaryCtaHref}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-8 py-3 text-base font-semibold transition ${config.theme.secondaryButton} ${config.theme.secondaryButtonHover}`}
              >
                Explore QR Builder
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </section>

          <section className="py-12 md:py-16">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className={`text-2xl font-bold md:text-3xl ${config.theme.text}`}>Everything you need — already included</h2>
                <p className={`mt-2 text-sm ${config.theme.subtext}`}>
                Unlimited scans, real-time analytics, and editable QR codes — all part of one honest $5/month plan.
                </p>
              </div>
              <Link
                to={copy.primaryCtaHref}
                className={`inline-flex items-center gap-2 text-sm font-semibold transition ${config.theme.secondaryButton} ${config.theme.secondaryButtonHover} rounded-full px-5 py-2`}
              >
                Try the QR builder
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
                  <Link
                    to={copy.primaryCtaHref}
                    className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${config.theme.primaryButton} ${config.theme.primaryButtonHover}`}
                  >
                    Try it now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <Link
                  to={copy.primaryCtaHref}
                  className={`rounded-3xl p-6 ${config.theme.card} block hover:scale-[1.02] transition cursor-pointer group`}
                >
                  <p className={`text-sm uppercase tracking-wider ${config.theme.subtext}`}>{config.highlight.metricLabel}</p>
                  <p className={`mt-2 text-4xl font-bold ${config.theme.text}`}>{config.highlight.metricValue}</p>
                  <p className={`mt-3 text-xs ${config.theme.subtext}`}>{config.highlight.footnote}</p>
                  <div className={`mt-4 inline-flex items-center gap-2 text-xs font-semibold transition opacity-0 group-hover:opacity-100 ${config.theme.text}`}>
                    Get started <ArrowRight className="h-3 w-3" />
                  </div>
                </Link>
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
              <Link
                to={copy.primaryCtaHref}
                className={`rounded-3xl border p-8 ${config.theme.outline} ${config.theme.card} block hover:scale-[1.01] transition cursor-pointer group space-y-8`}
              >
                {(config.testimonials || [config.testimonial]).filter(Boolean).map((testimonial, index) => (
                  <div key={testimonial.author} className={index > 0 ? 'pt-8 border-t border-white/10' : ''}>
                    <p className="text-sm italic leading-relaxed">{testimonial.quote}</p>
                    <div className="mt-6 text-sm font-semibold">{testimonial.author}</div>
                    <div className={`text-xs uppercase tracking-wide ${config.theme.subtext}`}>{testimonial.role}</div>
                  </div>
                ))}
                <div className={`inline-flex items-center gap-2 text-xs font-semibold transition opacity-0 group-hover:opacity-100 ${config.theme.text}`}>
                  Join them <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
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
                <h4 className={`mb-3 font-semibold ${config.theme.text}`}>Get Started</h4>
                <ul className={`space-y-2 ${config.theme.subtext}`}>
                  <li>
                    <Link to={copy.primaryCtaHref} className="transition hover:opacity-80 font-semibold">
                      Sign Up
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

