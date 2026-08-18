import type { IconType } from 'react-icons'
import {
  FaJs, FaReact, FaPhp, FaHtml5, FaCss3, FaLaravel, FaNodeJs, FaGitAlt, FaGithub, FaFigma,
  FaVuejs, FaAngular, FaPython, FaJava, FaAws, FaDocker, FaLinux, FaSass, FaWordpress,
  FaDatabase, FaServer, FaMobileAlt, FaPalette, FaSearch, FaRocket, FaShieldAlt, FaCloud,
  FaCogs, FaLightbulb, FaPencilRuler, FaLaptopCode, FaChartLine, FaUsers, FaHeadset,
  FaBriefcase, FaGraduationCap, FaCertificate, FaTrophy, FaAward, FaStar, FaMedal,
} from 'react-icons/fa'
import { FaPhone, FaXTwitter, FaThreads, FaLocationDot, FaEnvelope } from 'react-icons/fa6'
import {
  SiMysql, SiCodeigniter, SiJquery, SiTypescript, SiRedux, SiExpress, SiMongodb, SiPostman,
  SiFlutter, SiDart, SiFirebase, SiSupabase, SiPrisma, SiGraphql, SiVercel, SiNetlify,
  SiJira, SiSlack, SiNotion, SiAdobexd, SiCanva, SiVite, SiWebpack, SiEslint, SiJest,
  SiSocketdotio, SiRedis, SiNginx, SiGooglecloud,
} from 'react-icons/si'
import {
  TbApi, TbKey, TbLock, TbShieldLock, TbSparkles, TbDevices, TbBrandVscode, TbExternalLink,
  TbDownload, TbCode, TbLink, TbTrophy, TbAward, TbCertificate, TbSchool, TbBriefcase,
  TbServer, TbDatabase, TbDeviceMobile, TbPalette, TbSeo, TbCloud, TbRocket, TbBrush,
  TbLayout, TbGauge, TbBug, TbGitBranch, TbTerminal2, TbWorld, TbMail, TbPhone, TbMapPin,
  TbUser, TbSettings, TbTools, TbBuildingSkyscraper, TbCalendar, TbFileText, TbPhoto, TbStar,
} from 'react-icons/tb'
import { RiNextjsFill, RiTailwindCssFill, RiBootstrapFill, RiFlutterFill } from 'react-icons/ri'
import { BiLogoPostgresql, BiLogoGmail } from 'react-icons/bi'
import {
  BsInstagram, BsFacebook, BsYoutube, BsTelegram, BsDribbble, BsBehance, BsMedium,
  BsStackOverflow, BsTwitterX, BsWhatsapp,
} from 'react-icons/bs'
import { IoLogoLinkedin, IoLogoWhatsapp, IoLogoYoutube, IoLogoFacebook } from 'react-icons/io5'
import { IoMdMail } from 'react-icons/io'

/**
 * Icons are stored in MongoDB as plain strings (e.g. "FaReact") so the admin
 * can pick one without touching code. This registry resolves those strings
 * back to components at render time.
 *
 * To offer a new icon in the admin picker, import it above and add one entry
 * below — nothing else needs to change.
 */

export interface IconEntry {
  Icon: IconType
  label: string
  group: IconGroup
}

export type IconGroup =
  | 'Languages'
  | 'Frontend'
  | 'Backend'
  | 'Database'
  | 'Tools'
  | 'Social'
  | 'General'

