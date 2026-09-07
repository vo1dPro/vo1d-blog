import { SocialLinkPreview } from '@/components/SocialLinkPreview'

type IconAsset = {
  src?: string
  light?: string
  dark?: string
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
  iconUrl,
  darkIconUrl,
  className = '',
}: {
  name: string
  href: string
  icon: string
  iconUrl?: string
  darkIconUrl?: string
  className?: string
}) {
  return (
    <SocialLinkPreview
      href={href}
      name={name}
      className={`social-icon-link ${className}`}
    >
      <SocialIcon name={name} asset={iconUrl || darkIconUrl ? { light: iconUrl ?? darkIconUrl, dark: darkIconUrl ?? iconUrl } : {}} />
    </SocialLinkPreview>
  )
}
