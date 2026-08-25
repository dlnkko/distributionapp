import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default function Icon() {
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
            gap: 1,
          }}
        >
          <span
            style={{
              color: "#f4ead7",
              fontSize: 22,
              fontFamily: "Georgia, Times New Roman, serif",
              fontWeight: 500,
              lineHeight: 1,
              paddingBottom: 1,
            }}
          >
            d
          </span>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: 99,
              background: "#ff4d1c",
              marginBottom: 2,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
