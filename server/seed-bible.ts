import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const BIBLE_BOOKS = [
  { name: "Genesis", abbr: "Gen" },
  { name: "Exodus", abbr: "Exod" },
  { name: "Leviticus", abbr: "Lev" },
  { name: "Numbers", abbr: "Num" },
  { name: "Deuteronomy", abbr: "Deut" },
  { name: "Joshua", abbr: "Josh" },
  { name: "Judges", abbr: "Judg" },
  { name: "Ruth", abbr: "Ruth" },
  { name: "1 Samuel", abbr: "1Sam" },
  { name: "2 Samuel", abbr: "2Sam" },
  { name: "1 Kings", abbr: "1Kgs" },
  { name: "2 Kings", abbr: "2Kgs" },
  { name: "1 Chronicles", abbr: "1Chr" },
  { name: "2 Chronicles", abbr: "2Chr" },
  { name: "Ezra", abbr: "Ezra" },
  { name: "Nehemiah", abbr: "Neh" },
  { name: "Esther", abbr: "Esth" },
  { name: "Job", abbr: "Job" },
  { name: "Psalms", abbr: "Ps" },
  { name: "Proverbs", abbr: "Prov" },
  { name: "Ecclesiastes", abbr: "Eccl" },
  { name: "Song of Solomon", abbr: "Song" },
  { name: "Isaiah", abbr: "Isa" },
  { name: "Jeremiah", abbr: "Jer" },
  { name: "Lamentations", abbr: "Lam" },
  { name: "Ezekiel", abbr: "Ezek" },
  { name: "Daniel", abbr: "Dan" },
  { name: "Hosea", abbr: "Hos" },
  { name: "Joel", abbr: "Joel" },
  { name: "Amos", abbr: "Amos" },
  { name: "Obadiah", abbr: "Obad" },
  { name: "Jonah", abbr: "Jonah" },
  { name: "Micah", abbr: "Mic" },
  { name: "Nahum", abbr: "Nah" },
  { name: "Habakkuk", abbr: "Hab" },
  { name: "Zephaniah", abbr: "Zeph" },
  { name: "Haggai", abbr: "Hag" },
  { name: "Zechariah", abbr: "Zech" },
  { name: "Malachi", abbr: "Mal" },
  { name: "Matthew", abbr: "Matt" },
  { name: "Mark", abbr: "Mark" },
  { name: "Luke", abbr: "Luke" },
  { name: "John", abbr: "John" },
  { name: "Acts", abbr: "Acts" },
  { name: "Romans", abbr: "Rom" },
  { name: "1 Corinthians", abbr: "1Cor" },
  { name: "2 Corinthians", abbr: "2Cor" },
  { name: "Galatians", abbr: "Gal" },
  { name: "Ephesians", abbr: "Eph" },
  { name: "Philippians", abbr: "Phil" },
  { name: "Colossians", abbr: "Col" },
  { name: "1 Thessalonians", abbr: "1Thess" },
  { name: "2 Thessalonians", abbr: "2Thess" },
  { name: "1 Timothy", abbr: "1Tim" },
  { name: "2 Timothy", abbr: "2Tim" },
  { name: "Titus", abbr: "Tit" },
  { name: "Philemon", abbr: "Phlm" },
  { name: "Hebrews", abbr: "Heb" },
  { name: "James", abbr: "Jas" },
  { name: "1 Peter", abbr: "1Pet" },
  { name: "2 Peter", abbr: "2Pet" },
  { name: "1 John", abbr: "1John" },
  { name: "2 John", abbr: "2John" },
  { name: "3 John", abbr: "3John" },
  { name: "Jude", abbr: "Jude" },
  { name: "Revelation", abbr: "Rev" },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

const BASE_URL = "https://raw.githubusercontent.com/aruljohn/Bible-kjv/master";

async function fetchJSON(url: string): Promise<any> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
  return response.json();
}

