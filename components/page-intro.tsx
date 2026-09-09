export function PageIntro({
  index,
  eyebrow,
  title,
  summary,
}: {
  index: string;
  eyebrow: string;
  title: string;
  summary: string;
}) {
  return (
    <section className="page-intro">
      <div className="site-container page-intro-grid">
        <span className="section-index">{index}</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
        </div>
        <p className="page-intro-summary">{summary}</p>
      </div>
    </section>
  );
}
