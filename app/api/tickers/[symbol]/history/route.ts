import { NextRequest, NextResponse } from "next/server";
import { createPublicSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const RANGE_HOURS: Record<string, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const normalizedSymbol = symbol.toUpperCase();
  const range = request.nextUrl.searchParams.get("range") ?? "24h";
  const hours = RANGE_HOURS[range] ?? RANGE_HOURS["24h"];
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const supabase = createPublicSupabaseClient();
  const { data, error } = await supabase
    .from("ticker_hourly_sentiment")
    .select("*")
    .eq("symbol", normalizedSymbol)
    .gte("window_start", since)
    .order("window_start", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Unable to load ticker history" }, { status: 500 });
  }

  return NextResponse.json({ symbol: normalizedSymbol, range, rows: data ?? [] });
}
