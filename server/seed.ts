import { eq } from "drizzle-orm";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { rabbitHoles, comments, depthNodes, claims, sources, categories } from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding database...");

  const existingCats = await db.select().from(categories);
  if (existingCats.length === 0) {
    await db.insert(categories).values([
      { name: "Intelligence", slug: "intelligence", description: "Covert operations, spy agencies, and classified programs", icon: "shield" },
      { name: "Geopolitics", slug: "geopolitics", description: "Global power dynamics and hidden diplomatic maneuvering", icon: "globe" },
      { name: "History", slug: "history", description: "Suppressed histories, lost civilizations, and revisionist narratives", icon: "book" },
      { name: "Technology", slug: "technology", description: "Surveillance tech, AI, and digital warfare", icon: "cpu" },
      { name: "Finance", slug: "finance", description: "Shadow banking, market manipulation, and economic conspiracies", icon: "dollar-sign" },
      { name: "Mysteries", slug: "mysteries", description: "Unsolved puzzles, cryptography, and enigmatic phenomena", icon: "search" },
      { name: "Media Narratives", slug: "media", description: "Propaganda, disinformation campaigns, and narrative control", icon: "tv" },
    ]);
    console.log("Categories seeded.");
  }

  const existingHoles = await db.select().from(rabbitHoles);
  if (existingHoles.length > 0) {
    console.log("Rabbit holes already seeded. Checking for depth nodes...");

    const existingNodes = await db.select().from(depthNodes);
    if (existingNodes.length > 0) {
      console.log("Depth nodes already exist, skipping full seed.");
      await pool.end();
      return;
    }

    const mkUltra = existingHoles.find(h => h.slug === "mk-ultra");
    const vatican = existingHoles.find(h => h.slug === "vatican-archives");
    const cicada = existingHoles.find(h => h.slug === "cicada-3301");
    const numbers = existingHoles.find(h => h.slug === "number-stations");
    const biolabs = existingHoles.find(h => h.slug === "biolabs-central-asia");

    if (mkUltra) {
      await db.update(rabbitHoles).set({ categorySlug: "intelligence" }).where(eq(rabbitHoles.id, mkUltra.id));
      await seedMKUltraExtras(mkUltra.id);
    }
    if (vatican) {
      await db.update(rabbitHoles).set({ categorySlug: "history" }).where(eq(rabbitHoles.id, vatican.id));
      await seedVaticanExtras(vatican.id);
    }
    if (cicada) {
      await db.update(rabbitHoles).set({ categorySlug: "mysteries" }).where(eq(rabbitHoles.id, cicada.id));
      await seedCicadaExtras(cicada.id);
    }
    if (numbers) {
      await db.update(rabbitHoles).set({ categorySlug: "intelligence" }).where(eq(rabbitHoles.id, numbers.id));
    }
    if (biolabs) {
      await db.update(rabbitHoles).set({ categorySlug: "geopolitics" }).where(eq(rabbitHoles.id, biolabs.id));
    }

    console.log("Extended data seeded for existing holes.");
    await pool.end();
    return;
  }

  const holes = await db.insert(rabbitHoles).values([
    {
      slug: "mk-ultra",
      title: "Project MKUltra",
      summary: "A decades-long clandestine program by the Central Intelligence Agency (CIA) intended to develop procedures and identify drugs such as LSD that could be used in interrogations to weaken the individual and force confessions through mind control.",
      status: "Verified",
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
        { year: "1977", event: "Freedom of Information Act request uncovers 20,000 surviving documents.", type: "verified" }
      ],
    },
    {
      slug: "vatican-archives",
      title: "The Apostolic Archive",
      summary: "Deep dive into the restricted layers of the Vatican Secret Archives, focusing on 17th-century diplomatic suppressions, the Chinon Parchment discovery, and classified papal correspondence that reshaped geopolitical alliances.",
      status: "Specialist",
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
        { year: "2020", event: "Pius XII wartime files declassified amid controversy.", type: "verified" }
      ],
    },
    {
      slug: "biolabs-central-asia",
      title: "Steppe Pathogens",
      summary: "Tracing the lineage of Soviet-era biological research facilities across Kazakhstan and Uzbekistan, from Aralsk-7 to modern cooperative threat reduction programs and their geopolitical implications.",
      status: "Specialist",
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
        { year: "2018", event: "Renewed geopolitical tensions over remaining facilities spark fresh investigation.", type: "disputed" }
      ],
    },
    {
      slug: "cicada-3301",
      title: "Cicada 3301",
      summary: "Three sets of highly complex puzzles posted anonymously online between 2012-2014, incorporating cryptography, steganography, data security, and ancient philosophies. Believed to be a recruitment tool for a secretive intelligence or hacking organization.",
      status: "Unsolved",
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
        { year: "2016", event: "Suspected copycats emerge. No verified communication from original Cicada since 2014.", type: "disputed" }
      ],
    },
    {
      slug: "number-stations",
      title: "Numbers Stations",
      summary: "Shortwave radio stations broadcasting formatted numbers, believed to be encrypted messages for intelligence operations. Active since the Cold War, several remain operational today with no government acknowledging ownership.",
      status: "Active",
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
        { year: "2023", event: "Multiple new unidentified stations detected across HF bands, origins unknown.", type: "disputed" }
      ],
    },
  ]).returning();

  const mkUltra = holes.find(h => h.slug === "mk-ultra")!;
  const vatican = holes.find(h => h.slug === "vatican-archives")!;
  const cicada = holes.find(h => h.slug === "cicada-3301")!;

  await db.insert(comments).values([
    {
      holeId: mkUltra.id,
      username: "Watcher_99",
      reputation: 1402,
      content: "If you look at the declassified budget for 1963, there is a massive unaccounted discrepancy that aligns perfectly with the expansion of the Subproject 68 facilities in San Francisco.",
      upvotes: 342,
      links: [{ text: "Subproject 68 facilities", target: "Midnight Climax" }],
    },
    {
      holeId: mkUltra.id,
      username: "Null_State",
      reputation: 890,
      content: "The timeline presented here misses the preliminary research done at Edgewood Arsenal before the project was officially sanctioned. This is critical context.",
      upvotes: 128,
      links: [],
    },
    {
      holeId: mkUltra.id,
      username: "TruthSeeker",
      reputation: 42,
      content: "Has anyone cross-referenced the doctors involved with the earlier Operation Paperclip personnel? There are at least three overlapping names in the declassified personnel files.",
      upvotes: 89,
      links: [{ text: "Operation Paperclip", target: "operation-paperclip" }],
    },
  ]);

  await seedMKUltraExtras(mkUltra.id);
  await seedVaticanExtras(vatican.id);
  await seedCicadaExtras(cicada.id);

  console.log(`Seeded ${holes.length} rabbit holes with comments, depth nodes, claims, and sources.`);
  await pool.end();
}

