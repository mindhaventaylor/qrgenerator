// Checkout page designs for each landing page variant

type LandingVariantKey = 'control' | 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6';

export type CheckoutVariantConfig = {
  heroTitle: string;
  heroDescription: string;
  heroIcon: 'check' | 'zap' | 'palette' | 'ticket' | 'bar-chart';
  heroIconBg: string; // Gradient colors for hero icon
  benefitsTitle: string;
  benefitsDescription: string;
  benefitsBg: string; // Background gradient for benefits section
  features: Array<{
    icon: 'qr' | 'palette' | 'shield' | 'analytics' | 'settings' | 'zap' | 'download';
    title: string;
    description: string;
  }>;
  pricingTitle: string;
  pricingDescription: string;
  pricingCardBg: string; // Background for pricing card
  pricingCardBorder: string; // Border color for pricing card
  ctaLabel: string;
  ctaButtonBg: string; // CTA button gradient
  layout: 'centered' | 'split' | 'stacked'; // Layout variation
};

export const checkoutVariants: Record<LandingVariantKey, CheckoutVariantConfig> = {
  control: {
    heroTitle: 'Your QR Code is Ready!',
    heroDescription: 'Subscribe now to save your QR code, unlock analytics, and start tracking scans. Just $5/month—honest pricing, no hidden fees.',
    heroIcon: 'check',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Everything You Get',
    benefitsDescription: 'See exactly what your $5/month unlocks—powerful analytics, unlimited QR codes, and professional features.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'analytics', title: 'Advanced Analytics', description: 'Track scans, locations, devices, and engagement in real-time.' },
      { icon: 'zap', title: 'Dynamic Updates', description: 'Change QR code content anytime without reprinting.' },
      { icon: 'download', title: 'Multiple Formats', description: 'Download as PNG, SVG, PDF, or EPS for any use case.' },
      { icon: 'qr', title: 'Unlimited QR Codes', description: 'Create as many QR codes as you need. No limits, no restrictions.' },
      { icon: 'shield', title: 'Enterprise Security', description: 'Bank-level encryption and privacy-first tracking.' },
      { icon: 'settings', title: 'Custom Branding', description: 'Add your logo, colors, and custom styling to QR pages.' }
    ],
    pricingTitle: 'Simple, Transparent Pricing',
    pricingDescription: 'Cancel anytime • No hidden fees • No scams',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Subscribe Now - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'centered'
  },
  page1: {
    heroTitle: 'Ready to Save Your QR Code?',
    heroDescription: 'You\'ve built and previewed your QR code. Sign up now to save it and start tracking scans. Still just $5/month—no commitment, cancel anytime.',
    heroIcon: 'zap',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'What Happens When You Save',
    benefitsDescription: 'You\'ve already seen what you\'re getting. Here\'s what unlocks when you save:',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'qr', title: 'Save Forever', description: 'Your QR code is stored securely and accessible anytime.' },
      { icon: 'analytics', title: 'Track Every Scan', description: 'See who scanned, when, where, and on what device.' },
      { icon: 'download', title: 'Download & Share', description: 'Get high-quality files ready for print or digital use.' },
      { icon: 'zap', title: 'Edit Anytime', description: 'Update content without reprinting or redistributing.' },
      { icon: 'shield', title: 'Secure Storage', description: 'Your QR codes are encrypted and backed up automatically.' },
      { icon: 'settings', title: 'Manage Everything', description: 'Organize, activate, or deactivate QR codes from one dashboard.' }
    ],
    pricingTitle: 'Pay Only When You\'re Ready',
    pricingDescription: 'No credit card needed to try • Cancel anytime',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Sign up to save - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'split'
  },
  page2: {
    heroTitle: 'Your QR Code Awaits!',
    heroDescription: 'You\'ve created something great. Now save it and unlock powerful tracking. Just $5/month—try it risk-free, cancel anytime.',
    heroIcon: 'check',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Unlock Full Potential',
    benefitsDescription: 'Take your QR code from preview to production with these powerful features:',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'qr', title: 'Production Ready', description: 'Save and deploy your QR code to start collecting scans immediately.' },
      { icon: 'analytics', title: 'Real-Time Tracking', description: 'Monitor scans, locations, devices, and engagement as they happen.' },
      { icon: 'download', title: 'Professional Files', description: 'Download in PNG, SVG, PDF, or EPS for any use case.' },
      { icon: 'zap', title: 'Instant Updates', description: 'Change QR code content anytime without reprinting.' },
      { icon: 'shield', title: 'Privacy First', description: 'Track engagement without compromising user privacy.' },
      { icon: 'settings', title: 'Full Control', description: 'Activate, deactivate, or delete QR codes anytime.' }
    ],
    pricingTitle: 'Try Before You Commit',
    pricingDescription: 'Build free • Pay only to save • Cancel anytime',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Save my QR code - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'stacked'
  },
  page3: {
    heroTitle: 'Spin Up a Branded QR Experience',
    heroDescription: 'Craft a polished, on-brand page today with zero upsells or per-brand charges. Everything stays inside the $5/month plan.',
    heroIcon: 'palette',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Design Without Limits',
    benefitsDescription: 'See exactly what your $5/month unlocks—unlimited brand kits, layouts, and stakeholder sharing.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'palette', title: 'Brand Kits', description: 'Fonts, gradients, iconography, and button styles stored in one place.' },
      { icon: 'qr', title: 'Reusable Sections', description: 'Mix hero, gallery, FAQ, and CTA blocks unique to QR experiences.' },
      { icon: 'shield', title: 'Design Guardrails', description: 'Lock colors, spacing, and typography to stay exactly on-brand.' },
      { icon: 'analytics', title: 'Brand Analytics', description: 'See how your branded QR pages perform across campaigns.' },
      { icon: 'download', title: 'Export Designs', description: 'Download QR codes in any format for print or digital.' },
      { icon: 'settings', title: 'Team Collaboration', description: 'Share brand kits and designs with your team.' }
    ],
    pricingTitle: 'One Transparent Plan',
    pricingDescription: 'No watermark • No upgrade prompts • Cancel whenever',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Design a QR page - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'centered'
  },
  page4: {
    heroTitle: 'Transform Your Next Event Experience',
    heroDescription: 'Every attendee touchpoint can run through one QR workspace that still costs $5/month. Unlimited attendees, schedules, and sponsor spaces.',
    heroIcon: 'ticket',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Event-Ready Features',
    benefitsDescription: 'See exactly what your $5/month unlocks—unlimited events, check-ins, and live updates.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'qr', title: 'Badge Command Center', description: 'Monitor live check-ins and capacity from any device.' },
      { icon: 'analytics', title: 'Session Analytics', description: 'See engagement by track, speaker, and sponsor instantly.' },
      { icon: 'settings', title: 'Smart Updates', description: 'Push emergency alerts or last-minute changes from one dashboard.' },
      { icon: 'download', title: 'Event Materials', description: 'Download QR codes for badges, posters, and handouts.' },
      { icon: 'shield', title: 'Secure Check-Ins', description: 'Protect attendee data with enterprise security.' },
      { icon: 'zap', title: 'Real-Time Sync', description: 'All devices update instantly as attendees check in.' }
    ],
    pricingTitle: 'Event-Ready Pricing',
    pricingDescription: 'Spin up your next event in minutes • Cancel after the event if needed',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Build an event workspace - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'split'
  },
  page5: {
    heroTitle: 'Unlock Executive-Grade QR Insights',
    heroDescription: 'Design, edit, and track every QR — all in one simple $5/month dashboard.',
    heroIcon: 'bar-chart',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Analytics Without Enterprise Pricing',
    benefitsDescription: 'See exactly what your $5/month unlocks—executive dashboards, exports, and real-time tracking.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'analytics', title: 'Clear tracking & results', description: 'See where every scan comes from — location, device, date, time — to measure what’s really working.' },
      { icon: 'shield', title: 'Governance Controls', description: 'Role-based access, audit logs, and compliant data handling.' },
      { icon: 'settings', title: 'Real-Time Dashboards', description: 'Track scans, locations, devices, and conversions in real-time.' },
      { icon: 'download', title: 'Export Reports', description: 'Download analytics reports in multiple formats for stakeholders.' },
      { icon: 'qr', title: 'Unlimited QR Codes', description: 'Create and track as many QR codes as you need.' },
      { icon: 'zap', title: 'Custom Alerts', description: 'Set up notifications for important scan milestones.' }
    ],
    pricingTitle: 'Executive Visibility for $5/month',
    pricingDescription: 'No sales calls • Sign up and start tracking • Cancel whenever',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Get analytics workspace - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'stacked'
  },
  page6: {
    heroTitle: 'Ready to Save Your QR Code?',
    heroDescription: 'You\'ve built and previewed your QR code. Sign up now to save it and start tracking scans. Still just $5/month—no commitment, cancel anytime.',
    heroIcon: 'check',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'What You\'re Saving',
    benefitsDescription: 'You\'ve already seen what you\'re getting. Here\'s what happens when you save:',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'qr', title: 'Save Forever', description: 'Your QR code is stored securely and accessible anytime.' },
      { icon: 'analytics', title: 'Track Every Scan', description: 'See who scanned, when, where, and on what device.' },
      { icon: 'download', title: 'Download & Share', description: 'Get high-quality files ready for print or digital use.' },
      { icon: 'zap', title: 'Edit Anytime', description: 'Update content without reprinting or redistributing.' },
      { icon: 'shield', title: 'Secure Storage', description: 'Your QR codes are encrypted and backed up automatically.' },
      { icon: 'settings', title: 'Manage Everything', description: 'Organize, activate, or deactivate QR codes from one dashboard.' }
    ],
    pricingTitle: 'Pay Only When You\'re Ready',
    pricingDescription: 'No credit card needed to try • Cancel anytime',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Sign up to save - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'centered'
  }
};

