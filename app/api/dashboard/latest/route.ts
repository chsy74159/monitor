import { NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createPublicSupabaseClient();
  const mood = await supabase
    .from("market_hourly_mood")
    .select("*")
    .order("window_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (mood.error) {
    return NextResponse.json({ error: "Unable to load dashboard data" }, { status: 500 });
  }

  if (!mood.data) {
    return NextResponse.json({ mood: null, tickers: [], alerts: [], topics: [] });
  }

  const windowStart = mood.data.window_start;
  const [tickers, alerts, topics] = await Promise.all([
    supabase
      .from("ticker_hourly_sentiment")
      .select("*")
      .eq("window_start", windowStart)
      .order("avg_sentiment", { ascending: false }),
    supabase
      .from("alert_events")
      .select("*")
      .eq("window_start", windowStart)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("topic_clusters").select("*").eq("window_start", windowStart).order("score", { ascending: false }).limit(10)
  ]);

  if (tickers.error || alerts.error || topics.error) {
    return NextResponse.json({ error: "Unable to load dashboard data" }, { status: 500 });
  }

  return NextResponse.json({
    mood: mood.data,
    tickers: tickers.data ?? [],
    alerts: alerts.data ?? [],
    topics: topics.data ?? []
  });
}
