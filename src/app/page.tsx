import Link from "next/link";
import { TOOL_REGISTRY, TOOLS } from "@/lib/tool-registry";

const promptTool = TOOL_REGISTRY["prompt-builder"];
const pictureTool = TOOL_REGISTRY["picture-deck"];
const soundTool = TOOL_REGISTRY["sound-deck"];

// The landing page lists the same tools as the top bar, in the same order,
// and says so by construction: both read TOOLS. The order and the numbering
// were literals here and had drifted from the bar by the time anyone looked.
const toolNumber = (tool: (typeof TOOLS)[number]) =>
  `Deck ${String(TOOLS.indexOf(tool) + 1).padStart(2, "0")}`;

export default function HomePage() {
  return (
    <div className="welcome-page">
      <header className="welcome-intro">
        <div className="product-label">
          <span className="status-dot" aria-hidden="true" />
          Card Prompts
        </div>
        <h1 id="welcome-title">Prompts, built from cards.</h1>
        <p>
          Choose CRAFT for writing, PICTURE for images, or SONIC for sound effects. Pick a starting hand, swap cards, and export a prompt or a reusable skill. Your draft stays in this browser.
        </p>
        <p className="welcome-links">
          <a
            href="https://github.com/seanguadron/website-card-prompts"
            target="_blank"
            rel="noreferrer noopener"
          >
            View the source on GitHub
          </a>
          <span aria-hidden="true">·</span>
          <span>
            Created by{" "}
            <a
              href="https://seancreates.com"
              target="_blank"
              rel="noreferrer noopener"
            >
              Sean Guadron
            </a>
          </span>
        </p>
      </header>

      <div className="home-sections">
        <section
          className="home-feature"
          id="prompts"
          aria-labelledby="home-prompts-title"
        >
          <div className="home-feature-copy">
            <span className="tool-kicker">{toolNumber(promptTool)} · CRAFT</span>
            <h2 id="home-prompts-title">{promptTool.name}</h2>
            <p>{promptTool.tagline}</p>
            <ul className="home-feature-points">
              <li>Describe the job, add guardrails, take the result.</li>
              <li>Equip role and tactic cards onto a clear C.R.A.F.T. brief.</li>
              <li>Copy, download, or share the finished prompt.</li>
            </ul>
            <Link className="button button-primary" href={promptTool.href}>
              Open the CRAFT Deck
            </Link>
          </div>
          <div className="home-spec" aria-hidden="true">
            <div className="home-spec-header">
              <span>prompt.md</span>
              <span className="file-badge">LOCAL</span>
            </div>
            <pre>
              <code>{`ROLE
You are a senior product designer.

TASK
Review a new onboarding flow.

DELIVERABLE
Five prioritized findings with fixes.`}</code>
            </pre>
          </div>
        </section>

        <section
          className="home-feature"
          id="pictures"
          aria-labelledby="home-pictures-title"
        >
          <div className="home-feature-copy">
            <span className="tool-kicker">{toolNumber(pictureTool)} · PICTURE</span>
            <h2 id="home-pictures-title">{pictureTool.name}</h2>
            <p>{pictureTool.tagline}</p>
            <ul className="home-feature-points">
              <li>Name a subject, then stack light, medium, and style cards.</li>
              <li>One Intensity dial re-grades every card, subtle to extreme.</li>
              <li>Optional Midjourney tail; copy or download the prompt.</li>
            </ul>
            <Link className="button button-primary" href={pictureTool.href}>
              Open the PICTURE Deck
            </Link>
          </div>
          <div className="home-spec" aria-hidden="true">
            <div className="home-spec-header">
              <span>prompt.txt</span>
              <span className="file-badge">IMAGE</span>
            </div>
            <pre>
              <code>{`a lighthouse keeper reading
by lamplight, oil painting,
rain-swept night city, warm
golden-hour glow, muted
palette, wide establishing
shot --ar 3:2 --stylize 250`}</code>
            </pre>
          </div>
        </section>

        <section
          className="home-feature"
          id="sounds"
          aria-labelledby="home-sounds-title"
        >
          <div className="home-feature-copy">
            <span className="tool-kicker">{toolNumber(soundTool)} · SONIC</span>
            <h2 id="home-sounds-title">{soundTool.name}</h2>
            <p>{soundTool.tagline}</p>
            <ul className="home-feature-points">
              <li>Name the sound, then stack attack, texture, and world cards.</li>
              <li>One Emphasis dial re-grades every card, hint to dominant.</li>
              <li>One sound per prompt; a layer rack plans the soundscape.</li>
            </ul>
            <Link className="button button-primary" href={soundTool.href}>
              Open the SONIC Deck
            </Link>
          </div>
          <div className="home-spec" aria-hidden="true">
            <div className="home-spec-header">
              <span>prompt.txt</span>
              <span className="file-badge">SOUND</span>
            </div>
            <pre>
              <code>{`heavy castle door creaking
open, wooden, slow swell,
deep, bassy, dark, ominous

Layers:
1. distant thunder rumbling
2. rain on stone, steady`}</code>
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
