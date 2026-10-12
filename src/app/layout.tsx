import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "로그인 너머 | 웹서비스 방어전",
  description: "인증·인가 우회 경로와 다중 보안 통제를 체험하는 교육용 전략 게임"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
