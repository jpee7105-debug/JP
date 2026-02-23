const BIBLE_BOOKS: { name: string; slug: string; aliases: string[] }[] = [
  { name: "Genesis", slug: "genesis", aliases: ["Gen", "Ge"] },
  { name: "Exodus", slug: "exodus", aliases: ["Exod", "Ex"] },
  { name: "Leviticus", slug: "leviticus", aliases: ["Lev", "Le"] },
  { name: "Numbers", slug: "numbers", aliases: ["Num", "Nu"] },
  { name: "Deuteronomy", slug: "deuteronomy", aliases: ["Deut", "Dt"] },
  { name: "Joshua", slug: "joshua", aliases: ["Josh", "Jos"] },
  { name: "Judges", slug: "judges", aliases: ["Judg", "Jdg"] },
  { name: "Ruth", slug: "ruth", aliases: ["Ru"] },
  { name: "1 Samuel", slug: "1-samuel", aliases: ["1Sam", "1 Sam", "I Samuel", "I Sam"] },
  { name: "2 Samuel", slug: "2-samuel", aliases: ["2Sam", "2 Sam", "II Samuel", "II Sam"] },
  { name: "1 Kings", slug: "1-kings", aliases: ["1Kgs", "1 Kgs", "I Kings", "I Kgs"] },
  { name: "2 Kings", slug: "2-kings", aliases: ["2Kgs", "2 Kgs", "II Kings", "II Kgs"] },
  { name: "1 Chronicles", slug: "1-chronicles", aliases: ["1Chr", "1 Chr", "I Chronicles", "I Chr"] },
  { name: "2 Chronicles", slug: "2-chronicles", aliases: ["2Chr", "2 Chr", "II Chronicles", "II Chr"] },
  { name: "Ezra", slug: "ezra", aliases: ["Ezr"] },
  { name: "Nehemiah", slug: "nehemiah", aliases: ["Neh", "Ne"] },
  { name: "Esther", slug: "esther", aliases: ["Esth", "Est"] },
  { name: "Job", slug: "job", aliases: ["Jb"] },
  { name: "Psalms", slug: "psalms", aliases: ["Ps", "Psalm", "Psa"] },
  { name: "Proverbs", slug: "proverbs", aliases: ["Prov", "Pr"] },
  { name: "Ecclesiastes", slug: "ecclesiastes", aliases: ["Eccl", "Ecc"] },
  { name: "Song of Solomon", slug: "song-of-solomon", aliases: ["Song", "SoS", "Song of Songs", "Songs"] },
  { name: "Isaiah", slug: "isaiah", aliases: ["Isa", "Is"] },
  { name: "Jeremiah", slug: "jeremiah", aliases: ["Jer", "Je"] },
  { name: "Lamentations", slug: "lamentations", aliases: ["Lam", "La"] },
  { name: "Ezekiel", slug: "ezekiel", aliases: ["Ezek", "Eze"] },
  { name: "Daniel", slug: "daniel", aliases: ["Dan", "Da"] },
  { name: "Hosea", slug: "hosea", aliases: ["Hos", "Ho"] },
  { name: "Joel", slug: "joel", aliases: ["Joe"] },
  { name: "Amos", slug: "amos", aliases: ["Am"] },
  { name: "Obadiah", slug: "obadiah", aliases: ["Obad", "Ob"] },
  { name: "Jonah", slug: "jonah", aliases: ["Jon"] },
  { name: "Micah", slug: "micah", aliases: ["Mic", "Mi"] },
  { name: "Nahum", slug: "nahum", aliases: ["Nah", "Na"] },
  { name: "Habakkuk", slug: "habakkuk", aliases: ["Hab"] },
  { name: "Zephaniah", slug: "zephaniah", aliases: ["Zeph", "Zep"] },
  { name: "Haggai", slug: "haggai", aliases: ["Hag"] },
  { name: "Zechariah", slug: "zechariah", aliases: ["Zech", "Zec"] },
  { name: "Malachi", slug: "malachi", aliases: ["Mal"] },
  { name: "Matthew", slug: "matthew", aliases: ["Matt", "Mt"] },
  { name: "Mark", slug: "mark", aliases: ["Mk"] },
  { name: "Luke", slug: "luke", aliases: ["Lk"] },
  { name: "John", slug: "john", aliases: ["Jn"] },
  { name: "Acts", slug: "acts", aliases: ["Ac"] },
  { name: "Romans", slug: "romans", aliases: ["Rom", "Ro"] },
  { name: "1 Corinthians", slug: "1-corinthians", aliases: ["1Cor", "1 Cor", "I Corinthians", "I Cor"] },
  { name: "2 Corinthians", slug: "2-corinthians", aliases: ["2Cor", "2 Cor", "II Corinthians", "II Cor"] },
  { name: "Galatians", slug: "galatians", aliases: ["Gal"] },
  { name: "Ephesians", slug: "ephesians", aliases: ["Eph"] },
  { name: "Philippians", slug: "philippians", aliases: ["Phil", "Php"] },
  { name: "Colossians", slug: "colossians", aliases: ["Col"] },
  { name: "1 Thessalonians", slug: "1-thessalonians", aliases: ["1Thess", "1 Thess", "I Thessalonians", "I Thess"] },
  { name: "2 Thessalonians", slug: "2-thessalonians", aliases: ["2Thess", "2 Thess", "II Thessalonians", "II Thess"] },
  { name: "1 Timothy", slug: "1-timothy", aliases: ["1Tim", "1 Tim", "I Timothy", "I Tim"] },
  { name: "2 Timothy", slug: "2-timothy", aliases: ["2Tim", "2 Tim", "II Timothy", "II Tim"] },
  { name: "Titus", slug: "titus", aliases: ["Tit"] },
  { name: "Philemon", slug: "philemon", aliases: ["Phlm", "Phm"] },
  { name: "Hebrews", slug: "hebrews", aliases: ["Heb"] },
  { name: "James", slug: "james", aliases: ["Jas", "Ja"] },
  { name: "1 Peter", slug: "1-peter", aliases: ["1Pet", "1 Pet", "I Peter", "I Pet"] },
  { name: "2 Peter", slug: "2-peter", aliases: ["2Pet", "2 Pet", "II Peter", "II Pet"] },
  { name: "1 John", slug: "1-john", aliases: ["1Jn", "1 Jn", "I John", "I Jn"] },
  { name: "2 John", slug: "2-john", aliases: ["2Jn", "2 Jn", "II John", "II Jn"] },
  { name: "3 John", slug: "3-john", aliases: ["3Jn", "3 Jn", "III John", "III Jn"] },
  { name: "Jude", slug: "jude", aliases: ["Jud"] },
  { name: "Revelation", slug: "revelation", aliases: ["Rev", "Re", "Revelations"] },
];

