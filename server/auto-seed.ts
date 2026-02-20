import { eq } from "drizzle-orm";
import { db } from "./storage";
import {
  categories,
  rabbitHoles,
  depthNodes,
  claims,
  sources,
  media,
  comments,
  podcasts,
  podcastEpisodes,
  rabbitHolePodcastEpisodes,
  sponsoredPodcastSlots,
  creators,
  streams,
  streamReplays,
  employees,
} from "@shared/schema";

export async function autoSeedIfEmpty() {
  const existingCats = await db.select().from(categories);
  if (existingCats.length > 0) {
    console.log("[auto-seed] Database already has content, skipping.");
    return;
  }

  console.log("[auto-seed] Empty database detected, seeding content...");

  await db.insert(categories).values([
    { name: "Intelligence", slug: "intelligence", description: "Covert operations, spy agencies, and classified programs", icon: "shield" },
    { name: "Geopolitics", slug: "geopolitics", description: "Global power dynamics and hidden diplomatic maneuvering", icon: "globe" },
    { name: "History", slug: "history", description: "Suppressed histories, lost civilizations, and revisionist narratives", icon: "book" },
    { name: "Technology", slug: "technology", description: "Surveillance tech, AI, and digital warfare", icon: "cpu" },
    { name: "Finance", slug: "finance", description: "Shadow banking, market manipulation, and economic conspiracies", icon: "dollar-sign" },
    { name: "Mysteries", slug: "mysteries", description: "Unsolved puzzles, cryptography, and enigmatic phenomena", icon: "search" },
    { name: "Media Narratives", slug: "media", description: "Propaganda, disinformation campaigns, and narrative control", icon: "tv" },
  ]);
  console.log("[auto-seed] Categories seeded.");

  await seedOriginalHoles();
  await seedContentHoles();

  console.log("[auto-seed] All content seeded successfully.");
}

