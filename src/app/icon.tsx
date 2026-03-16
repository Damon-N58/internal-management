import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default async function Icon() {
  // The .ico file wraps a single PNG — raw PNG data begins at byte 22 (after the 6-byte
  // ICONDIR header + 16-byte directory entry).  Extracting it gives Satori a valid PNG
  // data URL it can actually render.
  const res = await fetch("https://app.nineteen58.dev/favicons/Nineteen58.ico")
  const buf = Buffer.from(await res.arrayBuffer())
  const pngBase64 = buf.slice(22).toString("base64")
  const src = `data:image/png;base64,${pngBase64}`

  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Apply the orange filter to the wrapping div so Satori composites it correctly */}
      <div
        style={{
          width: 22,
          height: 22,
          display: "flex",
          filter:
            "brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1200%) hue-rotate(345deg) brightness(105%)",
        }}
      >
        <img src={src} width={22} height={22} />
      </div>
    </div>,
    { width: 32, height: 32 }
  )
}
