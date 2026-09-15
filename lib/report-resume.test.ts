import { describe, expect, it, vi } from "vitest";
import { kickNextPart } from "./report-resume";

function streamOf(chunks: string[], onCancel?: () => void): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(enc.encode(ch));
    },
    cancel() {
      onCancel?.();
    },
  });
}

describe("kickNextPart", () => {
  it("다음 요청이 첫 응답을 보내면 true를 돌려주고 연결을 끊는다 (생성은 그쪽 함수가 완주)", async () => {
    const cancel = vi.fn();
    const fetchImpl = vi.fn(async () => new Response(streamOf(['data: {"t":"full"}\n\n'], cancel)));
    await expect(kickNextPart("https://x.test/api/reports/abc/stream", { fetchImpl })).resolves.toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith("https://x.test/api/reports/abc/stream", expect.anything());
    expect(cancel).toHaveBeenCalled();
  });

  it("응답이 실패(404 등)면 false", async () => {
    const fetchImpl = vi.fn(async () => new Response("not found", { status: 404 }));
    await expect(kickNextPart("https://x.test/s", { fetchImpl })).resolves.toBe(false);
  });

  it("네트워크 오류는 던지지 않고 false — 이어쓰기 실패가 이미 저장된 파트를 망치면 안 된다", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    await expect(kickNextPart("https://x.test/s", { fetchImpl })).resolves.toBe(false);
  });

  it("첫 응답이 제한 시간 안에 안 오면 false (함수 시간 제한을 넘기지 않게)", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );
    await expect(kickNextPart("https://x.test/s", { fetchImpl, timeoutMs: 20 })).resolves.toBe(false);
  });
});
