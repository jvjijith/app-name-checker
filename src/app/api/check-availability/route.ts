import { NextResponse } from "next/server";
import gplay from "google-play-scraper";
import levenshtein from "fast-levenshtein";

function isMatch(query: string, target: string) {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nQuery = normalize(query);
  const nTarget = normalize(target);
  
  if (nQuery === nTarget) return "exact";
  
  // Calculate Levenshtein distance for fuzzy matching
  const distance = levenshtein.get(nQuery, nTarget);
  // If the string length is small, threshold should be smaller. Let's say distance <= 2 is similar
  if (distance <= 2) return "similar";
  
  return "none";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  const baseBundleId = searchParams.get("baseBundleId");

  if (!name || !baseBundleId) {
    return NextResponse.json({ error: "Missing name or baseBundleId" }, { status: 400 });
  }

  // Sanitize the app name for the bundle ID
  const sanitizedAppName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suggestedBundleId = `${baseBundleId}.${sanitizedAppName}`;

  try {
    // 1. Check Apple App Store
    const applePromise = fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(name)}&entity=software&limit=10`)
      .then(res => res.json())
      .then(data => {
        const results = data.results.map((r: any) => ({
          name: r.trackName,
          developer: r.artistName,
          icon: r.artworkUrl512 || r.artworkUrl100,
          url: r.trackViewUrl
        }));

        let status = "available";
        const topResults = results.slice(0, 3);
        
        for (const r of results) {
          const match = isMatch(name, r.name);
          if (match === "exact") {
            status = "taken";
            break;
          } else if (match === "similar" && status !== "taken") {
            status = "similar";
          }
        }

        return { status, results: topResults };
      });

    // 2. Check Google Play Store using google-play-scraper
    const googlePromise = gplay.search({ term: name, num: 10 }).then(data => {
      const results = data.map((r: any) => ({
        name: r.title,
        developer: r.developer,
        icon: r.icon,
        url: r.url
      }));

      let status = "available";
      const topResults = results.slice(0, 3);

      for (const r of results) {
        const match = isMatch(name, r.name);
        if (match === "exact") {
          status = "taken";
          break;
        } else if (match === "similar" && status !== "taken") {
          status = "similar";
        }
      }

      return { status, results: topResults };
    });

    // 3. Check suggested Bundle ID availability directly on Google Play
    const bundlePromise = fetch(`https://play.google.com/store/apps/details?id=${suggestedBundleId}`)
      .then(res => {
        // If 404, it means the bundle ID is available
        return { id: suggestedBundleId, available: res.status === 404 };
      })
      .catch(() => {
        // If there's an error fetching (e.g. network issue), we can't be sure, but 404 is typical for available
        return { id: suggestedBundleId, available: true };
      });

    const [apple, google, bundleId] = await Promise.all([applePromise, googlePromise, bundlePromise]);

    return NextResponse.json({ apple, google, suggestedBundleId: bundleId });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json({ error: "Failed to check availability" }, { status: 500 });
  }
}
