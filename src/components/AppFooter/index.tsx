import { SocialIconLink } from '@/components/SocialIconLink'
import { socials } from '@/data/socials'

export default function AppFooter() {
  return (
    <footer className="relative z-10 px-6 py-12 sm:py-14">
      <nav className="mx-auto flex max-w-3xl items-center justify-center gap-3" aria-label="vo1d Socials">
        {socials.map((social) => (
          <SocialIconLink
            key={social.name}
            name={social.name}
            href={social.url}
            icon={social.icon}
          />
        ))}
      </nav>
    </footer>
  )
}
