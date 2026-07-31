import { type Node, type Edge } from "@xyflow/react";
import { type WNode, type WEdge } from "./workspace.types";

// ─── Mock people ──────────────────────────────────────────────────────────────
const PEOPLE: WNode[] = [
  { id:"p1",  kind:"person", label:"Marcus Halverson",   sub:"Former NSA Director",       desc:"Resigned in 2020 after 14 years. Suspected of brokering intelligence with private networks. Linked to 12 covert meetings with foreign nationals.", confidence:82, tags:["NSA","Whistleblower","Defence"], x:0, y:0 },
  { id:"p2",  kind:"person", label:"Elena Vasquez",      sub:"Investigative Journalist",  desc:"Published the initial exposé on Cobalt Network. Source protection invoked 4 times. Under surveillance since 2020.", confidence:91, tags:["Press","Source"], x:0, y:0 },
  { id:"p3",  kind:"person", label:"Dmitri Volkov",      sub:"Russian Oligarch",          desc:"Controls 14 shell companies across Liechtenstein, Cyprus, and the BVI. Net worth estimated at $4.2B. Travel bans in 6 jurisdictions.", confidence:76, tags:["Oligarch","Finance","Sanctions"], x:0, y:0 },
  { id:"p4",  kind:"person", label:"Sarah Chen",         sub:"CIA Analyst, Whistleblower",desc:"Filed whistleblower complaint July 2020. Surveilled by NSA for 18 months prior. Currently under witness protection.", confidence:95, tags:["CIA","Whistleblower"], x:0, y:0 },
  { id:"p5",  kind:"person", label:"Ahmad Khalil",       sub:"Lebanese Arms Broker",      desc:"Operating under 6 aliases. Brokered deals estimated at $1.2B annually. Interpol Red Notice issued November 2021.", confidence:78, tags:["Arms","Broker","INTERPOL"], x:0, y:0 },
  { id:"p6",  kind:"person", label:"Victoria Pemberton", sub:"UK Foreign Office",         desc:"Authorized surveillance operations under GCHQ cooperation agreement. Parliamentary inquiry testimony under review.", confidence:67, tags:["GCHQ","UK","Surveillance"], x:0, y:0 },
  { id:"p7",  kind:"person", label:"Jin-Ho Park",        sub:"South Korean Intelligence", desc:"Leaked classified satellite imagery to Meridian Capital in 2020. Under investigation by NIS. Diplomatic immunity contested.", confidence:71, tags:["NIS","Intelligence","Leak"], x:0, y:0 },
  { id:"p8",  kind:"person", label:"Thomas Kessler",     sub:"Swiss Private Banker",      desc:"Structured bearer bond instruments for anonymous cross-border transfers. Accounts frozen February 2021 under FATF pressure.", confidence:88, tags:["Banking","Switzerland","Money"], x:0, y:0 },
  { id:"p9",  kind:"person", label:"Natasha Petrov",     sub:"Former FSB Officer",        desc:"Survived assassination attempt August 2021. Attempted defection to UK. Provided intelligence on Cobalt Network internal structure.", confidence:83, tags:["FSB","Russia","Defection"], x:0, y:0 },
  { id:"p10", kind:"person", label:"Carlos Reyes",       sub:"Venezuelan Minister",       desc:"Channelled oil revenue through Nexus Strategic Partners. Named in Senate testimony. Travel restrictions imposed.", confidence:69, tags:["Venezuela","Oil","Sanctions"], x:0, y:0 },
  { id:"p11", kind:"person", label:"Amara Osei",         sub:"African Union Observer",    desc:"Documented network activity across 7 Sub-Saharan states. Report suppressed for 6 months at Security Council request.", confidence:74, tags:["AU","Observer","Report"], x:0, y:0 },
  { id:"p12", kind:"person", label:"Henrik Larsson",     sub:"Europol Investigator",      desc:"Led cross-border investigation team. Investigation politically compromised per internal Europol memo leaked in 2022.", confidence:80, tags:["Europol","Investigation"], x:0, y:0 },
  { id:"p13", kind:"person", label:"Priya Sharma",       sub:"UN Special Rapporteur",     desc:"Published landmark report on Cobalt Network's humanitarian impact. Faced intimidation campaign. Report endorsed by 34 member states.", confidence:89, tags:["UN","Human Rights"], x:0, y:0 },
  { id:"p14", kind:"person", label:"Robert Wexler",      sub:"Defence Contractor CEO",    desc:"Met Volkov 7 times in 2020. Cobalt Defense Systems received $2.3B in combined contracts. Board resigned en masse in 2022.", confidence:77, tags:["Defence","Contractor"], x:0, y:0 },
  { id:"p15", kind:"person", label:"Leila Nasseri",      sub:"Iranian Diplomat",          desc:"Coordinated sanctions evasion through Arcturus Foundation front entities. Expelled from Vienna in 2022 following UN inquiry.", confidence:73, tags:["Iran","Diplomacy","Sanctions"], x:0, y:0 },
];

