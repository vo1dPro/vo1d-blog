import SectionTitle from '../SectionTitle'

const identityTags = ['Developer', 'Frontend Craft', 'Learning Loop']

const workPrinciples = [
  {
    title: 'Clear structure',
    detail: 'I like codebases where boundaries are visible and changes have an obvious place to land.',
  },
  {
    title: 'Thoughtful UI',
    detail: 'I care about spacing, motion, feedback, and the small details that make an interface feel considered.',
  },
  {
    title: 'Useful writing',
    detail: 'Writing helps me clarify technical choices, document what I learn, and turn experience into reusable notes.',
  },
  {
    title: 'Iterative learning',
    detail: 'I prefer steady refinement: build, inspect, adjust, and keep the system honest as it grows.',
  },
]

const outsideCode = ['Books', 'Games', 'Photography', 'Blog notes']
const pathItems = ['Code', 'Product', 'Writing', 'Hobbies']

export default function AboutSection() {
  return (
    <section id="about" className="about-dossier-section py-24">
      <div className="mx-auto max-w-5xl px-6">
        <SectionTitle title="About Me" subtitle="A little bit about who I am" />

        <div className="about-dossier">
          <div className="about-dossier__grain" />

          <header className="about-dossier__intro">
            <div>
              <p className="about-dossier__eyebrow">vo1d / developer profile</p>
              <h3>
                I build clean, polished web experiences with structure, taste, and curiosity.
              </h3>
            </div>

            <p>
              I care about making ideas feel usable instead of just functional. My work sits between
              frontend craft, product thinking, and the habit of writing things down clearly.
            </p>
          </header>

          <div className="about-dossier__tags" aria-label="Identity tags">
            {identityTags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>

          <div className="about-dossier__grid">
            <section className="about-dossier__panel about-dossier__panel--work">
              <div className="about-dossier__panel-head">
                <span>01</span>
                <h4>How I work</h4>
              </div>

              <div className="about-dossier__principles">
                {workPrinciples.map((principle, index) => (
                  <article key={principle.title} className="about-dossier__principle">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h5>{principle.title}</h5>
                      <p>{principle.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="about-dossier__panel about-dossier__panel--life">
              <div className="about-dossier__panel-head">
                <span>02</span>
                <h4>Outside code</h4>
              </div>

              <div className="about-dossier__outside">
                {outsideCode.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>

              <p className="about-dossier__aside">
                I keep hobbies close because they change how I notice things: pacing from games,
                composition from photography, and patience from reading.
              </p>
            </section>
          </div>

          <footer className="about-dossier__path" aria-label="Personal path">
            {pathItems.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </footer>
        </div>
      </div>
    </section>
  )
}
