import { Footer } from "@/components/Footer";
import { GallerySection } from "@/components/GallerySection";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LinksSection } from "@/components/LinksSection";
import { OsuSection } from "@/components/OsuSection";
import { ProjectsSection } from "@/components/ProjectsSection";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <GallerySection />
        <OsuSection />
        <ProjectsSection />
        <LinksSection />
      </main>
      <Footer />
    </>
  );
}
