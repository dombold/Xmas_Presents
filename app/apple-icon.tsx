import { ImageResponse } from "next/og";
import { GiftIcon } from "@/lib/giftIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<GiftIcon size={180} />, size);
}
