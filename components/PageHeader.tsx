import Image from "next/image";

import { Incentive } from "@/components/Incentive";
import { eventConfig } from "@/lib/config";
import lockup from "@/public/brand/mega-test-drive-5.png";
import sainLogo from "@/public/brand/sain-motors.png";

/**
 * The hero, reduced to three beats on one centred axis:
 *
 *   endorsement  →  event mark  →  the reason to register  →  form
 *
 * When and where now sit under the form (EventLogistics); the hero carries only
 * identity and motive, so the first field arrives sooner.
 *
 * Spacing keeps three deliberate tiers: 20–24px inside the identity pair,
 * 36–44px for the one real break, 44–52px handing off to the form.
 *
 * The lockup animates by transform only (never opacity), so it paints
 * immediately and cannot delay Largest Contentful Paint.
 */
export function PageHeader() {
  const { distributor, title } = eventConfig;

  return (
    <header className="flex w-full flex-col items-center text-center">
      <Image
        src={sainLogo}
        alt={distributor}
        priority
        sizes="120px"
        className="animate-rise h-[1.375rem] w-[5.25rem] opacity-80 sm:h-6 sm:w-[5.75rem]"
      />

      {/* The anchor. Nothing else in the hero competes with it. */}
      <h1
        className="animate-settle relative mt-5 w-full max-w-[14rem] sm:mt-6 sm:max-w-[16.5rem] lg:max-w-[18rem]"
        style={{ animationDelay: "0.06s" }}
      >
        <Image
          src={lockup}
          alt={title}
          priority
          sizes="(max-width: 640px) 224px, (max-width: 1024px) 264px, 288px"
          className="h-auto w-full"
        />
        <span className="sr-only"> — {distributor}-ийн туршилтын жолоодлогын өдөрлөг</span>
        {/* Specular sweep: one sharp glint against an almost-still page. */}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className="animate-sheen absolute inset-y-0 -left-1/4 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent blur-md" />
        </span>
      </h1>

      <div className="animate-rise mt-9 sm:mt-11" style={{ animationDelay: "0.16s" }}>
        <Incentive />
      </div>
    </header>
  );
}
