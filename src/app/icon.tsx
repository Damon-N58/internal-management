import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
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
      <img
        src="https://app.nineteen58.dev/favicons/Nineteen58.ico"
        width={22}
        height={22}
        style={{
          filter:
            "brightness(0) saturate(100%) invert(58%) sepia(95%) saturate(1200%) hue-rotate(345deg) brightness(105%)",
        }}
      />
    </div>,
    { width: 32, height: 32 }
  )
}
