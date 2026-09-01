import Link from "next/link";

const highlights = [
  {
    label: "Brotherhood",
    copy: "Stay connected to the brothers, lines, and legacy that shaped Theta Phi.",
  },
  {
    label: "Service",
    copy: "Keep up with chapter events and the work happening in our community.",
  },
  {
    label: "Achievement",
    copy: "Celebrate the leaders and accomplishments carrying our chapter forward.",
  },
];

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Theta Phi home">
          <span className="brand-mark" aria-hidden="true">
            ΘΦ
          </span>
          <span>
            <strong>Theta Phi</strong>
            <small>Kappa Alpha Psi Fraternity, Inc.</small>
          </span>
        </Link>
        <Link className="header-login" href="/login">
          Brother Login
        </Link>
      </header>

      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <p className="eyebrow">Troy University · Since 1976</p>
        <h1>Theta Phi Chapter of Kappa Alpha Psi Fraternity, Inc.</h1>
        <p className="hero-copy">
          Honoring a proud legacy of brotherhood, service, and achievement while
          building stronger connections for every generation.
        </p>
        <div className="hero-actions">
          <Link className="primary-action" href="/login">
            Enter Brother Portal
          </Link>
          <a
            className="secondary-action"
            href="https://www.instagram.com/troynupes/?hl=en"
            rel="noreferrer"
            target="_blank"
          >
            Follow @troynupes
          </a>
        </div>
      </section>

      <section className="highlights" aria-label="Chapter values">
        {highlights.map((item, index) => (
          <article className="highlight-card" key={item.label}>
            <span className="card-number">0{index + 1}</span>
            <h2>{item.label}</h2>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
