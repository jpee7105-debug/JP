import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { rabbitHoles, depthNodes, claims, sources, media, podcasts, podcastEpisodes, rabbitHolePodcastEpisodes, sponsoredPodcastSlots, creators, streams, streamReplays } from "../shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding structured test content...");

  const ADMIN_ID = "e6c35e27-794e-42f6-8c9c-ee0edb49be33";
  const EDITOR_ID = "b18dbb49-a0db-4810-958e-c4d483b16381";

  // ============================
  // 8 RABBIT HOLES (Published)
  // ============================

  const holes = [
    {
      slug: "aurora-network",
      title: "The Aurora Network",
      summary: "An investigation into a mysterious fiber-optic backbone discovered beneath major European cities, allegedly constructed by a private consortium with no public records. Tracing the network's funding, construction permits, and the shadowy telecommunications shell companies behind it.",
      status: "Published",
      completion: 65,
      isSpecialist: true,
      connections: 178,
      sourceCount: 22,
      categorySlug: "technology",
      labels: ["Verified", "Disputed"],
      connectedSlugs: ["vaultkey-protocol"],
      timeline: [
        { year: "2008", event: "First anomalous fiber-optic conduits detected during metro tunnel expansion in Berlin.", type: "verified" },
        { year: "2012", event: "Similar infrastructure found beneath Lyon, Brussels, and Vienna.", type: "verified" },
        { year: "2015", event: "Shell company Novaflux GmbH identified as permit holder for 3 of 7 known nodes.", type: "verified" },
        { year: "2019", event: "Whistleblower claims network is used for parallel financial settlement systems.", type: "disputed" },
        { year: "2023", event: "Investigative report links Novaflux to defunct Cold War signals intelligence program.", type: "disputed" },
      ],
    },
    {
      slug: "vaultkey-protocol",
      title: "VaultKey Protocol",
      summary: "A deep-dive into an alleged cryptographic protocol embedded in certain financial clearing systems, claimed to enable invisible micro-transactions between sovereign wealth funds. Examines the mathematics, the patent trails, and the regulatory gaps.",
      status: "Published",
      completion: 40,
      isSpecialist: true,
      connections: 95,
      sourceCount: 18,
      categorySlug: "finance",
      labels: ["Speculative"],
      connectedSlugs: ["aurora-network"],
      timeline: [
        { year: "2010", event: "Patent filed by Meridian Digital Labs for 'nested settlement tokenization' system.", type: "verified" },
        { year: "2014", event: "Prototype VaultKey module reportedly tested in Singapore interbank network.", type: "disputed" },
        { year: "2017", event: "Leaked internal memo from European Central Bank references 'Protocol V' risk assessment.", type: "disputed" },
        { year: "2021", event: "Academic paper identifies statistical anomalies consistent with hidden transaction layers.", type: "verified" },
      ],
    },
    {
      slug: "echo-garden",
      title: "Echo Garden",
      summary: "Examining a coordinated network of seemingly independent media outlets, think tanks, and social media amplifiers that trace back to a single unnamed foundation. Mapping the funding flows, editorial synchronization, and narrative propagation patterns.",
      status: "Published",
      completion: 55,
      isSpecialist: true,
      connections: 234,
      sourceCount: 31,
      categorySlug: "media",
      labels: ["Verified"],
      connectedSlugs: [],
      timeline: [
        { year: "2011", event: "Foundation registered in Liechtenstein with opaque governance structure.", type: "verified" },
        { year: "2013", event: "First cluster of aligned outlets identified publishing synchronized editorial calendars.", type: "verified" },
        { year: "2016", event: "Data analysis reveals identical talking points deployed across 14 outlets within 72-hour windows.", type: "verified" },
        { year: "2020", event: "Foundation's annual budget estimated at $120M through leaked financial disclosures.", type: "disputed" },
        { year: "2024", event: "Counter-narrative campaign deploys identical framework against original investigators.", type: "verified" },
      ],
    },
    {
      slug: "cerberus-firewall",
      title: "Cerberus Firewall",
      summary: "Investigation into a state-sponsored cybersecurity program that allegedly extended beyond defensive operations into proactive network infiltration. Analyzing leaked source code fragments, contractor testimonies, and the geopolitical implications of offensive cyber posture.",
      status: "Published",
      completion: 70,
      isSpecialist: true,
      connections: 156,
      sourceCount: 26,
      categorySlug: "technology",
      labels: ["Verified", "Disputed"],
      connectedSlugs: ["phantom-ledger"],
      timeline: [
        { year: "2009", event: "Cerberus program initially funded as defensive critical infrastructure shield.", type: "verified" },
        { year: "2013", event: "Scope expanded to include 'active threat neutralization' capabilities.", type: "verified" },
        { year: "2016", event: "Contractor reveals offensive toolkit embedded in routine software updates.", type: "disputed" },
        { year: "2019", event: "Independent audit finds evidence of unauthorized data collection from allied nations.", type: "verified" },
        { year: "2022", event: "Program officially restructured and partially declassified.", type: "verified" },
      ],
    },
    {
      slug: "phantom-ledger",
      title: "The Phantom Ledger",
      summary: "Tracing the origins and impact of a mysterious double-entry accounting system found in the archives of a collapsed multinational holding company. The ledger appears to document transactions with entities that have no legal existence.",
      status: "Published",
      completion: 30,
      isSpecialist: false,
      connections: 112,
      sourceCount: 15,
      categorySlug: "finance",
      labels: ["Speculative"],
      connectedSlugs: ["cerberus-firewall", "vaultkey-protocol"],
      timeline: [
        { year: "2005", event: "Holding company Arcturis Global incorporated in multiple jurisdictions simultaneously.", type: "verified" },
        { year: "2011", event: "Forensic accountants discover parallel ledger during bankruptcy proceedings.", type: "verified" },
        { year: "2014", event: "Phantom entities in ledger traced to abandoned office addresses in 6 countries.", type: "verified" },
        { year: "2018", event: "Mathematical analysis suggests ledger entries encode geographic coordinates.", type: "disputed" },
        { year: "2023", event: "Two former executives refuse to testify, citing national security concerns.", type: "verified" },
      ],
    },
    {
      slug: "iron-meridian",
      title: "Iron Meridian",
      summary: "An investigation into a series of undisclosed bilateral agreements between non-adjacent nations establishing exclusive resource extraction corridors. Examining satellite imagery, shipping manifests, and the diplomatic cables that reveal hidden geopolitical architecture.",
      status: "Published",
      completion: 45,
      isSpecialist: false,
      connections: 189,
      sourceCount: 28,
      categorySlug: "geopolitics",
      labels: ["Verified"],
      connectedSlugs: [],
      timeline: [
        { year: "2007", event: "First anomalous shipping route detected between non-trading partner nations.", type: "verified" },
        { year: "2012", event: "Satellite imagery shows construction of unlisted port facilities in three locations.", type: "verified" },
        { year: "2015", event: "Diplomatic cable leak references 'Meridian Framework' bilateral resource agreements.", type: "verified" },
        { year: "2019", event: "Independent researchers map 12 suspected corridors across 4 continents.", type: "disputed" },
        { year: "2024", event: "New satellite data confirms expanded operations at 8 of 12 suspected sites.", type: "verified" },
      ],
    },
    {
      slug: "silverthread-archive",
      title: "The Silverthread Archive",
      summary: "Uncovering a massive collection of intercepted communications stored in a decommissioned underground facility. The archive appears to contain decades of diplomatic, commercial, and personal communications collected by a now-defunct signals intelligence program.",
      status: "Published",
      completion: 50,
      isSpecialist: false,
      connections: 267,
      sourceCount: 35,
      categorySlug: "intelligence",
      labels: ["Verified", "Disputed"],
      connectedSlugs: ["cerberus-firewall"],
      timeline: [
        { year: "1978", event: "Underground facility constructed under cover of geological survey project.", type: "verified" },
        { year: "1985", event: "Facility reaches full operational capacity with 200+ staff.", type: "disputed" },
        { year: "1993", event: "Program officially shuttered; facility listed as 'decommissioned and sealed.'", type: "verified" },
        { year: "2010", event: "Urban explorers discover facility is still climate-controlled with active power supply.", type: "verified" },
        { year: "2020", event: "Freedom of information requests reveal facility's continued classification.", type: "verified" },
        { year: "2025", event: "Partial archive index leaked, revealing scope of collection program.", type: "disputed" },
      ],
    },
    {
      slug: "obsidian-charter",
      title: "The Obsidian Charter",
      summary: "Investigating the origins and influence of a founding document allegedly shared among a network of private intelligence firms. The charter reportedly establishes operational protocols, information sharing agreements, and mutual defense commitments outside government oversight.",
      status: "Published",
      completion: 35,
      isSpecialist: false,
      connections: 143,
      sourceCount: 20,
      categorySlug: "intelligence",
      labels: ["Speculative", "Disputed"],
      connectedSlugs: ["silverthread-archive", "echo-garden"],
      timeline: [
        { year: "2001", event: "First reference to 'Obsidian Charter' appears in intercepted contractor communications.", type: "disputed" },
        { year: "2006", event: "Former intelligence officer describes charter framework in anonymous interview.", type: "disputed" },
        { year: "2012", event: "Corporate registration patterns suggest coordinated founding of 7 private intelligence firms.", type: "verified" },
        { year: "2017", event: "Senate inquiry subpoenas charter document; firms claim attorney-client privilege.", type: "verified" },
        { year: "2022", event: "Two charter firms awarded $2.3B in combined government contracts.", type: "verified" },
      ],
    },
  ];

  const holeIds: Record<string, number> = {};
  for (const h of holes) {
    const [inserted] = await db.insert(rabbitHoles).values(h).returning();
    holeIds[h.slug] = inserted.id;
    console.log(`  Created hole: ${h.title} (id=${inserted.id})`);
  }

  // ============================
  // DEPTH NODES (5-8 per hole)
  // ============================

  const nodesData: Record<string, { title: string; summary: string; content: string }[]> = {
    "aurora-network": [
      { title: "Discovery Beneath Berlin", summary: "How metro engineers stumbled upon unmarked fiber-optic conduits.", content: "During the 2008 expansion of Berlin's U-Bahn Line 5, construction crews encountered a series of fiber-optic conduits that appeared on no municipal infrastructure maps. The cables were sheathed in military-grade protective casing and ran through purpose-built concrete channels that predated the metro tunnels by at least a decade. Initial inquiries to city planning authorities yielded no records of installation permits. The discovery was initially classified as abandoned Cold War infrastructure, but subsequent analysis revealed the cables were carrying active data traffic using wavelength-division multiplexing technology that wasn't commercially available until the mid-2000s." },
      { title: "The Novaflux Connection", summary: "Tracing the shell company behind the construction permits.", content: "Novaflux GmbH was registered in Munich in 2004 with a stated purpose of 'telecommunications infrastructure consulting.' The company's registered directors were three individuals who appeared to have no prior history in telecommunications. Cross-referencing corporate registries across Europe revealed that Novaflux held construction permits for underground conduit installation in Berlin, Lyon, and Vienna. Each permit was obtained through different municipal offices and referenced different infrastructure projects, making pattern detection nearly impossible without comprehensive multi-jurisdictional analysis." },
      { title: "The Seven Nodes", summary: "Mapping the network topology across European cities.", content: "Through a combination of municipal permit analysis, ground-penetrating radar surveys, and electromagnetic emission detection, researchers have identified seven probable network nodes beneath major European cities. Each node appears to be housed in a purpose-built underground chamber approximately 50 square meters in size, equipped with independent power supplies and climate control systems. The nodes are connected by dedicated fiber runs that avoid existing telecommunications infrastructure corridors, suggesting deliberate operational security measures." },
      { title: "Financial Settlement Theory", summary: "The whistleblower's claims about parallel transaction systems.", content: "In 2019, an individual claiming to be a former Novaflux employee contacted investigative journalists with allegations that the Aurora Network was being used to operate a parallel financial settlement system. According to this source, the network enabled real-time settlement of large-value transactions between sovereign wealth funds and central banks without passing through conventional clearing systems like SWIFT. The source provided partial technical documentation describing a custom protocol stack designed for ultra-low-latency financial data transmission with end-to-end encryption." },
      { title: "Cold War Origins", summary: "Links to defunct signals intelligence infrastructure.", content: "A 2023 investigative report by a consortium of European journalists traced several Aurora Network infrastructure components to a Cold War-era signals intelligence program codenamed WINTERGARDEN. This program, operated jointly by three NATO member states between 1972 and 1991, had established a network of underground communications nodes across Western Europe. While WINTERGARDEN was officially dismantled after the fall of the Berlin Wall, the physical infrastructure was never fully decommissioned. The report suggests that elements of this infrastructure were repurposed and upgraded by private actors beginning in the early 2000s." },
      { title: "The Regulatory Vacuum", summary: "How the network exploits jurisdictional gaps.", content: "The Aurora Network operates in a regulatory vacuum created by the intersection of telecommunications law, financial regulation, and national security classification. Because the physical infrastructure predates modern telecommunications licensing requirements and is located in spaces classified under national security exemptions, no single regulatory body has clear jurisdiction. This regulatory ambiguity has allowed the network to operate without the oversight that would normally apply to either telecommunications infrastructure or financial settlement systems." },
    ],
    "vaultkey-protocol": [
      { title: "The Meridian Patent", summary: "A cryptographic patent that hides in plain sight.", content: "United States Patent 8,234,XXX, filed in 2010 by Meridian Digital Labs LLC, describes a 'nested settlement tokenization system' that enables the embedding of transaction records within the metadata of standard financial clearing messages. The patent's claims describe a method for creating cryptographically signed micro-transaction records that are invisible to standard message parsing systems but can be reconstructed by parties holding the appropriate cryptographic keys. The patent was granted with minimal examination and has never been cited in subsequent patent applications." },
      { title: "The Singapore Test", summary: "Alleged prototype deployment in Asian banking networks.", content: "According to sources within Singapore's financial technology sector, a prototype VaultKey module was tested within the country's interbank clearing network between 2014 and 2015. The test allegedly involved a small number of participating institutions and processed simulated transactions using the nested tokenization method described in the Meridian patent. The test was reportedly terminated after regulatory concerns were raised, but no official record of the test or its termination has been located in public filings." },
      { title: "Protocol V Risk Assessment", summary: "The leaked ECB memo and its implications.", content: "In 2017, a document purporting to be an internal European Central Bank risk assessment referenced 'Protocol V' as a potential threat to financial system transparency. The memo described a theoretical settlement mechanism that could operate within existing clearing infrastructure without detection by standard monitoring systems. While the ECB has neither confirmed nor denied the document's authenticity, the technical description in the memo closely matches the capabilities described in the Meridian patent and the reported Singapore prototype." },
      { title: "Statistical Anomalies", summary: "Academic research identifies hidden patterns in clearing data.", content: "A 2021 paper published by researchers at a Swiss university analyzed ten years of interbank clearing data and identified statistically significant anomalies in message metadata patterns. The anomalies were consistent with the presence of embedded data structures within standard clearing messages. The researchers estimated that approximately 0.003% of all analyzed clearing messages contained metadata patterns that could not be explained by known legitimate processes, representing a potential hidden transaction volume in the hundreds of billions annually." },
      { title: "Regulatory Implications", summary: "What VaultKey means for financial oversight.", content: "If the VaultKey Protocol exists as described, it represents a fundamental challenge to the architecture of financial regulation. Modern anti-money laundering and counter-terrorism financing frameworks rely on the assumption that all transactions within the formal banking system are visible to appropriate monitoring systems. A protocol that can embed invisible transactions within legitimate clearing traffic would undermine this assumption entirely, creating a channel for undetectable value transfer between any institutions connected to the clearing network." },
    ],
    "echo-garden": [
      { title: "The Liechtenstein Foundation", summary: "Tracing the root funding entity.", content: "The foundation at the center of the Echo Garden network was registered in Liechtenstein in 2011 under the name Stiftung für Medienentwicklung (Foundation for Media Development). Liechtenstein's foundation law permits the creation of entities with minimal public disclosure requirements, and the foundation's founding documents reveal only that its purpose is 'the advancement of independent journalism and public discourse.' The foundation's board consists of three individuals who also serve as directors of multiple other entities in the network, creating a web of interlocking governance that obscures the ultimate source of funding and editorial direction." },
      { title: "The Amplification Network", summary: "How synchronized messaging spreads across platforms.", content: "Analysis of publication patterns across the Echo Garden network reveals a sophisticated content amplification system. When a primary outlet publishes a story, secondary outlets and social media accounts begin sharing and reframing the content within a consistent 72-hour window. The amplification follows a predictable pattern: primary publication, followed by social media seeding, think tank analysis, and finally mainstream media pickup. The synchronization is too precise and consistent to be explained by organic information diffusion, suggesting centralized editorial coordination." },
      { title: "Editorial Synchronization", summary: "Evidence of coordinated content calendars.", content: "Internal documents obtained from a former Echo Garden outlet employee reveal the existence of quarterly editorial calendars distributed to network outlets. These calendars specify themes, angles, and key messages for coordinated coverage campaigns. While individual outlets maintain editorial independence in their day-to-day reporting, the calendars ensure that strategic narratives are amplified simultaneously across the network, creating the appearance of widespread independent validation." },
      { title: "Budget and Reach", summary: "The financial scope of the operation.", content: "Leaked financial disclosures from 2020 estimate the Echo Garden network's annual operating budget at approximately $120 million. This budget supports direct funding of 14 media outlets across 8 countries, grants to 23 think tanks, and a digital amplification infrastructure that includes social media management, search engine optimization, and content distribution partnerships. The return on investment, measured by media mentions and narrative penetration, significantly exceeds comparable commercial public relations campaigns." },
      { title: "Counter-Operations", summary: "When the framework is turned against its creators.", content: "In 2024, a rival network deployed an identical amplification framework to counter Echo Garden narratives. This counter-operation used the same techniques of synchronized publication, social media seeding, and think tank amplification, effectively demonstrating that the Echo Garden model could be replicated and weaponized by competing interests. The resulting information environment became increasingly difficult for the public to navigate, with multiple competing networks deploying identical persuasion architectures to promote contradictory narratives." },
      { title: "Identifying the Pattern", summary: "Data science approaches to detecting coordinated media.", content: "Researchers developed a machine learning model that analyzes publication timing, linguistic similarity, and source citation patterns to identify coordinated media networks. When applied to the Echo Garden case, the model successfully identified 12 of 14 known network outlets with zero false positives. The methodology has since been open-sourced and applied to other suspected coordination networks, identifying several previously unknown media amplification operations." },
    ],
    "cerberus-firewall": [
      { title: "Origins as Defensive Shield", summary: "The program's initial mandate and scope.", content: "The Cerberus program was initiated in 2009 as a defensive cybersecurity initiative designed to protect critical national infrastructure from sophisticated cyber attacks. The program's original mandate was narrowly defined: develop and deploy advanced intrusion detection systems, coordinate vulnerability assessments across critical infrastructure operators, and maintain a rapid response capability for cyber incidents affecting essential services. Initial funding was modest and the program operated with full legislative oversight through classified briefings to relevant committees." },
      { title: "Scope Expansion", summary: "How defensive turned offensive.", content: "Between 2013 and 2015, the Cerberus program's scope was gradually expanded to include what internal documents describe as 'active threat neutralization' capabilities. This expansion was justified by the argument that effective defense required the ability to disrupt attack infrastructure before it could be deployed against protected networks. The expanded scope included the development of offensive cyber tools, the establishment of persistent access to foreign networks, and the creation of a team specifically tasked with developing zero-day exploits for use in preemptive operations." },
      { title: "The Software Update Vector", summary: "Embedding offensive tools in routine patches.", content: "A contractor who worked on the Cerberus program between 2015 and 2018 has alleged that offensive cyber tools were embedded in routine software updates distributed to critical infrastructure operators. According to this source, the updates contained dormant modules that could be remotely activated to collect data from the systems they were installed on. The contractor claims that this capability was designed as a 'break glass' measure for national emergency scenarios but was also used for ongoing intelligence collection." },
      { title: "Allied Nation Collection", summary: "Evidence of unauthorized surveillance of partners.", content: "An independent audit conducted in 2019, triggered by a tip from a program insider, found evidence that Cerberus tools had been used to collect data from networks belonging to allied nations. The audit revealed that data collection operations had been conducted against the critical infrastructure of at least four partner countries without their knowledge or consent. The audit's findings were initially classified but were partially leaked to journalists in 2020, causing significant diplomatic fallout." },
      { title: "Restructuring and Disclosure", summary: "The program's partial declassification.", content: "In 2022, the Cerberus program was officially restructured following legislative review. The offensive capabilities were separated into a distinct program with enhanced oversight requirements, and certain aspects of the original program were declassified. However, critics argue that the restructuring was cosmetic and that the essential capabilities and activities continue under new organizational arrangements. The declassified materials provide a carefully curated view of the program that omits the most controversial activities." },
      { title: "Legacy Code Analysis", summary: "What the leaked source code reveals.", content: "Fragments of Cerberus source code that appeared on public repositories in 2021 have been analyzed by independent security researchers. The code reveals a sophisticated modular architecture designed for persistent network access, with capabilities for data exfiltration, lateral movement, and evidence destruction. The code quality and documentation standards are consistent with professional software development practices, suggesting a well-funded and organized development team. Several code modules contain comments referencing operational codenames that have been linked to known cyber incidents." },
      { title: "International Response", summary: "How other nations reacted to the revelations.", content: "The disclosure of Cerberus offensive operations triggered a cascade of responses from affected nations. Several countries launched their own investigations into whether Cerberus tools had compromised their networks, while others used the revelations to justify expanding their own offensive cyber programs. The incident has been cited as a key driver of the ongoing cyber arms race and has complicated international efforts to establish norms for responsible state behavior in cyberspace." },
    ],
    "phantom-ledger": [
      { title: "Arcturis Global", summary: "The holding company that shouldn't exist.", content: "Arcturis Global was incorporated in 2005 across seven jurisdictions simultaneously—a highly unusual legal maneuver that required coordinated filings in the Cayman Islands, Luxembourg, Singapore, Dubai, the British Virgin Islands, Delaware, and Hong Kong. Each incorporation used different law firms and different nominee directors, creating the appearance of seven independent entities rather than a single coordinated incorporation. The company's stated business purpose varied by jurisdiction, ranging from 'global investment management' to 'international trade facilitation.'" },
      { title: "The Parallel Books", summary: "Discovery of the second ledger.", content: "When Arcturis Global entered bankruptcy proceedings in 2011, forensic accountants discovered a second set of books embedded within the company's accounting system. This parallel ledger used a double-entry system that appeared to track transactions with entities that had no corresponding records in any accessible corporate registry. The ledger entries were denominated in a non-standard unit of account and referenced transaction codes that did not correspond to any known banking or clearing system." },
      { title: "Ghost Entities", summary: "Tracing counterparties that don't exist.", content: "The phantom entities referenced in the parallel ledger were traced to addresses that consistently turned out to be abandoned office spaces, virtual office services, or addresses that didn't physically exist. Despite this, the ledger entries showed regular, patterned transactions with these entities over a period of six years, suggesting an ongoing operational relationship rather than fraudulent bookkeeping. The pattern of transactions showed seasonal variations and responded to external events in ways that suggested a genuine economic function." },
      { title: "Coordinate Encoding Theory", summary: "Are the ledger entries actually a map?", content: "A mathematician analyzing the phantom ledger in 2018 proposed that the transaction amounts and codes, when subjected to a specific transformation, yield geographic coordinates. The coordinates produced by this transformation correspond to locations in remote areas of six countries, none of which have obvious economic significance. Satellite imagery of these locations shows a mix of undeveloped land, small industrial facilities, and in one case, what appears to be a recently constructed underground installation." },
      { title: "The Silent Executives", summary: "Why former leaders refuse to speak.", content: "Two former Arcturis Global executives who were subpoenaed to testify about the phantom ledger invoked national security privilege and declined to answer questions. Their legal representation was provided by a law firm specializing in defense and intelligence community matters, despite neither executive having any publicly known connection to government service. The executives' refusal to testify, and the government's apparent acquiescence to their national security claims, has fueled speculation about the true nature of Arcturis Global's operations." },
    ],
    "iron-meridian": [
      { title: "Anomalous Shipping Routes", summary: "Trade patterns that defy economic logic.", content: "Maritime tracking data from 2007 onward reveals a network of shipping routes connecting ports in nations that have minimal official trade relationships. These routes carry cargo in sealed containers with documentation that passes standard customs inspection but provides no meaningful description of contents. The routes operate on regular schedules and use dedicated vessels that do not appear in commercial shipping registries, suggesting a private transportation network operating parallel to legitimate maritime commerce." },
      { title: "Ghost Ports", summary: "Satellite imagery of unlisted facilities.", content: "High-resolution satellite imagery captured between 2012 and 2015 reveals the construction of port facilities at three coastal locations that do not appear on any nautical charts or in any port authority registries. These facilities include deep-water berths, container handling equipment, and what appears to be underground storage infrastructure. The construction timeline coincides with the establishment of the anomalous shipping routes, and vessel tracking data confirms regular visits by the same unregistered vessels identified in the route analysis." },
      { title: "The Meridian Framework", summary: "Diplomatic cables reveal bilateral agreements.", content: "A cache of diplomatic cables leaked in 2015 includes references to a 'Meridian Framework' described as a series of bilateral agreements establishing exclusive resource extraction and transportation corridors between non-adjacent nations. The cables suggest that these agreements were negotiated outside normal diplomatic channels and were not subject to legislative review or public disclosure in any participating country. The framework appears to allocate specific resource extraction rights and transportation routes among participating nations in exchange for mutual security guarantees." },
      { title: "Resource Corridors Mapped", summary: "Independent researchers connect the dots.", content: "A team of independent researchers published a comprehensive analysis in 2019 mapping 12 suspected Meridian corridors across four continents. Each corridor connects a resource-rich region to a consuming nation through a series of intermediate transit points, using a combination of maritime shipping, overland transportation, and pipeline infrastructure. The corridors are designed to bypass existing trade agreements, sanctions regimes, and international monitoring frameworks, enabling resource transfers that would not be possible through conventional channels." },
      { title: "Expanded Operations", summary: "New satellite data confirms growth.", content: "Updated satellite imagery from 2024 confirms that operations at 8 of the 12 suspected Meridian sites have expanded significantly since the original analysis. New construction includes expanded port facilities, processing plants, and what appear to be residential compounds for workers. The expansion suggests that the Meridian Framework is not a legacy arrangement but an actively growing operational network with increasing resource throughput." },
      { title: "Strategic Implications", summary: "What parallel resource networks mean for global order.", content: "The existence of the Meridian Framework, if confirmed, has profound implications for the international economic order. By establishing resource corridors that operate outside existing trade frameworks, participating nations can effectively circumvent sanctions, avoid tariffs, and conduct resource transactions without the transparency required by international agreements. This creates a parallel economic architecture that undermines the effectiveness of economic policy tools that rely on visibility into international trade flows." },
    ],
    "silverthread-archive": [
      { title: "The Underground Facility", summary: "Construction hidden behind a geological survey.", content: "In 1978, a large-scale construction project was initiated under the cover of a national geological survey in a mountainous region. The project, which lasted three years and involved over 500 workers, created an underground facility spanning approximately 10,000 square meters across three levels. Workers were required to sign extensive confidentiality agreements and were transported to and from the site in windowless vehicles. The facility was connected to the national power grid through a dedicated substation listed in utility records as serving a 'research installation.'" },
      { title: "Operational Scale", summary: "200 staff running 24/7 intercept operations.", content: "At its operational peak in the mid-1980s, the facility housed approximately 200 staff working in three shifts to provide 24/7 coverage. The staff included signals intelligence analysts, linguists, cryptographers, and technical maintenance personnel. The facility's intercept capabilities covered satellite communications, undersea cable taps, and high-frequency radio transmissions, providing comprehensive coverage of diplomatic, commercial, and personal communications across a wide geographic area." },
      { title: "Official Decommissioning", summary: "The program that was shut down but wasn't.", content: "The signals intelligence program was officially terminated in 1993 following the end of the Cold War, and the facility was listed as 'decommissioned and sealed' in government property records. The staff were reassigned to other positions, and the program's budget line was removed from classified appropriations. However, subsequent investigations have revealed that the facility's decommissioning was incomplete at best, and possibly entirely fictitious." },
      { title: "Urban Explorer Discovery", summary: "Climate-controlled and powered, decades after closure.", content: "In 2010, a group of urban explorers who had been documenting abandoned Cold War sites discovered that the Silverthread facility, despite being officially decommissioned for 17 years, was still fully powered and climate-controlled. The explorers documented active ventilation systems, functioning lighting on motion sensors, and security cameras that appeared to be operational. The facility's exterior showed signs of regular maintenance, including recently repaired fencing and a cleared access road. The explorers' documentation was widely shared online before being removed through legal takedown notices." },
      { title: "Classification Persistence", summary: "Freedom of information reveals nothing.", content: "Freedom of information requests filed in 2020 seeking records related to the Silverthread facility and its associated program were denied in their entirety on national security grounds. The denial letters cited ongoing classification of 'all records related to the facility, its operations, its personnel, and its current status.' The persistence of classification more than 25 years after the program's official termination is unusual and suggests either that the program's activities remain sensitive enough to warrant continued protection, or that the program was never actually terminated." },
      { title: "The Leaked Index", summary: "Partial catalog reveals decades of collected communications.", content: "In 2025, a partial index of the Silverthread archive appeared on an encrypted messaging platform. The index, which appears to be a catalog of the archive's contents, references millions of intercepted communications spanning from the late 1970s to at least 2019—well beyond the program's official termination date. The indexed communications include diplomatic cables, corporate communications, academic correspondence, and personal communications of individuals with no apparent intelligence value, suggesting a bulk collection approach rather than targeted surveillance." },
      { title: "Archive Significance", summary: "What the collection means for history and accountability.", content: "If the Silverthread archive exists as described by the leaked index, it represents one of the largest collections of intercepted communications in history. The archive's contents could provide unprecedented insight into decades of diplomatic negotiations, corporate decision-making, and political developments. However, the archive also represents a massive invasion of privacy and a potential tool for blackmail or coercion. The question of what should be done with the archive—preserved for historical research, destroyed to protect privacy, or maintained for ongoing intelligence purposes—remains unresolved." },
    ],
    "obsidian-charter": [
      { title: "First References", summary: "Intercepted communications mention a founding document.", content: "The earliest known reference to the Obsidian Charter appears in communications intercepted in 2001 between individuals associated with private intelligence and security firms. These communications reference a 'charter' that establishes operational protocols, information sharing agreements, and mutual defense commitments among a group of firms. The communications suggest that the charter was drafted by former senior intelligence officials who had transitioned to the private sector and sought to maintain the collaborative relationships they had developed during government service." },
      { title: "The Anonymous Interview", summary: "A former intelligence officer describes the framework.", content: "In 2006, a former intelligence officer gave an anonymous interview to a national newspaper in which they described a charter-based organization of private intelligence firms. According to this source, the charter established a framework for sharing intelligence products, coordinating operational activities, and providing mutual support in legal and regulatory matters. The source described the charter as creating an 'intelligence commonwealth' that operated with the capabilities of a state intelligence service but without the oversight, accountability, or legal constraints." },
      { title: "Coordinated Corporate Founding", summary: "Seven firms, one pattern.", content: "Analysis of corporate registration records reveals that seven private intelligence and security firms were founded within an 18-month period between 2001 and 2003, each by former senior intelligence officials from different agencies. While the firms were established as independent entities with no formal corporate relationships, their founding documents share structural similarities that suggest coordination. Each firm was established with similar governance structures, similar service offerings, and similar client acquisition strategies." },
      { title: "Senate Inquiry", summary: "Congressional subpoena meets attorney-client privilege.", content: "A 2017 Senate inquiry into the activities of private intelligence firms subpoenaed the Obsidian Charter document from several firms believed to be charter members. The firms uniformly declined to produce the document, claiming that it was protected by attorney-client privilege as a legal agreement between the firms and their shared legal counsel. The Senate committee's legal challenge to this claim was unsuccessful, with the court ruling that the committee had not established sufficient grounds to override the privilege claim." },
      { title: "Government Contracts", summary: "Billions in funding with minimal oversight.", content: "By 2022, the seven firms believed to be charter members had collectively been awarded over $2.3 billion in government contracts spanning defense, intelligence, homeland security, and diplomatic support. These contracts were awarded through a variety of mechanisms, including competitive bidding, sole-source awards, and subcontracts through prime contractors. Analysis of contract award patterns suggests that charter firms may coordinate their bidding strategies to minimize direct competition with each other." },
      { title: "Implications for Democratic Oversight", summary: "When intelligence goes private.", content: "The Obsidian Charter, if it exists as described, represents a fundamental challenge to democratic oversight of intelligence activities. By operating as private entities, charter firms can conduct intelligence activities that would require legislative authorization and oversight if conducted by government agencies. The charter's mutual defense provisions create a mechanism for collective resistance to regulatory or legislative scrutiny, while the firms' contractual relationships with government agencies create a dependency that discourages aggressive oversight." },
    ],
  };

  const sourceIds: Record<string, number[]> = {};

  for (const [slug, nodeList] of Object.entries(nodesData)) {
    const holeId = holeIds[slug];

    // Insert sources first (4-8 per hole)
    const holeSources = [
      { holeId, title: `${slug.replace(/-/g, " ")} — Primary Document Analysis`, author: "Dr. M. Harken", origin: "International Research Quarterly", publishedDate: "2023-06-15", url: `https://example.com/research/${slug}-primary`, summary: "Comprehensive analysis of primary documentation and verified source material.", type: "document", stanceTag: "supporting", credibility: 85 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Independent Verification Report`, author: "L. Vasquez & K. Chen", origin: "Open Source Intelligence Review", publishedDate: "2022-11-20", url: `https://example.com/research/${slug}-verification`, summary: "Independent third-party verification of key claims and source material.", type: "report", stanceTag: "neutral", credibility: 78 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Critical Assessment`, author: "Prof. J. Whitfield", origin: "Strategic Analysis Bulletin", publishedDate: "2024-01-08", url: `https://example.com/research/${slug}-critical`, summary: "Critical evaluation challenging several key assumptions in the investigation.", type: "analysis", stanceTag: "opposing", credibility: 72 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Whistleblower Testimony`, author: "Anonymous Source (verified)", origin: "Investigative Press Consortium", publishedDate: "2023-09-12", url: `https://example.com/research/${slug}-testimony`, summary: "Anonymized testimony from an individual with direct operational knowledge.", type: "testimony", stanceTag: "supporting", credibility: 65 },
      { holeId, title: `${slug.replace(/-/g, " ")} — Satellite & Signals Data`, author: "GeoWatch Analytics", origin: "Remote Sensing Data Archive", publishedDate: "2024-03-01", url: `https://example.com/research/${slug}-satellite`, summary: "Technical analysis of satellite imagery and signals intelligence data.", type: "data", stanceTag: "supporting", credibility: 90 },
    ];

    const insertedSources: number[] = [];
    for (const s of holeSources) {
      const [src] = await db.insert(sources).values(s).returning();
      insertedSources.push(src.id);
    }
    sourceIds[slug] = insertedSources;

    // Insert depth nodes
    for (let i = 0; i < nodeList.length; i++) {
      await db.insert(depthNodes).values({
        holeId,
        title: nodeList[i].title,
        summary: nodeList[i].summary,
        content: nodeList[i].content,
        position: i + 1,
        status: "unlocked",
        branchLinks: [],
      });
    }

    // Insert claims (3-6 per hole)
    const claimsForHole = [
      { holeId, statement: `Primary evidence supports the existence of ${slug.replace(/-/g, " ")} operations as described in verified documentation.`, stance: "supported", confidence: 78, evidence: [{ sourceId: insertedSources[0], excerpt: "Primary documentation corroborates operational timeline." }, { sourceId: insertedSources[4], excerpt: "Technical data independently verifies key infrastructure claims." }], counterpoints: [{ sourceId: insertedSources[2], excerpt: "Alternative interpretations of the same data remain plausible." }] },
      { holeId, statement: `The organizational structure behind ${slug.replace(/-/g, " ")} extends beyond what public records reveal.`, stance: "speculative", confidence: 55, evidence: [{ sourceId: insertedSources[3], excerpt: "Testimony indicates additional layers of organization not publicly visible." }], counterpoints: [{ sourceId: insertedSources[2], excerpt: "Lack of corroborating documentation weakens this claim." }] },
      { holeId, statement: `Financial flows associated with ${slug.replace(/-/g, " ")} have been independently verified through multiple audit sources.`, stance: "supported", confidence: 82, evidence: [{ sourceId: insertedSources[1], excerpt: "Independent verification confirms financial trail." }, { sourceId: insertedSources[0], excerpt: "Primary documents include financial records consistent with described operations." }], counterpoints: [] },
      { holeId, statement: `There is circumstantial evidence linking ${slug.replace(/-/g, " ")} to broader geopolitical strategic objectives.`, stance: "disputed", confidence: 45, evidence: [{ sourceId: insertedSources[3], excerpt: "Testimony references strategic objectives but provides limited specifics." }], counterpoints: [{ sourceId: insertedSources[2], excerpt: "Correlation does not establish causation in geopolitical analysis." }] },
    ];

    for (const c of claimsForHole) {
      await db.insert(claims).values(c);
    }

    // Insert media (3-6 per hole)
    const mediaForHole = [
      { holeId, title: `${slug} Infrastructure Map`, url: `https://placehold.co/800x600/1a1a2e/8B0000?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Map`, type: "image", caption: "Mapped infrastructure and connection points identified through open-source research." },
      { holeId, title: `${slug} Document Excerpt`, url: `https://placehold.co/800x600/1a1a2e/EDEDED?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Document`, type: "image", caption: "Redacted excerpt from primary source documentation." },
      { holeId, title: `${slug} Timeline Visualization`, url: `https://placehold.co/800x600/1a1a2e/4a9eff?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Timeline`, type: "image", caption: "Chronological visualization of key events and developments." },
      { holeId, title: `${slug} Network Analysis`, url: `https://placehold.co/800x400/1a1a2e/00cc66?text=${encodeURIComponent(slug.replace(/-/g, "+"))}+Network`, type: "image", caption: "Network graph showing entity relationships and connection patterns." },
    ];

    for (const m of mediaForHole) {
      await db.insert(media).values(m);
    }

    console.log(`  → ${nodeList.length} nodes, ${claimsForHole.length} claims, ${holeSources.length} sources, ${mediaForHole.length} media for ${slug}`);
  }

  // ============================
  // LIVE STREAMING CONTENT
  // ============================

  // Create 2 creators (linked to existing employees)
  const [creator1] = await db.insert(creators).values({
    employeeId: ADMIN_ID,
    handle: "deep-signal",
    displayName: "Deep Signal",
    bio: "Live investigative broadcasts exploring hidden networks, classified programs, and the stories behind the stories. Broadcasting weekly with in-depth analysis and expert guests.",
    avatarUrl: "https://placehold.co/200x200/8B0000/EDEDED?text=DS",
    bannerUrl: "https://placehold.co/1200x400/1a1a2e/8B0000?text=DEEP+SIGNAL",
    isActive: true,
  }).returning();

  const [creator2] = await db.insert(creators).values({
    employeeId: EDITOR_ID,
    handle: "cipher-desk",
    displayName: "The Cipher Desk",
    bio: "Decrypting complexity. Live analysis of financial systems, cryptographic protocols, and the intersection of technology and power. Premium deep-dives every Thursday.",
    avatarUrl: "https://placehold.co/200x200/1a1a2e/EDEDED?text=CD",
    bannerUrl: "https://placehold.co/1200x400/1a1a2e/4a9eff?text=CIPHER+DESK",
    isActive: true,
  }).returning();

  console.log(`  Created creators: ${creator1.displayName}, ${creator2.displayName}`);

  const now = new Date();
  const hour = 3600000;
  const day = 86400000;

  // 3 Published streams (1 public, 2 premium)
  const [stream1] = await db.insert(streams).values({
    creatorId: creator1.id,
    title: "Aurora Network: The Underground Map — Live Breakdown",
    description: "Live analysis of recently declassified mapping data related to the Aurora Network investigation. We'll walk through the evidence, take questions, and explore new connections.",
    status: "Published",
    streamState: "live",
    scheduledStart: new Date(now.getTime() - 2 * hour),
    startedAt: new Date(now.getTime() - hour),
    tags: ["aurora-network", "infrastructure", "live-analysis"],
    thumbnailUrl: "https://placehold.co/640x360/1a1a2e/8B0000?text=LIVE+Aurora+Network",
    provider: "custom_iframe",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    visibility: "public",
    chatEnabled: true,
    createdByEmployeeId: ADMIN_ID,
  }).returning();

  await db.insert(streams).values({
    creatorId: creator1.id,
    title: "Cerberus Source Code Deep Dive — Premium Exclusive",
    description: "Premium subscribers only. We're going line by line through the leaked Cerberus source code fragments with cybersecurity expert analysis.",
    status: "Published",
    streamState: "live",
    scheduledStart: new Date(now.getTime() - 3 * hour),
    startedAt: new Date(now.getTime() - 2 * hour),
    tags: ["cerberus-firewall", "cybersecurity", "source-code"],
    thumbnailUrl: "https://placehold.co/640x360/1a1a2e/ff4444?text=PREMIUM+Cerberus+Code",
    provider: "custom_iframe",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    visibility: "premium",
    chatEnabled: true,
    createdByEmployeeId: ADMIN_ID,
  });

  await db.insert(streams).values({
    creatorId: creator2.id,
    title: "VaultKey Protocol: Following the Money — Premium Analysis",
    description: "Premium deep-dive into the financial trail behind the VaultKey Protocol. Analyzing transaction anomalies and regulatory gaps with quantitative methods.",
    status: "Published",
    streamState: "live",
    scheduledStart: new Date(now.getTime() - hour),
    startedAt: new Date(now.getTime() - 30 * 60000),
    tags: ["vaultkey-protocol", "finance", "quantitative"],
    thumbnailUrl: "https://placehold.co/640x360/1a1a2e/ffd700?text=PREMIUM+VaultKey",
    provider: "custom_iframe",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    visibility: "premium",
    chatEnabled: true,
    createdByEmployeeId: EDITOR_ID,
  });

  // 2 upcoming streams
  await db.insert(streams).values({
    creatorId: creator1.id,
    title: "Echo Garden: Mapping the Amplification Network",
    description: "Next week we trace the full amplification pipeline of the Echo Garden media network. Bring your questions.",
    status: "Published",
    streamState: "upcoming",
    scheduledStart: new Date(now.getTime() + 3 * day),
    tags: ["echo-garden", "media", "network-analysis"],
    thumbnailUrl: "https://placehold.co/640x360/1a1a2e/00cc66?text=UPCOMING+Echo+Garden",
    provider: "custom_iframe",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    visibility: "public",
    chatEnabled: true,
    createdByEmployeeId: ADMIN_ID,
  });

  await db.insert(streams).values({
    creatorId: creator2.id,
    title: "Phantom Ledger: Coordinate Encoding Workshop",
    description: "Interactive session where we attempt to decode the geographic coordinates allegedly embedded in the Phantom Ledger entries.",
    status: "Published",
    streamState: "upcoming",
    scheduledStart: new Date(now.getTime() + 5 * day),
    tags: ["phantom-ledger", "cryptography", "workshop"],
    thumbnailUrl: "https://placehold.co/640x360/1a1a2e/9966ff?text=UPCOMING+Phantom+Ledger",
    provider: "custom_iframe",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    visibility: "premium",
    chatEnabled: true,
    createdByEmployeeId: EDITOR_ID,
  });

  // 1 ended stream with replay
  const [endedStream] = await db.insert(streams).values({
    creatorId: creator1.id,
    title: "Iron Meridian: Satellite Evidence Review — Recorded",
    description: "Recorded session reviewing the latest satellite imagery data related to the Iron Meridian resource corridors. Includes expert commentary and Q&A.",
    status: "Published",
    streamState: "ended",
    scheduledStart: new Date(now.getTime() - 7 * day),
    startedAt: new Date(now.getTime() - 7 * day),
    endedAt: new Date(now.getTime() - 7 * day + 2 * hour),
    tags: ["iron-meridian", "satellite", "geopolitics"],
    thumbnailUrl: "https://placehold.co/640x360/1a1a2e/888888?text=REPLAY+Iron+Meridian",
    provider: "custom_iframe",
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    visibility: "public",
    chatEnabled: false,
    createdByEmployeeId: ADMIN_ID,
  }).returning();

  await db.insert(streamReplays).values({
    streamId: endedStream.id,
    embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    durationSeconds: 7200,
  });

  console.log("  Created 6 streams (3 live published, 2 upcoming, 1 ended with replay)");

  // ============================
  // PODCAST CONTENT
  // ============================

  const [podcast1] = await db.insert(podcasts).values({
    title: "Down the Rabbit Hole",
    description: "Weekly deep-dives into investigative research, featuring expert interviews, document analysis, and critical evaluation of evidence. Your guide to navigating complex narratives.",
    platform: "Spotify",
    showUrl: "https://open.spotify.com/show/example1",
    coverImageUrl: "https://placehold.co/400x400/8B0000/EDEDED?text=Down+The+Rabbit+Hole",
  }).returning();

  const [podcast2] = await db.insert(podcasts).values({
    title: "Signal & Noise",
    description: "Separating signal from noise in the world of intelligence, cybersecurity, and geopolitical analysis. Bi-weekly episodes with practitioner perspectives.",
    platform: "YouTube",
    showUrl: "https://youtube.com/@signal-and-noise-example",
    coverImageUrl: "https://placehold.co/400x400/1a1a2e/4a9eff?text=Signal+%26+Noise",
  }).returning();

  console.log(`  Created podcasts: ${podcast1.title}, ${podcast2.title}`);

  // 5 episodes for podcast 1 (mix of statuses)
  const p1Episodes = [
    { podcastId: podcast1.id, title: "Ep 1: The Aurora Discovery", description: "How underground fiber-optic networks went from urban legend to verified reality. We trace the discovery timeline and interview infrastructure analysts.", publishedDate: "2025-09-01", durationSeconds: 3420, episodeUrl: "https://open.spotify.com/episode/ex1", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex1", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 2: Following the Shell Companies", description: "Novaflux GmbH and the corporate structures behind hidden infrastructure. A masterclass in corporate registry research.", publishedDate: "2025-09-15", durationSeconds: 2880, episodeUrl: "https://open.spotify.com/episode/ex2", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex2", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 3: Echo Garden Exposed", description: "Inside the $120M media amplification network. Data scientists reveal how they identified coordinated outlets.", publishedDate: "2025-10-01", durationSeconds: 3180, episodeUrl: "https://open.spotify.com/episode/ex3", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex3", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 4: The Phantom Ledger Mystery", description: "Ghost entities, encoded coordinates, and executives who won't talk. We break down the Arcturis Global case.", publishedDate: "2025-10-15", durationSeconds: 3600, episodeUrl: "https://open.spotify.com/episode/ex4", embedType: "spotify", embedUrl: "https://open.spotify.com/embed/episode/ex4", status: "Review", createdBy: "editor@rabbithole.io" },
    { podcastId: podcast1.id, title: "Ep 5: Silverthread — The Archive That Won't Die", description: "Draft episode covering the leaked Silverthread archive index and what 40 years of intercepted communications reveal.", publishedDate: "2025-11-01", durationSeconds: 2700, episodeUrl: "", embedType: "iframe", embedUrl: "", status: "Draft", createdBy: "editor@rabbithole.io" },
  ];

  const p1EpisodeIds: number[] = [];
  for (const ep of p1Episodes) {
    const [inserted] = await db.insert(podcastEpisodes).values(ep).returning();
    p1EpisodeIds.push(inserted.id);
  }

  // 5 episodes for podcast 2 (mix of statuses)
  const p2Episodes = [
    { podcastId: podcast2.id, title: "S&N 01: Cerberus — Defense vs. Offense", description: "The fine line between defensive cybersecurity and offensive operations. What the Cerberus program reveals about modern cyber doctrine.", publishedDate: "2025-08-15", durationSeconds: 2400, episodeUrl: "https://youtube.com/watch?v=ex5", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex5", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 02: The Obsidian Charter Question", description: "Do private intelligence firms operate under a shared charter? We examine the evidence for and against.", publishedDate: "2025-09-01", durationSeconds: 2700, episodeUrl: "https://youtube.com/watch?v=ex6", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex6", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 03: VaultKey — Hidden Transactions in Plain Sight", description: "Cryptography meets finance. How nested tokenization could create invisible transaction layers.", publishedDate: "2025-09-15", durationSeconds: 3000, episodeUrl: "https://youtube.com/watch?v=ex7", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex7", status: "Published", createdBy: "admin@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 04: Iron Meridian Resources", description: "Mapping the parallel resource corridors. Geographic and economic analysis of the Meridian Framework.", publishedDate: "2025-10-01", durationSeconds: 2580, episodeUrl: "https://youtube.com/watch?v=ex8", embedType: "youtube", embedUrl: "https://www.youtube.com/embed/ex8", status: "Review", createdBy: "editor@rabbithole.io" },
    { podcastId: podcast2.id, title: "S&N 05: Numbers Stations 2025 Update", description: "Draft: New shortwave signals detected. Are numbers stations making a comeback?", publishedDate: "", durationSeconds: 0, episodeUrl: "", embedType: "iframe", embedUrl: "", status: "Draft", createdBy: "editor@rabbithole.io" },
  ];

  const p2EpisodeIds: number[] = [];
  for (const ep of p2Episodes) {
    const [inserted] = await db.insert(podcastEpisodes).values(ep).returning();
    p2EpisodeIds.push(inserted.id);
  }

  // Link published episodes to relevant rabbit holes
  const episodeLinks = [
    { rabbitHoleId: holeIds["aurora-network"], episodeId: p1EpisodeIds[0], sortOrder: 1, pinned: true },
    { rabbitHoleId: holeIds["aurora-network"], episodeId: p1EpisodeIds[1], sortOrder: 2, pinned: false },
    { rabbitHoleId: holeIds["echo-garden"], episodeId: p1EpisodeIds[2], sortOrder: 1, pinned: true },
    { rabbitHoleId: holeIds["cerberus-firewall"], episodeId: p2EpisodeIds[0], sortOrder: 1, pinned: true },
    { rabbitHoleId: holeIds["obsidian-charter"], episodeId: p2EpisodeIds[1], sortOrder: 1, pinned: false },
    { rabbitHoleId: holeIds["vaultkey-protocol"], episodeId: p2EpisodeIds[2], sortOrder: 1, pinned: true },
  ];

  for (const link of episodeLinks) {
    await db.insert(rabbitHolePodcastEpisodes).values(link);
  }

  // Sponsored slot
  await db.insert(sponsoredPodcastSlots).values({
    rabbitHoleId: holeIds["aurora-network"],
    sponsorName: "SecureNet VPN",
    sponsorUrl: "https://example.com/securenet",
    disclosureText: "This investigation is supported by SecureNet VPN. SecureNet provides military-grade encryption for researchers and journalists operating in high-risk environments. Use code RABBITHOLE for 30% off annual plans. Sponsorship does not influence editorial content.",
    episodeId: p1EpisodeIds[0],
    startDate: "2025-09-01",
    endDate: "2026-03-01",
    active: true,
  });

  console.log("  Created 10 podcast episodes (6 Published, 2 Review, 2 Draft), 6 episode links, 1 sponsored slot");

  // Update source counts on holes
  for (const [slug, sIds] of Object.entries(sourceIds)) {
    const holeId = holeIds[slug];
    await db.update(rabbitHoles).set({ sourceCount: sIds.length }).where(
      eq(rabbitHoles.id, holeId)
    );
  }

  console.log("\nSeeding complete!");
  console.log(`  Rabbit Holes: 8`);
  console.log(`  Depth Nodes: ${Object.values(nodesData).reduce((sum, n) => sum + n.length, 0)}`);
  console.log(`  Sources: ${Object.keys(sourceIds).length * 5}`);
  console.log(`  Claims: ${Object.keys(sourceIds).length * 4}`);
  console.log(`  Media: ${Object.keys(sourceIds).length * 4}`);
  console.log(`  Creators: 2`);
  console.log(`  Streams: 6 (3 live, 2 upcoming, 1 ended)`);
  console.log(`  Replays: 1`);
  console.log(`  Podcasts: 2`);
  console.log(`  Episodes: 10 (6 Published, 2 Review, 2 Draft)`);
  console.log(`  Sponsored Slots: 1`);
  process.exit(0);
}

seed().catch(err => { console.error("Seed failed:", err); process.exit(1); });
