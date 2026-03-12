import { useMemo } from "react";
import { Clapperboard, Camera, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export function FeaturedSection() {
  const featured = useMemo(
    () => [
      {
        title: "On-screen talent",
        desc: "Film, TV, and digital productions — from comedy to high-energy action.",
        icon: <Clapperboard className="h-4 w-4" strokeWidth={1.8} />,
      },
      {
        title: "Editorial & commercial",
        desc: "Campaigns, product, lifestyle, and fashion — polished, punctual, and prepared.",
        icon: <Camera className="h-4 w-4" strokeWidth={1.8} />,
      },
      {
        title: "Brand collaborations",
        desc: "Sponsored content and partnerships aligned with your audience and goals.",
        icon: <Sparkles className="h-4 w-4" strokeWidth={1.8} />,
      },
    ],
    [],
  );

  return (
    <section id="about" data-testid="section-about" className="py-24 bg-background/50">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {featured.map((item, i) => (
            <Card
              key={i}
              data-testid={`card-feature-${i}`}
              className="group relative overflow-hidden border-border/40 bg-card/20 p-8 transition hover:border-border/80 hover:bg-card/40"
            >
              <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-foreground/80 group-hover:bg-white/10 group-hover:text-foreground">
                {item.icon}
              </div>
              <div className="absolute top-8 right-8 text-[10px] font-medium text-muted-foreground/40">
                0{i + 1}
              </div>
              <h3 className="mb-3 font-serif text-xl">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
