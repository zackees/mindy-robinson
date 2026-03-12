import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Instagram, Send, ArrowRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InquiryType = "Booking" | "Press" | "Collaboration" | "Other";

export function ContactPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [inquiryType, setInquiryType] = useState<InquiryType>("Booking");
  const [sent, setSent] = useState(false);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-white/10 bg-black/80 backdrop-blur-xl p-6 shadow-2xl md:p-10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-3xl text-white">Let's talk.</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div
              data-testid="card-hero-contact"
              className="relative"
            >
              <div className="p-1">
                {/* Chat with me section */}
                <div className="mb-8">
                  <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground mb-4">
                    CHAT WITH ME
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      data-testid="link-instagram-dm"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="group flex items-center justify-between rounded-xl border border-border/60 bg-white/[0.03] px-4 py-4 transition hover:border-primary/50 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#E1306C]/10 text-[#E1306C]">
                          <Instagram className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground/90">
                          Instagram
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </a>

                    <a
                      data-testid="link-telegram"
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="group flex items-center justify-between rounded-xl border border-border/60 bg-white/[0.03] px-4 py-4 transition hover:border-[#229ED9]/50 hover:bg-white/[0.06]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-[#229ED9]/10 text-[#229ED9]">
                          <Send className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground/90">
                          Telegram
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                    </a>
                  </div>
                </div>

                <Separator className="bg-border/70 mb-8" />

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p
                      data-testid="text-contact-eyebrow"
                      className="text-xs font-medium tracking-[0.22em] text-muted-foreground"
                    >
                      INQUIRIES
                    </p>
                    <p
                      data-testid="text-contact-subtitle"
                      className="mt-2 text-sm leading-relaxed text-foreground/80"
                    >
                      Share a few details and I’ll respond as soon as possible.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  {(
                    [
                      "Booking",
                      "Press",
                      "Collaboration",
                      "Other",
                    ] as InquiryType[]
                  ).map((t) => {
                    const active = t === inquiryType;
                    return (
                      <button
                        key={t}
                        data-testid={`button-inquiry-${t.toLowerCase()}`}
                        onClick={() => setInquiryType(t)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm transition",
                          active
                            ? "border-transparent bg-gradient-to-r from-white/[0.14] to-white/[0.06] shadow-sm"
                            : "border-border/60 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                        )}
                      >
                        <span className={cn(active ? "text-foreground" : "")}>{t}</span>
                      </button>
                    );
                  })}
                </div>

                <form
                  data-testid="form-contact"
                  className="mt-6 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                    window.setTimeout(() => setSent(false), 3500);
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      data-testid="input-name"
                      placeholder="Name"
                      required
                      className="h-12 bg-white/[0.03]"
                    />
                    <Input
                      data-testid="input-email"
                      placeholder="Email"
                      type="email"
                      required
                      className="h-12 bg-white/[0.03]"
                    />
                  </div>
                  <Input
                    data-testid="input-project"
                    placeholder="Project / Brand"
                    className="h-12 bg-white/[0.03]"
                  />
                  <Textarea
                    data-testid="input-message"
                    placeholder="Tell me about the role, shoot dates, location, usage, and any links…"
                    className="min-h-[140px] resize-none bg-white/[0.03]"
                    required
                  />

                  <div className="flex flex-col gap-4">
                    <div
                      data-testid="text-form-note"
                      className="text-xs text-muted-foreground"
                    >
                      By sending, you agree to be contacted regarding this inquiry.
                    </div>
                    <Button
                      data-testid="button-send"
                      type="submit"
                      className="h-12 w-full rounded-full text-base"
                    >
                      Send inquiry
                      <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.8} />
                    </Button>
                  </div>

                  {sent ? (
                    <div
                      data-testid="status-sent"
                      className="rounded-xl border border-border/60 bg-white/[0.06] px-4 py-3 text-sm text-foreground/90"
                    >
                      Sent. Thanks — we’ll reply shortly.
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