async function seedMKUltraExtras(holeId: number) {
  const nodes = await db.insert(depthNodes).values([
    {
      holeId,
      title: "Origins: Operation Bluebird",
      summary: "Before MKUltra, the CIA ran Operation Bluebird (1950) and Operation Artichoke (1951), early mind control programs that laid the groundwork.",
      content: "In the early days of the Cold War, the CIA became increasingly concerned about Soviet and Chinese advances in brainwashing and interrogation techniques. Reports of 'converted' American POWs during the Korean War created panic within the intelligence community.\n\nOperation Bluebird, initiated in 1950, was the first formal CIA program to investigate interrogation and mind control methods. It explored hypnosis, morphine addiction, forced withdrawal, and other techniques.\n\nBy 1951, the program was renamed Operation Artichoke and expanded to include the use of chemicals and biological agents. These early programs directly led to the creation of MKUltra in 1953.",
      position: 0,
      status: "unlocked",
      branchLinks: [],
    },
    {
      holeId,
      title: "The LSD Experiments",
      summary: "The CIA administered LSD to unwitting subjects including government employees, military personnel, and civilians.",
      content: "One of MKUltra's most notorious aspects was the widespread testing of LSD on human subjects, often without their knowledge or consent. The CIA believed LSD could be used as a truth serum or to disorient enemy agents.\n\nDr. Sidney Gottlieb, the program's chief scientist, personally oversaw many of these experiments. In one infamous incident, CIA officer Frank Olson was given LSD without his knowledge and died days later under suspicious circumstances—officially ruled a suicide, later reclassified as homicide.\n\nOperation Midnight Climax set up safe houses in San Francisco and New York where CIA operatives hired sex workers to lure men, who were then secretly dosed with LSD and observed through one-way mirrors.",
      position: 1,
      status: "unlocked",
      branchLinks: [{ label: "Operation Midnight Climax", targetSlug: "mk-ultra" }],
    },
    {
      holeId,
      title: "Subproject 68: The Montreal Experiments",
      summary: "Dr. Donald Ewen Cameron's horrifying experiments at McGill University involved 'psychic driving' and sensory deprivation.",
      content: "Perhaps the most disturbing chapter of MKUltra took place at McGill University's Allan Memorial Institute in Montreal, Canada. Dr. Donald Ewen Cameron, funded through CIA front organizations, conducted experiments that would later be classified as torture.\n\nCameron's technique of 'psychic driving' involved putting patients into drug-induced comas for weeks at a time while playing looped audio messages hundreds of thousands of times. He also used massive electroshock therapy—30 to 40 times the normal voltage.\n\nMany of Cameron's victims were ordinary psychiatric patients who came seeking help for minor conditions like anxiety or postpartum depression. They emerged with shattered identities, unable to recognize family members or perform basic functions.",
      position: 2,
      status: "locked",
      branchLinks: [],
    },
    {
      holeId,
      title: "The Cover-Up",
      summary: "In 1973, CIA Director Richard Helms ordered the destruction of all MKUltra files. Thousands of documents were burned.",
      content: "As Watergate-era investigations began closing in on CIA activities, Director Richard Helms made the fateful decision to order the destruction of all MKUltra files in 1973. An estimated 20,000 documents were destroyed.\n\nHowever, a cache of financial records survived—they had been incorrectly filed in a different building. These approximately 20,000 pages were discovered in 1977 through a Freedom of Information Act request and provided the bulk of what we know about the program today.\n\nThe Church Committee (1975) and subsequent congressional hearings exposed MKUltra to the public. Former CIA director Admiral Stansfield Turner testified that the program involved 149 subprojects at 80 institutions.",
      position: 3,
      status: "locked",
      branchLinks: [],
    },
  ]).returning();

  await db.insert(sources).values([
    { holeId, title: "CIA Declassified Archives: Behavior Modification", author: "Central Intelligence Agency", origin: "USA", publishedDate: "1977", url: "", summary: "Surviving financial records and memos from the MKUltra program discovered via FOIA request.", type: "document", stanceTag: "neutral", credibility: 98 },
    { holeId, title: "Church Committee Report Book 1", author: "U.S. Senate Select Committee", origin: "USA", publishedDate: "1975", url: "", summary: "Congressional investigation report detailing intelligence community abuses including MKUltra.", type: "document", stanceTag: "neutral", credibility: 95 },
    { holeId, title: "The Search for the Manchurian Candidate", author: "John Marks", origin: "USA", publishedDate: "1979", url: "", summary: "Investigative journalist's comprehensive account based on declassified CIA documents.", type: "book", stanceTag: "neutral", credibility: 88 },
    { holeId, title: "Speculative: Operation Midnight Climax Extensions", author: "Unknown", origin: "USA", publishedDate: "", url: "", summary: "Unverified claims about extended Midnight Climax operations beyond San Francisco.", type: "theory", stanceTag: "supporting", credibility: 40 },
  ]);

  await db.insert(claims).values([
    { holeId, nodeId: nodes[0].id, statement: "MKUltra was a direct continuation of Operation Bluebird and Artichoke programs", stance: "Verified", confidence: 95, evidence: [{ sourceId: 1, excerpt: "Declassified CIA memo references Bluebird as predecessor program" }], counterpoints: [] },
    { holeId, nodeId: nodes[1].id, statement: "Frank Olson was murdered by the CIA to prevent disclosure of MKUltra operations", stance: "Disputed", confidence: 65, evidence: [{ sourceId: 3, excerpt: "Forensic analysis in 1994 found cranial injuries inconsistent with a fall" }], counterpoints: [{ sourceId: 2, excerpt: "Original investigation ruled death a suicide" }] },
    { holeId, nodeId: nodes[2].id, statement: "Over 100 Canadian citizens were subjected to Cameron's experiments without informed consent", stance: "Verified", confidence: 90, evidence: [{ sourceId: 2, excerpt: "Church Committee testimony confirmed non-consensual experimentation" }], counterpoints: [] },
    { holeId, statement: "MKUltra techniques were used in the enhanced interrogation program post-9/11", stance: "Speculative", confidence: 35, evidence: [], counterpoints: [{ sourceId: 2, excerpt: "No direct documentary link established between programs" }] },
  ]);
}

