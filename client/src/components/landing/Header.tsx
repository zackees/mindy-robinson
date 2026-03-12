import { Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({
  onInquireClick,
  scrollToId,
}: {
  onInquireClick: () => void;
  scrollToId: (id: string) => void;
}) {
  return (
    <header
      data-testid="section-nav"
      className="sticky top-0 z-50 border-b border-border/70 bg-background/60 backdrop-blur"
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <button
          data-testid="button-home"
          onClick={() => scrollToId("top")}
          className="group flex items-baseline gap-2"
        >
          <span className="font-serif text-lg tracking-tight md:text-xl">
            Mindy Robinson
          </span>
          <span className="hidden text-xs text-muted-foreground md:inline">
            Actress • Model
          </span>
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          <button
            data-testid="button-nav-work"
            onClick={() => scrollToId("work")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Work
          </button>
          <button
            data-testid="button-nav-about"
            onClick={() => scrollToId("about")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </button>
          <button
            data-testid="button-nav-contact"
            onClick={() => scrollToId("contact")}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Contact
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <a
            data-testid="link-instagram-top"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              scrollToId("contact");
            }}
            className="hidden items-center gap-2 rounded-full border border-border/70 bg-white/[0.04] px-3 py-2 text-xs text-foreground/90 shadow-sm transition hover:bg-white/[0.07] md:inline-flex"
          >
            <Instagram className="h-4 w-4" strokeWidth={1.8} />
            Instagram
          </a>
          <Button
            data-testid="button-cta-top"
            className="rounded-full"
            onClick={onInquireClick}
          >
            Inquire
            <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
          </Button>
        </div>
      </div>
    </header>
  );
}
