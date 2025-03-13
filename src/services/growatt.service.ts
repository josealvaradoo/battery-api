import { Battery } from "../lib/battery/type";

const DISCHARGING_STATUS = [2, 3];

class GrowattService {
  public async get(): Promise<Battery> {
    try {
      const url = process.env.GROWATT_URL! + "/queryLastData";
      const response = await fetch(url, {
        method: "POST",
        headers: {
          token: process.env.GROWATT_TOKEN!,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          deviceSn: process.env.DEVICE_SN!,
          deviceType: process.env.DEVICE_TYPE!,
        }).toString(),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const { data } = await response.json();
      const storage = data.storage[0];

      return {
        level: storage.capacity,
        is_charging: !DISCHARGING_STATUS.includes(storage.status),
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new GrowattService();