async function seedVaticanExtras(holeId: number) {
  await db.insert(depthNodes).values([
    {
      holeId,
      title: "The Founding of the Secret Archives",
      summary: "Pope Paul V established the Vatican Secret Archives in 1612, centralizing centuries of papal documents.",
      content: "The Vatican Apostolic Archive (formerly 'Secret' Archive) holds an estimated 85 kilometers of shelving with documents spanning over 800 years. The word 'secret' derives from the Latin 'secretum' meaning 'private' rather than hidden.\n\nPope Paul V consolidated the archive in 1612 to centralize papal records that had been scattered across various locations. Access was extremely restricted—only the Pope and a handful of officials could enter.\n\nThe archive contains papal bulls, diplomatic correspondence, trial records (including Galileo's), and financial records of the Papal States. Researchers estimate that only a fraction of the archive's contents have been studied.",
      position: 0,
      status: "unlocked",
      branchLinks: [],
    },
    {
      holeId,
      title: "The Chinon Parchment",
      summary: "A lost document proving the Pope absolved the Knights Templar of heresy was found in 2001.",
      content: "In 2001, Italian researcher Barbara Frale discovered the Chinon Parchment in the Vatican Archives—a document that had been 'misfiled' for 700 years. The parchment revealed that Pope Clement V had secretly absolved the Knights Templar of heresy in 1308.\n\nThis contradicted the official historical narrative that the Templars were condemned by the Church. The document showed that Clement V had been pressured by King Philip IV of France to dissolve the order, but privately found them innocent of the heresy charges.\n\nThe discovery raised fundamental questions about how many other significant documents might be 'lost' within the archives' vast, partially catalogued collection.",
      position: 1,
      status: "unlocked",
      branchLinks: [],
    },
    {
      holeId,
      title: "Pius XII and the Holocaust",
      summary: "Newly declassified files reveal the Vatican's knowledge of and response to the Holocaust.",
      content: "In March 2020, Pope Francis opened the archives of Pope Pius XII's pontificate (1939-1958) to researchers. The decision was highly anticipated—Pius XII's response to the Holocaust has been one of the most contentious debates in modern Church history.\n\nEarly findings revealed that the Vatican had detailed knowledge of the Holocaust as early as 1942, including reports from multiple sources describing mass exterminations. Yet Pius XII chose a policy of diplomatic neutrality, avoiding public condemnation of Nazi atrocities.\n\nResearchers also found evidence of behind-the-scenes efforts to protect some Jewish individuals, alongside troubling instances where Vatican officials appeared to prioritize institutional interests over humanitarian concerns.",
      position: 2,
      status: "locked",
      branchLinks: [],
    },
  ]);

  await db.insert(sources).values([
    { holeId, title: "The Chinon Parchment - Full Translation", author: "Barbara Frale", origin: "Vatican City", publishedDate: "2001", url: "", summary: "Recovered document showing papal absolution of the Knights Templar.", type: "document", stanceTag: "neutral", credibility: 97 },
    { holeId, title: "Vatican Secret Diplomacy", author: "Peter Godman", origin: "UK", publishedDate: "2004", url: "", summary: "Comprehensive academic study of Vatican diplomatic activities based on archived documents.", type: "book", stanceTag: "neutral", credibility: 85 },
    { holeId, title: "Pius XII and the Holocaust - Declassified Correspondence", author: "Vatican Archives", origin: "Vatican City", publishedDate: "2020", url: "", summary: "Official papal correspondence from 1939-1945 regarding wartime activities.", type: "document", stanceTag: "neutral", credibility: 92 },
  ]);

  await db.insert(claims).values([
    { holeId, statement: "The Chinon Parchment was deliberately hidden to suppress knowledge of Templar absolution", stance: "Disputed", confidence: 45, evidence: [{ sourceId: 1, excerpt: "Document was found in an unexpected location within the archives" }], counterpoints: [{ sourceId: 2, excerpt: "The Vatican's cataloguing system is famously disorganized" }] },
    { holeId, statement: "Pope Pius XII had detailed knowledge of the Holocaust by 1942 but chose diplomatic silence", stance: "Verified", confidence: 88, evidence: [{ sourceId: 3, excerpt: "Multiple intelligence reports from 1942 describe systematic exterminations" }], counterpoints: [] },
  ]);
}

