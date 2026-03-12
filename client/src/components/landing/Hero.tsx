import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroVideo from "@/assets/videos/hero-loop-v2.mp4";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export function Hero({
  onContactClick,
  scrollToId,
}: {
  onContactClick: () => void;
  scrollToId: (id: string) => void;
}) {
  return (
    <section
      id="top"
      data-testid="section-hero"
      className="relative h-[90vh] overflow-hidden"
    >
      {/* Video Background */}
      <div className="absolute inset-0 z-0 bg-black">
        <video
          data-testid="video-hero"
          className="h-full w-full object-cover opacity-60 mix-blend-screen"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/40 to-background" />
        <div className="absolute inset-0 grain opacity-20" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-6">
        
        {/* Main Title */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center justify-center text-center w-full mb-20 md:mb-0"
        >
          <motion.h1
            data-testid="text-hero-title"
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="font-serif text-3xl leading-[0.9] md:text-[4.5rem] lg:text-[5rem] text-shadow-hero"
          >
            <span className="block overflow-hidden">
              <span
                data-testid="text-hero-title-slide"
                className="block animate-cinematic-spacing"
              >
                MINDY ROBINSON
              </span>
            </span>
          </motion.h1>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 1.5 }}
            className="mt-6 flex items-center gap-4"
          >
             <div className="h-[1px] w-8 bg-white/30 md:w-24" />
             <span className="font-serif text-base tracking-[0.25em] text-white/90 uppercase md:text-[1.35rem]">
                Actress & Model
             </span>
             <div className="h-[1px] w-8 bg-white/30 md:w-24" />
          </motion.div>
        </motion.div>

        {/* Bottom Right Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 4, duration: 1 }}
          className="absolute bottom-8 left-6 right-6 flex flex-col items-end gap-5 md:left-auto md:right-12 md:w-auto"
        >
          {/* Badges */}
          <div className="flex flex-wrap justify-end gap-2 opacity-80">
            <Badge variant="secondary" className="bg-white/10 text-[10px] backdrop-blur-sm hover:bg-white/20 border-0">SAG/AFTRA</Badge>
            <Badge variant="secondary" className="bg-white/10 text-[10px] backdrop-blur-sm hover:bg-white/20 border-0">Available for Travel</Badge>
            <Badge variant="secondary" className="bg-white/10 text-[10px] backdrop-blur-sm hover:bg-white/20 border-0">Fast Response</Badge>
          </div>

          {/* Description & Buttons Group */}
          <div className="flex flex-col items-end gap-6 text-right">
            <p className="text-sm leading-relaxed text-white/90 md:text-base font-light tracking-wide text-shadow-subtle">
              Character actress with 175+ TV & film appearances.
              <span className="opacity-70 block mt-1">Accepting bookings for 2026.</span>
            </p>
            
            <div className="flex items-center gap-4">
               <button
                onClick={() => scrollToId("work")}
                className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/80 hover:text-white transition-colors"
              >
                View Credits
              </button>
              <Button 
                onClick={onContactClick}
                className="h-10 rounded-full px-6 font-medium text-sm shadow-glow-gold"
              >
                Get in touch
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
