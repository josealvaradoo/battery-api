import { chromium, type Page } from "playwright";
import { type User } from "../lib/user/type";
import { delay } from "../helpers";
import type { Battery } from "../lib/battery/type";

const LOGIN_URL = `${process.env.PROVIDER_URL}/login`;
const DASHBOARD_URL = `${process.env.PROVIDER_URL}/index`;

export default class BatteryService {
  private async auth(page: Page, user: User) {
    await page.fill("#val_loginAccount", user.username);
    await page.fill("#val_loginPwd", user.password);
    await page.click("button[class$=loginB]");
    await page.waitForURL(DASHBOARD_URL);
    return page;
  }

  private async getBatteryCapacity(page: Page): Promise<number> {
    const selector = ".animPan > .abs:nth-child(13) > .val";

    await page.waitForSelector(selector);

    const element = page.locator(selector);
    await element.waitFor();

    const label = await element.textContent();
    const value = +label!.trim().replace("%", "");

    return value;
  }

  private async getChargingStatus(page: Page): Promise<boolean> {
    const selector = ".animPan > .abs:nth-child(9) > .val";

    await page.waitForSelector(selector);

    const element = page.locator(selector);
    await element.waitFor();

    const value = await element.textContent();

    if (value === "0W/0VA") {
      return true;
    }

    return false;
  }

  public async run(): Promise<Battery> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(LOGIN_URL);
    await page.waitForURL(LOGIN_URL);

    await this.auth(page, {
      username: process.env.AUTH_USER!,
      password: Buffer.from(process.env.AUTH_PASS!, "base64").toString(),
    });

    await delay(2000);

    const level = await this.getBatteryCapacity(page);
    const status = await this.getChargingStatus(page);

    await browser.close();

    console.log("[Running] BatteryService");

    return {
      level,
      is_charging: status,
    };
  }
}
