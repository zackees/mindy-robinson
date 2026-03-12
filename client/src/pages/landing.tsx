import { useState, useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { MoviesCarousel } from "@/components/landing/MoviesCarousel";
import { ContactPanel } from "@/components/landing/ContactPanel";
import { PublicityPics } from "@/components/landing/PublicityPics";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MessageCircle, Globe, MapPin, Instagram } from "lucide-react";
import paperTex from "@/assets/images/mindy-paper-texture.png";
import portraitAbout from "@/assets/legacy/portrait-about.jpg";

const LEGACY_EMAIL = "iheartmindy@yahoo.com";
const LEGACY_INSTAGRAM = "@iheartmindy";

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Pill({
  icon,
  label,
  testid,
}: {
  icon: React.ReactNode;
  label: string;
  testid: string;
}) {
  return (
    <div
      data-testid={testid}
      className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/[0.06] px-3 py-1.5 text-xs text-foreground/90 shadow-[0_1px_0_0_rgba(0,0,0,0.35)] backdrop-blur"
    >
      <span className="text-foreground/80">{icon}</span>
      <span className="font-medium tracking-wide">{label}</span>
    </div>
  );
}

export default function Landing() {
  const [showContact, setShowContact] = useState(false);

  // Prevent scroll when contact panel is open
  useEffect(() => {
    if (showContact) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showContact]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        onInquireClick={() => setShowContact(true)} 
        scrollToId={scrollToId} 
      />

      <Hero 
        onContactClick={() => setShowContact(true)} 
        scrollToId={scrollToId} 
      />

      <ContactPanel 
        open={showContact} 
        onClose={() => setShowContact(false)} 
      />

      {/* Movies carousel */}
      <section id="work" data-testid="section-work" className="py-14 md:py-18">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p
                data-testid="text-movies-eyebrow"
                className="text-xs font-medium tracking-[0.22em] text-muted-foreground"
              >
                FILMOGRAPHY
              </p>
              <h2
                data-testid="text-movies-title"
                className="mt-2 font-serif text-3xl tracking-tight md:text-4xl"
              >
                Movies & appearances
              </h2>
            </div>
          </div>

          <div className="mt-12">
            <MoviesCarousel />
          </div>
        </div>
      </section>

      <PublicityPics />

      {/* About / Bio Snippet */}
      <section className="relative overflow-hidden py-24">
        {/* Subtle Paper Texture Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url(${paperTex})` }}
        />
        
        <div className="mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-2 md:gap-20 md:px-6 items-center">
          <div className="relative">
             <div className="aspect-[4/5] overflow-hidden rounded-sm bg-muted">
               <img 
                 src={portraitAbout} 
                 alt="Mindy Robinson Portrait" 
                 className="h-full w-full object-cover grayscale transition duration-700 hover:grayscale-0 hover:saturate-[0.8]"
               />
             </div>
             {/* Decorative element */}
             <div className="absolute -bottom-6 -right-6 -z-10 h-32 w-32 rounded-full border border-white/5 bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
          </div>

          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground mb-4">
              ABOUT MINDY
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mb-6 leading-tight">
              More than just a face on camera.
            </h2>
            <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
              <p>
                Mindy Robinson is an American actress, TV personality, and host based in Los Angeles. 
                With over 175 credits in film and television, she has appeared in popular shows like 
                <em> King of the Nerds</em>, <em>Range 15</em>, and <em>Check Point</em>.
              </p>
              <p>
                Known for her comedic timing, versatility, and distinct look, Mindy brings professionalism 
                and energy to every set. Whether it's a feature film, a national commercial, or a 
                digital campaign, she delivers memorable performances that resonate with audiences.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Pill 
                testid="pill-location"
                icon={<MapPin className="h-3.5 w-3.5" />} 
                label="Los Angeles, CA" 
              />
               <Pill 
                testid="pill-language"
                icon={<Globe className="h-3.5 w-3.5" />} 
                label="English (Native)" 
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact CTA */}
      <section id="contact" className="border-t border-border/40 bg-card/30 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="font-serif text-3xl md:text-5xl mb-6">Ready to collaborate?</h2>
          <p className="mx-auto max-w-xl text-muted-foreground mb-10 text-lg">
            Currently accepting bookings for film, television, and commercial projects for the 2026 season.
          </p>
          
          <Button 
            onClick={() => setShowContact(true)}
            className="h-14 rounded-full px-10 text-lg shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all duration-300"
          >
            Start a conversation
          </Button>

          <div className="mt-16 grid grid-cols-1 gap-8 border-t border-border/40 pt-10 md:grid-cols-3 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Mail className="h-5 w-5 mb-2 opacity-50" />
              <span className="font-medium text-foreground">Email</span>
              <a href={`mailto:${LEGACY_EMAIL}`} className="hover:text-primary transition">{LEGACY_EMAIL}</a>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Instagram className="h-5 w-5 mb-2 opacity-50" />
              <span className="font-medium text-foreground">Social</span>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-primary transition">{LEGACY_INSTAGRAM}</a>
            </div>
             <div className="flex flex-col items-center gap-2">
              <MessageCircle className="h-5 w-5 mb-2 opacity-50" />
              <span className="font-medium text-foreground">Representation</span>
              <span>Direct Booking Available</span>
            </div>
          </div>

          <div className="mt-16 text-xs text-muted-foreground/40">
            © {new Date().getFullYear()} Mindy Robinson. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
}
