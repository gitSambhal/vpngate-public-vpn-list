import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { serverId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const config = searchParams.get("config")
    const filename = searchParams.get("filename") || "vpn-profile.ovpn"

    if (!config) {
      return NextResponse.json({ error: "No config provided" }, { status: 400 })
    }

    // Decode the base64 config
    const ovpnContent = atob(config)

    // Return the .ovpn file with proper headers for Android
    return new NextResponse(ovpnContent, {
      headers: {
        "Content-Type": "application/x-openvpn-profile",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        // Android-specific headers
        "X-Android-Intent":
          "intent://view#Intent;scheme=content;type=application/x-openvpn-profile;package=net.openvpn.openvpn;end",
        "X-Suggested-Filename": filename,
      },
    })
  } catch (error) {
    console.error("Error serving VPN config:", error)
    return NextResponse.json({ error: "Failed to serve VPN config" }, { status: 500 })
  }
}