const ORGS: WNode[] = [
  { id:"o1",  kind:"org", label:"Meridian Capital",        sub:"Investment Group",    desc:"Front company for cross-border intelligence payments. Registered in Delaware, operating from Zurich. $1.8B in unexplained inflows 2018–2021.", confidence:84, tags:["Front","Finance"], x:0, y:0 },
  { id:"o2",  kind:"org", label:"Cobalt Defense Systems",  sub:"Defence Contractor", desc:"Dual-use weapons technology supplier. Technology transferred to non-state actors. Contract cancelled by DoD in 2022.", confidence:79, tags:["Defence","Technology"], x:0, y:0 },
  { id:"o3",  kind:"org", label:"Prometheus Intelligence", sub:"Private Intelligence",desc:"Provides SIGINT services to non-state actors. Infiltrated 3 NATO member intelligence networks.", confidence:81, tags:["Intelligence","SIGINT","NATO"], x:0, y:0 },
  { id:"o4",  kind:"org", label:"Arcturus Foundation",     sub:"Think Tank",         desc:"Academic cover for disinformation operations. Funded by Meridian Capital. 34 published researchers confirmed as cover identities.", confidence:86, tags:["Disinfo","Cover"], x:0, y:0 },
  { id:"o5",  kind:"org", label:"Nexus Strategic Partners",sub:"Consulting",         desc:"Venezuelan oil revenue laundering. Won $340M in government contracts through bribery. CEO under Interpol warrant.", confidence:75, tags:["Bribery","Venezuela"], x:0, y:0 },
  { id:"o6",  kind:"org", label:"Silvergate Financial",    sub:"Private Bank",       desc:"Processed $340M in untraceable transfers over 36 months. Correspondent banking relationships in 14 jurisdictions.", confidence:88, tags:["Banking","Transfers"], x:0, y:0 },
  { id:"o7",  kind:"org", label:"Orion Security",          sub:"Security Consulting",desc:"Provided physical surveillance and counter-intelligence services to Cobalt Network principals.", confidence:70, tags:["Surveillance","Security"], x:0, y:0 },
  { id:"o8",  kind:"org", label:"Helios Data Systems",     sub:"Data Infrastructure",desc:"Data breach January 2020 suspected to be insider-facilitated. Classified data exfiltrated to external server.", confidence:77, tags:["Data","Breach","Tech"], x:0, y:0 },
  { id:"o9",  kind:"org", label:"Atlas Research Institute",sub:"Research Cover",     desc:"Provides academic legitimacy to network principals. 12 researchers hold simultaneous government security clearances.", confidence:72, tags:["Cover","Research"], x:0, y:0 },
  { id:"o10", kind:"org", label:"Vanta Intelligence Group",sub:"Private Intelligence",desc:"Infiltrated intelligence services of 3 NATO countries. Operations span 34 countries. Founded by former CIA officers.", confidence:83, tags:["NATO","Intelligence","CIA"], x:0, y:0 },
];

