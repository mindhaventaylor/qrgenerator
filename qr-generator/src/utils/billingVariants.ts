// Billing page designs for each landing page variant

type LandingVariantKey = 'control' | 'page1' | 'page2' | 'page3' | 'page4' | 'page5' | 'page6';

export type BillingVariantConfig = {
  heroTitle: string;
  heroDescription: string;
  heroIcon: 'check' | 'zap' | 'palette' | 'ticket' | 'bar-chart' | 'credit-card';
  heroIconBg: string; // Gradient colors for hero icon
  benefitsTitle: string;
  benefitsDescription: string;
  benefitsBg: string; // Background gradient for benefits section
  features: Array<{
    icon: 'qr' | 'palette' | 'shield' | 'analytics' | 'settings' | 'zap' | 'download' | 'globe' | 'users' | 'check' | 'ticket' | 'bar-chart';
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
  accentColor: string; // Accent color for checkmarks and highlights
  showDashboardPreview?: boolean; // Whether to show dashboard preview
  dashboardPreviewTitle?: string; // Custom dashboard preview title
  pricingFirst?: boolean; // Show pricing card before benefits section
};

export const billingVariants: Record<LandingVariantKey, BillingVariantConfig> = {
  control: {
    heroTitle: 'Subscription & Billing',
    heroDescription: 'Simple, transparent pricing at $5/month. Cancel anytime.',
    heroIcon: 'credit-card',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Everything You Get',
    benefitsDescription: 'See exactly what your $5/month unlocks—powerful analytics, unlimited QR codes, and professional features.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'analytics', title: 'Real-Time Analytics Dashboard', description: 'Track scans, locations, devices, and engagement metrics instantly.' },
      { icon: 'zap', title: 'Dynamic Content Updates', description: 'Change QR code content anytime without reprinting or redistributing.' },
      { icon: 'download', title: 'Professional Export Options', description: 'Download as PNG, SVG, PDF, or EPS for print and digital use.' },
      { icon: 'globe', title: 'Unlimited QR Code Creation', description: 'Create as many QR codes as you need. No limits, no restrictions.' },
      { icon: 'shield', title: 'Enterprise-Grade Security', description: 'Bank-level encryption and privacy-first tracking protocols.' },
      { icon: 'users', title: 'Priority Customer Support', description: 'Get help when you need it with dedicated support channels.' }
    ],
    pricingTitle: 'Simple, Transparent Pricing',
    pricingDescription: 'Cancel anytime • No hidden fees • No scams',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Subscribe Now - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'centered',
    accentColor: 'text-cyan-400',
    showDashboardPreview: true,
    dashboardPreviewTitle: 'Real-Time Analytics Dashboard'
  },
  page1: {
    heroTitle: 'Ready to Unlock Full Access?',
    heroDescription: 'Pay $5/month to save your QR codes, download them, and track every scan. Cancel anytime—no commitment.',
    heroIcon: 'zap',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'What Happens When You Subscribe',
    benefitsDescription: 'You\'ve already built your QR code. Here\'s what unlocks when you subscribe:',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'qr', title: 'Permanent QR Code Storage', description: 'Your QR codes are saved forever and accessible from any device.' },
      { icon: 'download', title: 'Instant High-Quality Downloads', description: 'Get print-ready PNG, SVG, PDF, or EPS files in seconds.' },
      { icon: 'check', title: 'No More Lost Codes', description: 'Never lose your QR codes again. All stored securely in the cloud.' },
      { icon: 'zap', title: 'Quick Content Edits', description: 'Update QR code content instantly without creating new codes.' },
      { icon: 'globe', title: 'Share Anywhere', description: 'Share your QR codes via link, email, or download for offline use.' },
      { icon: 'users', title: 'Organize Your Collection', description: 'Create folders, add tags, and manage all your QR codes easily.' }
    ],
    pricingTitle: 'Pay Only When You\'re Ready',
    pricingDescription: 'No credit card needed to try • Cancel anytime',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Unlock Full Access - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'split',
    accentColor: 'text-cyan-400',
    showDashboardPreview: false
  },
  page2: {
    heroTitle: 'Start Tracking Your QR Codes',
    heroDescription: 'Get full access for just $5/month. Download QR codes, view analytics, and manage everything in one place.',
    heroIcon: 'check',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Complete QR Management Platform',
    benefitsDescription: 'Everything you need to create, track, and optimize your QR code campaigns—all in one place.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'analytics', title: 'Live Scan Tracking', description: 'See scans happen in real-time with location, device, and time data.' },
      { icon: 'bar-chart', title: 'Performance Insights', description: 'Understand which QR codes perform best with detailed analytics.' },
      { icon: 'zap', title: 'Campaign Optimization', description: 'A/B test different QR codes and optimize based on scan data.' },
      { icon: 'globe', title: 'Geographic Analytics', description: 'See where your scans come from with interactive location maps.' },
      { icon: 'settings', title: 'Custom Tracking Rules', description: 'Set up alerts and notifications for important scan milestones.' },
      { icon: 'download', title: 'Export Analytics Data', description: 'Download scan reports as CSV or PDF for further analysis.' }
    ],
    pricingTitle: 'Try Before You Commit',
    pricingDescription: 'Build free • Pay only to save • Cancel anytime',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Start Tracking - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'stacked',
    accentColor: 'text-cyan-400',
    showDashboardPreview: true,
    dashboardPreviewTitle: 'Live Scan Tracking Dashboard'
  },
  page3: {
    heroTitle: 'Design Without Limits',
    heroDescription: 'Unlock unlimited brand kits, layouts, and QR experiences for $5/month. No per-brand charges, no upsells.',
    heroIcon: 'palette',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Branded QR Experiences',
    benefitsDescription: 'Create polished, on-brand QR pages with unlimited customization options—all included in one plan.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'palette', title: 'Custom Brand Kits', description: 'Upload your fonts, colors, logos, and design assets in one place.' },
      { icon: 'qr', title: 'Template Library', description: 'Choose from pre-designed templates or build custom layouts from scratch.' },
      { icon: 'shield', title: 'Brand Consistency', description: 'Lock design elements to ensure all QR pages stay on-brand.' },
      { icon: 'zap', title: 'Visual Editor', description: 'Drag-and-drop interface to customize every element of your QR pages.' },
      { icon: 'download', title: 'Branded Downloads', description: 'Export QR codes with your branding applied automatically.' },
      { icon: 'users', title: 'Design Team Access', description: 'Invite team members to collaborate on brand kits and designs.' }
    ],
    pricingTitle: 'One Transparent Plan',
    pricingDescription: 'No watermark • No upgrade prompts • Cancel whenever',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Design QR Pages - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'centered',
    accentColor: 'text-cyan-400',
    showDashboardPreview: false,
    pricingFirst: true
  },
  page4: {
    heroTitle: 'Event-Ready QR Workspace',
    heroDescription: 'Run unlimited events, check-ins, and live updates for $5/month. Perfect for conferences, festivals, and gatherings.',
    heroIcon: 'ticket',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Event Management Features',
    benefitsDescription: 'Everything you need to manage QR codes for events, from check-ins to analytics—all in one workspace.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'ticket', title: 'Attendee Check-In System', description: 'Scan QR codes on badges to check in attendees instantly.' },
      { icon: 'analytics', title: 'Real-Time Attendance', description: 'See who\'s checked in, capacity levels, and attendance trends live.' },
      { icon: 'settings', title: 'Event Updates & Alerts', description: 'Push schedule changes, announcements, or emergency alerts instantly.' },
      { icon: 'qr', title: 'Session Tracking', description: 'Track which sessions attendees visit and measure engagement per track.' },
      { icon: 'bar-chart', title: 'Sponsor Analytics', description: 'Show sponsors exactly how many attendees engaged with their content.' },
      { icon: 'users', title: 'Multi-Event Management', description: 'Run multiple events simultaneously from one dashboard.' }
    ],
    pricingTitle: 'Event-Ready Pricing',
    pricingDescription: 'Spin up your next event in minutes • Cancel after the event if needed',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Build Event Workspace - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'split',
    accentColor: 'text-cyan-400',
    showDashboardPreview: true,
    dashboardPreviewTitle: 'Event Check-In Dashboard'
  },
  page5: {
    heroTitle: 'Executive-Grade QR Analytics',
    heroDescription: 'Track every scan, click, and conversion in dashboards designed for leadership. $5/month—no sales calls, just sign up.',
    heroIcon: 'bar-chart',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Analytics Without Enterprise Pricing',
    benefitsDescription: 'Get executive-level visibility into your QR code performance without enterprise complexity or contracts.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'bar-chart', title: 'ROI & Conversion Tracking', description: 'Measure revenue attribution and ROI from QR code campaigns.' },
      { icon: 'analytics', title: 'Executive Dashboards', description: 'High-level KPIs and trends designed for leadership review.' },
      { icon: 'shield', title: 'Data Governance', description: 'Role-based access, audit trails, and GDPR-compliant data handling.' },
      { icon: 'download', title: 'Automated Reports', description: 'Schedule and send PDF reports to stakeholders automatically.' },
      { icon: 'settings', title: 'Custom Metrics', description: 'Define and track custom KPIs specific to your business goals.' },
      { icon: 'users', title: 'Team Performance', description: 'See which team members\' QR codes perform best.' }
    ],
    pricingTitle: 'Executive Visibility for $5/month',
    pricingDescription: 'No sales calls • Sign up and start tracking • Cancel whenever',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Get Analytics Workspace - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'stacked',
    accentColor: 'text-cyan-400',
    showDashboardPreview: true,
    dashboardPreviewTitle: 'Executive Analytics Dashboard',
    pricingFirst: true
  },
  page6: {
    heroTitle: 'Unlock Your QR Codes',
    heroDescription: 'Save, download, and track your QR codes for just $5/month. Cancel anytime—no commitment required.',
    heroIcon: 'check',
    heroIconBg: 'from-cyan-400 to-cyan-500',
    benefitsTitle: 'Full QR Code Access',
    benefitsDescription: 'Everything you need to manage your QR codes professionally—all included in one simple plan.',
    benefitsBg: 'from-slate-800 via-slate-700 to-slate-800',
    features: [
      { icon: 'check', title: 'Instant Access', description: 'Start using all features immediately after subscribing—no setup required.' },
      { icon: 'qr', title: 'Unlimited Storage', description: 'Save as many QR codes as you need. No storage limits ever.' },
      { icon: 'download', title: 'One-Click Downloads', description: 'Download QR codes in any format with a single click.' },
      { icon: 'zap', title: 'Quick Edits', description: 'Update QR code content in seconds without technical knowledge.' },
      { icon: 'globe', title: 'Works Everywhere', description: 'Access your QR codes from any device, anywhere, anytime.' },
      { icon: 'users', title: 'Simple & Reliable', description: 'No complex features. Just what you need, when you need it.' }
    ],
    pricingTitle: 'Pay Only When You\'re Ready',
    pricingDescription: 'No credit card needed to try • Cancel anytime',
    pricingCardBg: 'bg-slate-900/80',
    pricingCardBorder: 'border-white/10',
    ctaLabel: 'Unlock Access - $5/month',
    ctaButtonBg: 'from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400',
    layout: 'centered',
    accentColor: 'text-cyan-400',
    showDashboardPreview: false
  }
};

