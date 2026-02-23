import pg from "pg";

const BIBLE_BOOKS = [
  { name: "Genesis", abbr: "Gen", testament: "OT" },
  { name: "Exodus", abbr: "Exod", testament: "OT" },
  { name: "Leviticus", abbr: "Lev", testament: "OT" },
  { name: "Numbers", abbr: "Num", testament: "OT" },
  { name: "Deuteronomy", abbr: "Deut", testament: "OT" },
  { name: "Joshua", abbr: "Josh", testament: "OT" },
  { name: "Judges", abbr: "Judg", testament: "OT" },
  { name: "Ruth", abbr: "Ruth", testament: "OT" },
  { name: "1 Samuel", abbr: "1Sam", testament: "OT" },
  { name: "2 Samuel", abbr: "2Sam", testament: "OT" },
  { name: "1 Kings", abbr: "1Kgs", testament: "OT" },
  { name: "2 Kings", abbr: "2Kgs", testament: "OT" },
  { name: "1 Chronicles", abbr: "1Chr", testament: "OT" },
  { name: "2 Chronicles", abbr: "2Chr", testament: "OT" },
  { name: "Ezra", abbr: "Ezra", testament: "OT" },
  { name: "Nehemiah", abbr: "Neh", testament: "OT" },
  { name: "Esther", abbr: "Esth", testament: "OT" },
  { name: "Job", abbr: "Job", testament: "OT" },
  { name: "Psalms", abbr: "Ps", testament: "OT" },
  { name: "Proverbs", abbr: "Prov", testament: "OT" },
  { name: "Ecclesiastes", abbr: "Eccl", testament: "OT" },
  { name: "Song of Solomon", abbr: "Song", testament: "OT" },
  { name: "Isaiah", abbr: "Isa", testament: "OT" },
  { name: "Jeremiah", abbr: "Jer", testament: "OT" },
  { name: "Lamentations", abbr: "Lam", testament: "OT" },
  { name: "Ezekiel", abbr: "Ezek", testament: "OT" },
  { name: "Daniel", abbr: "Dan", testament: "OT" },
  { name: "Hosea", abbr: "Hos", testament: "OT" },
  { name: "Joel", abbr: "Joel", testament: "OT" },
  { name: "Amos", abbr: "Amos", testament: "OT" },
  { name: "Obadiah", abbr: "Obad", testament: "OT" },
  { name: "Jonah", abbr: "Jonah", testament: "OT" },
  { name: "Micah", abbr: "Mic", testament: "OT" },
  { name: "Nahum", abbr: "Nah", testament: "OT" },
  { name: "Habakkuk", abbr: "Hab", testament: "OT" },
  { name: "Zephaniah", abbr: "Zeph", testament: "OT" },
  { name: "Haggai", abbr: "Hag", testament: "OT" },
  { name: "Zechariah", abbr: "Zech", testament: "OT" },
  { name: "Malachi", abbr: "Mal", testament: "OT" },
  { name: "Matthew", abbr: "Matt", testament: "NT" },
  { name: "Mark", abbr: "Mark", testament: "NT" },
  { name: "Luke", abbr: "Luke", testament: "NT" },
  { name: "John", abbr: "John", testament: "NT" },
  { name: "Acts", abbr: "Acts", testament: "NT" },
  { name: "Romans", abbr: "Rom", testament: "NT" },
  { name: "1 Corinthians", abbr: "1Cor", testament: "NT" },
  { name: "2 Corinthians", abbr: "2Cor", testament: "NT" },
  { name: "Galatians", abbr: "Gal", testament: "NT" },
  { name: "Ephesians", abbr: "Eph", testament: "NT" },
  { name: "Philippians", abbr: "Phil", testament: "NT" },
  { name: "Colossians", abbr: "Col", testament: "NT" },
  { name: "1 Thessalonians", abbr: "1Thess", testament: "NT" },
  { name: "2 Thessalonians", abbr: "2Thess", testament: "NT" },
  { name: "1 Timothy", abbr: "1Tim", testament: "NT" },
  { name: "2 Timothy", abbr: "2Tim", testament: "NT" },
  { name: "Titus", abbr: "Tit", testament: "NT" },
  { name: "Philemon", abbr: "Phlm", testament: "NT" },
  { name: "Hebrews", abbr: "Heb", testament: "NT" },
  { name: "James", abbr: "Jas", testament: "NT" },
  { name: "1 Peter", abbr: "1Pet", testament: "NT" },
  { name: "2 Peter", abbr: "2Pet", testament: "NT" },
  { name: "1 John", abbr: "1John", testament: "NT" },
  { name: "2 John", abbr: "2John", testament: "NT" },
  { name: "3 John", abbr: "3John", testament: "NT" },
  { name: "Jude", abbr: "Jude", testament: "NT" },
  { name: "Revelation", abbr: "Rev", testament: "NT" },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

async function seedBible() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const existing = await client.query("SELECT id FROM library_works WHERE slug = 'bible-kjv'");
    if (existing.rows.length > 0) {
      console.log("KJV Bible already seeded. Skipping.");
      return;
    }

    console.log("Fetching KJV Bible data...");
    const response = await fetch("https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json");
    if (!response.ok) throw new Error(`Failed to fetch KJV data: ${response.status}`);
    const bibleData: { abbrev: string; name: string; chapters: string[][] }[] = await response.json();
    console.log(`Loaded ${bibleData.length} books from source`);

    await client.query("BEGIN");

    const workResult = await client.query(
      "INSERT INTO library_works (slug, title, description, author, language, year, book_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      ["bible-kjv", "King James Version", "The King James Version (KJV) of the Holy Bible, first published in 1611. Public domain.", "Various", "en", "1611", 66]
    );
    const workId = workResult.rows[0].id;
    console.log(`Created work: bible-kjv (id=${workId})`);

    let totalVerses = 0;

    for (let i = 0; i < BIBLE_BOOKS.length; i++) {
      const bookMeta = BIBLE_BOOKS[i];
      const bookSlug = slugify(bookMeta.name);
      const sourceBook = bibleData[i];

      if (!sourceBook) {
        console.warn(`  WARNING: No source data for book ${i + 1}: ${bookMeta.name}`);
        continue;
      }

      const chapterCount = sourceBook.chapters.length;

      const bookResult = await client.query(
        "INSERT INTO library_books (work_id, slug, name, abbreviation, position, testament, chapter_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [workId, bookSlug, bookMeta.name, bookMeta.abbr, i + 1, bookMeta.testament, chapterCount]
      );
      const bookId = bookResult.rows[0].id;

      for (let ch = 0; ch < sourceBook.chapters.length; ch++) {
        const verses = sourceBook.chapters[ch];
        const chapterNumber = ch + 1;

        const chapterResult = await client.query(
          "INSERT INTO library_chapters (book_id, chapter_number, verse_count) VALUES ($1, $2, $3) RETURNING id",
          [bookId, chapterNumber, verses.length]
        );
        const chapterId = chapterResult.rows[0].id;

        if (verses.length > 0) {
          const valuePlaceholders: string[] = [];
          const params: any[] = [];
          let paramIdx = 1;

          for (let v = 0; v < verses.length; v++) {
            valuePlaceholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3})`);
            params.push(chapterId, bookId, v + 1, verses[v]);
            paramIdx += 4;
          }

          await client.query(
            `INSERT INTO library_verses (chapter_id, book_id, verse_number, text) VALUES ${valuePlaceholders.join(", ")}`,
            params
          );
          totalVerses += verses.length;
        }
      }

      console.log(`  [${i + 1}/66] ${bookMeta.name}: ${chapterCount} chapters`);
    }

    await client.query("COMMIT");
    console.log(`\nSeed complete! Total verses: ${totalVerses}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedBible().catch((err) => {
  console.error(err);
  process.exit(1);
});
