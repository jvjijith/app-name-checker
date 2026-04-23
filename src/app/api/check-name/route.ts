import { NextResponse } from "next/server";
import gplay from "google-play-scraper";
import levenshtein from "fast-levenshtein";

function isMatch(query: string, target: string) {
  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const nQuery = normalize(query);
  const nTarget = normalize(target);
  
  if (nQuery === nTarget) return "exact";
  
  const distance = levenshtein.get(nQuery, nTarget);
  if (distance <= 2) return "similar";
  
  return "none";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  }

  try {
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

    const googlePromise = gplay.search({ term: name, num: 10 }).then(data => {
      const results = data.map((r: any) => ({
        name: r.title,
        developer: r.developer,
        icon: r.icon.startsWith("//") ? `https:${r.icon}` : r.icon,
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

    const [apple, google] = await Promise.all([applePromise, googlePromise]);

    return NextResponse.json({ apple, google });
  } catch (error) {
    console.error("Error checking name availability:", error);
    return NextResponse.json({ error: "Failed to check name availability" }, { status: 500 });
  }
}
