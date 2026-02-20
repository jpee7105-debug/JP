import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { rabbitHoles, comments } from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function seed() {
  console.log("Seeding database...");

  const existingHoles = await db.select().from(rabbitHoles);
  if (existingHoles.length > 0) {
    console.log("Database already seeded, skipping.");
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
      timeline: [
        { year: "1953", event: "Project officially sanctioned under CIA Director Allen Dulles.", type: "verified" },
        { year: "1955", event: "Subproject 68 launched at McGill University under Dr. Donald Ewen Cameron.", type: "verified" },
        { year: "1964", event: "Project renamed MKSEARCH with expanded scope.", type: "verified" },
        { year: "1973", event: "CIA Director Richard Helms orders all MKUltra files destroyed.", type: "verified" },
        { year: "1975", event: "Church Committee investigation begins, exposing domestic intelligence abuses.", type: "verified" },
        { year: "1977", event: "Freedom of Information Act request uncovers 20,000 surviving documents.", type: "verified" }
      ],
      sources: [
        { id: 1, title: "CIA Declassified Archives: Behavior Modification", type: "document", credibility: 98, img: null },
        { id: 2, title: "Church Committee Report Book 1", type: "document", credibility: 95, img: null },
        { id: 3, title: "Speculative: Operation Midnight Climax Extensions", type: "theory", credibility: 40, img: null },
        { id: 4, title: "The Search for the Manchurian Candidate - John Marks", type: "book", credibility: 88, img: null }
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
      timeline: [
        { year: "1612", event: "Archive formally established by Pope Paul V.", type: "verified" },
        { year: "1881", event: "Pope Leo XIII opens archives to qualified researchers.", type: "verified" },
        { year: "2001", event: "Chinon Parchment discovered, showing Templar absolution.", type: "verified" },
        { year: "2019", event: "Renamed from 'Secret' to 'Apostolic' Archive by Pope Francis.", type: "verified" },
        { year: "2020", event: "Pius XII wartime files declassified amid controversy.", type: "verified" }
      ],
      sources: [
        { id: 1, title: "The Chinon Parchment - Full Translation", type: "document", credibility: 97, img: null },
        { id: 2, title: "Vatican Secret Diplomacy - Peter Godman", type: "book", credibility: 85, img: null },
        { id: 3, title: "Pius XII and the Holocaust - Declassified Correspondence", type: "document", credibility: 92, img: null }
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
      timeline: [
        { year: "1954", event: "Soviet Ministry of Defense establishes Aralsk-7 bioweapons testing facility on Vozrozhdeniya Island.", type: "verified" },
        { year: "1971", event: "Weaponized smallpox accidentally released from Aralsk-7, infecting nearby fishing vessels.", type: "verified" },
        { year: "1992", event: "Nunn-Lugar Cooperative Threat Reduction Program begins dismantling Soviet-era facilities.", type: "verified" },
        { year: "2001", event: "US and Uzbekistan complete decontamination of Vozrozhdeniya Island anthrax burial sites.", type: "verified" },
        { year: "2018", event: "Renewed geopolitical tensions over remaining facilities spark fresh investigation.", type: "disputed" }
      ],
      sources: [
        { id: 1, title: "Biohazard - Ken Alibek", type: "book", credibility: 90, img: null },
        { id: 2, title: "Cooperative Threat Reduction Annual Report 2005", type: "document", credibility: 95, img: null }
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
      timeline: [
        { year: "2012", event: "First puzzle posted on 4chan's /b/ board on January 4.", type: "verified" },
        { year: "2012", event: "Solvers trace clues through steganographic images, QR codes, and real-world locations in 14 countries.", type: "verified" },
        { year: "2013", event: "Second round of puzzles released, more complex, involving Mayan numerals and Liber Primus.", type: "verified" },
        { year: "2014", event: "Third and final known puzzle released. Liber Primus remains only partially decoded.", type: "verified" },
        { year: "2016", event: "Suspected copycats emerge. No verified communication from original Cicada since 2014.", type: "disputed" }
      ],
      sources: [
        { id: 1, title: "Liber Primus - Partial Decoded Pages", type: "document", credibility: 80, img: null },
        { id: 2, title: "Analysis of Cicada 3301 Cryptographic Methods - Arxiv Paper", type: "document", credibility: 75, img: null }
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
      timeline: [
        { year: "1960s", event: "First documented numbers stations detected by amateur radio enthusiasts during Cold War.", type: "verified" },
        { year: "1998", event: "Cuban Five spy ring convicted; FBI confirms use of numbers stations for communication.", type: "verified" },
        { year: "2001", event: "Ana Montes arrested for espionage; confirmed use of shortwave number broadcasts from Cuban intelligence.", type: "verified" },
        { year: "2010", event: "Illegals Program arrests reveal Russian SVR agents received instructions via numbers stations.", type: "verified" },
        { year: "2023", event: "Multiple new unidentified stations detected across HF bands, origins unknown.", type: "disputed" }
      ],
      sources: [
        { id: 1, title: "The Conet Project - Recordings of Numbers Stations", type: "document", credibility: 92, img: null },
        { id: 2, title: "FBI Case Files: Cuban Five Communication Methods", type: "document", credibility: 98, img: null },
        { id: 3, title: "ENIGMA 2000 Newsletter Archive", type: "document", credibility: 78, img: null }
      ],
    },
  ]).returning();

  // Seed comments for MKUltra
  const mkUltra = holes.find(h => h.slug === "mk-ultra");
  if (mkUltra) {
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
  }

  console.log(`Seeded ${holes.length} rabbit holes with comments.`);
  await pool.end();
}

seed().catch(console.error);