async function seedCicadaExtras(holeId: number) {
  await db.insert(depthNodes).values([
    {
      holeId,
      title: "The First Puzzle (2012)",
      summary: "On January 4, 2012, an anonymous image appeared on 4chan containing hidden clues that launched a worldwide puzzle hunt.",
      content: "The first Cicada 3301 puzzle began with a simple image posted to 4chan's /b/ board. The text read: 'Hello. We are looking for highly intelligent individuals. To find them, we have devised a test.'\n\nUsing steganography tools, solvers discovered hidden text within the image containing a URL. This led to a series of increasingly complex challenges involving Caesar ciphers, book codes, and even physical QR codes posted at locations in 14 countries.\n\nThe final stage led to an onion (.tor) website that displayed a message congratulating successful solvers and providing instructions. Those who reached this point were reportedly contacted privately, though none have publicly disclosed what followed.",
      position: 0,
      status: "unlocked",
      branchLinks: [],
    },
    {
      holeId,
      title: "Liber Primus",
      summary: "A mysterious runic text published during the 2013 puzzle remains only partially decoded to this day.",
      content: "During the second puzzle iteration in 2013, Cicada 3301 released 'Liber Primus' (First Book)—a 58-page document written in Anglo-Saxon runes. The document appears to contain philosophical and esoteric content.\n\nDespite years of effort by thousands of cryptographers and enthusiasts, only approximately 20% of the Liber Primus has been decoded. The decoded portions reference concepts from Thelema, Gematria, and various ancient mystical traditions.\n\nThe difficulty of decoding the remaining pages suggests either an extremely sophisticated cipher or that additional keys are required that haven't been discovered. Some researchers believe real-world events or discoveries may serve as triggers for unlocking further sections.",
      position: 1,
      status: "unlocked",
      branchLinks: [],
    },
  ]);

  await db.insert(sources).values([
    { holeId, title: "Liber Primus - Partial Decoded Pages", author: "Unknown", origin: "Online", publishedDate: "2013", url: "", summary: "Community-decoded portions of the mysterious Cicada 3301 runic text.", type: "document", stanceTag: "neutral", credibility: 80 },
    { holeId, title: "Analysis of Cicada 3301 Cryptographic Methods", author: "Various researchers", origin: "Online", publishedDate: "2015", url: "", summary: "Academic paper analyzing the cryptographic techniques used in Cicada puzzles.", type: "document", stanceTag: "neutral", credibility: 75 },
  ]);

  await db.insert(claims).values([
    { holeId, statement: "Cicada 3301 is a recruitment tool for a government intelligence agency", stance: "Speculative", confidence: 30, evidence: [{ sourceId: 2, excerpt: "Sophistication level suggests significant resources and expertise" }], counterpoints: [{ sourceId: 2, excerpt: "No verified connection to any government agency has been established" }] },
    { holeId, statement: "The Liber Primus contains philosophical teachings from an organized group", stance: "Disputed", confidence: 55, evidence: [{ sourceId: 1, excerpt: "Decoded portions reference organized belief systems and philosophy" }], counterpoints: [] },
  ]);
}

seed().catch(console.error);
