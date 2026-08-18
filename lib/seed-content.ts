import type { PortfolioData } from './types'

/**
 * A verbatim capture of the original React portfolio's content.
 *
 * Two jobs:
 *  1. `npm run seed` writes this into MongoDB, so a fresh database renders the
 *     site exactly as it looked before the migration.
 *  2. The public page falls back to it if the database is unreachable, so a
 *     transient Atlas outage degrades to "slightly stale" rather than "blank".
 *
 * Inline emphasis uses `**double asterisks**`, rendered by
 * `components/portfolio/RichText.tsx` as <span className="font-semibold">.
 * This reproduces the original inline <span> markup without storing raw HTML.
 */

export const SEED_PROFILE = {
  name: 'Althaf N',
  title: 'Full Stack Developer',
  headline: 'Fullstack Developer',
  typedPhrases: ['I am Althaf N'],
  shortDescription:
    'Passionate Full Stack Developer specializing in Laravel, Node.js, React.js, and Next.js. Dedicated to building scalable, user-focused web applications, solving real-world problems, and continuously learning emerging technologies to deliver impactful solutions.',
  aboutParagraphs: [
    "I'm a passionate **Full Stack Developer** with 2 years of experience building scalable, secure, and user-centric web applications. I specialize in **Laravel, CodeIgniter, Node.js, React.js, and Next.js**, creating robust backend systems and modern, responsive user interfaces.",
    "Currently, I work at **DOCME Cloud Solutions**, where I contribute to enterprise-grade HRMS solutions by developing RESTful APIs, backend services, and scalable web applications using **PHP, MySQL, PostgreSQL, MongoDB, JavaScript, and TypeScript**. I'm passionate about writing clean, maintainable code and delivering software that creates real business value.",
    "Beyond my professional work, I'm continuously expanding my expertise by learning **Flutter** for cross-platform mobile development while staying up to date with modern web technologies. Outside of coding, I enjoy working out at the gym, gaming, watching movies, and exploring new technologies. I'm always excited to learn, collaborate, and take on challenging projects that help me grow as a developer.",
  ],
  location: 'Kerala, India',
  email: 'althafnizam763@gmail.com',
  phone: '9633146330',
  profileImage: '',
  heroImage: '/assets/hero-vector.svg',
  aboutImage: '/assets/about-me.svg',
  logo: '/assets/logo.svg',
  resumeUrl: '/assets/ALTHAFDEVELOPER.pdf',
  resumeLabel: 'Resume',
  availableForWork: true,
}

/**
 * `order` is global and ascending in the original render order. Categories are
 * rendered in order of their lowest-ordered skill, which reproduces the
 * original category sequence exactly.
 */