async function seedOriginalHoles() {
  const holes = await db.insert(rabbitHoles).values([
    {
      slug: "mk-ultra",
      title: "Project MKUltra",
      summary: "A decades-long clandestine program by the Central Intelligence Agency (CIA) intended to develop procedures and identify drugs such as LSD that could be used in interrogations to weaken the individual and force confessions through mind control.",
      status: "Published",
      completion: 35,
      isSpecialist: true,
      connections: 142,
      sourceCount: 24,
      categorySlug: "intelligence",
      timeline: [
        { year: "1953", event: "Project officially sanctioned under CIA Director Allen Dulles.", type: "verified" },
        { year: "1955", event: "Subproject 68 launched at McGill University under Dr. Donald Ewen Cameron.", type: "verified" },
        { year: "1964", event: "Project renamed MKSEARCH with expanded scope.", type: "verified" },
        { year: "1973", event: "CIA Director Richard Helms orders all MKUltra files destroyed.", type: "verified" },
        { year: "1975", event: "Church Committee investigation begins, exposing domestic intelligence abuses.", type: "verified" },
        { year: "1977", event: "Freedom of Information Act request uncovers 20,000 surviving documents.", type: "verified" },
      ],
    },
    {
      slug: "vatican-archives",
      title: "The Apostolic Archive",
      summary: "Deep dive into the restricted layers of the Vatican Secret Archives, focusing on 17th-century diplomatic suppressions, the Chinon Parchment discovery, and classified papal correspondence that reshaped geopolitical alliances.",
      status: "Published",
      completion: 0,
      isSpecialist: true,
      connections: 452,
      sourceCount: 38,
      categorySlug: "history",
      timeline: [
        { year: "1612", event: "Archive formally established by Pope Paul V.", type: "verified" },
        { year: "1881", event: "Pope Leo XIII opens archives to qualified researchers.", type: "verified" },
        { year: "2001", event: "Chinon Parchment discovered, showing Templar absolution.", type: "verified" },
        { year: "2019", event: "Renamed from 'Secret' to 'Apostolic' Archive by Pope Francis.", type: "verified" },
        { year: "2020", event: "Pius XII wartime files declassified amid controversy.", type: "verified" },
      ],
    },
    {
      slug: "biolabs-central-asia",
      title: "Steppe Pathogens",
      summary: "Tracing the lineage of Soviet-era biological research facilities across Kazakhstan and Uzbekistan, from Aralsk-7 to modern cooperative threat reduction programs and their geopolitical implications.",
      status: "Published",
      completion: 0,
      isSpecialist: true,
      connections: 310,
      sourceCount: 19,
      categorySlug: "geopolitics",
      timeline: [
        { year: "1954", event: "Soviet Ministry of Defense establishes Aralsk-7 bioweapons testing facility on Vozrozhdeniya Island.", type: "verified" },
        { year: "1971", event: "Weaponized smallpox accidentally released from Aralsk-7, infecting nearby fishing vessels.", type: "verified" },
        { year: "1992", event: "Nunn-Lugar Cooperative Threat Reduction Program begins dismantling Soviet-era facilities.", type: "verified" },
        { year: "2001", event: "US and Uzbekistan complete decontamination of Vozrozhdeniya Island anthrax burial sites.", type: "verified" },
        { year: "2018", event: "Renewed geopolitical tensions over remaining facilities spark fresh investigation.", type: "disputed" },
      ],
    },
    {
      slug: "cicada-3301",
      title: "Cicada 3301",
      summary: "Three sets of highly complex puzzles posted anonymously online between 2012-2014, incorporating cryptography, steganography, data security, and ancient philosophies. Believed to be a recruitment tool for a secretive intelligence or hacking organization.",
      status: "Published",
      completion: 0,
      isSpecialist: false,
      connections: 89,
      sourceCount: 15,
      categorySlug: "mysteries",
      timeline: [
        { year: "2012", event: "First puzzle posted on 4chan's /b/ board on January 4.", type: "verified" },
        { year: "2012", event: "Solvers trace clues through steganographic images, QR codes, and real-world locations in 14 countries.", type: "verified" },
        { year: "2013", event: "Second round of puzzles released, more complex, involving Mayan numerals and Liber Primus.", type: "verified" },
        { year: "2014", event: "Third and final known puzzle released. Liber Primus remains only partially decoded.", type: "verified" },
        { year: "2016", event: "Suspected copycats emerge. No verified communication from original Cicada since 2014.", type: "disputed" },
      ],
    },
    {
      slug: "number-stations",
      title: "Numbers Stations",
      summary: "Shortwave radio stations broadcasting formatted numbers, believed to be encrypted messages for intelligence operations. Active since the Cold War, several remain operational today with no government acknowledging ownership.",
      status: "Published",
      completion: 0,
      isSpecialist: false,
      connections: 215,
      sourceCount: 31,
      categorySlug: "intelligence",
      timeline: [
        { year: "1960s", event: "First documented numbers stations detected by amateur radio enthusiasts during Cold War.", type: "verified" },
        { year: "1998", event: "Cuban Five spy ring convicted; FBI confirms use of numbers stations for communication.", type: "verified" },
        { year: "2001", event: "Ana Montes arrested for espionage; confirmed use of shortwave number broadcasts from Cuban intelligence.", type: "verified" },
        { year: "2010", event: "Illegals Program arrests reveal Russian SVR agents received instructions via numbers stations.", type: "verified" },
        { year: "2023", event: "Multiple new unidentified stations detected across HF bands, origins unknown.", type: "disputed" },
      ],
    },
  ]).returning();

  const mkUltra = holes.find((h: any) => h.slug === "mk-ultra")!;
  const vatican = holes.find((h: any) => h.slug === "vatican-archives")!;
  const cicada = holes.find((h: any) => h.slug === "cicada-3301")!;

  await db.insert(comments).values([
    { holeId: mkUltra.id, username: "Watcher_99", reputation: 1402, content: "If you look at the declassified budget for 1963, there is a massive unaccounted discrepancy that aligns perfectly with the expansion of the Subproject 68 facilities in San Francisco.", upvotes: 342, links: [{ text: "Subproject 68 facilities", target: "Midnight Climax" }] },
    { holeId: mkUltra.id, username: "Null_State", reputation: 890, content: "The timeline presented here misses the preliminary research done at Edgewood Arsenal before the project was officially sanctioned. This is critical context.", upvotes: 128, links: [] },
    { holeId: mkUltra.id, username: "TruthSeeker", reputation: 42, content: "Has anyone cross-referenced the doctors involved with the earlier Operation Paperclip personnel? There are at least three overlapping names in the declassified personnel files.", upvotes: 89, links: [{ text: "Operation Paperclip", target: "operation-paperclip" }] },
  ]);

  const mkNodes = await db.insert(depthNodes).values([
    { holeId: mkUltra.id, title: "Origins: Operation Bluebird", summary: "Before MKUltra, the CIA ran Operation Bluebird (1950) and Operation Artichoke (1951), early mind control programs that laid the groundwork.", content: "In the early days of the Cold War, the CIA became increasingly concerned about Soviet and Chinese advances in brainwashing and interrogation techniques. Reports of 'converted' American POWs during the Korean War created panic within the intelligence community.\n\nOperation Bluebird, initiated in 1950, was the first formal CIA program to investigate interrogation and mind control methods. It explored hypnosis, morphine addiction, forced withdrawal, and other techniques.\n\nBy 1951, the program was renamed Operation Artichoke and expanded to include the use of chemicals and biological agents. These early programs directly led to the creation of MKUltra in 1953.", position: 0, status: "unlocked", branchLinks: [] },
    { holeId: mkUltra.id, title: "The LSD Experiments", summary: "The CIA administered LSD to unwitting subjects including government employees, military personnel, and civilians.", content: "One of MKUltra's most notorious aspects was the widespread testing of LSD on human subjects, often without their knowledge or consent. The CIA believed LSD could be used as a truth serum or to disorient enemy agents.\n\nDr. Sidney Gottlieb, the program's chief scientist, personally oversaw many of these experiments. In one infamous incident, CIA officer Frank Olson was given LSD without his knowledge and died days later under suspicious circumstances.\n\nOperation Midnight Climax set up safe houses in San Francisco and New York where CIA operatives hired sex workers to lure men, who were then secretly dosed with LSD and observed through one-way mirrors.", position: 1, status: "unlocked", branchLinks: [{ label: "Operation Midnight Climax", targetSlug: "mk-ultra" }] },
    { holeId: mkUltra.id, title: "Subproject 68: The Montreal Experiments", summary: "Dr. Donald Ewen Cameron's horrifying experiments at McGill University.", content: "Perhaps the most disturbing chapter of MKUltra took place at McGill University's Allan Memorial Institute in Montreal, Canada. Dr. Donald Ewen Cameron conducted experiments that would later be classified as torture.\n\nCameron's technique of 'psychic driving' involved putting patients into drug-induced comas for weeks at a time while playing looped audio messages. He also used massive electroshock therapy—30 to 40 times the normal voltage.\n\nMany of Cameron's victims were ordinary psychiatric patients who came seeking help for minor conditions. They emerged with shattered identities, unable to recognize family members.", position: 2, status: "locked", branchLinks: [] },
    { holeId: mkUltra.id, title: "The Cover-Up", summary: "In 1973, CIA Director Richard Helms ordered the destruction of all MKUltra files.", content: "As Watergate-era investigations began closing in on CIA activities, Director Richard Helms made the fateful decision to order the destruction of all MKUltra files in 1973. An estimated 20,000 documents were destroyed.\n\nHowever, a cache of financial records survived—they had been incorrectly filed in a different building. These approximately 20,000 pages were discovered in 1977 through a Freedom of Information Act request.\n\nThe Church Committee (1975) and subsequent congressional hearings exposed MKUltra to the public.", position: 3, status: "locked", branchLinks: [] },
  ]).returning();

  const mkSources = await db.insert(sources).values([
    { holeId: mkUltra.id, title: "CIA Declassified Archives: Behavior Modification", author: "Central Intelligence Agency", origin: "USA", publishedDate: "1977", url: "", summary: "Surviving financial records and memos from the MKUltra program discovered via FOIA request.", type: "document", stanceTag: "neutral", credibility: 98 },
    { holeId: mkUltra.id, title: "Church Committee Report Book 1", author: "U.S. Senate Select Committee", origin: "USA", publishedDate: "1975", url: "", summary: "Congressional investigation report detailing intelligence community abuses.", type: "document", stanceTag: "neutral", credibility: 95 },
    { holeId: mkUltra.id, title: "The Search for the Manchurian Candidate", author: "John Marks", origin: "USA", publishedDate: "1979", url: "", summary: "Investigative journalist's comprehensive account based on declassified CIA documents.", type: "book", stanceTag: "neutral", credibility: 88 },
  ]).returning();

  await db.insert(claims).values([
    { holeId: mkUltra.id, nodeId: mkNodes[0].id, statement: "MKUltra was a direct continuation of Operation Bluebird and Artichoke programs", stance: "Verified", confidence: 95, evidence: [{ sourceId: mkSources[0].id, excerpt: "Declassified CIA memo references Bluebird as predecessor program" }], counterpoints: [] },
    { holeId: mkUltra.id, nodeId: mkNodes[1].id, statement: "Frank Olson was murdered by the CIA to prevent disclosure of MKUltra operations", stance: "Disputed", confidence: 65, evidence: [{ sourceId: mkSources[2].id, excerpt: "Forensic analysis in 1994 found cranial injuries inconsistent with a fall" }], counterpoints: [{ sourceId: mkSources[1].id, excerpt: "Original investigation ruled death a suicide" }] },
    { holeId: mkUltra.id, nodeId: mkNodes[2].id, statement: "Over 100 Canadian citizens were subjected to Cameron's experiments without informed consent", stance: "Verified", confidence: 90, evidence: [{ sourceId: mkSources[1].id, excerpt: "Church Committee testimony confirmed non-consensual experimentation" }], counterpoints: [] },
  ]);

  await db.insert(depthNodes).values([
    { holeId: vatican.id, title: "The Founding of the Secret Archives", summary: "Pope Paul V established the Vatican Secret Archives in 1612.", content: "The Vatican Apostolic Archive holds an estimated 85 kilometers of shelving with documents spanning over 800 years. Pope Paul V consolidated the archive in 1612 to centralize papal records.", position: 0, status: "unlocked", branchLinks: [] },
    { holeId: vatican.id, title: "The Chinon Parchment", summary: "A lost document proving the Pope absolved the Knights Templar of heresy was found in 2001.", content: "In 2001, Italian researcher Barbara Frale discovered the Chinon Parchment—a document that had been 'misfiled' for 700 years. The parchment revealed that Pope Clement V had secretly absolved the Knights Templar of heresy in 1308.", position: 1, status: "unlocked", branchLinks: [] },
    { holeId: vatican.id, title: "Pius XII and the Holocaust", summary: "Newly declassified files reveal the Vatican's knowledge of the Holocaust.", content: "In March 2020, Pope Francis opened the archives of Pope Pius XII's pontificate to researchers. Early findings revealed the Vatican had detailed knowledge of the Holocaust as early as 1942.", position: 2, status: "locked", branchLinks: [] },
  ]);

  await db.insert(depthNodes).values([
    { holeId: cicada.id, title: "The First Puzzle (2012)", summary: "On January 4, 2012, an anonymous image appeared on 4chan containing hidden clues.", content: "The first Cicada 3301 puzzle began with a simple image posted to 4chan's /b/ board. Using steganography tools, solvers discovered hidden text within the image containing a URL leading to increasingly complex challenges.", position: 0, status: "unlocked", branchLinks: [] },
    { holeId: cicada.id, title: "Liber Primus", summary: "A mysterious runic text published during the 2013 puzzle remains only partially decoded.", content: "During the second puzzle iteration in 2013, Cicada 3301 released 'Liber Primus'—a 58-page document written in Anglo-Saxon runes. Only approximately 20% has been decoded.", position: 1, status: "unlocked", branchLinks: [] },
  ]);

  console.log("[auto-seed] Original 5 rabbit holes with depth nodes, claims, sources seeded.");
}

