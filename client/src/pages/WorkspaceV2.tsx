import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Search, ChevronLeft, ChevronRight, User, Building2, Zap, FileText, Shield,
  LayoutGrid, GitBranch, Clock, Users, MessageSquare, Link2, Map, Image,
  Cpu, Settings, X, ExternalLink, ChevronDown, Circle, Minus,
} from "lucide-react";

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg:        "#08080D",
  surface:   "#0F0F18",
  surfaceEl: "#13131F",
  border:    "rgba(255,255,255,0.06)",
  borderHi:  "rgba(255,255,255,0.14)",
  accent:    "#6C63FF",
  accentDim: "rgba(108,99,255,0.18)",
  text:      "#DDDDF0",
  textDim:   "#6B6B8A",
  textMuted: "#3E3E58",
  // Node type palette: [bg, border, accent]
  person:   ["#0D1F35", "#1E4D7A", "#5BA3E8"],
  event:    ["#0D1F14", "#1E5C2E", "#4FC87A"],
  claim:    ["#1A0D30", "#4A1E7A", "#9B6EFF"],
  evidence: ["#251500", "#6B3C00", "#E8923A"],
  org:      ["#200D0D", "#5C1A1A", "#E85A5A"],
};

// ─── Mock data types ──────────────────────────────────────────────────────────
type NodeKind = "person" | "event" | "claim" | "evidence" | "org";

interface WNode {
  id: string;
  kind: NodeKind;
  label: string;
  sub: string;          // role / date / type
  desc: string;
  confidence?: number;  // 0-100
  date?: string;
  tags?: string[];
  x: number;
  y: number;
}

