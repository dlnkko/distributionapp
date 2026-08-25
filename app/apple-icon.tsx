import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};

export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#100e0c",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 4,
          }}
        >
          <span
            style={{
              color: "#f4ead7",
              fontSize: 118,
              fontFamily: "Georgia, Times New Roman, serif",
              fontWeight: 500,
              lineHeight: 1,
            }}
          >
            d
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 99,
              background: "#ff4d1c",
              marginBottom: 10,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
