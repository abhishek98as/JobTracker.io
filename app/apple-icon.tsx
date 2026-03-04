import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF9F6"
        }}
      >
        <div
          style={{
            width: 152,
            height: 152,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "5px solid #0F172A",
            borderRadius: 34,
            background: "#FFFDF7",
            position: "relative"
          }}
        >
          <div
            style={{
              width: 46,
              height: 96,
              border: "4px solid #0F172A",
              borderRadius: 12,
              background: "#3B82F6",
              position: "absolute",
              left: 26,
              top: 24
            }}
          />
          <div
            style={{
              width: 46,
              height: 96,
              border: "4px solid #0F172A",
              borderRadius: 12,
              background: "#F59E0B",
              position: "absolute",
              left: 78,
              top: 24
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 44,
              top: 42,
              width: 10,
              height: 56,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 36,
              top: 94,
              width: 18,
              height: 10,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 90,
              top: 42,
              width: 28,
              height: 9,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 99,
              top: 42,
              width: 9,
              height: 56,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 18,
              bottom: 18,
              width: 16,
              height: 16,
              border: "3px solid #0F172A",
              borderRadius: 999,
              background: "#F97316"
            }}
          />
        </div>
      </div>
    ),
    size
  );
}
