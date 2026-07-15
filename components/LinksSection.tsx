import { Section } from "@/components/Section";
import { linksDescription, socialLinks } from "@/data/links";

export function LinksSection() {
  return (
    <Section id="links" title="links" description={linksDescription}>
      <ul className="divide-y divide-line border-y border-line">
        {socialLinks.map((link) => (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-baseline gap-4 py-6"
            >
              <span className="text-lg font-medium transition-colors group-hover:text-accent">
                {link.platform}
              </span>
              {link.username && (
                <span className="text-sm text-muted">{link.username}</span>
              )}
              <span
                aria-hidden="true"
                className="ml-auto text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-accent"
              >
                →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
