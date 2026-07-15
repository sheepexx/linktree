import { Section } from "@/components/Section";
import { projects, projectsDescription } from "@/data/projects";

export function ProjectsSection() {
  return (
    <Section id="projects" title="projects" description={projectsDescription}>
      <ul className="divide-y divide-line border-y border-line">
        {projects.map((project) => (
          <li
            key={project.id}
            className="py-7 md:grid md:grid-cols-[1.2fr_2fr_auto] md:items-baseline md:gap-8"
          >
            <h3 className="font-medium">{project.name}</h3>
            <p className="mt-1 leading-relaxed text-muted md:mt-0">
              {project.description}
            </p>
            <div className="mt-3 flex items-baseline gap-6 text-sm md:mt-0">
              <span className="text-muted">{project.status}</span>
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  visit ↗
                </a>
              )}
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-accent hover:underline"
                >
                  github ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