const EVENTS: WNode[] = [
  { id:"e1",  kind:"event", label:"Meridian Founding Meeting",   sub:"2019-03-15", desc:"First documented meeting of Cobalt Network principals at Meridian Capital offices in Zurich.", date:"2019-03-15", confidence:91, x:0, y:0 },
  { id:"e2",  kind:"event", label:"Cobalt Contract Signed",      sub:"2019-06-20", desc:"Cobalt Defense Systems signs $840M defence contract. Internal documents show contract engineered through Nexus intermediaries.", date:"2019-06-20", confidence:85, x:0, y:0 },
  { id:"e3",  kind:"event", label:"Geneva Summit",               sub:"2019-09-12", desc:"Clandestine meeting at Hotel Beau-Rivage. Satellite imagery confirms presence of 6 principals.", date:"2019-09-12", confidence:79, x:0, y:0 },
  { id:"e4",  kind:"event", label:"Helios Data Breach",          sub:"2020-01-08", desc:"Classified systems compromised. 340GB of signals intelligence exfiltrated. Insider involvement confirmed.", date:"2020-01-08", confidence:92, x:0, y:0 },
  { id:"e5",  kind:"event", label:"Halverson Resignation",       sub:"2020-03-22", desc:"Resigned citing personal reasons. Subsequent forensic audit revealed contact with network principals.", date:"2020-03-22", confidence:88, x:0, y:0 },
  { id:"e6",  kind:"event", label:"Vasquez Exposé Published",    sub:"2020-05-14", desc:"14,000-word investigation published. Caused immediate diplomatic incidents in 4 countries.", date:"2020-05-14", confidence:96, x:0, y:0 },
  { id:"e7",  kind:"event", label:"Chen Whistleblower Filing",   sub:"2020-07-03", desc:"Formal whistleblower complaint filed with Inspector General. 847-page filing with classified annexes.", date:"2020-07-03", confidence:97, x:0, y:0 },
  { id:"e8",  kind:"event", label:"Vienna Arms Meeting",         sub:"2020-09-18", desc:"Khalil brokers $200M arms deal. CCTV footage from Vienna airport confirms meeting.", date:"2020-09-18", confidence:74, x:0, y:0 },
  { id:"e9",  kind:"event", label:"Arcturus Established",        sub:"2020-11-30", desc:"Foundation formally registered in Liechtenstein. $40M initial capitalization from Meridian.", date:"2020-11-30", confidence:83, x:0, y:0 },
  { id:"e10", kind:"event", label:"Swiss Accounts Frozen",       sub:"2021-02-14", desc:"FATF intervention freezes 23 accounts across Silvergate network. $178M assets frozen.", date:"2021-02-14", confidence:95, x:0, y:0 },
  { id:"e11", kind:"event", label:"UN Security Briefing",        sub:"2021-04-22", desc:"Classified briefing to P5 on Cobalt Network's threat assessment.", date:"2021-04-22", confidence:87, x:0, y:0 },
  { id:"e12", kind:"event", label:"Nexus Contract Awarded",      sub:"2021-06-09", desc:"$500M advisory contract awarded through no-bid process. 14 procedural violations flagged.", date:"2021-06-09", confidence:82, x:0, y:0 },
  { id:"e13", kind:"event", label:"Petrov Attempt",              sub:"2021-08-17", desc:"Assassination attempt via nerve agent analogue. Petrov survived. UK expels 3 diplomatic personnel.", date:"2021-08-17", confidence:90, x:0, y:0 },
  { id:"e14", kind:"event", label:"Senate Intelligence Hearing", sub:"2021-10-05", desc:"Public and closed sessions. 6 principals testify. Halverson invokes 5th Amendment.", date:"2021-10-05", confidence:98, x:0, y:0 },
  { id:"e15", kind:"event", label:"Europol Investigation Opened",sub:"2021-12-19", desc:"Multi-jurisdiction investigation launched. 8 countries cooperating. Internal compromise discovered 6 months later.", date:"2021-12-19", confidence:88, x:0, y:0 },
  { id:"e16", kind:"event", label:"Sharma Report Published",     sub:"2022-02-28", desc:"UN Special Rapporteur report on humanitarian impact. Endorsed by 34 states.", date:"2022-02-28", confidence:93, x:0, y:0 },
  { id:"e17", kind:"event", label:"Cobalt Network Exposed",      sub:"2022-05-15", desc:"Full network graph published by joint investigative consortium. Named 94 individuals and 31 entities.", date:"2022-05-15", confidence:94, x:0, y:0 },
  { id:"e18", kind:"event", label:"International Arrest Warrants",sub:"2022-07-30",desc:"Interpol Red Notices issued for 19 individuals. 7 arrested within 30 days.", date:"2022-07-30", confidence:96, x:0, y:0 },
  { id:"e19", kind:"event", label:"Parliamentary Inquiry",       sub:"2022-09-12", desc:"UK parliamentary inquiry into Pemberton's authorization of surveillance operations.", date:"2022-09-12", confidence:85, x:0, y:0 },
  { id:"e20", kind:"event", label:"Final OPSEC Review",          sub:"2022-11-01", desc:"Intelligence community review. Assessment: network continues to operate in reduced form.", date:"2022-11-01", confidence:71, x:0, y:0 },
];

