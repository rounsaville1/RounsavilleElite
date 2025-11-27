import React from "react";

// ------------------------------------------------------------
// Commandments (global enforcement)
// ------------------------------------------------------------

interface CommandmentRule {
  id: string;
  text: string;
  check: (action: ActionContext) => boolean | Promise<boolean>;
  overrideRequired?: boolean;
}

interface ActionContext {
  type: "create" | "cancel" | "rollback";
  payload?: any;
  actor: string;
  overrides?: string[];
}

interface ProofArtifact {
  type: string;
  content: any;
  sha256?: string;
}

interface ProofRecord {
  runId: string;
  createdAt: string;
  merkleRoot: string;
  artifacts: ProofArtifact[];
  signature?: string;
  uri?: string;
}

const commandments: CommandmentRule[] = [
  {
    id: "untested-code",
    text: "Thou shalt not deploy untested code.",
    check: (ctx) => ctx.type !== "create" || /^v\d+\.\d+\.\d+$/.test(ctx.payload?.targetVersion || ""),
  },
  {
    id: "sabbath-quorum",
    text: "Thou shalt not upgrade during Sabbath without quorum approval.",
    check: (ctx) => {
      if (ctx.type !== "create") return true;
      const freeze = isFreezeActive(new Date(), ctx.payload?.sabbath);
      if (!freeze.active) return true;
      return (ctx.overrides?.length ?? 0) >= 2;
    },
    overrideRequired: true,
  },
  {
    id: "backup-verify",
    text: "Thou shalt always verify backups before upgrades.",
    check: (ctx) => ctx.type !== "create" || !!ctx.payload?.backupEnabled,
  },
  {
    id: "micro-canary",
    text: "Thou shalt run a micro-canary (David’s Sling) before batch one.",
    check: (ctx) => ctx.type !== "create" || ctx.payload?.microCanary === true,
  },
  {
    id: "rollback-reason",
    text: "Thou shalt not rollback without reason recorded.",
    check: (ctx) => ctx.type !== "rollback" || !!ctx.payload?.reason,
  },
];

// ------------------------------------------------------------
// Enforcement helpers
// ------------------------------------------------------------

async function enforceCommandments(
  ctx: ActionContext,
  addProof: (record: ProofRecord) => void
) {
  for (const rule of commandments) {
    const ok = await rule.check(ctx);
    if (!ok) {
      const violation = {
        commandment: rule.text,
        actor: ctx.actor,
        time: new Date().toISOString(),
        overrides: ctx.overrides || [],
      };
      const artifacts: ProofArtifact[] = [
        { type: "violation", content: violation },
        { type: "action", content: ctx },
      ];
      const merkleRoot = await sha256Hex(JSON.stringify(artifacts));
      const record: ProofRecord = {
        runId: ctx.payload?.id || `${ctx.type}-${Date.now()}`,
        createdAt: new Date().toISOString(),
        merkleRoot,
        artifacts,
      };
      addProof(record);
      throw new Error(`Violation of Commandment: ${rule.text}`);
    }
  }
}

// ------------------------------------------------------------
// SHA256 util for proof
// ------------------------------------------------------------

async function sha256Hex(str: string): Promise<string> {
  const enc = new TextEncoder().encode(str);
  const digest = await window.crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ------------------------------------------------------------
// Freeze helper (reuse from Sabbath)
// ------------------------------------------------------------

interface FreezePeriod {
  start: string;
  end: string;
  note?: string;
}

interface SabbathSettings {
  enabled: boolean;
  freezeWeekends: boolean;
  periods: FreezePeriod[];
}

function isFreezeActive(
  now: Date,
  sabbath?: SabbathSettings
): { active: boolean; reason?: string } {
  if (!sabbath?.enabled) return { active: false };
  const day = now.getDay();
  if (sabbath.freezeWeekends && (day === 0 || day === 6))
    return { active: true, reason: "Weekend freeze" };
  for (const p of sabbath.periods || []) {
    const s = new Date(p.start).getTime();
    const e = new Date(p.end).getTime();
    const n = now.getTime();
    if (n >= s && n <= e)
      return { active: true, reason: p.note || "Change freeze window" };
  }
  return { active: false };
}

// ------------------------------------------------------------
// Tablets of Law Component
// ------------------------------------------------------------

const CommandmentsPanel: React.FC<{ proofs: ProofRecord[] }> = ({ proofs }) => {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm mb-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold leading-tight">🪨 Tablets of Law</div>
          <div className="text-sm text-black/60">The Ten Commandments of Automation</div>
        </div>
      </div>
      <ol className="list-decimal pl-6 space-y-2">
        {commandments.map((c) => (
          <li key={c.id} className="text-sm font-medium">
            {c.text}
          </li>
        ))}
      </ol>
      {proofs.length > 0 && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          <div className="font-medium">Violations Recorded</div>
          <ul className="list-disc pl-5">
            {proofs.map((p, i) => (
              <li key={i}>
                {p.artifacts[0]?.content?.commandment} — by {p.artifacts[0]?.content?.actor} at {p.createdAt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export { CommandmentsPanel, enforceCommandments };
