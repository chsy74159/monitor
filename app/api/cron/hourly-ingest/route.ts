import { NextRequest, NextResponse } from "next/server";
import { runHourlyIngest } from "@/lib/ingest/hourly-pipeline";
import { previousHourWindow } from "@/lib/ingest/time";
import { FinnhubMarketDataProvider } from "@/lib/providers/market-data";
import { MarketauxNewsProvider } from "@/lib/providers/news";
import { DashboardRepository } from "@/lib/repositories/dashboard-repository";
import { createServiceSupabaseClient, requireEnv } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const expected = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");

  return Boolean(expected && header === `Bearer ${expected}`);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { windowStart, windowEnd } = previousHourWindow();
    const result = await runHourlyIngest({
      windowStart,
      windowEnd,
      marketDataProvider: new FinnhubMarketDataProvider(requireEnv("FINNHUB_API_KEY")),
      newsProvider: new MarketauxNewsProvider(requireEnv("MARKETAUX_API_KEY")),
      repository: new DashboardRepository(createServiceSupabaseClient())
    });

    return NextResponse.json({ ok: true, windowStart, windowEnd, result });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to run hourly ingest" }, { status: 500 });
  }
}
