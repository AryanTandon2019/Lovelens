import { ImageResponse } from "next/og";

export const alt = "LoveLens — Who's really more into who?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF4E88 0%, #E8437E 45%, #8B5CF6 100%)",
          color: "white",
          fontFamily: "sans-serif",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: 46, fontWeight: 800 }}>
          <span style={{ fontSize: 70 }}>💘</span>
          <span>LoveLens</span>
        </div>

        <div style={{ display: "flex", fontSize: 88, fontWeight: 900, marginTop: 30, lineHeight: 1.05 }}>
          Who&apos;s more into who?
        </div>

        <div style={{ display: "flex", fontSize: 34, marginTop: 26, opacity: 0.92 }}>
          Private WhatsApp chat stats — in seconds.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 54,
            fontSize: 30,
            fontWeight: 700,
            background: "rgba(255,255,255,0.18)",
            padding: "16px 34px",
            borderRadius: "999px",
          }}
        >
          getlovelens.com
        </div>
      </div>
    ),
    { ...size }
  );
}
