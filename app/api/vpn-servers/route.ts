import { NextResponse } from "next/server"

// Cache configuration - 1 hour cache for VPN server data
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

// In-memory cache object
const cache: {
  data: any[] | null
  timestamp: number
  lastFetch: number
} = {
  data: null,
  timestamp: 0,
  lastFetch: 0,
}

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

async function fetchVPNData(): Promise<VPNServer[]> {
  console.log("Fetching fresh VPN data from VPN Gate API...")

  const response = await fetch("https://www.vpngate.net/api/iphone/", {
    headers: {
      "User-Agent": "VPNGateClient/1.0",
    },
    // Add cache control to ensure we get fresh data from the API
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`VPN Gate API responded with status: ${response.status}`)
  }

  const csvData = await response.text()
  const lines = csvData.split("\n")
  const servers: VPNServer[] = []

  // Skip header lines and process data
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("*") || line.startsWith("#")) continue

    const columns = line.split(",")
    if (columns.length < 15) continue

    const server: VPNServer = {
      hostname: columns[0],
      ip: columns[1],
      score: Number.parseInt(columns[2]) || 0,
      ping: columns[3],
      speed: Number.parseInt(columns[4]) || 0,
      countryLong: columns[5],
      countryShort: columns[6],
      numVpnSessions: Number.parseInt(columns[7]) || 0,
      uptime: Number.parseInt(columns[8]) || 0,
      totalUsers: Number.parseInt(columns[9]) || 0,
      totalTraffic: columns[10],
      logType: columns[11],
      operator: columns[12],
      message: columns[13],
      openVPNConfigDataBase64: columns[14],
    }

    // Filter out servers without OpenVPN config
    if (server.openVPNConfigDataBase64 && server.openVPNConfigDataBase64.length > 100) {
      servers.push(server)
    }
  }

  return servers
}

function isCacheValid(): boolean {
  const now = Date.now()
  return cache.data !== null && now - cache.timestamp < CACHE_TTL
}

function getCachedData(): VPNServer[] | null {
  if (isCacheValid()) {
    console.log("Returning cached VPN data")
    return cache.data
  }
  return null
}

function setCacheData(data: VPNServer[]): void {
  cache.data = data
  cache.timestamp = Date.now()
  cache.lastFetch = Date.now()
  console.log(`Cached ${data.length} VPN servers for 1 hour`)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const sortBy = searchParams.get("sortBy") || "score"
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const forceRefresh = searchParams.get("refresh") === "true"

    let servers: VPNServer[]

    // Check if we should use cached data
    if (!forceRefresh && isCacheValid()) {
      servers = getCachedData()!
      console.log(`Using cached data with ${servers.length} servers`)
    } else {
      // Fetch fresh data
      try {
        servers = await fetchVPNData()
        setCacheData(servers)
      } catch (fetchError) {
        console.error("Failed to fetch fresh data:", fetchError)

        // If we have cached data (even if expired), use it as fallback
        if (cache.data !== null) {
          console.log("Using expired cache as fallback")
          servers = cache.data
        } else {
          throw fetchError
        }
      }
    }

    // Sort servers based on sortBy parameter
    const sortedServers = [...servers]
    switch (sortBy) {
      case "speed":
        sortedServers.sort((a, b) => b.speed - a.speed)
        break
      case "ping":
        sortedServers.sort((a, b) => Number.parseInt(a.ping) - Number.parseInt(b.ping))
        break
      case "uptime":
        sortedServers.sort((a, b) => b.uptime - a.uptime)
        break
      case "users":
        sortedServers.sort((a, b) => a.numVpnSessions - b.numVpnSessions) // Fewer users = better
        break
      case "score":
      default:
        sortedServers.sort((a, b) => b.score - a.score)
        break
    }

    // Apply pagination
    const paginatedServers = sortedServers.slice(offset, offset + limit)
    const hasMore = offset + limit < sortedServers.length

    // Calculate cache info for response headers
    const cacheAge = Date.now() - cache.timestamp
    const timeUntilExpiry = Math.max(0, CACHE_TTL - cacheAge)

    const response = NextResponse.json({
      servers: paginatedServers,
      count: paginatedServers.length,
      total: sortedServers.length,
      hasMore,
      offset,
      limit,
      cache: {
        hit: !forceRefresh && isCacheValid(),
        age: Math.floor(cacheAge / 1000), // in seconds
        ttl: Math.floor(timeUntilExpiry / 1000), // in seconds
        lastFetch: cache.lastFetch,
        duration: "1 hour", // Human readable cache duration
      },
    })

    // Add cache headers
    response.headers.set("Cache-Control", `public, max-age=${Math.floor(timeUntilExpiry / 1000)}`)
    response.headers.set("X-Cache", isCacheValid() ? "HIT" : "MISS")
    response.headers.set("X-Cache-Age", Math.floor(cacheAge / 1000).toString())
    response.headers.set("X-Cache-Duration", "3600") // 1 hour in seconds

    return response
  } catch (error) {
    console.error("Error in VPN servers API:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch VPN servers",
        details: error instanceof Error ? error.message : "Unknown error",
        cache: {
          available: cache.data !== null,
          age: cache.data ? Math.floor((Date.now() - cache.timestamp) / 1000) : 0,
          duration: "1 hour",
        },
      },
      { status: 500 },
    )
  }
}