const CLAIMS: WNode[] = [
  { id:"c1",  kind:"claim", label:"Meridian is a front company",          sub:"High Confidence",   desc:"Shell structure confirmed through Panama Papers cross-reference.", confidence:87, x:0, y:0 },
  { id:"c2",  kind:"claim", label:"Halverson received $12M offshore",     sub:"High Confidence",   desc:"Wire transfers through Silvergate to accounts in Vanuatu and BVI.", confidence:82, x:0, y:0 },
  { id:"c3",  kind:"claim", label:"Cobalt Defense dual-use transfer",     sub:"Disputed",          desc:"Technology classified as dual-use exported to Iran via UAE intermediary.", confidence:68, x:0, y:0 },
  { id:"c4",  kind:"claim", label:"Chen surveilled for 18 months",        sub:"High Confidence",   desc:"NSA metadata records confirm continuous collection. Warrant under Section 702 FISA.", confidence:91, x:0, y:0 },
  { id:"c5",  kind:"claim", label:"Geneva was a clandestine handoff",     sub:"Medium Confidence", desc:"Satellite imagery shows 6 verified principals. Hotel records sealed under Swiss banking secrecy.", confidence:74, x:0, y:0 },
  { id:"c6",  kind:"claim", label:"Volkov controls 14 shell companies",   sub:"High Confidence",   desc:"Corporate registry analysis across 9 jurisdictions.", confidence:89, x:0, y:0 },
  { id:"c7",  kind:"claim", label:"Arcturus funds disinformation",        sub:"Medium Confidence", desc:"Content analysis of 340 Arcturus-funded publications shows 73% alignment with known influence ops.", confidence:72, x:0, y:0 },
  { id:"c8",  kind:"claim", label:"Silvergate processed $340M",           sub:"High Confidence",   desc:"Transaction logs obtained by FATF. $340M in 1,847 transactions over 36 months.", confidence:93, x:0, y:0 },
  { id:"c9",  kind:"claim", label:"Khalil brokers $1.2B annually",        sub:"Medium Confidence", desc:"SIGINT assessment from 2019. 6 independent sources confirm.", confidence:71, x:0, y:0 },
  { id:"c10", kind:"claim", label:"Park leaked satellite data",           sub:"Disputed",          desc:"NIS investigation ongoing. Data exfiltration forensics consistent with Park's access logs.", confidence:64, x:0, y:0 },
  { id:"c11", kind:"claim", label:"Helios breach was inside job",         sub:"High Confidence",   desc:"Access logs show data exfiltration began 40 minutes after all-staff meeting.", confidence:85, x:0, y:0 },
  { id:"c12", kind:"claim", label:"Nexus contract secured through bribery",sub:"High Confidence",  desc:"Internal Nexus emails show payments to procurement officials.", confidence:88, x:0, y:0 },
  { id:"c13", kind:"claim", label:"Vasquez received NSA documents",       sub:"Medium Confidence", desc:"Document metadata analysis confirms NSA origin. 3 potential sources identified.", confidence:76, x:0, y:0 },
  { id:"c14", kind:"claim", label:"Petrov marked for elimination",        sub:"High Confidence",   desc:"HUMINT from 2 independent sources. Order originated at FSB Directorate level.", confidence:83, x:0, y:0 },
  { id:"c15", kind:"claim", label:"Senate testimony coordinated",         sub:"Disputed",          desc:"Communication metadata shows principals' lawyers exchanged 847 encrypted messages before hearing.", confidence:67, x:0, y:0 },
  { id:"c16", kind:"claim", label:"Network spans 34 countries",           sub:"High Confidence",   desc:"Joint investigative report maps operations across 34 jurisdictions.", confidence:94, x:0, y:0 },
  { id:"c17", kind:"claim", label:"Wexler met Volkov 7 times in 2020",   sub:"High Confidence",   desc:"Travel records, hotel CCTV, and credit card data confirm 7 meetings.", confidence:90, x:0, y:0 },
  { id:"c18", kind:"claim", label:"Venezuelan oil funds the network",     sub:"Medium Confidence", desc:"Oil revenue traced through 3 intermediary entities to Nexus accounts.", confidence:69, x:0, y:0 },
  { id:"c19", kind:"claim", label:"Larsson investigation compromised",    sub:"Disputed",          desc:"Internal Europol memo describes 'possible leak at senior level'.", confidence:61, x:0, y:0 },
  { id:"c20", kind:"claim", label:"Atlas provides academic cover",        sub:"Medium Confidence", desc:"12 Atlas researchers hold active security clearances.", confidence:73, x:0, y:0 },
  { id:"c21", kind:"claim", label:"Sharma report suppressed 6 months",   sub:"High Confidence",   desc:"UN administrative records confirm report completed August 2021. Published February 2022.", confidence:87, x:0, y:0 },
  { id:"c22", kind:"claim", label:"Nasseri coordinated sanctions evasion",sub:"Medium Confidence", desc:"Financial Intelligence Unit report links Nasseri to Arcturus bank accounts.", confidence:70, x:0, y:0 },
  { id:"c23", kind:"claim", label:"Pemberton authorized surveillance",    sub:"Disputed",          desc:"GCHQ authorisation signed by Pemberton. Legality under review.", confidence:65, x:0, y:0 },
  { id:"c24", kind:"claim", label:"Kessler created bearer bond structures",sub:"High Confidence",  desc:"Bank records show 23 bearer bond issuances. Total face value: $340M.", confidence:86, x:0, y:0 },
  { id:"c25", kind:"claim", label:"Prometheus serves non-state actors",   sub:"Medium Confidence", desc:"SIGINT analysis shows Prometheus collection shared with 4 entities not on authorised list.", confidence:74, x:0, y:0 },
  { id:"c26", kind:"claim", label:"Vanta infiltrated 3 NATO countries",   sub:"High Confidence",   desc:"Counter-intelligence assessments from 3 NATO member states confirm Vanta personnel.", confidence:81, x:0, y:0 },
  { id:"c27", kind:"claim", label:"Halverson–Volkov met covertly 12×",    sub:"High Confidence",   desc:"Travel records cross-referenced with Volkov's known itinerary. 12 confirmed colocations.", confidence:88, x:0, y:0 },
  { id:"c28", kind:"claim", label:"Arcturus linked to 4 agencies",        sub:"Disputed",          desc:"Former Arcturus board member claims founding represented CIA, MI6, BND, and Mossad interests.", confidence:55, x:0, y:0 },
  { id:"c29", kind:"claim", label:"Cobalt tech transferred to Iran",      sub:"Disputed",          desc:"Technology signatures identified in Iranian defence systems. US assessment: 'plausible'.", confidence:63, x:0, y:0 },
  { id:"c30", kind:"claim", label:"Network uses encrypted comms only",    sub:"High Confidence",   desc:"No unencrypted communication between principals recovered. All use Signal, Wire, or custom protocols.", confidence:92, x:0, y:0 },
];

