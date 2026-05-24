// Mock data — users, applications, chat messages
// Note: "self" is the player viewing the app. Demo switches between several "self" identities.

window.MOCK_DATA = (function () {
  // ===== Members of each guild (R5/R4 + standard) =====
  const RAD_MEMBERS = [
    { id: "u_rad_r5",   ign: "Vortexa",     role: "R5", color: "rad" },
    { id: "u_rad_r4a",  ign: "Heliax",      role: "R4", color: "rad" },
    { id: "u_rad_r4b",  ign: "Solenne",     role: "R4", color: "rad" },
    { id: "u_rad_r4c",  ign: "Auriel",      role: "R4", color: "rad" },
  ];
  const MTLH_MEMBERS = [
    { id: "u_mtlh_r5",  ign: "Ironclad",    role: "R5", color: "mtlh" },
    { id: "u_mtlh_r4a", ign: "Hammerfall",  role: "R4", color: "mtlh" },
    { id: "u_mtlh_r4b", ign: "Crogan",      role: "R4", color: "mtlh" },
    { id: "u_mtlh_r4c", ign: "Slagheart",   role: "R4", color: "mtlh" },
  ];

  // The site owner — R5 of RAD AND super-admin
  const SUPER_ADMIN = RAD_MEMBERS[0]; // Vortexa = you

  // ===== Applicants (the demo "players") =====
  // Mixed states across both guilds
  const APPLICANTS = [
    // ===== RAD applicants =====
    {
      id: "a_001",
      ign: "Ophelya",
      uid: "874 192 003",
      server: "S-3914",
      power: 78400000,
      timezone: "UTC+1 — evenings",
      language: "EN / FR",
      discord: "ophelya#3120",
      motivation: "S-2901 veteran (T11), specialized in March Capacity and base defense. Looking for a structured guild for the migration. Online every evening 8-11pm CET, full SvS & GvG attendance.",
      guild: "rad",
      status: "review",   // pending | review | accepted | rejected
      votes: { yes: ["u_rad_r4a", "u_rad_r4b"], no: [], abstain: [] },
      submittedAt: "2026-05-08T18:42:00",
      avatar: "OP",
    },
    {
      id: "a_002",
      ign: "Kestrel",
      uid: "212 884 559",
      server: "S-4021",
      power: 64200000,
      timezone: "UTC-5 — morning/noon",
      language: "EN",
      discord: "kestrel.gg",
      motivation: "Solo top 10 on my current server, want to join a team that plays top SvS. R4 in two previous guilds. Clean comms, available for coordinated rallies.",
      guild: "rad",
      status: "pending",
      votes: { yes: [], no: [], abstain: [] },
      submittedAt: "2026-05-10T09:15:00",
      avatar: "KE",
    },
    {
      id: "a_003",
      ign: "Lyrael",
      uid: "557 003 991",
      server: "S-3914",
      power: 92800000,
      timezone: "UTC+1 — flexible",
      language: "EN / FR / ES",
      discord: "lyrael#0001",
      motivation: "Migrating from S-3014 (disbanded after merge). 92M power, full T11, 3 mythic heroes. Looking for a long-term structure. Full weekends available.",
      guild: "rad",
      status: "accepted",
      votes: { yes: ["u_rad_r5", "u_rad_r4a", "u_rad_r4b", "u_rad_r4c"], no: [], abstain: [] },
      submittedAt: "2026-05-06T14:20:00",
      avatar: "LY",
    },
    {
      id: "a_004",
      ign: "Tobyas",
      uid: "118 442 776",
      server: "S-4112",
      power: 41200000,
      timezone: "UTC+8 — evenings",
      language: "EN",
      discord: "tobyas92",
      motivation: "41M power. I know it's borderline but I'm farming hard. Can show my Bear Trap stats.",
      guild: "rad",
      status: "rejected",
      votes: { yes: [], no: ["u_rad_r5", "u_rad_r4a", "u_rad_r4b"], abstain: ["u_rad_r4c"] },
      submittedAt: "2026-05-07T22:08:00",
      avatar: "TO",
    },
    {
      id: "a_005",
      ign: "Sirenya",
      uid: "904 221 088",
      server: "S-3914",
      power: 71500000,
      timezone: "UTC+2",
      language: "EN / FR",
      discord: "sirenya.dev",
      motivation: "Been playing for 18 months, City level 31. Vouched for by Heliax. Available every evening and weekend.",
      guild: "rad",
      status: "review",
      votes: { yes: ["u_rad_r4a"], no: [], abstain: ["u_rad_r4b"] },
      submittedAt: "2026-05-09T19:30:00",
      avatar: "SI",
    },

    // ===== MTLH applicants =====
    {
      id: "a_010",
      ign: "Brennoch",
      uid: "337 102 884",
      server: "S-3990",
      power: 58700000,
      timezone: "UTC-3",
      language: "EN / PT",
      discord: "brennoch#7700",
      motivation: "R4 in my current guild (top 3 on the server). Migrating because the server is dying. Rally player, squad leader.",
      guild: "mtlh",
      status: "pending",
      votes: { yes: [], no: [], abstain: [] },
      submittedAt: "2026-05-10T11:05:00",
      avatar: "BR",
    },
    {
      id: "a_011",
      ign: "Veska",
      uid: "771 558 002",
      server: "S-4012",
      power: 49300000,
      timezone: "UTC+1 — flex",
      language: "EN / FR",
      discord: "veska.iron",
      motivation: "Playing for 2 years. Infantry specialist. Looking for a guild that doesn't just pretend — Metalheads fits my style.",
      guild: "mtlh",
      status: "review",
      votes: { yes: ["u_mtlh_r4a", "u_mtlh_r4b"], no: [], abstain: [] },
      submittedAt: "2026-05-08T20:50:00",
      avatar: "VE",
    },
    {
      id: "a_012",
      ign: "Drakhus",
      uid: "228 994 117",
      server: "S-3990",
      power: 66800000,
      timezone: "UTC-5",
      language: "EN",
      discord: "drakhus#0042",
      motivation: "Former R5 of a T2 guild on server 2700. Can coordinate 50+ rallies. Migrating after merge.",
      guild: "mtlh",
      status: "accepted",
      votes: { yes: ["u_mtlh_r5", "u_mtlh_r4a", "u_mtlh_r4b", "u_mtlh_r4c"], no: [], abstain: [] },
      submittedAt: "2026-05-05T16:00:00",
      avatar: "DR",
    },
    {
      id: "a_013",
      ign: "Marrok",
      uid: "660 887 312",
      server: "S-4112",
      power: 32100000,
      timezone: "UTC+8",
      language: "EN",
      discord: "marrok_play",
      motivation: "Low power but very active. I can make up for it with attendance.",
      guild: "mtlh",
      status: "rejected",
      votes: { yes: [], no: ["u_mtlh_r5", "u_mtlh_r4a", "u_mtlh_r4c"], abstain: ["u_mtlh_r4b"] },
      submittedAt: "2026-05-07T08:14:00",
      avatar: "MA",
    },
    {
      id: "a_014",
      ign: "Norviane",
      uid: "445 003 770",
      server: "S-3990",
      power: 54100000,
      timezone: "UTC+1",
      language: "EN / FR",
      discord: "norviane.gg",
      motivation: "Cavalry main, top 15 on the server. Available morning and evening. I know Drakhus since SvS 14.",
      guild: "mtlh",
      status: "pending",
      votes: { yes: [], no: [], abstain: [] },
      submittedAt: "2026-05-10T07:42:00",
      avatar: "NO",
    },
  ];

  // ===== Chat messages per applicant (with R5/R4 + the applicant) =====
  const CHATS = {
    // Ophelya — RAD, in review, multiple back-and-forth
    a_001: [
      { id: "m1", authorId: "u_rad_r5",  text: "Serious profile. 78M, EN/FR, S-3914. Are we taking her?", ts: "2026-05-09T19:00:00" },
      { id: "m2", authorId: "u_rad_r4a", text: "Pretty favorable. She defended 12 times in the last SvS. Need to check her schedule though — she says CET evenings but should be able to cover morning rallies sometimes.", ts: "2026-05-09T19:14:00" },
      { id: "m3", type: "system", text: "Vote opened by Vortexa", ts: "2026-05-09T19:15:00" },
      { id: "m4", type: "vote", question: "Accept Ophelya?", ts: "2026-05-09T19:15:00" },
      { id: "m5", authorId: "a_001", text: "Hi, thanks for considering me. For morning rallies I can adjust my schedule during SvS weeks. Not every day but for the peaks yes.", ts: "2026-05-09T19:40:00" },
      { id: "m6", authorId: "u_rad_r4b", text: "Good enough for me. +1.", ts: "2026-05-09T19:52:00" },
    ],
    // Lyrael — RAD, accepted
    a_003: [
      { id: "m1", authorId: "u_rad_r5",  text: "92M, full T11, vouched for by 2 external contacts. Easy yes.", ts: "2026-05-06T15:00:00" },
      { id: "m2", authorId: "u_rad_r4a", text: "+1.", ts: "2026-05-06T15:02:00" },
      { id: "m3", authorId: "u_rad_r4b", text: "+1.", ts: "2026-05-06T15:03:00" },
      { id: "m4", authorId: "u_rad_r4c", text: "+1, should we offer her a squad lead role straight away?", ts: "2026-05-06T15:08:00" },
      { id: "m5", type: "system", text: "Status → Accepted", ts: "2026-05-06T15:30:00" },
      { id: "m6", authorId: "u_rad_r5",  text: "Welcome to RAD. We'll plan the migration together on Discord.", ts: "2026-05-06T15:31:00" },
      { id: "m7", authorId: "a_003", text: "Thanks everyone. Joined Discord.", ts: "2026-05-06T15:45:00" },
    ],
    // Sirenya — RAD, in review
    a_005: [
      { id: "m1", authorId: "u_rad_r4a", text: "Vouched for by me. I've been playing with her for 6 months on the neighbour server.", ts: "2026-05-09T20:00:00" },
      { id: "m2", authorId: "u_rad_r5",  text: "OK but 71M is just on the bar. Can you guarantee progression?", ts: "2026-05-09T20:08:00" },
      { id: "m3", authorId: "u_rad_r4a", text: "Yes, she's on a +3M/week curve.", ts: "2026-05-09T20:10:00" },
      { id: "m4", type: "vote", question: "Accept Sirenya?", ts: "2026-05-09T20:11:00" },
    ],
    // Veska — MTLH, in review
    a_011: [
      { id: "m1", authorId: "u_mtlh_r5",  text: "Infantry main, bilingual, 49M. Solid.", ts: "2026-05-08T21:00:00" },
      { id: "m2", authorId: "u_mtlh_r4a", text: "Yes from me.", ts: "2026-05-08T21:04:00" },
      { id: "m3", authorId: "u_mtlh_r4b", text: "+1. She can join squad B.", ts: "2026-05-08T21:10:00" },
      { id: "m4", authorId: "a_011", text: "Hello, happy to hop on a voice call if you want.", ts: "2026-05-08T22:30:00" },
    ],
    // Drakhus — MTLH, accepted
    a_012: [
      { id: "m1", authorId: "u_mtlh_r5", text: "Former R5, knows how to coordinate. We're taking him.", ts: "2026-05-05T16:30:00" },
      { id: "m2", authorId: "u_mtlh_r4a", text: "+1, no debate.", ts: "2026-05-05T16:31:00" },
      { id: "m3", type: "system", text: "Status → Accepted", ts: "2026-05-05T17:00:00" },
    ],
  };

  return {
    RAD_MEMBERS, MTLH_MEMBERS, SUPER_ADMIN, APPLICANTS, CHATS,

    // Helper: members of a given guild
    membersOf(g) { return g === "rad" ? RAD_MEMBERS : MTLH_MEMBERS; },
    memberById(id) {
      return [...RAD_MEMBERS, ...MTLH_MEMBERS].find(m => m.id === id);
    },
    applicantById(id) {
      return APPLICANTS.find(a => a.id === id);
    },
  };
})();

// Format helpers
window.FMT = {
  power(n) {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return String(n);
  },
  time(iso, lang) {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === "fr" ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" });
  },
  date(iso, lang) {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "short" });
  },
  dayLabel(iso, lang) {
    const d = new Date(iso);
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "long", day: "numeric", month: "long" });
  },
};
