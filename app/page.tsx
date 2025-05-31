"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Download,
  Zap,
  Clock,
  Shield,
  RefreshCw,
  Copy,
  Filter,
  Search,
  ExternalLink,
  Heart,
  Users,
  Activity,
  Server,
  Wifi,
  AlertTriangle,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

interface VPNServer {
  hostname: string
  ip: string
  score: number
  ping: string
  speed: number
  countryLong: string
  countryShort: string
  numVpnSessions: number
  uptime: number
  totalUsers: number
  totalTraffic: string
  logType: string
  operator: string
  message: string
  openVPNConfigDataBase64: string
}

interface Filters {
  search: string
  country: string
  minSpeed: number
  maxSpeed: number
  maxPing: number
  logType: string
  showFavoritesOnly: boolean
}

interface CacheInfo {
  hit: boolean
  age: number
  ttl: number
  lastFetch: number
}

export default function VPNGateApp() {
  const [servers, setServers] = useState<VPNServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedServer, setSelectedServer] = useState<VPNServer | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showUsagePolicy, setShowUsagePolicy] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: "",
    country: "all",
    minSpeed: 0,
    maxSpeed: 100,
    maxPing: 1000,
    logType: "all",
    showFavoritesOnly: false,
  })
  const { toast } = useToast()

  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [sortBy, setSortBy] = useState("score")
  const [totalServers, setTotalServers] = useState(0)
  const [showOpenVPNHelp, setShowOpenVPNHelp] = useState(false)

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("vpn-favorites")
    if (savedFavorites) {
      try {
        const favArray = JSON.parse(savedFavorites)
        setFavorites(new Set(favArray))
      } catch (err) {
        console.error("Failed to load favorites:", err)
      }
    }
  }, [])

  // Save favorites to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem("vpn-favorites", JSON.stringify(Array.from(favorites)))
  }, [favorites])

  const toggleFavorite = (server: VPNServer) => {
    const serverId = `${server.ip}-${server.hostname}`
    const newFavorites = new Set(favorites)

    if (newFavorites.has(serverId)) {
      newFavorites.delete(serverId)
      toast({
        title: "Removed from Favorites",
        description: `${server.countryLong} server removed from favorites.`,
      })
    } else {
      newFavorites.add(serverId)
      toast({
        title: "Added to Favorites",
        description: `${server.countryLong} server added to favorites.`,
      })
    }

    setFavorites(newFavorites)
  }

  const isFavorite = (server: VPNServer) => {
    const serverId = `${server.ip}-${server.hostname}`
    return favorites.has(serverId)
  }

  const fetchVPNServers = async (loadMore = false, forceRefresh = false) => {
    if (loadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setServers([])
    }
    setError(null)

    try {
      const offset = loadMore ? servers.length : 0
      const refreshParam = forceRefresh ? "&refresh=true" : ""
      const response = await fetch(`/api/vpn-servers?limit=50&sortBy=${sortBy}&offset=${offset}${refreshParam}`)

      if (!response.ok) {
        throw new Error("Failed to fetch VPN servers")
      }

      const data = await response.json()

      if (loadMore) {
        setServers((prev) => [...prev, ...(data.servers || [])])
      } else {
        setServers(data.servers || [])
      }

      setHasMore(data.hasMore || false)
      setTotalServers(data.total || 0)
      setCacheInfo(data.cache || null)

      // Show cache status in toast for force refresh
      if (forceRefresh) {
        toast({
          title: "Data Refreshed",
          description: `Fetched fresh data from VPN Gate API. ${data.total} servers available.`,
        })
      }
    } catch (err) {
      setError("Failed to load VPN servers. Please try again.")
      console.error("Error fetching VPN servers:", err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy)
    // Reset and fetch with new sorting
    setServers([])
    setHasMore(true)
  }

  const handleRefresh = () => {
    fetchVPNServers(false, true) // Force refresh
  }

  useEffect(() => {
    fetchVPNServers()
  }, [sortBy])

  const loadMoreServers = () => {
    if (!loadingMore && hasMore) {
      fetchVPNServers(true)
    }
  }

  // Filter servers based on current filters
  const filteredServers = useMemo(() => {
    const filtered = servers.filter((server) => {
      const matchesSearch =
        server.countryLong.toLowerCase().includes(filters.search.toLowerCase()) ||
        server.hostname.toLowerCase().includes(filters.search.toLowerCase()) ||
        server.operator.toLowerCase().includes(filters.search.toLowerCase())
      const matchesCountry = filters.country === "all" || server.countryShort === filters.country
      const matchesSpeed = server.speed >= filters.minSpeed * 1000000 // Convert Mbps to bps
      const matchesPing = Number.parseInt(server.ping) <= filters.maxPing
      const matchesLogType =
        filters.logType === "all" ||
        (filters.logType === "No Logging" && (server.logType.includes("No") || server.logType.includes("no"))) ||
        (filters.logType === "Some Logging" && !server.logType.includes("No") && !server.logType.includes("no"))
      const matchesFavorites = !filters.showFavoritesOnly || isFavorite(server)

      return matchesSearch && matchesCountry && matchesSpeed && matchesPing && matchesLogType && matchesFavorites
    })

    // If showing favorites only, sort favorites first
    if (filters.showFavoritesOnly) {
      filtered.sort((a, b) => {
        const aFav = isFavorite(a)
        const bFav = isFavorite(b)
        if (aFav && !bFav) return -1
        if (!aFav && bFav) return 1
        return 0
      })
    } else {
      // Sort favorites first, then by selected criteria
      filtered.sort((a, b) => {
        const aFav = isFavorite(a)
        const bFav = isFavorite(b)
        if (aFav && !bFav) return -1
        if (!aFav && bFav) return 1

        // Then sort by selected criteria
        switch (sortBy) {
          case "speed":
            return b.speed - a.speed
          case "ping":
            return Number.parseInt(a.ping) - Number.parseInt(b.ping)
          case "uptime":
            return b.uptime - a.uptime
          case "users":
            return a.numVpnSessions - b.numVpnSessions
          case "score":
          default:
            return b.score - a.score
        }
      })
    }

    return filtered
  }, [servers, filters, favorites, sortBy])

  // Get unique countries for filter dropdown
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(new Set(servers.map((s) => s.countryShort)))
    return uniqueCountries
      .map((code) => ({
        code,
        name: servers.find((s) => s.countryShort === code)?.countryLong || code,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [servers])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      })
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    }
  }

  const connectDirectly = (server: VPNServer) => {
    setSelectedServer(server)
  }

  const openInOpenVPN = async (server: VPNServer) => {
    try {
      const configData = server.openVPNConfigDataBase64
      const fileName = `${server.countryShort}_${server.hostname}.ovpn`
      const ovpnContent = atob(configData)

      // Create the file blob with multiple MIME types for better Android compatibility
      const blob = new Blob([ovpnContent], {
        type: "application/x-openvpn-profile",
      })

      // Try Web Share API first (most reliable on Android)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], fileName, {
            type: "application/x-openvpn-profile",
          })

          const shareData = {
            files: [file],
            title: `VPN Profile: ${server.countryLong}`,
            text: `Import this VPN profile into OpenVPN Connect`,
          }

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData)
            toast({
              title: "Profile Shared",
              description: "Select 'OpenVPN Connect' from the sharing options to import the profile directly.",
              duration: 10000,
            })
            return
          }
        } catch (shareError) {
          console.log("Web Share failed, trying download method")
        }
      }

      // Enhanced download method with proper Android file association
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName

      // Add Android-specific attributes for better app association
      a.setAttribute("type", "application/x-openvpn-profile")
      a.setAttribute("data-mime-type", "application/x-openvpn-profile")

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      // Small delay then try to trigger Android intent
      setTimeout(() => {
        // Create a data URL for Android intent
        const dataUrl = `data:application/x-openvpn-profile;base64,${configData}`

        // Try Android intent to open with OpenVPN
        try {
          const intentUrl = `intent:${dataUrl}#Intent;scheme=content;type=application/x-openvpn-profile;package=net.openvpn.openvpn;action=android.intent.action.VIEW;end`
          window.location.href = intentUrl
        } catch (intentError) {
          console.log("Intent failed, showing manual instructions")
        }

        URL.revokeObjectURL(url)
      }, 500)

      toast({
        title: "Profile Downloaded",
        description: "Check your downloads - tap the file to open with OpenVPN Connect!",
        duration: 8000,
      })

      // Show the help dialog after a delay
      setTimeout(() => {
        setShowOpenVPNHelp(true)
      }, 2000)
    } catch (err) {
      console.error("Error opening in OpenVPN:", err)
      toast({
        title: "Failed to Open",
        description: "Could not process VPN profile. Please try downloading instead.",
        variant: "destructive",
      })
    }
  }

  const formatSpeed = (speed: number) => {
    // Speed is in bps, convert to Mbps/Kbps
    if (speed > 1000000) {
      return `${(speed / 1000000).toFixed(1)} Mbps`
    }
    if (speed > 1000) {
      return `${(speed / 1000).toFixed(0)} Kbps`
    }
    return `${speed} bps`
  }

  const formatTraffic = (traffic: string) => {
    const num = Number.parseInt(traffic)
    if (num > 1000000000) {
      return `${(num / 1000000000).toFixed(1)} GB`
    }
    if (num > 1000000) {
      return `${(num / 1000000).toFixed(1)} MB`
    }
    return `${(num / 1000).toFixed(1)} KB`
  }

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime / 86400)
    const hours = Math.floor((uptime % 86400) / 3600)
    if (days > 0) {
      return `${days}d ${hours}h`
    }
    return `${hours}h`
  }

  const getCountryFlag = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  const resetFilters = () => {
    setFilters({
      search: "",
      country: "all",
      minSpeed: 0,
      maxSpeed: 100,
      maxPing: 1000,
      logType: "all",
      showFavoritesOnly: false,
    })
  }

  const getQualityBadge = (server: VPNServer) => {
    const score = server.score
    const ping = Number.parseInt(server.ping)
    const speed = server.speed / 1000000 // Convert to Mbps

    if (score > 10000000 && ping < 50 && speed > 10) {
      return { label: "Excellent", variant: "default" as const, color: "bg-green-500" }
    } else if (score > 1000000 && ping < 100 && speed > 5) {
      return { label: "Good", variant: "secondary" as const, color: "bg-blue-500" }
    } else if (ping < 200 && speed > 1) {
      return { label: "Fair", variant: "outline" as const, color: "bg-yellow-500" }
    } else {
      return { label: "Poor", variant: "destructive" as const, color: "bg-red-500" }
    }
  }

  const formatCacheAge = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">VPN Gate Client</h1>
          <p className="text-muted-foreground">Loading free VPN servers...</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">VPN Gate Client</h1>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 mb-4">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchVPNServers(false, true)} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-6">
        {/* Main Title - Compact */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold flex items-center justify-center gap-2 mb-1">
            <Shield className="w-6 h-6" />
            VPN Gate Client
          </h1>
          <p className="text-sm text-muted-foreground">
            Free VPN servers • Created by{" "}
            <a
              href="https://www.linkedin.com/in/im-suhail-akhtar"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Suhail Akhtar
            </a>
          </p>
        </div>

        {/* Status Bar - Compact Info */}
        <div className="flex items-center justify-center gap-4 mb-4 text-xs text-muted-foreground">
          {cacheInfo && (
            <Badge variant={cacheInfo.hit ? "secondary" : "outline"} className="text-xs">
              {cacheInfo.hit ? "📋" : "🔄"} {formatCacheAge(cacheInfo.age)} old • Expires{" "}
              {formatCacheAge(cacheInfo.ttl)}
            </Badge>
          )}
          {servers.length > 0 && (
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3" />
              {filteredServers.length} of {totalServers} servers
            </span>
          )}
          {favorites.size > 0 && (
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3 fill-red-500 text-red-500" />
              {favorites.size} favorites
            </span>
          )}
        </div>

        {/* Action Bar - Horizontal Layout */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-1" />
            Filters
            {(filters.search ||
              filters.country !== "all" ||
              filters.logType !== "all" ||
              filters.minSpeed > 0 ||
              filters.maxPing < 1000) && (
              <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                !
              </Badge>
            )}
          </Button>
          <Button
            onClick={() => setFilters((prev) => ({ ...prev, showFavoritesOnly: !prev.showFavoritesOnly }))}
            variant={filters.showFavoritesOnly ? "default" : "outline"}
            size="sm"
          >
            <Heart className={`w-4 h-4 mr-1 ${filters.showFavoritesOnly ? "fill-current" : ""}`} />
            Favorites
            {favorites.size > 0 && (
              <Badge variant={filters.showFavoritesOnly ? "secondary" : "default"} className="ml-1 h-4 w-4 p-0 text-xs">
                {favorites.size}
              </Badge>
            )}
          </Button>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Best Score</SelectItem>
              <SelectItem value="speed">Fastest</SelectItem>
              <SelectItem value="ping">Low Ping</SelectItem>
              <SelectItem value="uptime">Uptime</SelectItem>
              <SelectItem value="users">Low Usage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Filters</span>
              <Button onClick={resetFilters} variant="ghost" size="sm">
                Reset
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Country, hostname, or operator..."
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Country</Label>
                <Select
                  value={filters.country}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {getCountryFlag(country.code)} {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Log Policy</Label>
                <Select
                  value={filters.logType}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, logType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All policies" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Policies</SelectItem>
                    <SelectItem value="No Logging">No Logging Policy</SelectItem>
                    <SelectItem value="Some Logging">Some Logging Policy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Minimum Speed: {filters.minSpeed} Mbps</Label>
                <Slider
                  value={[filters.minSpeed]}
                  onValueChange={([value]) => setFilters((prev) => ({ ...prev, minSpeed: value }))}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Maximum Ping: {filters.maxPing}ms</Label>
                <Slider
                  value={[filters.maxPing]}
                  onValueChange={([value]) => setFilters((prev) => ({ ...prev, maxPing: value }))}
                  max={1000}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredServers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {servers.length === 0
              ? "No VPN servers available at the moment."
              : filters.showFavoritesOnly
                ? "No favorite servers found. Add some servers to favorites first!"
                : "No servers match your filters."}
          </p>
          {servers.length > 0 && (
            <Button onClick={resetFilters} variant="outline" className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredServers.map((server, index) => {
              const quality = getQualityBadge(server)
              const favorite = isFavorite(server)

              return (
                <Card
                  key={index}
                  className={`hover:shadow-lg transition-shadow relative ${favorite ? "ring-2 ring-red-200" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <span className="text-2xl">{getCountryFlag(server.countryShort)}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{server.countryLong}</div>
                        <div className="text-sm text-muted-foreground font-normal">{server.hostname}</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleFavorite(server)} className="p-1 h-8 w-8">
                        <Heart className={`w-4 h-4 ${favorite ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
                      </Button>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Quality Badge */}
                    <div className="flex items-center justify-between">
                      <Badge variant={quality.variant} className="text-xs">
                        {quality.label}
                      </Badge>
                      <div className="text-xs text-muted-foreground">Score: {(server.score / 1000000).toFixed(1)}M</div>
                    </div>

                    {/* Server Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3 text-green-500" />
                        <span className="text-muted-foreground">Speed:</span>
                      </div>
                      <span className="font-medium">{formatSpeed(server.speed)}</span>

                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span className="text-muted-foreground">Ping:</span>
                      </div>
                      <span className="font-medium">{server.ping}ms</span>

                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-purple-500" />
                        <span className="text-muted-foreground">Sessions:</span>
                      </div>
                      <span className="font-medium">{server.numVpnSessions}</span>

                      <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-orange-500" />
                        <span className="text-muted-foreground">Uptime:</span>
                      </div>
                      <span className="font-medium">{formatUptime(server.uptime)}</span>

                      <div className="flex items-center gap-1">
                        <Server className="w-3 h-3 text-gray-500" />
                        <span className="text-muted-foreground">IP:</span>
                      </div>
                      <span className="font-medium font-mono text-xs">{server.ip}</span>

                      <div className="flex items-center gap-1">
                        <Wifi className="w-3 h-3 text-cyan-500" />
                        <span className="text-muted-foreground">Traffic:</span>
                      </div>
                      <span className="font-medium">{formatTraffic(server.totalTraffic)}</span>
                    </div>

                    {/* Operator Info */}
                    {server.operator && (
                      <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                        <strong>Operator:</strong> {server.operator}
                      </div>
                    )}

                    {/* Log Policy Badge */}
                    <div className="flex items-center justify-between pt-2">
                      <Badge variant={server.logType.includes("No") ? "default" : "secondary"} className="text-xs">
                        {server.logType}
                      </Badge>
                      <div className="text-xs text-muted-foreground">Total Users: {server.totalUsers}</div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3">
                      <Button
                        onClick={() => openInOpenVPN(server)}
                        variant="default"
                        size="sm"
                        disabled={!server.openVPNConfigDataBase64}
                        className="w-full"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Import to OpenVPN Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {hasMore && !showFilters && !filters.showFavoritesOnly && (
        <div className="text-center mt-8">
          <Button onClick={loadMoreServers} disabled={loadingMore} variant="outline" size="lg">
            {loadingMore ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading More...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Load More Servers ({totalServers - servers.length} remaining)
              </>
            )}
          </Button>
        </div>
      )}

      {/* Direct Connection Modal */}
      {selectedServer && (
        <Dialog open={!!selectedServer} onOpenChange={() => setSelectedServer(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-2xl">{getCountryFlag(selectedServer.countryShort)}</span>
                Connect to {selectedServer.countryLong} VPN
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Server Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Server</div>
                  <div className="font-medium">{selectedServer.hostname}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">IP Address</div>
                  <div className="font-medium">{selectedServer.ip}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Speed</div>
                  <div className="font-medium">{formatSpeed(selectedServer.speed)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Ping</div>
                  <div className="font-medium">{selectedServer.ping}ms</div>
                </div>
              </div>

              {/* Quick Connect Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Quick Connect Information</h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Server Address</Label>
                    <div className="flex gap-2">
                      <Input value={selectedServer.ip} readOnly />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(selectedServer.ip, "Server IP")}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Port</Label>
                    <div className="flex gap-2">
                      <Input value="1194" readOnly />
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard("1194", "Port")}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Protocol</Label>
                  <Input value="UDP" readOnly />
                </div>
              </div>

              {/* Manual Setup Instructions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Manual Setup Instructions</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>For Android OpenVPN Connect:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Download and install OpenVPN Connect from Google Play Store</li>
                    <li>Copy the configuration below or download the .ovpn file</li>
                    <li>Open OpenVPN Connect and tap "Import Profile"</li>
                    <li>Paste the configuration or select the downloaded file</li>
                    <li>Tap "Connect" to establish VPN connection</li>
                  </ol>
                </div>
              </div>

              {/* OpenVPN Configuration */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>OpenVPN Configuration</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(atob(selectedServer.openVPNConfigDataBase64), "OpenVPN config")}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Config
                  </Button>
                </div>
                <Textarea
                  value={atob(selectedServer.openVPNConfigDataBase64)}
                  readOnly
                  className="font-mono text-xs h-40"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSelectedServer(null)}>
                  Close
                </Button>
                <Button onClick={() => openInOpenVPN(selectedServer)}>
                  <Shield className="w-4 h-4 mr-2" />
                  Import to OpenVPN Connect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Usage Policy Dialog */}
      <Dialog open={showUsagePolicy} onOpenChange={setShowUsagePolicy}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Usage Policy & Disclaimers
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimers</h3>
              <ul className="space-y-1 text-yellow-700">
                <li>• This application is provided "as is" without any warranties</li>
                <li>• No guarantee of service availability, speed, or reliability</li>
                <li>• Use at your own risk and responsibility</li>
                <li>• Creator is not liable for any damages or issues</li>
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">🔒 Privacy & Security</h3>
              <ul className="space-y-1 text-blue-700">
                <li>• VPN servers are provided by VPN Gate volunteers</li>
                <li>• Check each server's logging policy before connecting</li>
                <li>• Your traffic may be logged by server operators</li>
                <li>• Use HTTPS websites for additional security</li>
                <li>• This app does not collect or store your personal data</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">⚖️ Legal Compliance</h3>
              <ul className="space-y-1 text-red-700">
                <li>• Ensure VPN usage is legal in your country</li>
                <li>• Respect local laws and regulations</li>
                <li>• Do not use for illegal activities</li>
                <li>• Some countries restrict or ban VPN usage</li>
                <li>• You are responsible for compliance with applicable laws</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">📋 VPN Gate Terms</h3>
              <ul className="space-y-1 text-green-700">
                <li>• Servers are provided by VPN Gate Academic Experiment Project</li>
                <li>• Operated by University of Tsukuba, Japan</li>
                <li>• Free service for academic research purposes</li>
                <li>• Server availability and performance may vary</li>
                <li>• Respect the VPN Gate terms of service</li>
              </ul>
            </div>

            {/* Updated Technical Notes */}
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-800 mb-2">🛠️ Technical Notes</h3>
              <ul className="space-y-1 text-gray-700">
                <li>• Data is cached on server for 1 hour to reduce API load</li>
                <li>• Favorites are stored locally in your browser</li>
                <li>• Requires OpenVPN Connect app for best experience</li>
                <li>• Internet connection required to fetch server list</li>
                <li>• Some servers may be offline or slow</li>
                <li>• Performance depends on your location and server load</li>
                <li>• Server-side API ensures reliable data fetching</li>
              </ul>
            </div>

            {/* Updated About the Creator Section */}
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">👨‍💻 About the Developer</h3>
              <div className="text-purple-700 space-y-2">
                <p>
                  This application was created by <strong>Suhail Akhtar</strong>, a software developer passionate about
                  creating useful tools and applications. This VPN Gate client provides a modern interface to access
                  free VPN servers from the VPN Gate Academic Experiment Project.
                </p>
                <div className="flex items-center gap-4 text-sm pt-2">
                  <a
                    href="https://www.linkedin.com/in/im-suhail-akhtar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-3 h-3" />
                    LinkedIn Profile
                  </a>
                  <a
                    href="https://github.com/gitsambhal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                  >
                    <ExternalLink className="w-3 h-3" />
                    GitHub Profile
                  </a>
                </div>
                <p className="text-xs">
                  This is an independent project and not officially affiliated with VPN Gate or University of Tsukuba.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={() => setShowUsagePolicy(false)} className="w-full">
                I Understand and Agree
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* OpenVPN Help Dialog */}
      <Dialog open={showOpenVPNHelp} onOpenChange={setShowOpenVPNHelp}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Import VPN Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
            {/* Quick Check Section */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-800 mb-2">✅ VPN Profile Downloaded Successfully!</p>
              <p className="text-xs text-green-600">
                Check your notification bar - you might be able to tap the download notification and select "Open with
                OpenVPN Connect"
              </p>
            </div>

            {/* Step by Step Guide */}
            <div className="space-y-3">
              <h3 className="font-medium text-center">📱 Step-by-Step Import Guide</h3>

              <div className="space-y-2">
                <div className="flex gap-3 p-2 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-sm">Open OpenVPN Connect</p>
                    <p className="text-xs text-muted-foreground">Look for the red OpenVPN icon on your phone</p>
                  </div>
                </div>

                <div className="flex gap-3 p-2 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-sm">Tap the "+" (Plus) Button</p>
                    <p className="text-xs text-muted-foreground">Usually located at the bottom right of the screen</p>
                  </div>
                </div>

                <div className="flex gap-3 p-2 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-sm">Select "File"</p>
                    <p className="text-xs text-muted-foreground">Choose "Import from file" or "File" option</p>
                  </div>
                </div>

                <div className="flex gap-3 p-2 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium text-sm">Find Your Downloads</p>
                    <p className="text-xs text-muted-foreground">
                      Navigate to Downloads folder and look for the .ovpn file
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 p-2 bg-muted rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    5
                  </div>
                  <div>
                    <p className="font-medium text-sm">Select & Import</p>
                    <p className="text-xs text-muted-foreground">Tap the .ovpn file, then tap "Import" and "Add"</p>
                  </div>
                </div>

                <div className="flex gap-3 p-2 bg-green-100 rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    6
                  </div>
                  <div>
                    <p className="font-medium text-sm">Connect!</p>
                    <p className="text-xs text-muted-foreground">Tap "Connect" to start using the VPN</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Methods */}
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">💡 Alternative Methods:</p>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Check your notification bar for the download notification</li>
                <li>• Open your file manager and navigate to Downloads folder</li>
                <li>• Long-press the .ovpn file and select "Open with OpenVPN Connect"</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <a
                href="https://play.google.com/store/apps/details?id=net.openvpn.openvpn"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-green-600 text-white hover:bg-green-700 h-10 px-4 py-2"
              >
                <ExternalLink className="w-4 h-4" />
                Download OpenVPN Connect App
              </a>
              <Button variant="outline" onClick={() => setShowOpenVPNHelp(false)} className="w-full">
                Got it! Close this guide
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Updated Footer Section */}
      <div className="mt-12 text-center text-sm text-muted-foreground space-y-4">
        <div className="flex justify-center">
          <Button onClick={() => setShowUsagePolicy(true)} variant="outline" size="sm">
            <Info className="w-4 h-4 mr-2" />
            Usage Policy & Disclaimers
          </Button>
        </div>

        <p>
          <strong>How to use:</strong>
        </p>
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">🚀 Import to OpenVPN Connect</p>
            <p className="text-sm">
              Downloads the VPN profile and provides step-by-step instructions to import it into the OpenVPN Connect app
              for the best VPN experience. Use the heart icon to save your favorite servers!
            </p>
          </div>
        </div>
        <div className="pt-4 space-y-2">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg max-w-2xl mx-auto">
            <p className="text-sm font-medium text-blue-800 mb-2">🎯 Features:</p>
            <p className="text-xs text-blue-700">
              • <strong>Favorites:</strong> Save your best servers for quick access
              <br />• <strong>Quality Ratings:</strong> Excellent, Good, Fair, Poor based on performance
              <br />• <strong>Detailed Info:</strong> Speed, ping, uptime, traffic, operator details
              <br />• <strong>Smart Sorting:</strong> Favorites appear first, then by your chosen criteria
              <br />• <strong>Server-side Caching:</strong> Data cached for 1 hour to reduce API calls
              <br />• <strong>Reliable Fetching:</strong> Server-side API bypasses CORS restrictions
            </p>
          </div>
          <a
            href="https://play.google.com/store/apps/details?id=net.openvpn.openvpn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary"
          >
            <ExternalLink className="w-4 h-4" />
            Download OpenVPN Connect from Google Play Store
          </a>
        </div>

        {/* Author Information */}
        <div className="pt-6 border-t border-muted">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 p-4 rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-800 mb-2">👨‍💻 About the Developer</h3>
            <p className="text-blue-700 mb-3">
              This VPN Gate client was developed by <strong>Suhail Akhtar</strong>, a passionate software developer
              focused on creating useful tools and applications. This project provides a modern, user-friendly interface
              to access VPN Gate's free VPN servers.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a
                href="https://www.linkedin.com/in/im-suhail-akhtar"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Connect on LinkedIn
              </a>
              <a
                href="https://github.com/gitsambhal"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View GitHub Profile
              </a>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              ⭐ If you find this tool helpful, consider connecting or following for more projects!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