const EVIDENCE: WNode[] = [
  { id:"v1",  kind:"evidence", label:"Leaked NSA Memorandum",         sub:"Document · 2019-12-01",  desc:"Internal NSA memo describing surveillance authorisation targeting 4 Cobalt Network principals. Classification: TS/SCI.", confidence:94, tags:["NSA","SIGINT","TS/SCI"], x:0, y:0 },
  { id:"v2",  kind:"evidence", label:"Swiss Bank Transaction Logs",   sub:"Financial · 2020-02-15", desc:"1,847 transaction records obtained by FATF.", confidence:91, tags:["Financial","FATF"], x:0, y:0 },
  { id:"v3",  kind:"evidence", label:"Encrypted Cable Intercepts",    sub:"SIGINT · 2020",          desc:"Signal intercepts obtained under cooperative SIGINT agreement. 12% readable.", confidence:73, tags:["SIGINT","Encrypted"], x:0, y:0 },
  { id:"v4",  kind:"evidence", label:"Geneva Satellite Imagery",      sub:"Imagery · 2019-09-12",   desc:"Commercial satellite imagery of Hotel Beau-Rivage. 6 principals identified.", confidence:85, tags:["IMINT","Geneva"], x:0, y:0 },
  { id:"v5",  kind:"evidence", label:"Meridian Financial Audit",      sub:"Financial · 2021",       desc:"Forensic audit commissioned by FATF. $1.8B in unexplained transactions.", confidence:89, tags:["Audit","Financial"], x:0, y:0 },
  { id:"v6",  kind:"evidence", label:"Vasquez Audio Recordings",      sub:"Audio · 2020",           desc:"21 hours of recordings. 6 principal voices identified.", confidence:87, tags:["Audio","Source"], x:0, y:0 },
  { id:"v7",  kind:"evidence", label:"Senate Testimony Transcripts",  sub:"Legal · 2021-10-05",     desc:"Full transcripts of public testimony.", confidence:98, tags:["Legal","Senate"], x:0, y:0 },
  { id:"v8",  kind:"evidence", label:"Vienna Airport CCTV",           sub:"Imagery · 2020-09-18",   desc:"Airport security footage confirms Khalil under 3 aliases.", confidence:82, tags:["CCTV","Vienna"], x:0, y:0 },
  { id:"v9",  kind:"evidence", label:"Shell Company Registrations",   sub:"Legal · Various",        desc:"Corporate registry documents from 9 jurisdictions. 47 entities traced to Volkov nominees.", confidence:90, tags:["Corporate","Legal"], x:0, y:0 },
  { id:"v10", kind:"evidence", label:"Interpol Red Notices",          sub:"Legal · 2022-07-30",     desc:"19 Red Notices issued. Includes biometrics, aliases, and known associates.", confidence:99, tags:["Interpol","Legal"], x:0, y:0 },
  { id:"v11", kind:"evidence", label:"UN Security Council Annexes",   sub:"Classified · 2021",      desc:"Classified annexes to UN Security Briefing. Summary leaked to press.", confidence:80, tags:["UN","Classified"], x:0, y:0 },
  { id:"v12", kind:"evidence", label:"SIGINT Reports 2019–2022",      sub:"SIGINT · Ongoing",       desc:"Series of 14 SIGINT assessment reports covering all network principals.", confidence:77, tags:["SIGINT","Assessment"], x:0, y:0 },
  { id:"v13", kind:"evidence", label:"Chen Whistleblower Declaration", sub:"Legal · 2020-07-03",    desc:"847-page declaration with classified annexes. Filed with OIG.", confidence:96, tags:["Whistleblower","Legal"], x:0, y:0 },
  { id:"v14", kind:"evidence", label:"Forensic Accounting Report",    sub:"Financial · 2022",       desc:"Big-4 forensic accounting firm report. $2.1B in suspicious flows across 14 jurisdictions.", confidence:92, tags:["Forensic","Finance"], x:0, y:0 },
  { id:"v15", kind:"evidence", label:"Email Metadata Analysis",       sub:"Digital · 2021",         desc:"Graph analysis of encrypted email metadata from 6 principals.", confidence:84, tags:["Digital","Metadata"], x:0, y:0 },
  { id:"v16", kind:"evidence", label:"Offshore Account Statements",   sub:"Financial · 2020–2021",  desc:"Account statements from 23 offshore entities.", confidence:88, tags:["Offshore","Finance"], x:0, y:0 },
  { id:"v17", kind:"evidence", label:"Halverson Travel Records",      sub:"Administrative · 2020",  desc:"Passport and hotel records for 2020. 12 confirmed colocations with Volkov.", confidence:91, tags:["Travel","Admin"], x:0, y:0 },
  { id:"v18", kind:"evidence", label:"Crypto Trace Analysis",         sub:"Digital · 2021–2022",    desc:"Blockchain forensics tracing $34M. Final destination: Silvergate-linked wallets.", confidence:79, tags:["Crypto","Blockchain"], x:0, y:0 },
  { id:"v19", kind:"evidence", label:"Source Intelligence Assessment",sub:"Intelligence · 2022",    desc:"Joint 5-Eyes intelligence assessment. Source reliability graded. Overall confidence: HIGH.", confidence:86, tags:["Intelligence","5-Eyes"], x:0, y:0 },
  { id:"v20", kind:"evidence", label:"Corporate Ownership Maps",      sub:"Legal · 2022",           desc:"Visual ownership maps of 31 entities. Produced by joint investigative consortium.", confidence:93, tags:["Corporate","Legal"], x:0, y:0 },
];

