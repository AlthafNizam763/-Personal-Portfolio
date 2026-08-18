import { getPortfolioData } from '@/lib/data'
import { getSiteUrl, toAbsoluteUrl } from '@/lib/site'
import CustomCursor from '@/components/portfolio/CustomCursor'
import Navbar from '@/components/portfolio/Navbar'
import Hero from '@/components/portfolio/Hero'
import Skills from '@/components/portfolio/Skills'
import Experience from '@/components/portfolio/Experience'
import About from '@/components/portfolio/About'
import Services from '@/components/portfolio/Services'
import Projects from '@/components/portfolio/Projects'
import Education from '@/components/portfolio/Education'
import Certifications from '@/components/portfolio/Certifications'
import Achievements from '@/components/portfolio/Achievements'
import Contact from '@/components/portfolio/Contact'
import Footer from '@/components/portfolio/Footer'

/**
 * Statically rendered at build time and refreshed on demand: every admin write
 * calls `revalidatePortfolio()`, which busts the `portfolio` cache tag and
 * regenerates this page. The hourly `revalidate` below is only a safety net.
 */
export const revalidate = 3600

export default async function HomePage() {
  const data = await getPortfolioData()
  const {
    profile,
    settings,
    skills,
    experiences,
    projects,
    education,
    certifications,
    achievements,
    services,
    socialLinks,
  } = data

  const { sections } = settings

  // Person schema — helps Google render a knowledge panel / rich result and is
  // where `profile.location` is used (the visible design has no location line).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.title,
    description: profile.shortDescription,
    url: getSiteUrl(),
    image: profile.profileImage ? toAbsoluteUrl(profile.profileImage) : undefined,
    email: profile.email ? `mailto:${profile.email}` : undefined,
    telephone: profile.phone || undefined,
    address: profile.location
      ? { '@type': 'PostalAddress', addressLocality: profile.location }
      : undefined,
    sameAs: socialLinks
      .map((l) => l.url)
      .filter((url) => /^https?:\/\//i.test(url)),
    knowsAbout: skills.map((s) => s.name),
    worksFor: experiences
      .filter((e) => e.current)
      .map((e) => ({ '@type': 'Organization', name: e.company })),
  }

  return (
    <div className="font-sora scroll-smooth overflow-x-hidden">
      <script
        type="application/ld+json"
        // Serialized from our own database values, not user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {settings.showCursorAnimation && <CustomCursor />}

      <Navbar profile={profile} settings={settings} />

      <main>
        {sections.hero && <Hero profile={profile} socialLinks={socialLinks} />}
        {sections.skills && <Skills skills={skills} />}
        {sections.experience && <Experience experiences={experiences} />}
        {sections.about && <About profile={profile} />}
        {sections.services && <Services services={services} />}
        {sections.projects && <Projects projects={projects} />}
        {sections.education && <Education education={education} />}
        {sections.certifications && <Certifications certifications={certifications} />}
        {sections.achievements && <Achievements achievements={achievements} />}
        {sections.contact && <Contact profile={profile} socialLinks={socialLinks} />}
      </main>

      <Footer profile={profile} settings={settings} />
    </div>
  )
}