interface WEdge {
  source: string;
  target: string;
  label?: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const PEOPLE: WNode[] = [
  { id:"p1",  kind:"person", label:"Marcus Halverson",   sub:"Former NSA Director",         desc:"Resigned in 2020 after 14 years. Suspected of brokering intelligence with private networks. Linked to 12 covert meetings with foreign nationals.", confidence:82, tags:["NSA","Whistleblower","Defence"], x:0, y:0 },
  { id:"p2",  kind:"person", label:"Elena Vasquez",      sub:"Investigative Journalist",     desc:"Published the initial exposé on Cobalt Network. Source protection invoked 4 times. Under surveillance since 2020.", confidence:91, tags:["Press","Source"], x:0, y:0 },
  { id:"p3",  kind:"person", label:"Dmitri Volkov",      sub:"Russian Oligarch",             desc:"Controls 14 shell companies across Liechtenstein, Cyprus, and the BVI. Net worth estimated at $4.2B. Travel bans in 6 jurisdictions.", confidence:76, tags:["Oligarch","Finance","Sanctions"], x:0, y:0 },
  { id:"p4",  kind:"person", label:"Sarah Chen",         sub:"CIA Analyst, Whistleblower",   desc:"Filed whistleblower complaint July 2020. Surveilled by NSA for 18 months prior. Currently under witness protection.", confidence:95, tags:["CIA","Whistleblower"], x:0, y:0 },
  { id:"p5",  kind:"person", label:"Ahmad Khalil",       sub:"Lebanese Arms Broker",         desc:"Operating under 6 aliases. Brokered deals estimated at $1.2B annually. Interpol Red Notice issued November 2021.", confidence:78, tags:["Arms","Broker","INTERPOL"], x:0, y:0 },
  { id:"p6",  kind:"person", label:"Victoria Pemberton", sub:"UK Foreign Office",            desc:"Authorized surveillance operations under GCHQ cooperation agreement. Parliamentary inquiry testimony under review.", confidence:67, tags:["GCHQ","UK","Surveillance"], x:0, y:0 },
  { id:"p7",  kind:"person", label:"Jin-Ho Park",        sub:"South Korean Intelligence",    desc:"Leaked classified satellite imagery to Meridian Capital in 2020. Under investigation by NIS. Diplomatic immunity contested.", confidence:71, tags:["NIS","Intelligence","Leak"], x:0, y:0 },
  { id:"p8",  kind:"person", label:"Thomas Kessler",     sub:"Swiss Private Banker",         desc:"Structured bearer bond instruments for anonymous cross-border transfers. Accounts frozen February 2021 under FATF pressure.", confidence:88, tags:["Banking","Switzerland","Money"], x:0, y:0 },
  { id:"p9",  kind:"person", label:"Natasha Petrov",     sub:"Former FSB Officer",           desc:"Survived assassination attempt August 2021. Attempted defection to UK. Provided intelligence on Cobalt Network internal structure.", confidence:83, tags:["FSB","Russia","Defection"], x:0, y:0 },
  { id:"p10", kind:"person", label:"Carlos Reyes",       sub:"Venezuelan Minister",          desc:"Channelled oil revenue through Nexus Strategic Partners. Named in Senate testimony. Travel restrictions imposed.", confidence:69, tags:["Venezuela","Oil","Sanctions"], x:0, y:0 },
  { id:"p11", kind:"person", label:"Amara Osei",         sub:"African Union Observer",       desc:"Documented network activity across 7 Sub-Saharan states. Report suppressed for 6 months at Security Council request.", confidence:74, tags:["AU","Observer","Report"], x:0, y:0 },
  { id:"p12", kind:"person", label:"Henrik Larsson",     sub:"Europol Investigator",         desc:"Led cross-border investigation team. Investigation politically compromised per internal Europol memo leaked in 2022.", confidence:80, tags:["Europol","Investigation"], x:0, y:0 },
  { id:"p13", kind:"person", label:"Priya Sharma",       sub:"UN Special Rapporteur",        desc:"Published landmark report on Cobalt Network's humanitarian impact. Faced intimidation campaign. Report endorsed by 34 member states.", confidence:89, tags:["UN","Human Rights"], x:0, y:0 },
  { id:"p14", kind:"person", label:"Robert Wexler",      sub:"Defence Contractor CEO",       desc:"Met Volkov 7 times in 2020. Cobalt Defense Systems received $2.3B in combined contracts. Board resigned en masse in 2022.", confidence:77, tags:["Defence","Contractor"], x:0, y:0 },
  { id:"p15", kind:"person", label:"Leila Nasseri",      sub:"Iranian Diplomat",             desc:"Coordinated sanctions evasion through Arcturus Foundation front entities. Expelled from Vienna in 2022 following UN inquiry.", confidence:73, tags:["Iran","Diplomacy","Sanctions"], x:0, y:0 },
];

const ORGS: WNode[] = [
  { id:"o1",  kind:"org", label:"Meridian Capital",      sub:"Investment Group",             desc:"Front company for cross-border intelligence payments. Registered in Delaware, operating from Zurich. $1.8B in unexplained inflows 2018–2021.", confidence:84, tags:["Front","Finance"], x:0, y:0 },
  { id:"o2",  kind:"org", label:"Cobalt Defense Systems",sub:"Defence Contractor",           desc:"Dual-use weapons technology supplier. Technology transferred to non-state actors. Contract cancelled by DoD in 2022.", confidence:79, tags:["Defence","Technology"], x:0, y:0 },
  { id:"o3",  kind:"org", label:"Prometheus Intelligence",sub:"Private Intelligence",        desc:"Provides SIGINT services to non-state actors. Infiltrated 3 NATO member intelligence networks.", confidence:81, tags:["Intelligence","SIGINT","NATO"], x:0, y:0 },
  { id:"o4",  kind:"org", label:"Arcturus Foundation",   sub:"Think Tank",                  desc:"Academic cover for disinformation operations. Funded by Meridian Capital. 34 published researchers confirmed as cover identities.", confidence:86, tags:["Disinfo","Cover"], x:0, y:0 },
  { id:"o5",  kind:"org", label:"Nexus Strategic Partners",sub:"Consulting",                desc:"Venezuelan oil revenue laundering. Won $340M in government contracts through bribery. CEO under Interpol warrant.", confidence:75, tags:["Bribery","Venezuela"], x:0, y:0 },
  { id:"o6",  kind:"org", label:"Silvergate Financial",  sub:"Private Bank",                desc:"Processed $340M in untraceable transfers over 36 months. Correspondent banking relationships in 14 jurisdictions.", confidence:88, tags:["Banking","Transfers"], x:0, y:0 },
  { id:"o7",  kind:"org", label:"Orion Security",        sub:"Security Consulting",          desc:"Provided physical surveillance and counter-intelligence services to Cobalt Network principals.", confidence:70, tags:["Surveillance","Security"], x:0, y:0 },
  { id:"o8",  kind:"org", label:"Helios Data Systems",   sub:"Data Infrastructure",         desc:"Data breach January 2020 suspected to be insider-facilitated. Classified data exfiltrated to external server.", confidence:77, tags:["Data","Breach","Tech"], x:0, y:0 },
  { id:"o9",  kind:"org", label:"Atlas Research Institute",sub:"Research Cover",            desc:"Provides academic legitimacy to network principals. 12 researchers hold simultaneous government security clearances.", confidence:72, tags:["Cover","Research"], x:0, y:0 },
  { id:"o10", kind:"org", label:"Vanta Intelligence Group",sub:"Private Intelligence",      desc:"Infiltrated intelligence services of 3 NATO countries. Operations span 34 countries. Founded by former CIA officers.", confidence:83, tags:["NATO","Intelligence","CIA"], x:0, y:0 },
];

const EVENTS: WNode[] = [
  { id:"e1",  kind:"event", label:"Meridian Founding Meeting",  sub:"2019-03-15", desc:"First documented meeting of Cobalt Network principals at Meridian Capital offices in Zurich. 9 attendees identified from CCTV.", date:"2019-03-15", confidence:91, x:0, y:0 },
  { id:"e2",  kind:"event", label:"Cobalt Contract Signed",     sub:"2019-06-20", desc:"Cobalt Defense Systems signs $840M defence contract. Internal documents show contract engineered through Nexus intermediaries.", date:"2019-06-20", confidence:85, x:0, y:0 },
  { id:"e3",  kind:"event", label:"Geneva Summit",              sub:"2019-09-12", desc:"Clandestine meeting at Hotel Beau-Rivage. Satellite imagery confirms presence of 6 principals. Classified handoffs documented.", date:"2019-09-12", confidence:79, x:0, y:0 },
  { id:"e4",  kind:"event", label:"Helios Data Breach",         sub:"2020-01-08", desc:"Classified systems compromised. 340GB of signals intelligence exfiltrated. Insider involvement confirmed by subsequent investigation.", date:"2020-01-08", confidence:92, x:0, y:0 },
  { id:"e5",  kind:"event", label:"Halverson Resignation",      sub:"2020-03-22", desc:"Resigned citing personal reasons. Subsequent forensic audit of his communications revealed contact with network principals.", date:"2020-03-22", confidence:88, x:0, y:0 },
  { id:"e6",  kind:"event", label:"Vasquez Exposé Published",   sub:"2020-05-14", desc:"14,000-word investigation published. Caused immediate diplomatic incidents in 4 countries. Source protection invoked.", date:"2020-05-14", confidence:96, x:0, y:0 },
  { id:"e7",  kind:"event", label:"Chen Whistleblower Filing",  sub:"2020-07-03", desc:"Formal whistleblower complaint filed with Inspector General. 847-page filing with classified annexes. Triggered Senate inquiry.", date:"2020-07-03", confidence:97, x:0, y:0 },
  { id:"e8",  kind:"event", label:"Vienna Arms Meeting",        sub:"2020-09-18", desc:"Khalil brokers $200M arms deal. CCTV footage from Vienna airport confirms meeting. Multiple aliases used.", date:"2020-09-18", confidence:74, x:0, y:0 },
  { id:"e9",  kind:"event", label:"Arcturus Established",       sub:"2020-11-30", desc:"Foundation formally registered in Liechtenstein. Founding board all pseudonymous. $40M initial capitalization from Meridian.", date:"2020-11-30", confidence:83, x:0, y:0 },
  { id:"e10", kind:"event", label:"Swiss Accounts Frozen",      sub:"2021-02-14", desc:"FATF intervention freezes 23 accounts across Silvergate network. $178M assets frozen. Kessler arrested, released on bond.", date:"2021-02-14", confidence:95, x:0, y:0 },
  { id:"e11", kind:"event", label:"UN Security Briefing",       sub:"2021-04-22", desc:"Classified briefing to P5 on Cobalt Network's threat assessment. 3 member states objected to distribution.", date:"2021-04-22", confidence:87, x:0, y:0 },
  { id:"e12", kind:"event", label:"Nexus Contract Awarded",     sub:"2021-06-09", desc:"$500M advisory contract awarded through no-bid process. Internal audit flagged 14 procedural violations.", date:"2021-06-09", confidence:82, x:0, y:0 },
  { id:"e13", kind:"event", label:"Petrov Attempt",             sub:"2021-08-17", desc:"Assassination attempt via nerve agent analogue. Petrov survived. UK expels 3 diplomatic personnel. FSB denies involvement.", date:"2021-08-17", confidence:90, x:0, y:0 },
  { id:"e14", kind:"event", label:"Senate Intelligence Hearing", sub:"2021-10-05", desc:"Public and closed sessions. 6 principals testify. Chen's sealed testimony classified TS/SCI. Halverson invokes 5th Amendment.", date:"2021-10-05", confidence:98, x:0, y:0 },
  { id:"e15", kind:"event", label:"Europol Investigation Opened",sub:"2021-12-19", desc:"Multi-jurisdiction investigation launched. 8 countries cooperating. Larsson appointed lead. Internal compromise discovered 6 months later.", date:"2021-12-19", confidence:88, x:0, y:0 },
  { id:"e16", kind:"event", label:"Sharma Report Published",    sub:"2022-02-28", desc:"UN Special Rapporteur report on humanitarian impact. Suppressed for 6 months. Endorsed by 34 states. Russia and China abstain.", date:"2022-02-28", confidence:93, x:0, y:0 },
  { id:"e17", kind:"event", label:"Cobalt Network Exposed",     sub:"2022-05-15", desc:"Full network graph published by joint investigative consortium. Named 94 individuals and 31 entities across 34 countries.", date:"2022-05-15", confidence:94, x:0, y:0 },
  { id:"e18", kind:"event", label:"International Arrest Warrants",sub:"2022-07-30", desc:"Interpol Red Notices issued for 19 individuals. 7 arrested within 30 days. 12 remain at large.", date:"2022-07-30", confidence:96, x:0, y:0 },
  { id:"e19", kind:"event", label:"Parliamentary Inquiry",      sub:"2022-09-12", desc:"UK parliamentary inquiry into Pemberton's authorization of surveillance operations. Interim report classified.", date:"2022-09-12", confidence:85, x:0, y:0 },
  { id:"e20", kind:"event", label:"Final OPSEC Review",         sub:"2022-11-01", desc:"Intelligence community review of network's operational security capabilities. Assessment: network continues to operate in reduced form.", date:"2022-11-01", confidence:71, x:0, y:0 },
];

const CLAIMS: WNode[] = [
  { id:"c1",  kind:"claim", label:"Meridian is a front company",       sub:"High Confidence", desc:"Shell structure confirmed through Panama Papers cross-reference. Beneficial ownership traced to 4 Volkov nominees.", confidence:87, x:0, y:0 },
  { id:"c2",  kind:"claim", label:"Halverson received $12M offshore",  sub:"High Confidence", desc:"Wire transfers through Silvergate to accounts in Vanuatu and BVI. Initiated within 6 months of contract awards.", confidence:82, x:0, y:0 },
  { id:"c3",  kind:"claim", label:"Cobalt Defense dual-use transfer",  sub:"Disputed",        desc:"Technology classified as dual-use exported to Iran via UAE intermediary. Export licence forged according to forensic analysis.", confidence:68, x:0, y:0 },
  { id:"c4",  kind:"claim", label:"Chen surveilled for 18 months",     sub:"High Confidence", desc:"NSA metadata records confirm continuous collection. Warrant obtained under Section 702 FISA. Target designation: FOREIGN AGENT.", confidence:91, x:0, y:0 },
  { id:"c5",  kind:"claim", label:"Geneva was a clandestine handoff",  sub:"Medium Confidence",desc:"Satellite imagery shows 6 verified principals. Hotel records sealed under Swiss banking secrecy. 4 diplomatic bags.", confidence:74, x:0, y:0 },
  { id:"c6",  kind:"claim", label:"Volkov controls 14 shell companies",sub:"High Confidence", desc:"Corporate registry analysis across 9 jurisdictions. Nominee directors trace to single Zurich law firm. Circular ownership structure.", confidence:89, x:0, y:0 },
  { id:"c7",  kind:"claim", label:"Arcturus funds disinformation",     sub:"Medium Confidence",desc:"Content analysis of 340 Arcturus-funded publications shows 73% alignment with known influence operation messaging.", confidence:72, x:0, y:0 },
  { id:"c8",  kind:"claim", label:"Silvergate processed $340M",        sub:"High Confidence", desc:"Transaction logs obtained by FATF. $340M in 1,847 transactions over 36 months. Average transaction: $184,000.", confidence:93, x:0, y:0 },
  { id:"c9",  kind:"claim", label:"Khalil brokers $1.2B annually",     sub:"Medium Confidence",desc:"SIGINT assessment from 2019. Trade finance records partially corroborate. 6 independent sources confirm.", confidence:71, x:0, y:0 },
  { id:"c10", kind:"claim", label:"Park leaked satellite data",        sub:"Disputed",        desc:"NIS investigation ongoing. Data exfiltration forensics consistent with Park's access logs. Denied by South Korean government.", confidence:64, x:0, y:0 },
  { id:"c11", kind:"claim", label:"Helios breach was inside job",      sub:"High Confidence", desc:"Access logs show data exfiltration began 40 minutes after all-staff meeting. Only 3 individuals had simultaneous access.", confidence:85, x:0, y:0 },
  { id:"c12", kind:"claim", label:"Nexus contract secured through bribery",sub:"High Confidence",desc:"Internal Nexus emails show payments to procurement officials. 14 procedural violations in contract award process.", confidence:88, x:0, y:0 },
  { id:"c13", kind:"claim", label:"Vasquez received NSA documents",    sub:"Medium Confidence",desc:"Document metadata analysis confirms NSA origin. 3 potential sources identified. None confirmed. Source protection ongoing.", confidence:76, x:0, y:0 },
  { id:"c14", kind:"claim", label:"Petrov marked for elimination",     sub:"High Confidence", desc:"HUMINT from 2 independent sources. Order originated at FSB Directorate level. Petrov informed by allied intelligence.", confidence:83, x:0, y:0 },
  { id:"c15", kind:"claim", label:"Senate testimony coordinated",      sub:"Disputed",        desc:"Communication metadata shows 6 principals' lawyers exchanged 847 encrypted messages in 72 hours before hearing.", confidence:67, x:0, y:0 },
  { id:"c16", kind:"claim", label:"Network spans 34 countries",        sub:"High Confidence", desc:"Joint investigative report maps operations across 34 jurisdictions. 12 intelligence agencies confirm independently.", confidence:94, x:0, y:0 },
  { id:"c17", kind:"claim", label:"Wexler met Volkov 7 times in 2020", sub:"High Confidence", desc:"Travel records, hotel CCTV, and credit card data confirm 7 meetings. All in neutral jurisdictions. No press present.", confidence:90, x:0, y:0 },
  { id:"c18", kind:"claim", label:"Venezuelan oil funds the network",  sub:"Medium Confidence",desc:"Oil revenue traced through 3 intermediary entities to Nexus accounts. Estimated $80M annually diverted.", confidence:69, x:0, y:0 },
  { id:"c19", kind:"claim", label:"Larsson investigation compromised", sub:"Disputed",        desc:"Internal Europol memo describes 'possible leak at senior level'. Larsson removed from case in 2022.", confidence:61, x:0, y:0 },
  { id:"c20", kind:"claim", label:"Atlas provides academic cover",     sub:"Medium Confidence",desc:"12 Atlas researchers hold active security clearances. 4 have direct access to classified programmes they also publish about.", confidence:73, x:0, y:0 },
  { id:"c21", kind:"claim", label:"Sharma report suppressed 6 months", sub:"High Confidence", desc:"UN administrative records confirm report completed August 2021. Published February 2022. Suppression authorized by Security Council.", confidence:87, x:0, y:0 },
  { id:"c22", kind:"claim", label:"Nasseri coordinated sanctions evasion",sub:"Medium Confidence",desc:"Financial Intelligence Unit report links Nasseri to Arcturus bank accounts. Diplomatic immunity invoked.", confidence:70, x:0, y:0 },
  { id:"c23", kind:"claim", label:"Pemberton authorized surveillance", sub:"Disputed",        desc:"GCHQ authorisation signed by Pemberton. Legality under review. 3 oversight bodies have opened inquiries.", confidence:65, x:0, y:0 },
  { id:"c24", kind:"claim", label:"Kessler created bearer bond structures",sub:"High Confidence",desc:"Bank records show 23 bearer bond issuances. Total face value: $340M. All transferred to unnamed beneficial owners.", confidence:86, x:0, y:0 },
  { id:"c25", kind:"claim", label:"Prometheus serves non-state actors", sub:"Medium Confidence",desc:"SIGINT analysis shows Prometheus collection shared with 4 entities not on authorised list. 2 confirmed non-state.", confidence:74, x:0, y:0 },
  { id:"c26", kind:"claim", label:"Vanta infiltrated 3 NATO countries", sub:"High Confidence", desc:"Counter-intelligence assessments from 3 NATO member states confirm Vanta personnel in senior advisory positions.", confidence:81, x:0, y:0 },
  { id:"c27", kind:"claim", label:"Halverson–Volkov met covertly 12×", sub:"High Confidence", desc:"Travel records cross-referenced with Volkov's known itinerary. 12 confirmed colocations in 7 countries. No official record.", confidence:88, x:0, y:0 },
  { id:"c28", kind:"claim", label:"Arcturus linked to 4 agencies",     sub:"Disputed",        desc:"Former Arcturus board member claims founding represented CIA, MI6, BND, and Mossad interests. Denied by all 4 agencies.", confidence:55, x:0, y:0 },
  { id:"c29", kind:"claim", label:"Cobalt tech transferred to Iran",   sub:"Disputed",        desc:"Technology signatures identified in Iranian defence systems. Cobalt denies. US government assessment: 'plausible'.", confidence:63, x:0, y:0 },
  { id:"c30", kind:"claim", label:"Network uses encrypted comms only", sub:"High Confidence", desc:"No unencrypted communication between principals recovered. All use Signal, Wire, or custom encrypted protocols.", confidence:92, x:0, y:0 },
];

const EVIDENCE: WNode[] = [
  { id:"v1",  kind:"evidence", label:"Leaked NSA Memorandum",           sub:"Document · 2019-12-01",  desc:"Internal NSA memo describing surveillance authorisation targeting 4 Cobalt Network principals. Classification: TS/SCI.", confidence:94, tags:["NSA","SIGINT","TS/SCI"], x:0, y:0 },
  { id:"v2",  kind:"evidence", label:"Swiss Bank Transaction Logs",     sub:"Financial · 2020-02-15", desc:"1,847 transaction records obtained by FATF. Cross-referenced to Silvergate correspondent network.", confidence:91, tags:["Financial","FATF"], x:0, y:0 },
  { id:"v3",  kind:"evidence", label:"Encrypted Cable Intercepts",      sub:"SIGINT · 2020",          desc:"Signal intercepts obtained under cooperative SIGINT agreement. Partial decryption achieved. 12% readable.", confidence:73, tags:["SIGINT","Encrypted"], x:0, y:0 },
  { id:"v4",  kind:"evidence", label:"Geneva Satellite Imagery",        sub:"Imagery · 2019-09-12",   desc:"Commercial satellite imagery of Hotel Beau-Rivage. 6 principals identified through facial recognition.", confidence:85, tags:["IMINT","Geneva"], x:0, y:0 },
  { id:"v5",  kind:"evidence", label:"Meridian Financial Audit",        sub:"Financial · 2021",       desc:"Forensic audit commissioned by FATF. Identifies $1.8B in unexplained transactions over 3 years.", confidence:89, tags:["Audit","Financial"], x:0, y:0 },
  { id:"v6",  kind:"evidence", label:"Vasquez Audio Recordings",        sub:"Audio · 2020",           desc:"21 hours of recordings. 6 principal voices identified. Source identity protected. Authentication verified.", confidence:87, tags:["Audio","Source"], x:0, y:0 },
  { id:"v7",  kind:"evidence", label:"Senate Testimony Transcripts",    sub:"Legal · 2021-10-05",     desc:"Full transcripts of public testimony. Sealed portions summarised in classified annex.", confidence:98, tags:["Legal","Senate"], x:0, y:0 },
  { id:"v8",  kind:"evidence", label:"Vienna Airport CCTV",             sub:"Imagery · 2020-09-18",   desc:"Airport security footage confirms Khalil under 3 aliases at Vienna airport. Timing matches arms deal claim.", confidence:82, tags:["CCTV","Vienna"], x:0, y:0 },
  { id:"v9",  kind:"evidence", label:"Shell Company Registrations",     sub:"Legal · Various",        desc:"Corporate registry documents from 9 jurisdictions. 47 entities with circular ownership traced to Volkov nominees.", confidence:90, tags:["Corporate","Legal"], x:0, y:0 },
  { id:"v10", kind:"evidence", label:"Interpol Red Notices",            sub:"Legal · 2022-07-30",     desc:"19 Red Notices issued. Includes biometrics, aliases, and known associates.", confidence:99, tags:["Interpol","Legal"], x:0, y:0 },
  { id:"v11", kind:"evidence", label:"UN Security Council Annexes",     sub:"Classified · 2021",      desc:"Classified annexes to UN Security Briefing. Distribution restricted. Summary leaked to press.", confidence:80, tags:["UN","Classified"], x:0, y:0 },
  { id:"v12", kind:"evidence", label:"SIGINT Reports 2019–2022",        sub:"SIGINT · Ongoing",       desc:"Series of 14 SIGINT assessment reports. Covers comms intercepts from all network principals.", confidence:77, tags:["SIGINT","Assessment"], x:0, y:0 },
  { id:"v13", kind:"evidence", label:"Chen Whistleblower Declaration",  sub:"Legal · 2020-07-03",     desc:"847-page declaration with classified annexes. Filed with OIG and copies lodged with 3 congressional oversight committees.", confidence:96, tags:["Whistleblower","Legal"], x:0, y:0 },
  { id:"v14", kind:"evidence", label:"Forensic Accounting Report",      sub:"Financial · 2022",       desc:"Big-4 forensic accounting firm report. Maps $2.1B in suspicious transaction flows across 14 jurisdictions.", confidence:92, tags:["Forensic","Finance"], x:0, y:0 },
  { id:"v15", kind:"evidence", label:"Email Metadata Analysis",         sub:"Digital · 2021",         desc:"Graph analysis of encrypted email metadata from 6 principals. 23,000 communications over 24 months.", confidence:84, tags:["Digital","Metadata"], x:0, y:0 },
  { id:"v16", kind:"evidence", label:"Offshore Account Statements",     sub:"Financial · 2020–2021",  desc:"Account statements from 23 offshore entities. Subpoenaed from correspondent banks.", confidence:88, tags:["Offshore","Finance"], x:0, y:0 },
  { id:"v17", kind:"evidence", label:"Halverson Travel Records",        sub:"Administrative · 2020",  desc:"Passport and hotel records for 2020. Cross-referenced with Volkov's known itinerary. 12 confirmed colocations.", confidence:91, tags:["Travel","Admin"], x:0, y:0 },
  { id:"v18", kind:"evidence", label:"Crypto Trace Analysis",           sub:"Digital · 2021–2022",    desc:"Blockchain forensics tracing $34M in cryptocurrency. Mixing services identified. Final destination: Silvergate-linked wallets.", confidence:79, tags:["Crypto","Blockchain"], x:0, y:0 },
  { id:"v19", kind:"evidence", label:"Source Intelligence Assessment",  sub:"Intelligence · 2022",    desc:"Joint 5-Eyes intelligence assessment of network. Source reliability graded. Overall confidence: HIGH.", confidence:86, tags:["Intelligence","5-Eyes"], x:0, y:0 },
  { id:"v20", kind:"evidence", label:"Corporate Ownership Maps",        sub:"Legal · 2022",           desc:"Visual ownership maps of 31 entities. Produced by joint investigative consortium. Published as part of exposé.", confidence:93, tags:["Corporate","Legal"], x:0, y:0 },
];

// Assign positions
function assignPositions(nodes: WNode[]): WNode[] {
  return nodes.map((n, i) => ({ ...n }));
}

// Layout: cluster by kind
function layoutNodes(all: WNode[]): WNode[] {
  const layout = [...all];
  // People: 5×3 grid, top-left
  layout.filter(n => n.kind === "person").forEach((n, i) => {
    n.x = 60  + (i % 5) * 220;
    n.y = 60  + Math.floor(i / 5) * 140;
  });
  // Orgs: 5×2 grid, top-right
  layout.filter(n => n.kind === "org").forEach((n, i) => {
    n.x = 1300 + (i % 3) * 220;
    n.y = 60   + Math.floor(i / 3) * 140;
  });
  // Events: horizontal spine, center
  layout.filter(n => n.kind === "event").forEach((n, i) => {
    n.x = 60 + i * 200;
    n.y = 520 + (i % 3 === 0 ? 0 : i % 3 === 1 ? -50 : 50);
  });
  // Claims: 6×5 grid, lower-left
  layout.filter(n => n.kind === "claim").forEach((n, i) => {
    n.x = 60  + (i % 6) * 210;
    n.y = 720 + Math.floor(i / 6) * 130;
  });
  // Evidence: 5×4 grid, lower-right
  layout.filter(n => n.kind === "evidence").forEach((n, i) => {
    n.x = 1300 + (i % 3) * 220;
    n.y = 460  + Math.floor(i / 3) * 130;
  });
  return layout;
}

const ALL_NODES_RAW = layoutNodes([...PEOPLE, ...ORGS, ...EVENTS, ...CLAIMS, ...EVIDENCE]);
const NODE_MAP: Record<string, WNode> = Object.fromEntries(
  ALL_NODES_RAW.map(n => [n.id, n] as [string, WNode])
);

// Edges: structured connections
const RAW_EDGES: WEdge[] = [
  // People → Events
  { source:"p1",  target:"e5",  label:"resigned from" },
  { source:"p1",  target:"e14", label:"testified (5th)" },
  { source:"p1",  target:"e3",  label:"attended" },
  { source:"p2",  target:"e6",  label:"published" },
  { source:"p2",  target:"e17", label:"contributed to" },
  { source:"p3",  target:"e1",  label:"attended" },
  { source:"p3",  target:"e3",  label:"met at" },
  { source:"p4",  target:"e7",  label:"filed" },
  { source:"p4",  target:"e14", label:"testified" },
  { source:"p5",  target:"e8",  label:"brokered" },
  { source:"p6",  target:"e19", label:"subject of" },
  { source:"p7",  target:"e4",  label:"linked to breach" },
  { source:"p8",  target:"e10", label:"arrested" },
  { source:"p9",  target:"e13", label:"victim of" },
  { source:"p10", target:"e12", label:"benefited from" },
  { source:"p11", target:"e16", label:"authored" },
  { source:"p12", target:"e15", label:"led" },
  { source:"p13", target:"e16", label:"co-authored" },
  { source:"p14", target:"e2",  label:"signed" },
  { source:"p15", target:"e11", label:"attended" },
  // People → Orgs
  { source:"p1",  target:"o1",  label:"linked to" },
  { source:"p3",  target:"o1",  label:"controls" },
  { source:"p3",  target:"o6",  label:"controls" },
  { source:"p8",  target:"o6",  label:"banker for" },
  { source:"p14", target:"o2",  label:"CEO of" },
  { source:"p5",  target:"o5",  label:"works with" },
  { source:"p10", target:"o5",  label:"channels through" },
  { source:"p15", target:"o4",  label:"uses" },
  { source:"p9",  target:"o3",  label:"former client of" },
  { source:"p12", target:"o10", label:"investigates" },
  // Orgs → Orgs
  { source:"o1",  target:"o4",  label:"funds" },
  { source:"o1",  target:"o6",  label:"banks with" },
  { source:"o2",  target:"o7",  label:"contracts" },
  { source:"o3",  target:"o10", label:"sister org" },
  { source:"o5",  target:"o6",  label:"transacts via" },
  // Orgs → Events
  { source:"o1",  target:"e1",  label:"hosted" },
  { source:"o2",  target:"e2",  label:"party to" },
  { source:"o4",  target:"e9",  label:"established in" },
  { source:"o6",  target:"e10", label:"accounts frozen" },
  { source:"o8",  target:"e4",  label:"breached" },
  // People → Claims
  { source:"p1",  target:"c2",  label:"subject of" },
  { source:"p1",  target:"c27", label:"subject of" },
  { source:"p3",  target:"c6",  label:"subject of" },
  { source:"p3",  target:"c17", label:"subject of" },
  { source:"p4",  target:"c4",  label:"victim of" },
  { source:"p6",  target:"c23", label:"authorized" },
  { source:"p8",  target:"c24", label:"created" },
  { source:"p9",  target:"c14", label:"victim of" },
  { source:"p12", target:"c19", label:"subject of" },
  { source:"p13", target:"c21", label:"victim of" },
  // Orgs → Claims
  { source:"o1",  target:"c1",  label:"subject of" },
  { source:"o2",  target:"c3",  label:"subject of" },
  { source:"o4",  target:"c7",  label:"subject of" },
  { source:"o5",  target:"c12", label:"subject of" },
  { source:"o6",  target:"c8",  label:"processed" },
  { source:"o10", target:"c26", label:"subject of" },
  // Events → Claims
  { source:"e3",  target:"c5",  label:"basis of" },
  { source:"e4",  target:"c11", label:"supports" },
  { source:"e6",  target:"c13", label:"published" },
  { source:"e7",  target:"c4",  label:"proves" },
  // Claims → Evidence
  { source:"c1",  target:"v5",  label:"supported by" },
  { source:"c2",  target:"v2",  label:"supported by" },
  { source:"c2",  target:"v16", label:"supported by" },
  { source:"c4",  target:"v1",  label:"supported by" },
  { source:"c4",  target:"v13", label:"supported by" },
  { source:"c5",  target:"v4",  label:"supported by" },
  { source:"c6",  target:"v9",  label:"supported by" },
  { source:"c6",  target:"v20", label:"supported by" },
  { source:"c8",  target:"v2",  label:"proven by" },
  { source:"c9",  target:"v8",  label:"corroborated by" },
  { source:"c11", target:"v3",  label:"supported by" },
  { source:"c12", target:"v7",  label:"documented in" },
  { source:"c13", target:"v6",  label:"corroborated by" },
  { source:"c14", target:"v12", label:"supported by" },
  { source:"c15", target:"v15", label:"evidenced by" },
  { source:"c16", target:"v19", label:"confirmed by" },
  { source:"c17", target:"v17", label:"proven by" },
  { source:"c21", target:"v11", label:"documented in" },
  { source:"c24", target:"v2",  label:"supported by" },
  { source:"c27", target:"v17", label:"proven by" },
  { source:"c30", target:"v15", label:"evidenced by" },
  // People → Evidence
  { source:"p2",  target:"v6",  label:"recorded" },
  { source:"p4",  target:"v13", label:"authored" },
];

// Build ReactFlow nodes & edges
function buildRFNodes(wnodes: WNode[]): Node[] {
  return wnodes.map(n => ({
    id: n.id,
    type: "wnode",
    position: { x: n.x, y: n.y },
    data: { wnode: n, isHighlighted: false, isFaded: false },
    draggable: true,
  }));
}

function buildRFEdges(edges: WEdge[]): Edge[] {
  return edges.map((e, i) => ({
    id: `edge-${i}`,
    source: e.source,
    target: e.target,
    label: e.label,
    type: "default",
    animated: false,
    style: { stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 },
    labelStyle: { fill: "rgba(255,255,255,0.3)", fontSize: 9 },
    labelBgStyle: { fill: "#0F0F18", fillOpacity: 0.8 },
  }));
}

const INITIAL_NODES = buildRFNodes(ALL_NODES_RAW);
const INITIAL_EDGES = buildRFEdges(RAW_EDGES);

// ─── Node type colours ────────────────────────────────────────────────────────
const KIND_META: Record<NodeKind, { icon: React.ReactElement; palette: string[]; label: string }> = {
  person:   { icon: <User size={10}      />, palette: C.person,   label: "Person" },
  event:    { icon: <Zap size={10}       />, palette: C.event,    label: "Event" },
  claim:    { icon: <MessageSquare size={10}/>, palette: C.claim, label: "Claim" },
  evidence: { icon: <FileText size={10}  />, palette: C.evidence, label: "Evidence" },
  org:      { icon: <Building2 size={10} />, palette: C.org,      label: "Org" },
};

// ─── Custom node component ────────────────────────────────────────────────────
const WNodeComponent = memo(({ data, selected }: NodeProps) => {
  const wn = data.wnode as WNode;
  const isHighlighted = data.isHighlighted as boolean;
  const isFaded = data.isFaded as boolean;
  const meta = KIND_META[wn.kind];
  const [bg, border, accent] = meta.palette;

  const opacity = isFaded ? 0.18 : 1;
  const scale = isHighlighted || selected ? 1.06 : 1;
  const borderColor = selected ? accent : isHighlighted ? accent + "88" : border;
  const glowColor = accent + "33";

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      transition: "opacity 0.22s ease, transform 0.18s ease, box-shadow 0.22s ease",
      background: bg,
      border: `1px solid ${borderColor}`,
      borderRadius: 6,
      minWidth: 150,
      maxWidth: 180,
      padding: "7px 10px",
      boxShadow: (selected || isHighlighted) ? `0 0 18px ${glowColor}, 0 2px 8px rgba(0,0,0,0.6)` : "0 2px 6px rgba(0,0,0,0.5)",
      cursor: "pointer",
      position: "relative",
    }}>
      <Handle type="target" position={Position.Left}  style={{ background: accent, width: 5, height: 5, border: "none" }} />
      <Handle type="source" position={Position.Right} style={{ background: accent, width: 5, height: 5, border: "none" }} />
      {/* Type badge */}
      <div style={{ display:"flex", alignItems:"center", gap:4, marginBottom:4 }}>
        <div style={{ color: accent, lineHeight: 1 }}>{meta.icon}</div>
        <span style={{ color: accent, fontSize: 9, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", opacity:0.8 }}>
          {meta.label}
        </span>
        {wn.confidence !== undefined && (
          <span style={{ marginLeft:"auto", color: C.textDim, fontSize: 9, fontFamily:"'JetBrains Mono',monospace" }}>
            {wn.confidence}%
          </span>
        )}
      </div>
      {/* Label */}
      <div style={{ color: C.text, fontSize: 11, fontWeight: 600, lineHeight: 1.3, fontFamily:"'Space Grotesk',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
        {wn.label}
      </div>
      {/* Sub */}
      <div style={{ color: C.textDim, fontSize: 9.5, marginTop:2, fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
        {wn.sub}
      </div>
      {/* Selection indicator */}
      {selected && <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${accent}, transparent)`, borderRadius:"6px 6px 0 0" }} />}
    </div>
  );
});
WNodeComponent.displayName = "WNodeComponent";

const nodeTypes = { wnode: WNodeComponent };

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { id:"overview",   icon: <LayoutGrid size={15}/>,    label:"Overview" },
  { id:"graph",      icon: <GitBranch size={15}/>,     label:"Graph" },
  { id:"timeline",   icon: <Clock size={15}/>,         label:"Timeline" },
  { id:"people",     icon: <Users size={15}/>,         label:"People" },
  { id:"claims",     icon: <MessageSquare size={15}/>, label:"Claims" },
  { id:"evidence",   icon: <FileText size={15}/>,      label:"Evidence" },
  { id:"sources",    icon: <Link2 size={15}/>,         label:"Sources" },
  { id:"orgs",       icon: <Building2 size={15}/>,     label:"Organizations" },
  { id:"locations",  icon: <Map size={15}/>,           label:"Locations" },
  { id:"files",      icon: <FileText size={15}/>,      label:"Files" },
  { id:"images",     icon: <Image size={15}/>,         label:"Images" },
  { id:"ai",         icon: <Cpu size={15}/>,           label:"AI" },
  { id:"settings",   icon: <Settings size={15}/>,      label:"Settings" },
];

// ─── Confidence bar ───────────────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 80 ? "#4FC87A" : value >= 60 ? "#E8923A" : "#E85A5A";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1, height:3, background:"rgba(255,255,255,0.06)", borderRadius:2 }}>
        <div style={{ width:`${value}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.4s ease" }} />
      </div>
      <span style={{ color, fontSize:11, fontFamily:"'JetBrains Mono',monospace", minWidth:32 }}>{value}%</span>
    </div>
  );
}

// ─── Right context panel ──────────────────────────────────────────────────────
function RightPanel({ node, onClose }: { node: WNode | null; onClose: () => void }) {
  const meta = node ? KIND_META[node.kind] : null;
  const palette = node ? meta!.palette : C.person;
  const accent = palette[2];

  // Find connected nodes
  const connected = useMemo(() => {
    if (!node) return [];
    return RAW_EDGES
      .filter(e => e.source === node.id || e.target === node.id)
      .map(e => {
        const otherId = e.source === node.id ? e.target : e.source;
        const other = NODE_MAP[otherId];
        const rel = e.source === node.id ? e.label : `← ${e.label}`;
        return other ? { node: other, rel } : null;
      })
      .filter(Boolean) as { node: WNode; rel: string | undefined }[];
  }, [node]);

  return (
    <div style={{
      width: 300,
      minWidth: 300,
      borderLeft: `1px solid ${C.border}`,
      background: C.surface,
      display:"flex",
      flexDirection:"column",
      overflow:"hidden",
      transition:"width 0.25s ease",
      position:"relative",
    }}>
      {/* Header */}
      <div style={{ padding:"12px 14px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ color:C.textDim, fontSize:11, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 }}>
          {node ? `${meta!.label} Detail` : "Context"}
        </span>
        {node && (
          <button onClick={onClose} style={{ color:C.textDim, background:"none", border:"none", cursor:"pointer", padding:2, display:"flex", alignItems:"center" }}>
            <X size={13}/>
          </button>
        )}
      </div>

      {!node ? (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:24, gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:"50%", border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Circle size={16} color={C.textMuted}/>
          </div>
          <p style={{ color:C.textDim, fontSize:12, textAlign:"center", fontFamily:"'Inter',sans-serif", lineHeight:1.6 }}>
            Hover or click a node to inspect it
          </p>
        </div>
      ) : (
        <div style={{ flex:1, overflowY:"auto", padding:"16px 14px", display:"flex", flexDirection:"column", gap:18 }}>
          {/* Title block */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
              <div style={{ color:accent }}>{meta!.icon}</div>
              <span style={{ color:accent, fontSize:9.5, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.07em" }}>{meta!.label}</span>
            </div>
            <h2 style={{ color:C.text, fontSize:15, fontWeight:600, fontFamily:"'Space Grotesk',sans-serif", lineHeight:1.3, margin:0 }}>
              {node.label}
            </h2>
            <p style={{ color:C.textDim, fontSize:11, margin:"4px 0 0", fontFamily:"'Inter',sans-serif" }}>{node.sub}</p>
          </div>

          {/* Confidence */}
          {node.confidence !== undefined && (
            <div>
              <div style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Confidence</div>
              <ConfidenceBar value={node.confidence} />
            </div>
          )}

          {/* Description */}
          <div>
            <div style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Description</div>
            <p style={{ color:C.text, fontSize:12, fontFamily:"'Inter',sans-serif", lineHeight:1.7, margin:0 }}>{node.desc}</p>
          </div>

          {/* Tags */}
          {node.tags && node.tags.length > 0 && (
            <div>
              <div style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Tags</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {node.tags.map(t => (
                  <span key={t} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 7px", color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          {node.date && (
            <div>
              <div style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 }}>Date</div>
              <div style={{ color:C.text, fontSize:12, fontFamily:"'JetBrains Mono',monospace" }}>{node.date}</div>
            </div>
          )}

          {/* Related nodes */}
          {connected.length > 0 && (
            <div>
              <div style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>
                Connections ({connected.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                {connected.slice(0,8).map(({ node:cn, rel }) => {
                  const cm = KIND_META[cn.kind];
                  return (
                    <div key={cn.id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 8px", background:"rgba(255,255,255,0.02)", border:`1px solid ${C.border}`, borderRadius:5 }}>
                      <div style={{ color:cm.palette[2], flexShrink:0 }}>{cm.icon}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:C.text, fontSize:11, fontWeight:500, fontFamily:"'Inter',sans-serif", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{cn.label}</div>
                        {rel && <div style={{ color:C.textDim, fontSize:9.5, fontFamily:"'Inter',sans-serif" }}>{rel}</div>}
                      </div>
                    </div>
                  );
                })}
                {connected.length > 8 && (
                  <div style={{ color:C.textDim, fontSize:10, fontFamily:"'Inter',sans-serif", textAlign:"center", paddingTop:4 }}>
                    +{connected.length - 8} more connections
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginTop:4 }}>
            <button style={{ padding:"8px 12px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, borderRadius:5, color:C.text, fontSize:11, fontFamily:"'Inter',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"background 0.15s" }}>
              <ExternalLink size={11}/>View Full Detail
            </button>
            <button style={{ padding:"8px 12px", background:"rgba(255,255,255,0.04)", border:`1px solid ${C.border}`, borderRadius:5, color:C.text, fontSize:11, fontFamily:"'Inter',sans-serif", cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
              <GitBranch size={11}/>Focus Subgraph
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bottom timeline ──────────────────────────────────────────────────────────
function BottomTimeline({ selectedEventId, onSelect }: { selectedEventId: string | null; onSelect: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedEventId && scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-id="${selectedEventId}"]`) as HTMLElement;
      el?.scrollIntoView({ behavior:"smooth", inline:"center", block:"nearest" });
    }
  }, [selectedEventId]);

  return (
    <div style={{ borderTop:`1px solid ${C.border}`, background:C.surface, height:110, display:"flex", flexDirection:"column", overflow:"hidden" }}>
      {/* Timeline header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 16px", borderBottom:`1px solid ${C.border}` }}>
        <Clock size={12} color={C.textDim}/>
        <span style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace", textTransform:"uppercase", letterSpacing:"0.07em" }}>Timeline · Operation Cobalt Network</span>
        <span style={{ marginLeft:"auto", color:C.textMuted, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>2019 – 2022</span>
      </div>
      {/* Scrollable events */}
      <div ref={scrollRef} style={{ flex:1, display:"flex", alignItems:"center", gap:0, overflowX:"auto", padding:"0 16px", scrollbarWidth:"none" }}>
        {/* Year markers */}
        {EVENTS.map((ev, i) => {
          const isSelected = selectedEventId === ev.id;
          const year = ev.date?.slice(0,4) ?? "";
          const prevYear = i > 0 ? EVENTS[i-1].date?.slice(0,4) : null;
          const showYear = year !== prevYear;
          return (
            <div key={ev.id} data-id={ev.id} style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, marginRight:2 }}>
              {/* Year label */}
              <div style={{ height:14, display:"flex", alignItems:"center" }}>
                {showYear && <span style={{ color:C.textMuted, fontSize:9, fontFamily:"'JetBrains Mono',monospace", whiteSpace:"nowrap", paddingRight:4 }}>{year}</span>}
              </div>
              {/* Connector line + dot */}
              <div style={{ display:"flex", alignItems:"center", width:"100%", position:"relative" }}>
                <div style={{ flex:1, height:1, background:C.border }}/>
                <button
                  onClick={() => onSelect(ev.id)}
                  style={{
                    width:8, height:8, borderRadius:"50%", flexShrink:0,
                    background: isSelected ? C.accent : C.textMuted,
                    border: isSelected ? `2px solid ${C.accent}` : `1px solid ${C.borderHi}`,
                    cursor:"pointer",
                    transition:"background 0.2s, transform 0.15s",
                    transform: isSelected ? "scale(1.5)" : "scale(1)",
                    outline:"none",
                    boxShadow: isSelected ? `0 0 8px ${C.accent}88` : "none",
                  }}
                />
                <div style={{ flex:1, height:1, background:C.border }}/>
              </div>
              {/* Event label */}
              <button
                onClick={() => onSelect(ev.id)}
                style={{
                  maxWidth:120, padding:"4px 6px", background:"transparent",
                  border: isSelected ? `1px solid ${C.accent}44` : "1px solid transparent",
                  borderRadius:4, cursor:"pointer",
                  textAlign:"center", transition:"all 0.2s",
                }}
              >
                <div style={{ color: isSelected ? C.text : C.textDim, fontSize:9.5, fontFamily:"'Inter',sans-serif", lineHeight:1.3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:110 }}>
                  {ev.label}
                </div>
                {ev.date && (
                  <div style={{ color: isSelected ? C.accent : C.textMuted, fontSize:8.5, fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>
                    {ev.date.slice(5)}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Graph canvas (inner) ─────────────────────────────────────────────────────
function GraphCanvas({
  onNodeHover,
  onNodeSelect,
  selectedNodeId,
  focusNodeId,
}: {
  onNodeHover: (id: string | null) => void;
  onNodeSelect: (id: string | null) => void;
  selectedNodeId: string | null;
  focusNodeId: string | null;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const { fitView, setCenter } = useReactFlow();
  const hoveredIdRef = useRef<string | null>(null);

  // Compute neighbor sets
  const getNeighbors = useCallback((id: string) => {
    const set = new Set<string>([id]);
    edges.forEach(e => {
      if (e.source === id) set.add(e.target);
      if (e.target === id) set.add(e.source);
    });
    return set;
  }, [edges]);

  // Apply highlight state to nodes and edges
  const applyHighlight = useCallback((activeId: string | null) => {
    if (!activeId) {
      setNodes(ns => ns.map(n => ({ ...n, data: { ...n.data, isHighlighted:false, isFaded:false } })));
      setEdges(es => es.map(e => ({ ...e, animated:false, style:{ stroke:"rgba(255,255,255,0.08)", strokeWidth:1 } })));
      return;
    }
    const neighbors = getNeighbors(activeId);
    setNodes(ns => ns.map(n => ({
      ...n,
      data: {
        ...n.data,
        isHighlighted: neighbors.has(n.id),
        isFaded: !neighbors.has(n.id),
      },
    })));
    setEdges(es => es.map(e => {
      const active = e.source === activeId || e.target === activeId;
      return {
        ...e,
        animated: active,
        style: {
          stroke: active ? C.accent : "rgba(255,255,255,0.04)",
          strokeWidth: active ? 2 : 1,
        },
      };
    }));
  }, [getNeighbors, setNodes, setEdges]);

  // Focus a node by panning to it
  useEffect(() => {
    if (!focusNodeId) return;
    const wn = NODE_MAP[focusNodeId];
    if (wn) {
      setCenter(wn.x + 90, wn.y + 40, { zoom:1.4, duration:600 });
      applyHighlight(focusNodeId);
    }
  }, [focusNodeId, setCenter, applyHighlight]);

  const handleNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    hoveredIdRef.current = node.id;
    onNodeHover(node.id);
    applyHighlight(node.id);
  }, [onNodeHover, applyHighlight]);

  const handleNodeMouseLeave = useCallback(() => {
    hoveredIdRef.current = null;
    onNodeHover(null);
    // Restore selection highlight if a node is selected
    if (selectedNodeId) {
      applyHighlight(selectedNodeId);
    } else {
      applyHighlight(null);
    }
  }, [onNodeHover, selectedNodeId, applyHighlight]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    onNodeSelect(node.id);
    applyHighlight(node.id);
  }, [onNodeSelect, applyHighlight]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
    applyHighlight(null);
  }, [onNodeSelect, applyHighlight]);

  useEffect(() => {
    fitView({ padding:0.08, duration:600 });
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeMouseEnter={handleNodeMouseEnter}
      onNodeMouseLeave={handleNodeMouseLeave}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      minZoom={0.05}
      maxZoom={3}
      fitView
      proOptions={{ hideAttribution: true }}
      style={{ background: C.bg }}
    >
      <Background color={C.textMuted} gap={28} size={0.5} style={{ opacity:0.35 }} />
      <Controls style={{
        background: C.surfaceEl,
        border:`1px solid ${C.border}`,
        borderRadius:6,
      }}/>
      <MiniMap
        style={{ background: C.surface, border:`1px solid ${C.border}`, borderRadius:6 }}
        nodeColor={(n) => {
          const wn = (n.data as { wnode: WNode }).wnode;
          return KIND_META[wn.kind].palette[1];
        }}
        maskColor="rgba(8,8,13,0.75)"
      />
    </ReactFlow>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────
export default function WorkspaceV2() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("graph");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const activeNodeId = hoveredNodeId || selectedNodeId;
  const activeNode = activeNodeId ? (NODE_MAP[activeNodeId] ?? null) : null;

  const handleTimelineSelect = useCallback((id: string) => {
    setSelectedNodeId(id);
    setFocusNodeId(id);
    // Reset after a tick so re-clicking same node still triggers focus
    setTimeout(() => setFocusNodeId(null), 50);
  }, []);

  const handleNodeHover = useCallback((id: string | null) => {
    setHoveredNodeId(id);
  }, []);

  const handleNodeSelect = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  }, []);

  // Node counts by kind
  const counts = useMemo(() => ({
    person: PEOPLE.length,
    event: EVENTS.length,
    claim: CLAIMS.length,
    evidence: EVIDENCE.length,
    org: ORGS.length,
  }), []);

  const sidebarW = sidebarOpen ? 220 : 44;

  return (
    <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden", fontFamily:"'Inter',sans-serif" }}>

      {/* ── Top Navigation ─────────────────────────────────────────────────── */}
      <div style={{ height:46, borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", paddingInline:14, gap:16, flexShrink:0, background:C.surface, zIndex:10 }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <div style={{ width:22, height:22, borderRadius:5, background:`linear-gradient(135deg, ${C.accent}, #4039AA)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>R</span>
          </div>
          <span style={{ color:C.text, fontSize:13, fontWeight:600, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:"-0.01em" }}>
            Rabbit<span style={{ color:C.accent }}>Hole</span>
          </span>
          <span style={{ color:C.textMuted, fontSize:11 }}>·</span>
          <span style={{ color:C.textDim, fontSize:12, fontFamily:"'Space Grotesk',sans-serif" }}>Workspace <span style={{ color:C.textMuted }}>v2</span></span>
        </div>

        {/* Board title */}
        <div style={{ height:"60%", width:1, background:C.border }}/>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Shield size={12} color={C.accent}/>
          <span style={{ color:C.text, fontSize:12, fontFamily:"'Space Grotesk',sans-serif", fontWeight:500 }}>Operation Cobalt Network</span>
          <ChevronDown size={12} color={C.textDim}/>
        </div>

        {/* Global search */}
        <div style={{ flex:1, maxWidth:340, position:"relative", marginInline:"auto" }}>
          <Search size={12} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.textDim }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search nodes, claims, people…"
            style={{
              width:"100%", padding:"5px 10px 5px 30px", background:"rgba(255,255,255,0.03)",
              border:`1px solid ${C.border}`, borderRadius:5, color:C.text, fontSize:12,
              fontFamily:"'Inter',sans-serif", outline:"none",
            }}
          />
          <div style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", display:"flex", gap:2 }}>
            <kbd style={{ color:C.textMuted, fontSize:9, fontFamily:"'JetBrains Mono',monospace", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, borderRadius:3, padding:"1px 4px" }}>⌘</kbd>
            <kbd style={{ color:C.textMuted, fontSize:9, fontFamily:"'JetBrains Mono',monospace", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, borderRadius:3, padding:"1px 4px" }}>K</kbd>
          </div>
        </div>

        {/* Stats chips */}
        <div style={{ display:"flex", gap:6, flexShrink:0 }}>
          {(Object.entries(counts) as [NodeKind, number][]).map(([kind, count]) => (
            <div key={kind} style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 8px", background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, borderRadius:4 }}>
              <span style={{ color:KIND_META[kind].palette[2] }}>{KIND_META[kind].icon}</span>
              <span style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>{count}</span>
            </div>
          ))}
        </div>

        {/* View selector */}
        <div style={{ height:"60%", width:1, background:C.border }}/>
        <div style={{ display:"flex", gap:2, flexShrink:0 }}>
          {["Graph","Timeline","Matrix"].map(v => (
            <button key={v} style={{ padding:"4px 10px", background: v==="Graph" ? C.accentDim : "transparent", border: v==="Graph" ? `1px solid ${C.accent}44` : "1px solid transparent", borderRadius:4, color: v==="Graph" ? C.accent : C.textDim, fontSize:11, fontFamily:"'Inter',sans-serif", cursor:"pointer" }}>
              {v}
            </button>
          ))}
        </div>

        {/* User */}
        <div style={{ height:"60%", width:1, background:C.border }}/>
        <div style={{ width:26, height:26, borderRadius:"50%", background:`linear-gradient(135deg, #3A4A6B, #1E2E4A)`, border:`1px solid ${C.borderHi}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
          <User size={12} color={C.textDim}/>
        </div>
      </div>

      {/* ── Main area ──────────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>

        {/* Left Sidebar */}
        <div style={{ width:sidebarW, minWidth:sidebarW, borderRight:`1px solid ${C.border}`, background:C.surface, display:"flex", flexDirection:"column", transition:"width 0.22s ease, min-width 0.22s ease", overflow:"hidden", flexShrink:0, zIndex:5 }}>
          {/* Toggle */}
          <div style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent: sidebarOpen ? "flex-end" : "center" }}>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${C.border}`, borderRadius:4, padding:"4px 6px", color:C.textDim, cursor:"pointer", display:"flex", alignItems:"center" }}
            >
              {sidebarOpen ? <ChevronLeft size={13}/> : <ChevronRight size={13}/>}
            </button>
          </div>
          {/* Nav items */}
          <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"6px 0", scrollbarWidth:"none" }}>
            {SIDEBAR_ITEMS.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  title={!sidebarOpen ? item.label : undefined}
                  style={{
                    width:"100%", display:"flex", alignItems:"center", gap:10,
                    padding: sidebarOpen ? "8px 14px" : "8px 0", justifyContent: sidebarOpen ? "flex-start" : "center",
                    background: isActive ? C.accentDim : "transparent",
                    border:"none", borderLeft: isActive ? `2px solid ${C.accent}` : "2px solid transparent",
                    cursor:"pointer", color: isActive ? C.accent : C.textDim,
                    fontSize:12, fontFamily:"'Inter',sans-serif", fontWeight: isActive ? 500 : 400,
                    transition:"background 0.15s, color 0.15s", whiteSpace:"nowrap",
                  }}
                >
                  <div style={{ flexShrink:0, marginLeft: sidebarOpen ? 0 : 2 }}>{item.icon}</div>
                  {sidebarOpen && item.label}
                </button>
              );
            })}
          </div>

          {/* Sidebar footer stats */}
          {sidebarOpen && (
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${C.border}` }}>
              <div style={{ color:C.textMuted, fontSize:9.5, fontFamily:"'JetBrains Mono',monospace", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Network</div>
              <div style={{ color:C.textDim, fontSize:11, fontFamily:"'JetBrains Mono',monospace", lineHeight:1.8 }}>
                <div>{PEOPLE.length + ORGS.length + EVENTS.length + CLAIMS.length + EVIDENCE.length} nodes</div>
                <div>{RAW_EDGES.length} edges</div>
                <div>34 countries</div>
              </div>
            </div>
          )}
        </div>

        {/* Center: Graph canvas */}
        <div style={{ flex:1, position:"relative", overflow:"hidden", minWidth:0 }}>
          {/* Canvas top bar */}
          <div style={{ position:"absolute", top:10, left:10, zIndex:5, display:"flex", gap:6, alignItems:"center" }}>
            {activeNode && (
              <div style={{ padding:"5px 10px", background:"rgba(8,8,13,0.85)", backdropFilter:"blur(12px)", border:`1px solid ${C.border}`, borderRadius:5, display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ color:KIND_META[activeNode.kind].palette[2] }}>{KIND_META[activeNode.kind].icon}</div>
                <span style={{ color:C.text, fontSize:11, fontFamily:"'Inter',sans-serif" }}>{activeNode.label}</span>
                <Minus size={9} color={C.textDim}/>
                <span style={{ color:C.textDim, fontSize:10, fontFamily:"'JetBrains Mono',monospace" }}>{activeNode.confidence}% confidence</span>
              </div>
            )}
          </div>

          {/* Kind legend */}
          <div style={{ position:"absolute", bottom:14, left:14, zIndex:5, display:"flex", flexDirection:"column", gap:4 }}>
            {(Object.entries(KIND_META) as [NodeKind, typeof KIND_META[NodeKind]][]).map(([kind, meta]) => (
              <div key={kind} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:meta.palette[0], border:`1px solid ${meta.palette[1]}` }}/>
                <span style={{ color:C.textDim, fontSize:9.5, fontFamily:"'JetBrains Mono',monospace" }}>{meta.label}</span>
              </div>
            ))}
          </div>

          <ReactFlowProvider>
            <GraphCanvas
              onNodeHover={handleNodeHover}
              onNodeSelect={handleNodeSelect}
              selectedNodeId={selectedNodeId}
              focusNodeId={focusNodeId}
            />
          </ReactFlowProvider>
        </div>

        {/* Right panel */}
        <RightPanel node={activeNode} onClose={handleClose} />
      </div>

      {/* ── Bottom Timeline ─────────────────────────────────────────────────── */}
      <BottomTimeline
        selectedEventId={selectedNodeId && NODE_MAP[selectedNodeId]?.kind === "event" ? selectedNodeId : null}
        onSelect={handleTimelineSelect}
      />
    </div>
  );
}