export interface ParsedCitation {
  raw: string;
  bookName: string;
  bookSlug: string;
  chapter: number;
  verse: number;
  endVerse?: number;
  url: string;
}

function buildBookLookup(): Map<string, { name: string; slug: string }> {
  const map = new Map<string, { name: string; slug: string }>();
  for (const book of BIBLE_BOOKS) {
    const entry = { name: book.name, slug: book.slug };
    map.set(book.name.toLowerCase(), entry);
    for (const alias of book.aliases) {
      map.set(alias.toLowerCase(), entry);
    }
  }
  return map;
}

const bookLookup = buildBookLookup();

function buildRegex(): RegExp {
  const allNames: string[] = [];
  for (const book of BIBLE_BOOKS) {
    allNames.push(book.name);
    allNames.push(...book.aliases);
  }
  allNames.sort((a, b) => b.length - a.length);
  const escaped = allNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = `(?:${escaped.join("|")})\\s+\\d+:\\d+(?:\\s*-\\s*\\d+)?`;
  return new RegExp(pattern, "gi");
}

const citationRegex = buildRegex();

export function parseCitations(text: string): ParsedCitation[] {
  const matches: ParsedCitation[] = [];
  let match: RegExpExecArray | null;

  const regex = new RegExp(citationRegex.source, citationRegex.flags);

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const refMatch = raw.match(/^(.+?)\s+(\d+):(\d+)(?:\s*-\s*(\d+))?$/i);
    if (!refMatch) continue;

    const bookNameRaw = refMatch[1].trim();
    const chapter = parseInt(refMatch[2]);
    const verse = parseInt(refMatch[3]);
    const endVerse = refMatch[4] ? parseInt(refMatch[4]) : undefined;

    const entry = bookLookup.get(bookNameRaw.toLowerCase());
    if (!entry) continue;

    matches.push({
      raw,
      bookName: entry.name,
      bookSlug: entry.slug,
      chapter,
      verse,
      endVerse,
      url: `/library/bible-kjv/${entry.slug}/${chapter}#v${verse}`,
    });
  }

  return matches;
}

export interface TextSegment {
  type: "text" | "citation";
  content: string;
  citation?: ParsedCitation;
}

export function segmentText(text: string): TextSegment[] {
  const citations = parseCitations(text);
  if (citations.length === 0) return [{ type: "text", content: text }];

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  const regex = new RegExp(citationRegex.source, citationRegex.flags);
  let match: RegExpExecArray | null;
  let citationIdx = 0;

  while ((match = regex.exec(text)) !== null && citationIdx < citations.length) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: "citation", content: match[0], citation: citations[citationIdx] });
    lastIndex = match.index + match[0].length;
    citationIdx++;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}