async function seedBible() {
  const client = await pool.connect();

  try {
    const existing = await client.query("SELECT id FROM library_works WHERE slug = 'bible-kjv'");
    if (existing.rows.length > 0) {
      console.log("KJV Bible already seeded. Deleting and re-seeding...");
      const workId = existing.rows[0].id;
      await client.query("BEGIN");
      await client.query("DELETE FROM library_verses WHERE book_id IN (SELECT id FROM library_books WHERE work_id = $1)", [workId]);
      await client.query("DELETE FROM library_chapters WHERE book_id IN (SELECT id FROM library_books WHERE work_id = $1)", [workId]);
      await client.query("DELETE FROM library_books WHERE work_id = $1", [workId]);
      await client.query("DELETE FROM library_works WHERE id = $1", [workId]);
      await client.query("COMMIT");
      console.log("Deleted existing KJV data.");
    }

    console.log("Fetching KJV Bible book list...");
    const booksIndex: string[] = await fetchJSON(`${BASE_URL}/Books.json`);
    console.log(`Found ${booksIndex.length} books in Books.json`);

    await client.query("BEGIN");

    const workResult = await client.query(
      "INSERT INTO library_works (slug, title, description, author, language, year, book_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      ["bible-kjv", "King James Version", "The King James Version of the Holy Bible", "Various", "en", "1611", 66]
    );
    const workId = workResult.rows[0].id;
    console.log(`Created work: bible-kjv (id=${workId})`);

    let totalVerses = 0;

    for (let i = 0; i < BIBLE_BOOKS.length; i++) {
      const bookMeta = BIBLE_BOOKS[i];
      const bookSlug = slugify(bookMeta.name);
      const testament = i < 39 ? "Old Testament" : "New Testament";

      const bookFileName = booksIndex[i];
      if (!bookFileName) {
        console.warn(`  WARNING: No book file name for index ${i}: ${bookMeta.name}`);
        continue;
      }

      let bookData: { book: string; chapters: { chapter: string; verses: { verse: string; text: string }[] }[] };
      const repoFileName = bookFileName.replace(/\s+/g, "");
      try {
        bookData = await fetchJSON(`${BASE_URL}/${repoFileName}.json`);
      } catch (err) {
        console.warn(`  WARNING: Failed to fetch ${repoFileName}.json, skipping ${bookMeta.name}`);
        continue;
      }

      const chapterCount = bookData.chapters.length;

      const bookResult = await client.query(
        "INSERT INTO library_books (work_id, slug, name, abbreviation, position, testament, chapter_count) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [workId, bookSlug, bookMeta.name, bookMeta.abbr, i + 1, testament, chapterCount]
      );
      const bookId = bookResult.rows[0].id;

      for (let ch = 0; ch < bookData.chapters.length; ch++) {
        const chapterData = bookData.chapters[ch];
        const chapterNumber = ch + 1;
        const verses = chapterData.verses;

        const chapterResult = await client.query(
          "INSERT INTO library_chapters (book_id, chapter_number, verse_count) VALUES ($1, $2, $3) RETURNING id",
          [bookId, chapterNumber, verses.length]
        );
        const chapterId = chapterResult.rows[0].id;

        if (verses.length > 0) {
          const BATCH_SIZE = 100;
          for (let bStart = 0; bStart < verses.length; bStart += BATCH_SIZE) {
            const batch = verses.slice(bStart, bStart + BATCH_SIZE);
            const valuePlaceholders: string[] = [];
            const params: any[] = [];
            let paramIdx = 1;

            for (const v of batch) {
              valuePlaceholders.push(`($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3})`);
              params.push(chapterId, bookId, parseInt(v.verse, 10), v.text);
              paramIdx += 4;
            }

            await client.query(
              `INSERT INTO library_verses (chapter_id, book_id, verse_number, text) VALUES ${valuePlaceholders.join(", ")}`,
              params
            );
          }
          totalVerses += verses.length;
        }
      }

      console.log(`  [${i + 1}/66] ${bookMeta.name}: ${chapterCount} chapters (${testament})`);
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
