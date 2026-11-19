import { ImageResponse } from "next/og";
import { GiftIcon } from "@/lib/giftIcon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<GiftIcon size={512} />, size);
}