export const ICON_REGISTRY: Record<string, IconEntry> = {
  // ---- Languages -------------------------------------------------------
  FaPhp: { Icon: FaPhp, label: 'PHP', group: 'Languages' },
  FaJs: { Icon: FaJs, label: 'JavaScript', group: 'Languages' },
  SiTypescript: { Icon: SiTypescript, label: 'TypeScript', group: 'Languages' },
  FaHtml5: { Icon: FaHtml5, label: 'HTML5', group: 'Languages' },
  FaCss3: { Icon: FaCss3, label: 'CSS3', group: 'Languages' },
  FaPython: { Icon: FaPython, label: 'Python', group: 'Languages' },
  FaJava: { Icon: FaJava, label: 'Java', group: 'Languages' },
  SiDart: { Icon: SiDart, label: 'Dart', group: 'Languages' },
  FaSass: { Icon: FaSass, label: 'Sass', group: 'Languages' },

  // ---- Frontend --------------------------------------------------------
  FaReact: { Icon: FaReact, label: 'React', group: 'Frontend' },
  RiNextjsFill: { Icon: RiNextjsFill, label: 'Next.js', group: 'Frontend' },
  RiTailwindCssFill: { Icon: RiTailwindCssFill, label: 'Tailwind CSS', group: 'Frontend' },
  RiBootstrapFill: { Icon: RiBootstrapFill, label: 'Bootstrap', group: 'Frontend' },
  SiJquery: { Icon: SiJquery, label: 'jQuery', group: 'Frontend' },
  SiRedux: { Icon: SiRedux, label: 'Redux', group: 'Frontend' },
  FaVuejs: { Icon: FaVuejs, label: 'Vue.js', group: 'Frontend' },
  FaAngular: { Icon: FaAngular, label: 'Angular', group: 'Frontend' },
  SiFlutter: { Icon: SiFlutter, label: 'Flutter', group: 'Frontend' },
  RiFlutterFill: { Icon: RiFlutterFill, label: 'Flutter (alt)', group: 'Frontend' },
  SiVite: { Icon: SiVite, label: 'Vite', group: 'Frontend' },
  SiWebpack: { Icon: SiWebpack, label: 'Webpack', group: 'Frontend' },

  // ---- Backend ---------------------------------------------------------
  FaLaravel: { Icon: FaLaravel, label: 'Laravel', group: 'Backend' },
  SiCodeigniter: { Icon: SiCodeigniter, label: 'CodeIgniter', group: 'Backend' },
  FaNodeJs: { Icon: FaNodeJs, label: 'Node.js', group: 'Backend' },
  SiExpress: { Icon: SiExpress, label: 'Express.js', group: 'Backend' },
  SiGraphql: { Icon: SiGraphql, label: 'GraphQL', group: 'Backend' },
  SiSocketdotio: { Icon: SiSocketdotio, label: 'Socket.IO', group: 'Backend' },
  SiNginx: { Icon: SiNginx, label: 'Nginx', group: 'Backend' },
  FaWordpress: { Icon: FaWordpress, label: 'WordPress', group: 'Backend' },
  TbApi: { Icon: TbApi, label: 'REST API', group: 'Backend' },
  TbKey: { Icon: TbKey, label: 'JWT / Key', group: 'Backend' },
  TbLock: { Icon: TbLock, label: 'Authentication', group: 'Backend' },
  TbShieldLock: { Icon: TbShieldLock, label: 'Authorization / RBAC', group: 'Backend' },

  // ---- Database --------------------------------------------------------
  SiMysql: { Icon: SiMysql, label: 'MySQL', group: 'Database' },
  BiLogoPostgresql: { Icon: BiLogoPostgresql, label: 'PostgreSQL', group: 'Database' },
  SiMongodb: { Icon: SiMongodb, label: 'MongoDB', group: 'Database' },
  SiRedis: { Icon: SiRedis, label: 'Redis', group: 'Database' },
  SiFirebase: { Icon: SiFirebase, label: 'Firebase', group: 'Database' },
  SiSupabase: { Icon: SiSupabase, label: 'Supabase', group: 'Database' },
  SiPrisma: { Icon: SiPrisma, label: 'Prisma', group: 'Database' },
  FaDatabase: { Icon: FaDatabase, label: 'Database', group: 'Database' },

  // ---- Tools -----------------------------------------------------------
  FaGitAlt: { Icon: FaGitAlt, label: 'Git', group: 'Tools' },
  FaGithub: { Icon: FaGithub, label: 'GitHub', group: 'Tools' },
  SiPostman: { Icon: SiPostman, label: 'Postman', group: 'Tools' },
  TbBrandVscode: { Icon: TbBrandVscode, label: 'VS Code', group: 'Tools' },
  FaFigma: { Icon: FaFigma, label: 'Figma', group: 'Tools' },
  FaDocker: { Icon: FaDocker, label: 'Docker', group: 'Tools' },
  FaLinux: { Icon: FaLinux, label: 'Linux', group: 'Tools' },
  FaAws: { Icon: FaAws, label: 'AWS', group: 'Tools' },
  SiGooglecloud: { Icon: SiGooglecloud, label: 'Google Cloud', group: 'Tools' },
  SiVercel: { Icon: SiVercel, label: 'Vercel', group: 'Tools' },
  SiNetlify: { Icon: SiNetlify, label: 'Netlify', group: 'Tools' },
  SiJira: { Icon: SiJira, label: 'Jira', group: 'Tools' },
  SiSlack: { Icon: SiSlack, label: 'Slack', group: 'Tools' },
  SiNotion: { Icon: SiNotion, label: 'Notion', group: 'Tools' },
  SiAdobexd: { Icon: SiAdobexd, label: 'Adobe XD', group: 'Tools' },
  SiCanva: { Icon: SiCanva, label: 'Canva', group: 'Tools' },
  SiEslint: { Icon: SiEslint, label: 'ESLint', group: 'Tools' },
  SiJest: { Icon: SiJest, label: 'Jest', group: 'Tools' },
  TbGitBranch: { Icon: TbGitBranch, label: 'Version Control', group: 'Tools' },
  TbTerminal2: { Icon: TbTerminal2, label: 'Terminal', group: 'Tools' },

  // ---- Social ----------------------------------------------------------
  IoLogoLinkedin: { Icon: IoLogoLinkedin, label: 'LinkedIn', group: 'Social' },
  IoLogoWhatsapp: { Icon: IoLogoWhatsapp, label: 'WhatsApp', group: 'Social' },
  BsWhatsapp: { Icon: BsWhatsapp, label: 'WhatsApp (outline)', group: 'Social' },
  BsInstagram: { Icon: BsInstagram, label: 'Instagram', group: 'Social' },
  BsFacebook: { Icon: BsFacebook, label: 'Facebook', group: 'Social' },
  IoLogoFacebook: { Icon: IoLogoFacebook, label: 'Facebook (solid)', group: 'Social' },
  BsYoutube: { Icon: BsYoutube, label: 'YouTube', group: 'Social' },
  IoLogoYoutube: { Icon: IoLogoYoutube, label: 'YouTube (solid)', group: 'Social' },
  BsTwitterX: { Icon: BsTwitterX, label: 'X (Twitter)', group: 'Social' },
  FaXTwitter: { Icon: FaXTwitter, label: 'X (alt)', group: 'Social' },
  FaThreads: { Icon: FaThreads, label: 'Threads', group: 'Social' },
  BsTelegram: { Icon: BsTelegram, label: 'Telegram', group: 'Social' },
  BsDribbble: { Icon: BsDribbble, label: 'Dribbble', group: 'Social' },
  BsBehance: { Icon: BsBehance, label: 'Behance', group: 'Social' },
  BsMedium: { Icon: BsMedium, label: 'Medium', group: 'Social' },
  BsStackOverflow: { Icon: BsStackOverflow, label: 'Stack Overflow', group: 'Social' },
  BiLogoGmail: { Icon: BiLogoGmail, label: 'Gmail', group: 'Social' },
  IoMdMail: { Icon: IoMdMail, label: 'Email', group: 'Social' },
  FaEnvelope: { Icon: FaEnvelope, label: 'Envelope', group: 'Social' },
  FaPhone: { Icon: FaPhone, label: 'Phone', group: 'Social' },
  TbLink: { Icon: TbLink, label: 'Generic link', group: 'Social' },
  TbWorld: { Icon: TbWorld, label: 'Website', group: 'Social' },

  // ---- General (services, achievements, misc) --------------------------
  TbCode: { Icon: TbCode, label: 'Code', group: 'General' },
  TbSparkles: { Icon: TbSparkles, label: 'AI / Sparkles', group: 'General' },
  TbDevices: { Icon: TbDevices, label: 'Responsive Design', group: 'General' },
  TbServer: { Icon: TbServer, label: 'Server', group: 'General' },
  TbDatabase: { Icon: TbDatabase, label: 'Data', group: 'General' },
  TbDeviceMobile: { Icon: TbDeviceMobile, label: 'Mobile', group: 'General' },
  TbPalette: { Icon: TbPalette, label: 'UI / Design', group: 'General' },
  TbBrush: { Icon: TbBrush, label: 'Branding', group: 'General' },
  TbLayout: { Icon: TbLayout, label: 'Layout', group: 'General' },
  TbSeo: { Icon: TbSeo, label: 'SEO', group: 'General' },
  TbGauge: { Icon: TbGauge, label: 'Performance', group: 'General' },
  TbCloud: { Icon: TbCloud, label: 'Cloud', group: 'General' },
  TbRocket: { Icon: TbRocket, label: 'Launch', group: 'General' },
  TbBug: { Icon: TbBug, label: 'Debugging', group: 'General' },
  TbTools: { Icon: TbTools, label: 'Maintenance', group: 'General' },
  TbTrophy: { Icon: TbTrophy, label: 'Trophy', group: 'General' },
  TbAward: { Icon: TbAward, label: 'Award', group: 'General' },
  TbCertificate: { Icon: TbCertificate, label: 'Certificate', group: 'General' },
  TbSchool: { Icon: TbSchool, label: 'Education', group: 'General' },
  TbBriefcase: { Icon: TbBriefcase, label: 'Work', group: 'General' },
  TbBuildingSkyscraper: { Icon: TbBuildingSkyscraper, label: 'Company', group: 'General' },
  TbStar: { Icon: TbStar, label: 'Star', group: 'General' },
  TbCalendar: { Icon: TbCalendar, label: 'Calendar', group: 'General' },
  TbFileText: { Icon: TbFileText, label: 'Document', group: 'General' },
  TbPhoto: { Icon: TbPhoto, label: 'Image', group: 'General' },
  TbUser: { Icon: TbUser, label: 'Person', group: 'General' },
  TbMail: { Icon: TbMail, label: 'Mail', group: 'General' },
  TbPhone: { Icon: TbPhone, label: 'Phone (line)', group: 'General' },
  TbMapPin: { Icon: TbMapPin, label: 'Location', group: 'General' },
  TbSettings: { Icon: TbSettings, label: 'Settings', group: 'General' },
  TbExternalLink: { Icon: TbExternalLink, label: 'External link', group: 'General' },
  TbDownload: { Icon: TbDownload, label: 'Download', group: 'General' },
  FaLightbulb: { Icon: FaLightbulb, label: 'Idea', group: 'General' },
  FaLaptopCode: { Icon: FaLaptopCode, label: 'Web Development', group: 'General' },
  FaPencilRuler: { Icon: FaPencilRuler, label: 'UI/UX', group: 'General' },
  FaChartLine: { Icon: FaChartLine, label: 'Analytics', group: 'General' },
  FaUsers: { Icon: FaUsers, label: 'Team', group: 'General' },
  FaHeadset: { Icon: FaHeadset, label: 'Support', group: 'General' },
  FaShieldAlt: { Icon: FaShieldAlt, label: 'Security', group: 'General' },
  FaCogs: { Icon: FaCogs, label: 'Automation', group: 'General' },
  FaSearch: { Icon: FaSearch, label: 'Search', group: 'General' },
  FaRocket: { Icon: FaRocket, label: 'Rocket', group: 'General' },
  FaCloud: { Icon: FaCloud, label: 'Cloud (solid)', group: 'General' },
  FaServer: { Icon: FaServer, label: 'Server (solid)', group: 'General' },
  FaMobileAlt: { Icon: FaMobileAlt, label: 'Mobile (solid)', group: 'General' },
  FaPalette: { Icon: FaPalette, label: 'Palette', group: 'General' },
  FaBriefcase: { Icon: FaBriefcase, label: 'Briefcase', group: 'General' },
  FaGraduationCap: { Icon: FaGraduationCap, label: 'Graduation', group: 'General' },
  FaCertificate: { Icon: FaCertificate, label: 'Certificate (solid)', group: 'General' },
  FaTrophy: { Icon: FaTrophy, label: 'Trophy (solid)', group: 'General' },
  FaAward: { Icon: FaAward, label: 'Award (solid)', group: 'General' },
  FaStar: { Icon: FaStar, label: 'Star (solid)', group: 'General' },
  FaMedal: { Icon: FaMedal, label: 'Medal', group: 'General' },
  FaLocationDot: { Icon: FaLocationDot, label: 'Location (pin)', group: 'General' },
}

export const ICON_NAMES = Object.keys(ICON_REGISTRY)

export const ICON_GROUPS: IconGroup[] = [
  'Languages',
  'Frontend',
  'Backend',
  'Database',
  'Tools',
  'Social',
  'General',
]

/** Resolves an icon name to a component, falling back to a neutral glyph. */
export function getIcon(name: string | undefined | null): IconType {
  if (!name) return TbCode
  return ICON_REGISTRY[name]?.Icon ?? TbCode
}

/**
 * Renders a stored icon name. Keeping this in one place means the public site
 * and the admin panel can never drift on how an icon string is resolved.
 */
export function Icon({
  name,
  size = 30,
  className,
}: {
  name: string | undefined | null
  size?: number
  className?: string
}) {
  const Cmp = getIcon(name)
  return <Cmp size={size} className={className} aria-hidden="true" />
}
