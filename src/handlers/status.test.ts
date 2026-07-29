import { describe, test, expect, mock, beforeEach } from "bun:test";
import type { Battery } from "../lib/battery/type";

/* ---------- Mocks ---------- */

const mockBattery: Battery = { level: 85, is_charging: true };

const mockGet = mock((): Promise<Battery> => Promise.resolve(mockBattery));

mock.module("../services/growatt.service", () => ({
  default: { get: mockGet },
}));

const mockMemoryGet = mock((): Battery | null => null);
const mockMemorySet = mock((): void => {});
const mockMemoryInstance = {
  get: mockMemoryGet,
  set: mockMemorySet,
};

mock.module("../helpers/memory", () => ({
  default: {
    getInstance: mock(() => mockMemoryInstance),
  },
}));

const retryMock = mock((fn: () => Promise<unknown>) => fn());

mock.module("../helpers/retry.helper", () => ({
  default: retryMock,
}));

/* ---------- Import handler after mocks ---------- */

import { status } from "./status";

/* ---------- Tests ---------- */

describe("GET /status", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockMemoryGet.mockClear();
    mockMemorySet.mockClear();
    retryMock.mockClear();
    mockGet.mockResolvedValue(mockBattery);
    mockMemoryGet.mockReturnValue(null);
  });

  test("returns fresh data with 200 when no cache exists", async () => {
    const res = await status.request("/");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockBattery);
    expect(body.is_cached).toBe(false);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockMemorySet).toHaveBeenCalledWith("battery", mockBattery);
  });

  test("returns cached data with 200 when cache exists", async () => {
    const cached: Battery = { level: 50, is_charging: false };
    mockMemoryGet.mockReturnValue(cached);

    const res = await status.request("/");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(cached);
    expect(body.is_cached).toBe(true);
    expect(mockGet).not.toHaveBeenCalled();
  });

  test("forces refresh and updates cache when cache=false", async () => {
    const cached: Battery = { level: 50, is_charging: false };
    mockMemoryGet.mockReturnValue(cached);

    const res = await status.request("/?cache=false");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockBattery);
    expect(body.is_cached).toBe(false);
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockMemorySet).toHaveBeenCalledWith("battery", mockBattery);
  });

  test("returns 500 when the service throws", async () => {
    mockGet.mockRejectedValueOnce(new Error("Growatt unavailable"));

    const res = await status.request("/");
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Growatt unavailable");
  });
});