export const SEED_SKILLS = [
  // Languages
  { name: 'PHP', category: 'Languages', icon: 'FaPhp', level: 90 },
  { name: 'JavaScript (ES6+)', category: 'Languages', icon: 'FaJs', level: 90 },
  { name: 'TypeScript', category: 'Languages', icon: 'SiTypescript', level: 80 },
  { name: 'HTML5', category: 'Languages', icon: 'FaHtml5', level: 95 },
  { name: 'CSS3', category: 'Languages', icon: 'FaCss3', level: 90 },
  // Frontend
  { name: 'React.js', category: 'Frontend', icon: 'FaReact', level: 90 },
  { name: 'Next.js', category: 'Frontend', icon: 'RiNextjsFill', level: 85 },
  { name: 'Bootstrap', category: 'Frontend', icon: 'RiBootstrapFill', level: 85 },
  { name: 'Tailwind CSS', category: 'Frontend', icon: 'RiTailwindCssFill', level: 90 },
  { name: 'jQuery', category: 'Frontend', icon: 'SiJquery', level: 80 },
  { name: 'Redux', category: 'Frontend', icon: 'SiRedux', level: 75 },
  // Backend
  { name: 'Laravel', category: 'Backend', icon: 'FaLaravel', level: 90 },
  { name: 'CodeIgniter 3', category: 'Backend', icon: 'SiCodeigniter', level: 85 },
  { name: 'CodeIgniter 4', category: 'Backend', icon: 'SiCodeigniter', level: 85 },
  { name: 'Node.js', category: 'Backend', icon: 'FaNodeJs', level: 85 },
  { name: 'Express.js', category: 'Backend', icon: 'SiExpress', level: 80 },
  // Database
  { name: 'MySQL', category: 'Database', icon: 'SiMysql', level: 90 },
  { name: 'PostgreSQL', category: 'Database', icon: 'BiLogoPostgresql', level: 80 },
  { name: 'MongoDB', category: 'Database', icon: 'SiMongodb', level: 80 },
  // API & Authentication
  { name: 'REST APIs', category: 'API & Authentication', icon: 'TbApi', level: 90 },
  { name: 'JWT Authentication', category: 'API & Authentication', icon: 'TbKey', level: 85 },
  {
    name: 'Authentication & Authorization',
    category: 'API & Authentication',
    icon: 'TbLock',
    level: 85,
  },
  {
    name: 'Role-Based Access Control (RBAC)',
    category: 'API & Authentication',
    icon: 'TbShieldLock',
    level: 80,
  },
  // Tools
  { name: 'Git', category: 'Tools', icon: 'FaGitAlt', level: 90 },
  { name: 'GitHub', category: 'Tools', icon: 'FaGithub', level: 90 },
  { name: 'Postman', category: 'Tools', icon: 'SiPostman', level: 85 },
  { name: 'VS Code', category: 'Tools', icon: 'TbBrandVscode', level: 95 },
  { name: 'Figma', category: 'Tools', icon: 'FaFigma', level: 70 },
  // Others
  { name: 'AI Prompt Engineering', category: 'Others', icon: 'TbSparkles', level: 85 },
  { name: 'Responsive Web Design', category: 'Others', icon: 'TbDevices', level: 95 },
]

export const SEED_EXPERIENCES = [
  {
    company: 'DOCME CLOUD SOLUTIONS',
    position: 'Software Engineer',
    employmentType: 'Full-time',
    location: 'Kerala, India',
    // NOTE: the original hardcoded string read "July 3024 - Present" — a typo
    // for 2024. Stored as a real date so the UI can format it; edit it in
    // Admin -> Experience if the intended year differs.
    startDate: '2024-07-01',
    endDate: null,
    current: true,
    description:
      'Working as a Software Engineer at DocMe Cloud Solutions, I specialize in building scalable full-stack applications using Laravel, CodeIgniter, Node.js, React.js, Next.js, MySQL, PostgreSQL, and MongoDB. My role involves developing RESTful APIs, optimizing application performance, resolving production issues, and delivering secure, high-performance solutions while collaborating with cross-functional teams in an Agile development environment.',
    // Deliberately empty: the original experience card showed no technology
    // chips, and seeding them would visibly change the page on day one. Add
    // them in Admin -> Experience and they render as chips under the summary.
    technologies: [],
    companyLogo: '/assets/docme.png',
    companyUrl: '',
  },
]

export const SEED_PROJECTS = [
  {
    title: 'Zenith Academy',
    slug: 'zenith-academy',
    description:
      "Discover an informative website designed to help you easily download the app and connect with him directly. Don't miss out on the opportunity to enhance your experience!",
    image: '/assets/zenith.jpg',
    video: '',
    technologies: [],
    liveUrl: 'https://www.zenithacademy.in/',
    githubUrl: '',
    category: 'Web',
    featured: true,
  },
  {
    title: 'Loyaltri',
    slug: 'loyaltri',
    description:
      'Loyaltri is an all-in-one HRMS platform built to simplify and automate everyday HR tasks like hiring, onboarding, payroll, attendance, and communication. Designed with real HR teams in mind, Loyaltri helps businesses boost efficiency, reduce manual work, and focus on growth. Explore the platform to see how we’ve made HR smarter, faster, and stress-free.',
    image: '',
    video: '/assets/Loyaltri.mp4',
    technologies: [],
    liveUrl: 'https://www.loyaltri.com/',
    githubUrl: '',
    category: 'Web',
    featured: true,
  },
  {
    title: 'Voice of the Voiceless',
    slug: 'voice-of-the-voiceless',
    description:
      'A platform dedicated to amplifying the voices of those often unheard, focusing on social issues and community empowerment.',
    image: '/assets/Voice.png',
    video: '',
    technologies: [],
    liveUrl: 'https://www.voiceofthevoiceless.co.in/',
    githubUrl: '',
    category: 'Web',
    featured: false,
  },
  {
    title: 'Research Academy For Creative Excellence',
    slug: 'research-academy-for-creative-excellence',
    description:
      'Developed a WordPress website for a social organization to showcase its mission, promote community initiatives, share updates, and provide an accessible platform for engaging with members and the public.',
    image: '/assets/Race.png',
    video: '',
    // Empty for the same reason as the experience entry: the original project
    // cards showed no technology chips. Add them in Admin -> Projects.
    technologies: [],
    liveUrl: 'https://raceindia.org/',
    githubUrl: '',
    category: 'Web',
    featured: false,
  },
]

