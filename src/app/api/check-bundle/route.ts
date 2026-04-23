import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bundleId = searchParams.get("bundleId");

  if (!bundleId) {
    return NextResponse.json({ error: "Missing bundleId" }, { status: 400 });
  }

  try {
    // 1. Check Google Play Store
    const googlePromise = fetch(`https://play.google.com/store/apps/details?id=${bundleId}`)
      .then(res => {
        return { available: res.status === 404 };
      })
      .catch(() => {
        return { available: true };
      });

    // 2. Check Apple App Store (iTunes Lookup API supports bundleId)
    const applePromise = fetch(`https://itunes.apple.com/lookup?bundleId=${bundleId}`)
      .then(res => res.json())
      .then(data => {
        return { available: data.resultCount === 0 };
      })
      .catch(() => {
        return { available: true };
      });

    const [google, apple] = await Promise.all([googlePromise, applePromise]);

    return NextResponse.json({ google, apple });
  } catch (error) {
    console.error("Error checking bundle availability:", error);
    return NextResponse.json({ error: "Failed to check bundle availability" }, { status: 500 });
  }
}
