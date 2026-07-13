import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Users,
  ListChecks,
  LayoutGrid,
  BarChart3,
  Clock,
  Puzzle,
  Globe,
  Zap,
  UserPlus,
  Target,
  Triangle,
  Hexagon,
  Aperture,
  Waves,
  Eye,
  Send,
  AtSign,
  Briefcase,
  Camera,
  Play,
  Rss,
} from 'lucide-react';
import Reveal from '../components/common/Reveal';

export default function LandingPage() {
  return (
    <div className="bg-bg text-text min-h-screen">
      <Navbar />
      <Hero />
      <TrustedBy />
      <Features />
      <Stats />
      <HowItWorks />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? 'bg-bg/85 border-b border-accent/25 shadow-[0_8px_32px_-4px_rgba(124,92,255,0.35)]'
          : 'bg-bg/70 border-b border-border shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-16 py-4">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center text-white shadow-[0_0_18px_rgba(124,92,255,0.45)]">
            <Layers size={17} />
          </span>
          <span className="text-[17px] font-semibold text-white">Orvix</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-[13.5px] text-text-dim">
          <a href="#" className="hover:text-text">Product</a>
          <a href="#features" className="hover:text-text">Features</a>
          <NavDropdown label="Solutions" items={['For Startups', 'For Enterprises', 'For Agencies']} />
          <NavDropdown label="Resources" items={['Documentation', 'Blog', 'Help Center']} />
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="text-[13.5px] font-medium text-text-dim hover:text-text px-2">
            Sign in
          </Link>
          <Link to="/register" className="btn-primary !py-2.5 !px-4 text-[13.5px]">
            Get Started Free <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavDropdown({ label, items }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button className="flex items-center gap-1 hover:text-text">
        {label} <ChevronDown size={13} />
      </button>
      {open && (
        <div className="absolute left-0 top-full pt-2 w-48">
          <div className="bg-[#0d1120] border border-border-strong rounded-lg shadow-xl py-1.5">
            {items.map((item) => (
              <a key={item} href="#" className="block px-3.5 py-2 text-[13px] text-text-dim hover:text-text hover:bg-white/[0.05]">
                {item}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/hero-bg.png')" }}
    >
      <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center overflow-visible">
        <div className="relative z-10">
        <span className="animate-fade-up inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent-2 text-[12px] font-medium mb-6">
          <span className="px-1.5 py-0.5 rounded bg-accent text-white text-[10px] font-bold">NEW</span>
          Orvix 1.0 is now live
        </span>

        <h1
          className="animate-fade-up text-[42px] sm:text-[52px] leading-[1.08] font-bold text-white tracking-tight mb-6"
          style={{ animationDelay: '90ms' }}
        >
          The All-in-One SaaS Platform<br className="hidden sm:block" /> for{' '}
          <span className="text-transparent bg-clip-text bg-accent-gradient">Modern Teams</span>
        </h1>

        <p
          className="animate-fade-up text-[16.5px] text-text-dim max-w-lg mb-8 leading-relaxed"
          style={{ animationDelay: '180ms' }}
        >
          Orvix helps you plan, track, collaborate, and grow your business — all in one powerful
          platform.
        </p>

        <div className="animate-fade-up flex items-center gap-4 mb-8 flex-wrap" style={{ animationDelay: '270ms' }}>
          <Link to="/register" className="btn-primary !py-3.5 !px-6 text-[14.5px]">
            Start Your Free Trial <ArrowRight size={16} />
          </Link>
          <a href="#" className="text-[14px] font-medium text-accent-2 hover:underline flex items-center gap-1.5">
            Watch Demo <span className="w-5 h-5 rounded-full border border-accent-2 flex items-center justify-center text-[10px]">▶</span>
          </a>
        </div>

        <div
          className="animate-fade-up flex items-center gap-6 flex-wrap text-[12.5px] text-text-dim"
          style={{ animationDelay: '360ms' }}
        >
          {['No credit card required', '14-day free trial', 'Cancel anytime'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-green-400" /> {t}
            </span>
          ))}
        </div>
        </div>

        <div className="relative z-10 flex justify-center lg:justify-end animate-fade-up" style={{ animationDelay: '200ms' }}>
          <div className="animate-float w-full max-w-[560px]" style={{ animationDelay: '0.4s' }}>
            <div
              style={{
                perspective: '1500px',
              }}
            >
              <img
                src="/assets/hero-dashboard-flat.png"
                alt="Orvix dashboard preview"
                className="w-full h-auto rounded-xl shadow-[0_40px_80px_rgba(0,0,0,0.55)]"
                style={{
                  transform: 'rotateY(-14deg) rotateX(7deg) rotate(-1.5deg) scale(1.02)',
                  transformStyle: 'preserve-3d',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustedBy() {
  const rowA = [
    { name: 'Acme Inc.', icon: Triangle },
    { name: 'Celestial', icon: Hexagon },
    { name: 'Quotient', icon: Aperture },
    { name: 'EchoFlow', icon: Waves },
    { name: 'PULSE', icon: Zap, bold: true },
    { name: 'Visionary', icon: Eye },
  ];
  const rowB = [
    { name: 'Visionary', icon: Eye },
    { name: 'PULSE', icon: Zap, bold: true },
    { name: 'EchoFlow', icon: Waves },
    { name: 'Quotient', icon: Aperture },
    { name: 'Celestial', icon: Hexagon },
    { name: 'Acme Inc.', icon: Triangle },
  ];

  const renderLogos = (list) =>
    list.map(({ name, icon: Icon, bold }, i) => (
      <span key={`${name}-${i}`} className="flex items-center gap-2 text-text-dim flex-shrink-0 px-6">
        <Icon size={16} />
        <span className={`text-[15px] whitespace-nowrap ${bold ? 'font-bold tracking-wide' : 'font-medium'}`}>{name}</span>
      </span>
    ));

  return (
    <Reveal as="section" className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 border-t border-border">
      <p className="text-center text-[11px] tracking-[0.15em] text-text-faint uppercase mb-8">
        Trusted by fast-growing companies worldwide
      </p>

      <div className="flex flex-col gap-6 opacity-80">
        <div className="marquee-row overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee-left">
            {renderLogos(rowA)}
            {renderLogos(rowA)}
          </div>
        </div>
        <div className="marquee-row overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex w-max animate-marquee-right">
            {renderLogos(rowB)}
            {renderLogos(rowB)}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

const FEATURES = [
  {
    icon: LayoutGrid,
    title: 'Project Management',
    desc: 'Plan, organize, and track projects with ease.',
  },
  {
    icon: ListChecks,
    title: 'Task & Workflow',
    desc: 'Assign tasks, set deadlines, and automate workflows.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    desc: 'Communicate and collaborate in real-time.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Reports',
    desc: 'Get insights and make data-driven decisions.',
  },
  {
    icon: Clock,
    title: 'Time Tracking',
    desc: 'Track time and boost team productivity.',
  },
  {
    icon: Puzzle,
    title: 'Integrations',
    desc: 'Seamlessly connect with your favorite tools.',
  },
];

function Features() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 border-t border-border">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-12 items-start">
        <Reveal className="lg:sticky lg:top-28">
          <h2 className="text-[50px] font-bold text-white tracking-tight mb-3">
            Everything you need to run your business
          </h2>
          <p className="text-[17px] text-text-dim mb-6 max-w-sm">
            Powerful features designed to help your team move faster and achieve more.
          </p>
          <a href="#" className="btn-primary !py-2.5 !px-4 text-[13.5px] inline-flex">
            Explore All Features
          </a>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 70}>
              <div className="card p-5 h-full transition-all duration-300 hover:-translate-y-1.5 hover:border-accent/40 hover:shadow-[0_16px_40px_rgba(124,92,255,0.18)] group">
                <span className="w-9 h-9 rounded-[10px] bg-accent-gradient flex items-center justify-center text-white mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon size={17} />
                </span>
                <h3 className="text-[14.5px] font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-[13px] text-text-dim leading-relaxed">{desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { icon: Users, value: '10K+', label: 'Active Users' },
    { icon: ListChecks, value: '2.5M+', label: 'Tasks Completed' },
    { icon: Globe, value: '150+', label: 'Countries' },
    { icon: Zap, value: '99.9%', label: 'Uptime' },
  ];

  return (
    <Reveal as="section" className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-16">
      <div className="card p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-[10px] bg-accent-gradient flex items-center justify-center text-white flex-shrink-0">
              <Icon size={17} />
            </span>
            <div>
              <p className="text-[19px] font-bold text-white leading-tight">{value}</p>
              <p className="text-[12px] text-text-dim">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </Reveal>
  );
}

function HowItWorks() {
  const steps = [
    { icon: UserPlus, title: 'Sign Up', desc: 'Create your free account in under a minute.' },
    { icon: Users, title: 'Add Your Team', desc: 'Invite your team and set up your workspace.' },
    { icon: LayoutGrid, title: 'Manage Work', desc: 'Plan projects, assign tasks, and track progress.' },
    { icon: Target, title: 'Achieve More', desc: 'Collaborate, automate, and grow your business.' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 border-t border-border">
      <Reveal className="text-center max-w-lg mx-auto mb-14">
        <h2 className="text-[30px] font-bold text-white tracking-tight mb-3">How Orvix works</h2>
        <p className="text-[14.5px] text-text-dim">Get started in minutes and see the difference.</p>
      </Reveal>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-10 relative">
        <div className="hidden sm:block absolute top-6 left-[12.5%] right-[12.5%] border-t border-dashed border-border-strong" />
        {steps.map(({ icon: Icon, title, desc }, i) => (
          <Reveal key={title} delay={i * 100} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 w-12 h-12 rounded-full bg-bg-elevated border border-border-strong flex items-center justify-center text-accent-2 mb-4">
              <Icon size={19} />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </span>
            <h3 className="text-[14.5px] font-semibold text-white mb-1.5">{title}</h3>
            <p className="text-[12.5px] text-text-dim max-w-[180px]">{desc}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: 'What is Orvix?',
    a: 'Orvix is an all-in-one SaaS platform that helps teams plan, track, collaborate, and grow their business efficiently.',
  },
  {
    q: 'How does the free trial work?',
    a: "You can sign up and start using Orvix right away — no credit card required to get started.",
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes, you can cancel at any time from your account settings with no cancellation fees.',
  },
  {
    q: 'Is my data secure with Orvix?',
    a: 'Your data is protected with industry-standard authentication and access controls, scoped to your teams.',
  },
  {
    q: 'Can I integrate Orvix with other tools?',
    a: "We're continually expanding integration support to fit into your existing workflow.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 border-t border-border grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <Reveal>
        <h2 className="text-[28px] font-bold text-white tracking-tight mb-8">Frequently asked questions</h2>
        <div className="flex flex-col gap-2.5">
          {FAQS.map((f, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={f.q} className="card overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                >
                  <span className="text-[13.5px] font-medium text-white">{f.q}</span>
                  <ChevronDown size={16} className={`text-text-dim transition-transform flex-shrink-0 ml-3 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && <p className="px-4 pb-4 text-[13px] text-text-dim leading-relaxed">{f.a}</p>}
              </div>
            );
          })}
        </div>
      </Reveal>

      <Reveal delay={150} className="hidden lg:flex items-center justify-center">
        <img
          src="/assets/faq-question-orb.png"
          alt=""
          aria-hidden="true"
          className="w-92 h-92 object-contain animate-float"
        />
      </Reveal>
    </section>
  );
}

function CTABanner() {
  return (
    <Reveal as="section" className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pb-24">
      <div className="relative rounded-lg overflow-hidden bg-accent-gradient px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-white tracking-tight mb-1.5">
            Ready to boost your productivity?
          </h2>
          <p className="text-[14px] text-white/85">Join thousands of teams already using Orvix to get more done.</p>
        </div>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-white text-[#1a1230] font-semibold text-[14px] px-5 py-3 rounded-[10px] hover:brightness-95 flex-shrink-0"
        >
          Start Your Free Trial <ArrowRight size={15} />
        </Link>
      </div>
    </Reveal>
  );
}

function Footer() {
  const columns = [
    { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'Changelog'] },
    { title: 'Solutions', links: ['By Team', 'By Industry', 'Use Cases'] },
    { title: 'Resources', links: ['Documentation', 'Blog', 'Help Center', 'Templates'] },
    { title: 'Company', links: ['About Us', 'Careers', 'Contact Us', 'Privacy Policy'] },
  ];

  const socials = [AtSign, Briefcase, Camera, Play, Rss];

  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-14 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1.2fr] gap-10">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-7 h-7 rounded-lg bg-accent-gradient flex items-center justify-center text-white">
              <Layers size={14} />
            </span>
            <span className="text-[14px] font-semibold text-white">Orvix</span>
          </div>
          <p className="text-[12.5px] text-text-dim leading-relaxed max-w-[220px]">
            The all-in-one SaaS platform that helps teams plan, track, collaborate, and grow their
            business.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-[12.5px] font-semibold text-white mb-3">{col.title}</h4>
            <ul className="flex flex-col gap-2">
              {col.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-[12.5px] text-text-dim hover:text-text">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-[12.5px] font-semibold text-white mb-3">Newsletter</h4>
          <p className="text-[12.5px] text-text-dim mb-3">Stay updated with the latest news and updates.</p>
          <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
            <input type="email" placeholder="Email" className="input !py-2 text-[12.5px]" />
            <button className="btn-primary !py-2 !px-3 flex-shrink-0">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-5 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            {socials.map((Icon, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-text-dim hover:text-text hover:bg-white/[0.08]">
                <Icon size={14} />
              </a>
            ))}
          </div>
          <p className="text-[12px] text-text-faint">© {new Date().getFullYear()} Orvix. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[12px] text-text-faint">
            <a href="#" className="hover:text-text-dim">Terms of Service</a>
            <a href="#" className="hover:text-text-dim">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}