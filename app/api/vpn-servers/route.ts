import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const sortBy = searchParams.get("sortBy") || "score" // score, speed, ping, uptime
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // Fetch VPN Gate API data
    const response = await fetch("https://www.vpngate.net/api/iphone/", {
      headers: {
        "User-Agent": "VPNGateClient/1.0",
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch VPN data")
    }

    const csvData = await response.text()

    // Parse CSV data
    const lines = csvData.split("\n")
    const servers = []

    // Skip header lines and process data
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.startsWith("*") || line.startsWith("#")) continue

      const columns = line.split(",")
      if (columns.length < 15) continue

      const server = {
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

    return NextResponse.json({
      servers: paginatedServers,
      count: paginatedServers.length,
      total: sortedServers.length,
      hasMore,
      offset,
      limit,
    })
  } catch (error) {
    console.error("Error fetching VPN servers:", error)
    return NextResponse.json({ error: "Failed to fetch VPN servers" }, { status: 500 })
  }
}
