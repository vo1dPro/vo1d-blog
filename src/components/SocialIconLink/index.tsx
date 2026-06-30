type IconAsset = {
  src?: string
  light?: string
  dark?: string
}

const iconAssets: Record<string, IconAsset> = {
  github: {
    light: '/images/icons/github-light.svg',
    dark: '/images/icons/github-dark.svg',
  },
  'x-formerly-twitter': {
    light: '/images/icons/x-formerly-twitter-light.svg',
    dark: '/images/icons/x-formerly-twitter-dark.svg',
  },
  tiktok: {
    light: '/images/icons/tiktok-light.svg',
    dark: '/images/icons/tiktok-dark.svg',
  },
}

function SocialIcon({ name, asset }: { name: string; asset: IconAsset }) {
  if (asset.light && asset.dark) {
    return (
      <>
        <img className="social-icon social-icon--light" src={asset.light} alt="" aria-hidden="true" />
        <img className="social-icon social-icon--dark" src={asset.dark} alt="" aria-hidden="true" />
      </>
    )
  }

  if (asset.src) {
    return <img className="social-icon" src={asset.src} alt="" aria-hidden="true" />
  }

  return (
    <span aria-hidden="true" className="text-sm font-semibold text-muted-foreground">
      {name.slice(0, 1)}
    </span>
  )
}

export function SocialIconLink({
  name,
  href,
  icon,
  className = '',
}: {
  name: string
  href: string
  icon: string
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={name}
      title={name}
      className={`social-icon-link ${className}`}
    >
      <SocialIcon name={name} asset={iconAssets[icon] ?? {}} />
    </a>
  )
}