/**
 * The original site rendered these four icons in the hero and again in the
 * contact section. Order is preserved.
 */
export const SEED_SOCIAL_LINKS = [
  {
    platform: 'email',
    label: 'Email',
    url: 'mailto:althafnizam763@gmail.com',
    icon: 'BiLogoGmail',
  },
  {
    platform: 'linkedin',
    label: 'LinkedIn',
    url: 'https://www.linkedin.com/in/althaf-nizam-b27489260',
    icon: 'IoLogoLinkedin',
  },
  {
    platform: 'whatsapp',
    label: 'WhatsApp',
    url: 'https://wa.me/9633146330',
    icon: 'IoLogoWhatsapp',
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    url: 'https://www.instagram.com/alth_fx',
    icon: 'BsInstagram',
  },
]

/**
 * Sections that did not exist in the original React site ship empty and
 * disabled. They light up as soon as the admin adds a row and flips the
 * section toggle in Admin -> Settings.
 */
export const SEED_EDUCATION: unknown[] = []
export const SEED_CERTIFICATIONS: unknown[] = []
export const SEED_ACHIEVEMENTS: unknown[] = []
export const SEED_SERVICES: unknown[] = []

export const SEED_SETTINGS = {
  siteTitle: 'Xpalico | Full Stack Developer Portfolio',
  siteDescription:
    "Welcome to Xpalico's portfolio – A full stack developer showcasing projects, skills, and experience in web development, UI/UX design, and more.",
  keywords: [
    'Althaf Nizam',
    'Xpalico',
    'Full Stack Developer',
    'Laravel Developer',
    'React Developer',
    'Next.js Developer',
    'Node.js',
    'Portfolio',
    'Kerala',
  ],
  ogImage: '/assets/preview.png',
  favicon: '/assets/xpalico.png',
  twitterHandle: '',
  themeColor: '#000000',
  showCursorAnimation: true,
  sections: {
    hero: true,
    skills: true,
    experience: true,
    about: true,
    services: false,
    projects: true,
    education: false,
    certifications: false,
    achievements: false,
    contact: true,
  },
  // Matches the original navbar exactly.
  navLinks: [
    { label: 'About', href: 'about' },
    { label: 'Skills', href: 'skills' },
    { label: 'Projects', href: 'projects' },
    { label: 'Contact', href: 'contact' },
  ],
}

/** Fully-formed `PortfolioData` used when MongoDB cannot be reached. */
export function buildFallbackPortfolio(): PortfolioData {
  return {
    profile: { id: 'fallback', ...SEED_PROFILE },
    skills: SEED_SKILLS.map((s, i) => ({
      id: `fallback-skill-${i}`,
      ...s,
      enabled: true,
      order: i,
    })),
    experiences: SEED_EXPERIENCES.map((e, i) => ({
      id: `fallback-exp-${i}`,
      ...e,
      startDate: e.startDate ? new Date(e.startDate).toISOString() : null,
      endDate: e.endDate ? new Date(e.endDate).toISOString() : null,
      enabled: true,
      order: i,
    })),
    projects: SEED_PROJECTS.map((p, i) => ({
      id: `fallback-project-${i}`,
      ...p,
      images: [],
      enabled: true,
      order: i,
    })),
    education: [],
    certifications: [],
    achievements: [],
    services: [],
    socialLinks: SEED_SOCIAL_LINKS.map((s, i) => ({
      id: `fallback-social-${i}`,
      ...s,
      enabled: true,
      order: i,
    })),
    settings: { id: 'fallback', ...SEED_SETTINGS },
  }
}
