import './index.css'

interface NotFoundPageProps {
  article?: boolean
}

export default function NotFoundPage({ article = false }: NotFoundPageProps) {
  return (
    <main className="not-found-page" aria-labelledby="not-found-title">
      <div className="not-found-content">
        <div className="not-found-number" aria-hidden="true">
          <span className="not-found-number-sharp">404</span>
          <span className="not-found-number-soft">404</span>
          <span className="not-found-number-blur">404</span>
        </div>
        <h1 id="not-found-title">
          {article ? 'The article you requested cannot be found.' : 'The page you requested cannot be found.'}
        </h1>
        <p className="not-found-description">
          The link may be broken, or the {article ? 'article' : 'page'}
          <br />
          could have been taken down or renamed.
        </p>
        <a className="not-found-home" href="/">Go back home</a>
      </div>
    </main>
  )
}
