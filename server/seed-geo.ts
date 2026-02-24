import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { rabbitHoles, people, globalTimelineItems } from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const investigationGeoData: Record<string, { latitude: number; longitude: number; country: string; region?: string; city?: string }> = {
  "mkultra": { latitude: 38.9072, longitude: -77.0369, country: "United States", region: "District of Columbia", city: "Washington DC" },
  "vatican-archives": { latitude: 41.9022, longitude: 12.4534, country: "Vatican City", city: "Vatican City" },
  "steppe-pathogens": { latitude: 46.7903, longitude: 61.6601, country: "Kazakhstan", region: "Kyzylorda", city: "Aralsk" },
  "cicada-3301": { latitude: 51.5074, longitude: -0.1278, country: "United Kingdom", region: "England", city: "London" },
  "numbers-stations": { latitude: 55.7558, longitude: 37.6173, country: "Russia", region: "Moscow Oblast", city: "Moscow" },
  "aurora-network": { latitude: 52.5200, longitude: 13.4050, country: "Germany", region: "Berlin", city: "Berlin" },
  "vaultkey-protocol": { latitude: 1.3521, longitude: 103.8198, country: "Singapore", city: "Singapore" },
  "echo-garden": { latitude: 47.1660, longitude: 9.5554, country: "Liechtenstein", city: "Vaduz" },
  "cerberus-firewall": { latitude: 39.1087, longitude: -76.7713, country: "United States", region: "Maryland", city: "Fort Meade" },
  "phantom-ledger": { latitude: 47.3769, longitude: 8.5417, country: "Switzerland", region: "Zurich", city: "Zurich" },
  "iron-meridian": { latitude: 48.8566, longitude: 2.3522, country: "France", region: "Île-de-France", city: "Paris" },
  "silverthread-archive": { latitude: 38.8339, longitude: -104.8214, country: "United States", region: "Colorado", city: "Colorado Springs" },
  "obsidian-charter": { latitude: 38.8800, longitude: -77.1012, country: "United States", region: "Virginia", city: "Arlington" },
};

const timelineGeoItems = [
  {
    date: "1953-04-13",
    title: "CIA Authorizes Project MKUltra",
    summary: "Director Allen Dulles formally approves MKUltra, a top-secret mind control research program involving universities, hospitals, and prisons across the United States.",
    country: "United States",
    region: "District of Columbia",
    city: "Washington DC",
    lat: 38.9072,
    lng: -77.0369,
    linkType: "investigation" as const,
    tags: ["mkultra", "cia", "cold-war"],
    status: "Published" as const,
    sortPriority: 10,
  },
  {
    date: "2012-01-05",
    title: "Cicada 3301 First Puzzle Posted",
    summary: "A mysterious image appears on 4chan containing hidden data, launching the first iteration of the Cicada 3301 puzzle that would span multiple countries and media formats.",
    country: "United Kingdom",
    region: "England",
    city: "London",
    lat: 51.5074,
    lng: -0.1278,
    linkType: "investigation" as const,
    tags: ["cicada-3301", "cryptography", "puzzle"],
    status: "Published" as const,
    sortPriority: 8,
  },
  {
    date: "1971-07-01",
    title: "Aralsk-7 Smallpox Incident",
    summary: "A research vessel on the Aral Sea inadvertently exposes crew to weaponized smallpox from the nearby Vozrozhdeniya Island bioweapons testing site.",
    country: "Kazakhstan",
    region: "Kyzylorda",
    city: "Aralsk",
    lat: 46.7903,
    lng: 61.6601,
    linkType: "investigation" as const,
    tags: ["bioweapons", "cold-war", "aral-sea"],
    status: "Published" as const,
    sortPriority: 9,
  },
  {
    date: "1989-11-09",
    title: "Fall of the Berlin Wall",
    summary: "The Berlin Wall falls, ending decades of Cold War division and exposing intelligence networks that had operated in the shadow of the Iron Curtain.",
    country: "Germany",
    region: "Berlin",
    city: "Berlin",
    lat: 52.5200,
    lng: 13.4050,
    linkType: "external" as const,
    linkUrl: "https://en.wikipedia.org/wiki/Fall_of_the_Berlin_Wall",
    tags: ["cold-war", "intelligence", "europe"],
    status: "Published" as const,
    sortPriority: 7,
  },
];

async function seedGeoData() {
  console.log("🌍 Seeding geographic data...\n");

  let updatedInvestigations = 0;
  for (const [slug, geo] of Object.entries(investigationGeoData)) {
    const [hole] = await db.select().from(rabbitHoles).where(eq(rabbitHoles.slug, slug));
    if (hole) {
      await db.update(rabbitHoles).set({
        latitude: geo.latitude,
        longitude: geo.longitude,
        country: geo.country,
        region: geo.region || null,
        city: geo.city || null,
      }).where(eq(rabbitHoles.id, hole.id));
      console.log(`  ✅ ${hole.title} → ${geo.city || geo.country} (${geo.latitude}, ${geo.longitude})`);
      updatedInvestigations++;
    } else {
      console.log(`  ⚠️  Investigation "${slug}" not found, skipping`);
    }
  }

  console.log(`\n📍 Updated ${updatedInvestigations} investigations with geo data\n`);

  const allPeople = await db.select().from(people);
  let updatedPeople = 0;
  const peopleGeoFallbacks: Record<string, { lat: number; lng: number }> = {
    "american": { lat: 38.9072, lng: -77.0369 },
    "british": { lat: 51.5074, lng: -0.1278 },
    "german": { lat: 52.5200, lng: 13.4050 },
    "russian": { lat: 55.7558, lng: 37.6173 },
    "french": { lat: 48.8566, lng: 2.3522 },
    "swiss": { lat: 47.3769, lng: 8.5417 },
    "italian": { lat: 41.9028, lng: 12.4964 },
  };

  for (const person of allPeople) {
    if (person.latitude && person.longitude) continue;
    const nat = (person.nationality || "").toLowerCase();
    const match = Object.entries(peopleGeoFallbacks).find(([key]) => nat.includes(key));
    if (match) {
      const jitter = () => (Math.random() - 0.5) * 0.5;
      await db.update(people).set({
        latitude: match[1].lat + jitter(),
        longitude: match[1].lng + jitter(),
      }).where(eq(people.id, person.id));
      console.log(`  ✅ ${person.fullName} → ${match[0]} (${match[1].lat.toFixed(2)}, ${match[1].lng.toFixed(2)})`);
      updatedPeople++;
    }
  }

  console.log(`\n👤 Updated ${updatedPeople} people with geo data\n`);

  let createdTimeline = 0;
  for (const item of timelineGeoItems) {
    const [created] = await db.insert(globalTimelineItems).values(item).returning();
    console.log(`  ✅ Timeline: "${created.title}" → ${item.city} (${item.lat}, ${item.lng})`);
    createdTimeline++;
  }

  console.log(`\n📅 Created ${createdTimeline} geo-tagged timeline items\n`);
  console.log("🌍 Geo data seeding complete!");

  await pool.end();
}

seedGeoData().catch((err) => {
  console.error("❌ Geo seed failed:", err);
  process.exit(1);
});
