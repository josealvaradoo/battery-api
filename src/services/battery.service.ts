import { webkit, type Page } from "playwright";
import { delay } from "../helpers";
import type { Battery } from "../lib/battery/type";
import { type User } from "../lib/user/type";

const LOGIN_URL = `${process.env.PROVIDER_URL}/login`;
const DASHBOARD_URL = `${process.env.PROVIDER_URL}/index`;

class BatteryService {
  private page: Page | undefined = undefined;
  private cookies: string = "";
  private static instance: BatteryService;

  private constructor() { }

  public static getInstance() {
    if (!BatteryService.instance) {
      BatteryService.instance = new BatteryService();
    }
    return BatteryService.instance;
  }

  private async auth(page: Page, user: User) {
    await page.fill("#val_loginAccount", user.username);
    await page.fill("#val_loginPwd", user.password);
    await page.click("button[class$=loginB]");
    return page;
  }

  private async getBatteryCapacity(page: Page): Promise<number> {
    const selector = ".animPan > .abs:nth-child(13) > .val";

    await delay(500);

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

  private dispose() {
    this.page = undefined;
  }

  public async run(): Promise<Battery> {
    const browser = await webkit.launch({ headless: true });
    console.log("[Running]: BatteryService");

    try {
      const context = await browser.newContext({
        ignoreHTTPSErrors: true,
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
      });

      this.page = await context.newPage();

      if (!this.cookies) {
        console.log("[Playwright]: No cookies found. Logging in...")

        await this.page.goto(LOGIN_URL);
        await this.page.waitForURL(LOGIN_URL);

        await this.auth(this.page, {
          username: process.env.AUTH_USER!,
          password: Buffer.from(process.env.AUTH_PASS!, "base64").toString(),
        });

        const cookies = await context.cookies();
        this.cookies = JSON.stringify(cookies)
      } else {
        console.log("[Playwright]: Using cookies from memory")

        await context.addCookies(JSON.parse(this.cookies));
        await this.page.goto(DASHBOARD_URL);
      }

      await this.page.waitForURL(DASHBOARD_URL);

      const level = await this.getBatteryCapacity(this.page);
      const status = await this.getChargingStatus(this.page);

      await browser.close();

      return {
        level,
        is_charging: status,
      };

    } catch (error: unknown) {
      this.dispose();
      await browser.close();
      console.error("[Error]:", (error as ErrnoException).message);
      return {
        level: 0,
        is_charging: true,
      }
    }
  }
}

export default BatteryService.getInstance();
