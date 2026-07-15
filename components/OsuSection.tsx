import { Section } from "@/components/Section";
import { getSocialLink } from "@/data/links";
import { osu } from "@/data/osu";

export function OsuSection() {
  const profile = getSocialLink("osu");
  const youtube = getSocialLink("youtube");
  const externalLinks = [
    { label: "osu! profile", url: profile.url },
    { label: "YouTube", url: youtube.url },
  ];

  return (
    <Section id="osu" title="osu!">
      <div className="grid gap-12 md:grid-cols-2 md:gap-16">
        <div>
          <p className="text-sm text-muted">username</p>
          <p className="mt-1 text-lg font-medium">{osu.username}</p>
          <p className="mt-6 text-sm text-muted">main mode</p>
          <p className="mt-1 text-lg font-medium">{osu.mainMode}</p>
          <p className="mt-8 max-w-sm leading-relaxed text-muted">
            {osu.description}
          </p>
        </div>
        <div>
          <ul className="border-b border-line">
            {externalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between border-t border-line py-4 transition-colors hover:text-accent"
                >
                  <span className="font-medium">{link.label}</span>
                  <span aria-hidden="true" className="text-muted group-hover:text-accent">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-10 text-sm text-muted">selected maps</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {osu.highlights.map((highlight) => (
              <li key={highlight.id} className="py-4 text-sm">
                {highlight.title}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