// ─── Layout ───────────────────────────────────────────────────────────────────
function layoutNodes(all: WNode[]): WNode[] {
  const layout = all.map(n => ({ ...n }));
  layout.filter(n => n.kind === "person").forEach((n, i) => { n.x = 60 + (i % 5) * 220; n.y = 60 + Math.floor(i / 5) * 140; });
  layout.filter(n => n.kind === "org").forEach((n, i) => { n.x = 1300 + (i % 3) * 220; n.y = 60 + Math.floor(i / 3) * 140; });
  layout.filter(n => n.kind === "event").forEach((n, i) => { n.x = 60 + i * 200; n.y = 520 + (i % 3 === 0 ? 0 : i % 3 === 1 ? -50 : 50); });
  layout.filter(n => n.kind === "claim").forEach((n, i) => { n.x = 60 + (i % 6) * 210; n.y = 720 + Math.floor(i / 6) * 130; });
  layout.filter(n => n.kind === "evidence").forEach((n, i) => { n.x = 1300 + (i % 3) * 220; n.y = 460 + Math.floor(i / 3) * 130; });
  return layout;
}

// ─── Raw edges ────────────────────────────────────────────────────────────────
export const MOCK_EDGES: WEdge[] = [
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

// ─── Build ReactFlow nodes/edges ──────────────────────────────────────────────
export function buildRFNodes(wnodes: WNode[]): Node[] {
  return wnodes.map(n => ({
    id: n.id,
    type: "wnode",
    position: { x: n.x, y: n.y },
    data: { wnode: n, isHighlighted: false, isFaded: false },
    draggable: true,
  }));
}

export function buildRFEdges(edges: WEdge[]): Edge[] {
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

// ─── Exports ──────────────────────────────────────────────────────────────────
export const MOCK_NODES_RAW = layoutNodes([
  ...PEOPLE, ...ORGS, ...EVENTS, ...CLAIMS, ...EVIDENCE,
]);
export const MOCK_NODE_MAP: Record<string, WNode> = Object.fromEntries(
  MOCK_NODES_RAW.map(n => [n.id, n] as [string, WNode])
);
export const MOCK_INITIAL_NODES = buildRFNodes(MOCK_NODES_RAW);
export const MOCK_INITIAL_EDGES = buildRFEdges(MOCK_EDGES);

export const MOCK_WORKSPACE_DATA = {
  title: "Operation Cobalt Network",
  nodes: MOCK_NODES_RAW,
  edges: MOCK_EDGES,
};