async function seedContentHoles() {
  const holes = [
    { slug: "aurora-network", title: "The Aurora Network", summary: "An investigation into a mysterious fiber-optic backbone discovered beneath major European cities, allegedly constructed by a private consortium with no public records.", status: "Published", completion: 65, isSpecialist: true, connections: 178, sourceCount: 22, categorySlug: "technology", labels: ["Verified", "Disputed"], connectedSlugs: ["vaultkey-protocol"], timeline: [{ year: "2008", event: "First anomalous fiber-optic conduits detected during metro tunnel expansion in Berlin.", type: "verified" }, { year: "2012", event: "Similar infrastructure found beneath Lyon, Brussels, and Vienna.", type: "verified" }, { year: "2015", event: "Shell company Novaflux GmbH identified as permit holder for 3 of 7 known nodes.", type: "verified" }, { year: "2019", event: "Whistleblower claims network is used for parallel financial settlement systems.", type: "disputed" }, { year: "2023", event: "Investigative report links Novaflux to defunct Cold War signals intelligence program.", type: "disputed" }] },
    { slug: "vaultkey-protocol", title: "VaultKey Protocol", summary: "A deep-dive into an alleged cryptographic protocol embedded in certain financial clearing systems, claimed to enable invisible micro-transactions between sovereign wealth funds.", status: "Published", completion: 40, isSpecialist: true, connections: 95, sourceCount: 18, categorySlug: "finance", labels: ["Speculative"], connectedSlugs: ["aurora-network"], timeline: [{ year: "2010", event: "Patent filed by Meridian Digital Labs for 'nested settlement tokenization' system.", type: "verified" }, { year: "2014", event: "Prototype VaultKey module reportedly tested in Singapore interbank network.", type: "disputed" }, { year: "2017", event: "Leaked internal memo from European Central Bank references 'Protocol V' risk assessment.", type: "disputed" }, { year: "2021", event: "Academic paper identifies statistical anomalies consistent with hidden transaction layers.", type: "verified" }] },
    { slug: "echo-garden", title: "Echo Garden", summary: "Examining a coordinated network of seemingly independent media outlets, think tanks, and social media amplifiers that trace back to a single unnamed foundation.", status: "Published", completion: 55, isSpecialist: true, connections: 234, sourceCount: 31, categorySlug: "media", labels: ["Verified"], connectedSlugs: [], timeline: [{ year: "2011", event: "Foundation registered in Liechtenstein with opaque governance structure.", type: "verified" }, { year: "2013", event: "First cluster of aligned outlets identified publishing synchronized editorial calendars.", type: "verified" }, { year: "2016", event: "Data analysis reveals identical talking points deployed across 14 outlets within 72-hour windows.", type: "verified" }, { year: "2020", event: "Foundation's annual budget estimated at $120M through leaked financial disclosures.", type: "disputed" }] },
    { slug: "cerberus-firewall", title: "Cerberus Firewall", summary: "Investigation into a state-sponsored cybersecurity program that allegedly extended beyond defensive operations into proactive network infiltration.", status: "Published", completion: 70, isSpecialist: true, connections: 156, sourceCount: 26, categorySlug: "technology", labels: ["Verified", "Disputed"], connectedSlugs: ["phantom-ledger"], timeline: [{ year: "2009", event: "Cerberus program initially funded as defensive critical infrastructure shield.", type: "verified" }, { year: "2013", event: "Scope expanded to include 'active threat neutralization' capabilities.", type: "verified" }, { year: "2016", event: "Contractor reveals offensive toolkit embedded in routine software updates.", type: "disputed" }, { year: "2019", event: "Independent audit finds evidence of unauthorized data collection from allied nations.", type: "verified" }] },
    { slug: "phantom-ledger", title: "The Phantom Ledger", summary: "Tracing the origins and impact of a mysterious double-entry accounting system found in the archives of a collapsed multinational holding company.", status: "Published", completion: 30, isSpecialist: false, connections: 112, sourceCount: 15, categorySlug: "finance", labels: ["Speculative"], connectedSlugs: ["cerberus-firewall", "vaultkey-protocol"], timeline: [{ year: "2005", event: "Holding company Arcturis Global incorporated in multiple jurisdictions simultaneously.", type: "verified" }, { year: "2011", event: "Forensic accountants discover parallel ledger during bankruptcy proceedings.", type: "verified" }, { year: "2014", event: "Phantom entities in ledger traced to abandoned office addresses in 6 countries.", type: "verified" }, { year: "2018", event: "Mathematical analysis suggests ledger entries encode geographic coordinates.", type: "disputed" }] },
    { slug: "iron-meridian", title: "Iron Meridian", summary: "An investigation into undisclosed bilateral agreements between non-adjacent nations establishing exclusive resource extraction corridors.", status: "Published", completion: 45, isSpecialist: false, connections: 189, sourceCount: 28, categorySlug: "geopolitics", labels: ["Verified"], connectedSlugs: [], timeline: [{ year: "2007", event: "First anomalous shipping route detected between non-trading partner nations.", type: "verified" }, { year: "2012", event: "Satellite imagery shows construction of unlisted port facilities.", type: "verified" }, { year: "2015", event: "Diplomatic cable leak references 'Meridian Framework' bilateral agreements.", type: "verified" }, { year: "2019", event: "Independent researchers map 12 suspected corridors across 4 continents.", type: "disputed" }] },
    { slug: "silverthread-archive", title: "The Silverthread Archive", summary: "Uncovering a massive collection of intercepted communications stored in a decommissioned underground facility.", status: "Published", completion: 50, isSpecialist: false, connections: 267, sourceCount: 35, categorySlug: "intelligence", labels: ["Verified", "Disputed"], connectedSlugs: ["cerberus-firewall"], timeline: [{ year: "1978", event: "Underground facility constructed under cover of geological survey project.", type: "verified" }, { year: "1985", event: "Facility reaches full operational capacity with 200+ staff.", type: "disputed" }, { year: "1993", event: "Program officially shuttered; facility listed as 'decommissioned and sealed.'", type: "verified" }, { year: "2010", event: "Urban explorers discover facility still climate-controlled with active power.", type: "verified" }, { year: "2020", event: "Freedom of information requests reveal facility's continued classification.", type: "verified" }] },
    { slug: "obsidian-charter", title: "The Obsidian Charter", summary: "Investigating the origins and influence of a founding document allegedly shared among a network of private intelligence firms.", status: "Published", completion: 35, isSpecialist: false, connections: 143, sourceCount: 20, categorySlug: "intelligence", labels: ["Speculative", "Disputed"], connectedSlugs: ["silverthread-archive", "echo-garden"], timeline: [{ year: "2001", event: "First reference to 'Obsidian Charter' appears in intercepted contractor communications.", type: "disputed" }, { year: "2006", event: "Former intelligence officer describes charter framework in anonymous interview.", type: "disputed" }, { year: "2012", event: "Corporate registration patterns suggest coordinated founding of 7 private intelligence firms.", type: "verified" }, { year: "2017", event: "Senate inquiry subpoenas charter document; firms claim attorney-client privilege.", type: "verified" }] },
  ];

  const holeIds: Record<string, number> = {};
  for (const h of holes) {
    const [inserted] = await db.insert(rabbitHoles).values(h).returning();
    holeIds[h.slug] = inserted.id;
  }

  const nodesData: Record<string, { title: string; summary: string; content: string }[]> = {
    "aurora-network": [
      { title: "Discovery Beneath Berlin", summary: "How metro engineers stumbled upon unmarked fiber-optic conduits.", content: "During the 2008 expansion of Berlin's U-Bahn Line 5, construction crews encountered a series of fiber-optic conduits that appeared on no municipal infrastructure maps. The cables were sheathed in military-grade protective casing and ran through purpose-built concrete channels." },
      { title: "The Novaflux Connection", summary: "Tracing the shell company behind the construction permits.", content: "Novaflux GmbH was registered in Munich in 2004 with a stated purpose of 'telecommunications infrastructure consulting.' The company's registered directors were three individuals who appeared to have no prior history in telecommunications." },
      { title: "The Seven Nodes", summary: "Mapping the network topology across European cities.", content: "Through municipal permit analysis, ground-penetrating radar surveys, and electromagnetic emission detection, researchers have identified seven probable network nodes beneath major European cities." },
      { title: "Financial Settlement Theory", summary: "The whistleblower's claims about parallel transaction systems.", content: "In 2019, an individual claiming to be a former Novaflux employee contacted investigative journalists with allegations that the Aurora Network was being used to operate a parallel financial settlement system." },
      { title: "Cold War Origins", summary: "Links to defunct signals intelligence infrastructure.", content: "A 2023 investigative report traced several Aurora Network infrastructure components to a Cold War-era signals intelligence program codenamed WINTERGARDEN." },
      { title: "The Regulatory Vacuum", summary: "How the network exploits jurisdictional gaps.", content: "The Aurora Network operates in a regulatory vacuum created by the intersection of telecommunications law, financial regulation, and national security classification." },
    ],
    "vaultkey-protocol": [
      { title: "The Meridian Patent", summary: "A cryptographic patent that hides in plain sight.", content: "United States Patent 8,234,XXX describes a 'nested settlement tokenization system' that enables the embedding of transaction records within the metadata of standard financial clearing messages." },
      { title: "The Singapore Test", summary: "Alleged prototype deployment in Asian banking networks.", content: "According to sources within Singapore's financial technology sector, a prototype VaultKey module was tested within the country's interbank clearing network between 2014 and 2015." },
      { title: "Protocol V Risk Assessment", summary: "The leaked ECB memo and its implications.", content: "In 2017, a document purporting to be an internal European Central Bank risk assessment referenced 'Protocol V' as a potential threat to financial system transparency." },
      { title: "Statistical Anomalies", summary: "Academic research identifies hidden patterns in clearing data.", content: "A 2021 paper analyzed ten years of interbank clearing data and identified statistically significant anomalies in message metadata patterns." },
      { title: "Regulatory Implications", summary: "What VaultKey means for financial oversight.", content: "If the VaultKey Protocol exists as described, it represents a fundamental challenge to the architecture of financial regulation." },
    ],
    "echo-garden": [
      { title: "The Liechtenstein Foundation", summary: "Tracing the root funding entity.", content: "The foundation was registered in Liechtenstein in 2011 under the name Stiftung für Medienentwicklung. Its purpose is 'the advancement of independent journalism and public discourse.'" },
      { title: "The Amplification Network", summary: "How synchronized messaging spreads across platforms.", content: "Analysis reveals a sophisticated content amplification system. When a primary outlet publishes a story, secondary outlets and social media accounts begin sharing within a consistent 72-hour window." },
      { title: "Editorial Synchronization", summary: "Evidence of coordinated content calendars.", content: "Internal documents obtained from a former employee reveal quarterly editorial calendars distributed to network outlets, specifying themes, angles, and key messages." },
      { title: "Budget and Reach", summary: "The financial scope of the operation.", content: "Leaked financial disclosures estimate the network's annual operating budget at approximately $120 million, supporting 14 media outlets across 8 countries." },
      { title: "Counter-Operations", summary: "When the framework is turned against its creators.", content: "In 2024, a rival network deployed an identical amplification framework to counter Echo Garden narratives, demonstrating the model could be replicated." },
      { title: "Identifying the Pattern", summary: "Data science approaches to detecting coordinated media.", content: "Researchers developed a machine learning model that analyzes publication timing, linguistic similarity, and source citation patterns to identify coordinated media networks." },
    ],
    "cerberus-firewall": [
      { title: "Origins as Defensive Shield", summary: "The program's initial mandate and scope.", content: "The Cerberus program was initiated in 2009 as a defensive cybersecurity initiative designed to protect critical national infrastructure from sophisticated cyber attacks." },
      { title: "Scope Expansion", summary: "How defensive turned offensive.", content: "Between 2013 and 2015, the program's scope was expanded to include 'active threat neutralization' capabilities, including offensive cyber tools and zero-day exploits." },
      { title: "The Software Update Vector", summary: "Embedding offensive tools in routine patches.", content: "A contractor alleged that offensive cyber tools were embedded in routine software updates distributed to critical infrastructure operators." },
      { title: "Allied Nation Collection", summary: "Evidence of unauthorized surveillance of partners.", content: "An independent audit found evidence that Cerberus tools had been used to collect data from networks belonging to at least four allied nations without their knowledge." },
      { title: "Restructuring and Disclosure", summary: "The program's partial declassification.", content: "In 2022, the Cerberus program was officially restructured following legislative review. Offensive capabilities were separated into a distinct program with enhanced oversight." },
      { title: "Technical Forensics", summary: "Analysis of recovered code artifacts.", content: "Security researchers who analyzed fragments of Cerberus toolkit code found sophisticated capabilities including rootkit deployment, encrypted exfiltration channels, and evidence destruction modules." },
      { title: "International Fallout", summary: "Diplomatic consequences of the revelations.", content: "The disclosure of allied nation surveillance operations created significant diplomatic tensions, leading to formal protests and the renegotiation of several intelligence-sharing agreements." },
    ],
    "phantom-ledger": [
      { title: "Arcturis Global", summary: "The holding company that shouldn't exist.", content: "Arcturis Global was incorporated in 2005 across seven jurisdictions simultaneously—a highly unusual legal maneuver requiring coordinated filings in the Cayman Islands, Luxembourg, Singapore, Dubai, the BVI, Delaware, and Hong Kong." },
      { title: "The Parallel Books", summary: "Discovery of the second ledger.", content: "When Arcturis Global entered bankruptcy proceedings in 2011, forensic accountants discovered a second set of books embedded within the company's accounting system." },
      { title: "Ghost Entities", summary: "Tracing counterparties that don't exist.", content: "The phantom entities referenced in the parallel ledger were traced to addresses that consistently turned out to be abandoned office spaces or addresses that didn't physically exist." },
      { title: "Coordinate Encoding Theory", summary: "Are the ledger entries actually a map?", content: "A mathematician proposed that the transaction amounts and codes, when subjected to a specific transformation, yield geographic coordinates corresponding to locations in remote areas of six countries." },
      { title: "The Silent Executives", summary: "Why former leaders refuse to speak.", content: "Two former executives who were subpoenaed invoked national security privilege. Their legal representation was provided by a firm specializing in defense and intelligence community matters." },
    ],
    "iron-meridian": [
      { title: "Anomalous Shipping Routes", summary: "Trade patterns that defy economic logic.", content: "Maritime tracking data reveals a network of shipping routes connecting ports in nations that have minimal official trade relationships, using dedicated vessels not in commercial registries." },
      { title: "Ghost Ports", summary: "Satellite imagery of unlisted facilities.", content: "High-resolution satellite imagery reveals the construction of port facilities at three coastal locations that do not appear on any nautical charts." },
      { title: "The Meridian Framework", summary: "Diplomatic cables reveal bilateral agreements.", content: "Leaked diplomatic cables reference a 'Meridian Framework' establishing exclusive resource extraction and transportation corridors between non-adjacent nations." },
      { title: "Resource Corridors Mapped", summary: "Independent researchers connect the dots.", content: "A team of independent researchers published a comprehensive analysis mapping 12 suspected Meridian corridors across four continents." },
      { title: "Expanded Operations", summary: "New satellite data confirms growth.", content: "Updated satellite imagery from 2024 confirms that operations at 8 of the 12 suspected Meridian sites have expanded significantly." },
      { title: "Strategic Implications", summary: "What parallel resource networks mean for global order.", content: "The existence of the Meridian Framework has profound implications for the international economic order, enabling nations to circumvent sanctions and avoid tariffs." },
    ],
    "silverthread-archive": [
      { title: "The Underground Facility", summary: "Construction hidden behind a geological survey.", content: "In 1978, a large-scale construction project created an underground facility spanning approximately 10,000 square meters across three levels." },
      { title: "Operational Scale", summary: "200 staff running 24/7 intercept operations.", content: "At its peak in the mid-1980s, the facility housed approximately 200 staff working in three shifts covering satellite communications, undersea cable taps, and HF radio transmissions." },
      { title: "Official Decommissioning", summary: "The program that was shut down but wasn't.", content: "The program was officially terminated in 1993 and the facility listed as 'decommissioned and sealed.' However, subsequent investigations revealed the decommissioning was incomplete." },
      { title: "Urban Explorer Discovery", summary: "Climate-controlled and powered, decades after closure.", content: "In 2010, urban explorers discovered the facility was still fully powered and climate-controlled with active ventilation, functioning lighting, and operational security cameras." },
      { title: "Classification Persistence", summary: "Freedom of information reveals nothing.", content: "FOIA requests filed in 2020 were denied in their entirety on national security grounds, citing ongoing classification of 'all records related to the facility.'" },
      { title: "The Leaked Index", summary: "Partial catalog reveals decades of collected communications.", content: "In 2025, a partial index appeared online referencing millions of intercepted communications spanning from the late 1970s to at least 2019—well beyond the program's official termination." },
      { title: "Archive Significance", summary: "What the collection means for history and accountability.", content: "If the archive exists as described, it represents one of the largest collections of intercepted communications in history with profound implications for privacy and accountability." },
    ],
    "obsidian-charter": [
      { title: "First References", summary: "Intercepted communications mention a founding document.", content: "The earliest known reference to the Obsidian Charter appears in 2001 communications between individuals associated with private intelligence firms." },
      { title: "The Anonymous Interview", summary: "A former intelligence officer describes the framework.", content: "In 2006, a former intelligence officer described a charter-based organization creating an 'intelligence commonwealth' operating without government oversight." },
      { title: "Coordinated Corporate Founding", summary: "Seven firms, one pattern.", content: "Analysis reveals seven private intelligence firms were founded within an 18-month period between 2001 and 2003, each by former senior intelligence officials, with strikingly similar structures." },
      { title: "Senate Inquiry", summary: "Congressional subpoena meets attorney-client privilege.", content: "A 2017 Senate inquiry subpoenaed the document from several firms. All declined, claiming attorney-client privilege as a legal agreement with shared counsel." },
      { title: "Government Contracts", summary: "Billions in funding with minimal oversight.", content: "By 2022, the seven firms had collectively been awarded over $2.3 billion in government contracts spanning defense, intelligence, and homeland security." },
      { title: "Implications for Democratic Oversight", summary: "When intelligence goes private.", content: "The Obsidian Charter represents a fundamental challenge to democratic oversight of intelligence activities, as private firms operate outside legislative authorization requirements." },
    ],
  };

  const sourceIds: Record<string, number[]> = {};

  for (const [slug, nodeList] of Object.entries(nodesData)) {
    const holeId = holeIds[slug];

    const holeSources = [
      { holeId, title: `${slug.replace(/-/g, " ")} — Primary Document Analysis`, author: "Dr. M. Harken", origin: "International Research Quarterly", publishedDate: "2023-06-15", url: `https://example.com/research/${slug}-primary`, summary: "Comprehensive analysis of primary documentation.", type: "document", stanceTag: "supporting", credibility: 85 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Independent Verification Report`, author: "L. Vasquez & K. Chen", origin: "Open Source Intelligence Review", publishedDate: "2022-11-20", url: `https://example.com/research/${slug}-verification`, summary: "Independent third-party verification of key claims.", type: "report", stanceTag: "neutral", credibility: 78 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Critical Assessment`, author: "Prof. J. Whitfield", origin: "Strategic Analysis Bulletin", publishedDate: "2024-01-08", url: `https://example.com/research/${slug}-critical`, summary: "Critical evaluation challenging key assumptions.", type: "analysis", stanceTag: "opposing", credibility: 72 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Whistleblower Testimony`, author: "Anonymous Source (verified)", origin: "Investigative Press Consortium", publishedDate: "2023-09-12", url: `https://example.com/research/${slug}-testimony`, summary: "Anonymized testimony from an individual with direct knowledge.", type: "testimony", stanceTag: "supporting", credibility: 65 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Satellite & Signals Data`, author: "GeoWatch Analytics", origin: "Remote Sensing Data Archive", publishedDate: "2024-03-01", url: `https://example.com/research/${slug}-satellite`, summary: "Technical analysis of satellite imagery and signals data.", type: "data", stanceTag: "supporting", credibility: 90 },
    ];

    const insertedSources: number[] = [];
    for (const s of holeSources) {
      const [src] = await db.insert(sources).values(s).returning();
      insertedSources.push(src.id);
    }
    sourceIds[slug] = insertedSources;

    for (let i = 0; i < nodeList.length; i++) {
      await db.insert(depthNodes).values({
        holeId, title: nodeList[i].title, summary: nodeList[i].summary, content: nodeList[i].content, position: i + 1, status: "unlocked", branchLinks: [],
      });
    }

    const claimsForHole = [
      { holeId, statement: `Primary evidence supports the existence of ${slug.replace(/-/g, " ")} operations as described.`, stance: "supported", confidence: 78, evidence: [{ sourceId: insertedSources[0], excerpt: "Primary documentation corroborates operational timeline." }, { sourceId: insertedSources[4], excerpt: "Technical data independently verifies key claims." }], counterpoints: [{ sourceId: insertedSources[2], excerpt: "Alternative interpretations remain plausible." }] },
      { holeId, statement: `The organizational structure behind ${slug.replace(/-/g, " ")} extends beyond public records.`, stance: "speculative", confidence: 55, evidence: [{ sourceId: insertedSources[3], excerpt: "Testimony indicates additional layers not publicly visible." }], counterpoints: [{ sourceId: insertedSources[2], excerpt: "Lack of corroborating documentation weakens this claim." }] },
      { holeId, statement: `Financial flows associated with ${slug.replace(/-/g, " ")} have been independently verified.`, stance: "supported", confidence: 82, evidence: [{ sourceId: insertedSources[1], excerpt: "Independent verification confirms financial trail." }], counterpoints: [] },
      { holeId, statement: `There is circumstantial evidence linking ${slug.replace(/-/g, " ")} to broader geopolitical objectives.`, stance: "disputed", confidence: 45, evidence: [{ sourceId: insertedSources[3], excerpt: "Testimony references strategic objectives." }], counterpoints: [{ sourceId: insertedSources[2], excerpt: "Correlation does not establish causation." }] },
    ];

    for (const c of claimsForHole) {
      await db.insert(claims).values(c);
    }

    const mediaForHole = [
      { holeId, title: `${slug} Infrastructure Map`, url: `https://placehold.co/800x600/1a1a2e/8B0000?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Map`, type: "image", caption: "Mapped infrastructure and connection points." },
      { holeId, title: `${slug} Document Excerpt`, url: `https://placehold.co/800x600/1a1a2e/EDEDED?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Document`, type: "image", caption: "Redacted excerpt from primary source documentation." },
      { holeId, title: `${slug} Timeline Visualization`, url: `https://placehold.co/800x600/1a1a2e/4a9eff?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Timeline`, type: "image", caption: "Chronological visualization of key events." },
      { holeId, title: `${slug} Network Analysis`, url: `https://placehold.co/800x400/1a1a2e/00cc66?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Network`, type: "image", caption: "Network graph showing entity relationships." },
    ];

    for (const m of mediaForHole) {
      await db.insert(media).values(m);
    }
  }

  for (const [slug, sIds] of Object.entries(sourceIds)) {
    const holeId = holeIds[slug];
    await db.update(rabbitHoles).set({ sourceCount: sIds.length }).where(eq(rabbitHoles.id, holeId));
  }

  console.log("[auto-seed] 8 content rabbit holes with nodes, sources, claims, media seeded.");

  await seedLiveStreaming();
  await seedPodcasts(holeIds);
}

async function seedLiveStreaming() {
  const allEmployees = await db.select().from(employees);
  const adminEmp = allEmployees[0];
  if (!adminEmp) {
    console.log("[auto-seed] No employees found, skipping live streaming seed.");
    return;
  }

  const [creator1] = await db.insert(creators).values({
    employeeId: adminEmp.id,
    handle: "deep-signal",
    displayName: "Deep Signal",
    bio: "Live investigative broadcasts exploring hidden networks, classified programs, and the stories behind the stories.",
    avatarUrl: "https://placehold.co/200x200/8B0000/EDEDED?text=DS",
    bannerUrl: "https://placehold.co/1200x400/1a1a2e/8B0000?text=DEEP+SIGNAL",
    isActive: true,
  }).returning();

  const [creator2] = await db.insert(creators).values({
    employeeId: adminEmp.id,
    handle: "cipher-desk",
    displayName: "The Cipher Desk",
    bio: "Decrypting complexity. Live analysis of financial systems, cryptographic protocols, and technology.",
    avatarUrl: "https://placehold.co/200x200/1a1a2e/EDEDED?text=CD",
    bannerUrl: "https://placehold.co/1200x400/1a1a2e/4a9eff?text=CIPHER+DESK",
    isActive: true,
  }).returning();

  const now = new Date();
  const hour = 3600000;
  const day = 86400000;

  const [stream1] = await db.insert(streams).values([
    { creatorId: creator1.id, title: "Aurora Network: The Underground Map — Live Breakdown", description: "Live analysis of recently declassified mapping data related to the Aurora Network investigation.", status: "Published", streamState: "live", scheduledStart: new Date(now.getTime() - 2 * hour), startedAt: new Date(now.getTime() - hour), tags: ["aurora-network", "infrastructure"], thumbnailUrl: "https://placehold.co/640x360/1a1a2e/8B0000?text=LIVE+Aurora+Network", provider: "custom_iframe", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", visibility: "public", chatEnabled: true },
    { creatorId: creator1.id, title: "Cerberus Source Code Deep Dive — Premium Exclusive", description: "Premium subscribers only. Going line by line through the leaked Cerberus source code fragments.", status: "Published", streamState: "live", scheduledStart: new Date(now.getTime() - 3 * hour), startedAt: new Date(now.getTime() - 2 * hour), tags: ["cerberus-firewall", "cybersecurity"], thumbnailUrl: "https://placehold.co/640x360/1a1a2e/ff4444?text=PREMIUM+Cerberus+Code", provider: "custom_iframe", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", visibility: "premium", chatEnabled: true },
    { creatorId: creator2.id, title: "VaultKey Protocol: Following the Money — Premium Analysis", description: "Premium deep-dive into the financial trail behind the VaultKey Protocol.", status: "Published", streamState: "live", scheduledStart: new Date(now.getTime() - hour), startedAt: new Date(now.getTime() - 30 * 60000), tags: ["vaultkey-protocol", "finance"], thumbnailUrl: "https://placehold.co/640x360/1a1a2e/ffd700?text=PREMIUM+VaultKey", provider: "custom_iframe", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", visibility: "premium", chatEnabled: true },
  ]).returning();

  await db.insert(streams).values([
    { creatorId: creator1.id, title: "Echo Garden: Mapping the Amplification Network", description: "Tracing the full amplification pipeline of the Echo Garden media network.", status: "Published", streamState: "upcoming", scheduledStart: new Date(now.getTime() + 3 * day), tags: ["echo-garden", "media"], thumbnailUrl: "https://placehold.co/640x360/1a1a2e/00cc66?text=UPCOMING+Echo+Garden", provider: "custom_iframe", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", visibility: "public", chatEnabled: true },
    { creatorId: creator2.id, title: "Phantom Ledger: Coordinate Encoding Workshop", description: "Interactive session decoding geographic coordinates embedded in Phantom Ledger entries.", status: "Published", streamState: "upcoming", scheduledStart: new Date(now.getTime() + 5 * day), tags: ["phantom-ledger", "cryptography"], thumbnailUrl: "https://placehold.co/640x360/1a1a2e/9966ff?text=UPCOMING+Phantom+Ledger", provider: "custom_iframe", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", visibility: "premium", chatEnabled: true },
  ]);

  const [endedStream] = await db.insert(streams).values({
    creatorId: creator1.id, title: "Iron Meridian: Satellite Evidence Review — Recorded", description: "Recorded session reviewing satellite imagery data related to Iron Meridian resource corridors.", status: "Published", streamState: "ended", scheduledStart: new Date(now.getTime() - 7 * day), startedAt: new Date(now.getTime() - 7 * day), endedAt: new Date(now.getTime() - 7 * day + 2 * hour), tags: ["iron-meridian", "satellite"], thumbnailUrl: "https://placehold.co/640x360/1a1a2e/888888?text=REPLAY+Iron+Meridian", provider: "custom_iframe", embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", visibility: "public", chatEnabled: false,
  }).returning();

  await db.insert(streamReplays).values({
    streamId: endedStream.id, embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", durationSeconds: 7200,
  });

  console.log("[auto-seed] Live streaming content (2 creators, 6 streams, 1 replay) seeded.");
}

async function seedPodcasts(holeIds: Record<string, number>) {
  const [podcast1] = await db.insert(podcasts).values({
    title: "Down the Rabbit Hole", description: "Weekly deep-dives into investigative research, featuring expert interviews and document analysis.", platform: "Spotify", showUrl: "https://open.spotify.com/show/example1", coverImageUrl: "https://placehold.co/400x400/8B0000/EDEDED?text=Down+The+Rabbit+Hole",
  }).returning();

  const [podcast2] = await db.insert(podcasts).values({
    title: "Signal & Noise", description: "Separating signal from noise in intelligence, cybersecurity, and geopolitical analysis.", platform: "YouTube", showUrl: "https://youtube.com/@signal-and-noise-example", coverImageUrl: "https://placehold.co/400x400/1a1a2e/4a9eff?text=Signal+%26+Noise",
  }).returning();

  const p1Ids: number[] = [];
  for (const ep of [
    { podcastId: podcast1.id, title: "Ep 1: The Aurora Discovery", description: "How underground fiber-optic networks went from urban legend to verified reality.", publishedDate: "2025-09-01", durationSeconds: 3420, episodeUrl: "https://open.spotify.com/episode/ex1", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex1", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 2: Following the Shell Companies", description: "Novaflux GmbH and the corporate structures behind hidden infrastructure.", publishedDate: "2025-09-15", durationSeconds: 2880, episodeUrl: "https://open.spotify.com/episode/ex2", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex2", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 3: Echo Garden Exposed", description: "Inside the $120M media amplification network.", publishedDate: "2025-10-01", durationSeconds: 3180, episodeUrl: "https://open.spotify.com/episode/ex3", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex3", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 4: The Phantom Ledger Mystery", description: "Ghost entities, encoded coordinates, and silent executives.", publishedDate: "2025-10-15", durationSeconds: 3600, episodeUrl: "https://open.spotify.com/episode/ex4", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex4", status: "Review", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 5: Silverthread — The Archive That Won't Die", description: "The leaked archive index and 40 years of intercepted communications.", publishedDate: "2025-11-01", durationSeconds: 2700, episodeUrl: "", embedType: "iframe", embedUrl: "", status: "Draft", createdBy: "admin@rabbithole.io" },
  ]) {
    const [inserted] = await db.insert(podcastEpisodes).values(ep).returning();
    p1Ids.push(inserted.id);
  }

  const p2Ids: number[] = [];
  for (const ep of [
    { podcastId: podcast2.id, title: "S&N 01: Cerberus — Defense vs. Offense", description: "The fine line between defensive and offensive cybersecurity operations.", publishedDate: "2025-08-15", durationSeconds: 2400, episodeUrl: "https://youtube.com/watch?v=ex5", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex5", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 02: The Obsidian Charter Question", description: "Do private intelligence firms operate under a shared charter?", publishedDate: "2025-09-01", durationSeconds: 2700, episodeUrl: "https://youtube.com/watch?v=ex6", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex6", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 03: VaultKey — Hidden Transactions", description: "Cryptography meets finance. Nested tokenization and invisible transaction layers.", publishedDate: "2025-09-15", durationSeconds: 3000, episodeUrl: "https://youtube.com/watch?v=ex7", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex7", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 04: Iron Meridian Resources", description: "Mapping the parallel resource corridors.", publishedDate: "2025-10-01", durationSeconds: 2580, episodeUrl: "https://youtube.com/watch?v=ex8", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex8", status: "Review", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 05: Numbers Stations 2025", description: "New shortwave signals detected. Are numbers stations coming back?", publishedDate: "", durationSeconds: 0, episodeUrl: "", embedType: "iframe", embedUrl: "", status: "Draft", createdBy: "admin@rabbithole.io" },
  ]) {
    const [inserted] = await db.insert(podcastEpisodes).values(ep).returning();
    p2Ids.push(inserted.id);
  }

  const episodeLinks = [
    { rabbitHoleId: holeIds["aurora-network"], episodeId: p1Ids[0], sortOrder: 1, pinned: true },
    { rabbitHoleId: holeIds["aurora-network"], episodeId: p1Ids[1], sortOrder: 2, pinned: false },
    { rabbitHoleId: holeIds["echo-garden"], episodeId: p1Ids[2], sortOrder: 1, pinned: true },
    { rabbitHoleId: holeIds["cerberus-firewall"], episodeId: p2Ids[0], sortOrder: 1, pinned: true },
    { rabbitHoleId: holeIds["obsidian-charter"], episodeId: p2Ids[1], sortOrder: 1, pinned: false },
    { rabbitHoleId: holeIds["vaultkey-protocol"], episodeId: p2Ids[2], sortOrder: 1, pinned: true },
  ];

  for (const link of episodeLinks) {
    await db.insert(rabbitHolePodcastEpisodes).values(link);
  }

  await db.insert(sponsoredPodcastSlots).values({
    rabbitHoleId: holeIds["aurora-network"], sponsorName: "SecureNet VPN", sponsorUrl: "https://example.com/securenet", disclosureText: "This investigation is supported by SecureNet VPN. Sponsorship does not influence editorial content.", episodeId: p1Ids[0], startDate: "2025-09-01", endDate: "2026-03-01", active: true,
  });

  console.log("[auto-seed] Podcasts (2 shows, 10 episodes, 6 links, 1 sponsored slot) seeded.");
}
