import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
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
            width: 420,
            height: 420,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "12px solid #0F172A",
            borderRadius: 92,
            background: "#FFFDF7",
            boxShadow: "18px 18px 0 #0F172A",
            position: "relative"
          }}
        >
          <div
            style={{
              width: 132,
              height: 272,
              border: "10px solid #0F172A",
              borderRadius: 36,
              background: "#3B82F6",
              position: "absolute",
              left: 84,
              top: 74
            }}
          />
          <div
            style={{
              width: 132,
              height: 272,
              border: "10px solid #0F172A",
              borderRadius: 36,
              background: "#F59E0B",
              position: "absolute",
              left: 204,
              top: 74
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 142,
              top: 122,
              width: 28,
              height: 164,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 118,
              top: 274,
              width: 56,
              height: 28,
              borderBottomLeftRadius: 24,
              borderBottomRightRadius: 24,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 238,
              top: 124,
              width: 84,
              height: 24,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 268,
              top: 124,
              width: 24,
              height: 170,
              borderRadius: 999,
              background: "#FFFFFF"
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 54,
              bottom: 54,
              width: 44,
              height: 44,
              border: "8px solid #0F172A",
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
