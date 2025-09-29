import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, DollarSign, MapPin, Calendar } from "lucide-react";
import { formatCurrency, MAJOR_MARKETS } from "@/utils/languages";
import { format } from "date-fns";

export default function MarketPrices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCommodity, setSelectedCommodity] = useState<string>("all");

  const { data: prices, isLoading } = useQuery({
    queryKey: ["market-prices", searchTerm, selectedState, selectedCommodity],
    queryFn: async () => {
      let query = supabase
        .from("market_prices")
        .select("*")
        .order("price_date", { ascending: false });

      if (selectedState !== "all") {
        query = query.eq("state", selectedState);
      }

      if (selectedCommodity !== "all") {
        query = query.eq("commodity", selectedCommodity);
      }

      if (searchTerm) {
        query = query.or(`commodity.ilike.%${searchTerm}%,market_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const uniqueStates = [...new Set(prices?.map(p => p.state))];
  const uniqueCommodities = [...new Set(prices?.map(p => p.commodity))];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Calculate market statistics
  const avgPrice = prices?.reduce((sum, price) => sum + Number(price.price), 0) / (prices?.length || 1);
  const highestPrice = Math.max(...(prices?.map(p => Number(p.price)) || [0]));
  const lowestPrice = Math.min(...(prices?.map(p => Number(p.price)) || [0]));
  const upTrending = prices?.filter(p => p.price_trend === 'up').length || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">Loading market prices...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Prices</h1>
          <p className="text-muted-foreground">
            Real-time commodity prices from major Nigerian markets
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgPrice)}</div>
            <p className="text-xs text-muted-foreground">Across all commodities</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(highestPrice)}</div>
            <p className="text-xs text-muted-foreground">Peak market price</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Price</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(lowestPrice)}</div>
            <p className="text-xs text-muted-foreground">Most affordable option</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Increases</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upTrending}</div>
            <p className="text-xs text-muted-foreground">Markets with rising prices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Price Data</CardTitle>
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Search commodities or markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCommodity} onValueChange={setSelectedCommodity}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select commodity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Commodities</SelectItem>
                {uniqueCommodities.map((commodity) => (
                  <SelectItem key={commodity} value={commodity}>
                    {commodity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prices?.map((price) => (
              <Card key={price.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{price.commodity}</CardTitle>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(price.price_trend)}
                      <span className={`text-sm font-medium ${getTrendColor(price.price_trend)}`}>
                        {price.price_trend?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(price.price))}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      per {price.unit}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">{price.market_name}</span>
                      <Badge variant="outline">{price.state}</Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(price.price_date), 'MMM d, yyyy')}</span>
                    </div>
                  </div>

                  {(price.seasonal_high || price.seasonal_low) && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Seasonal Range:</p>
                      <div className="flex justify-between text-sm">
                        {price.seasonal_low && (
                          <span className="text-green-600">
                            Low: {formatCurrency(Number(price.seasonal_low))}
                          </span>
                        )}
                        {price.seasonal_high && (
                          <span className="text-red-600">
                            High: {formatCurrency(Number(price.seasonal_high))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Updated {format(new Date(price.updated_at), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!prices || prices.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              No market prices found. Try adjusting your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Information */}
      <Card>
        <CardHeader>
          <CardTitle>Major Nigerian Markets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Object.entries(MAJOR_MARKETS).map(([state, markets]) => (
              <div key={state} className="space-y-2">
                <h4 className="font-semibold">{state}</h4>
                <div className="space-y-1">
                  {markets.map((market) => (
                    <Badge key={market} variant="secondary" className="block w-fit text-xs">
                      {market}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}