/**
 * Executes an asynchronous function with retries.
 * @param func - The asynchronous function to execute.
 * @param maxRetries - The maximum number of retry attempts.
 * @param delay - The delay between retry attempts in seconds.
 * @returns The result of the successful execution of the function.
 * @throws The error if all retries fail.
 */
export default async function retry<T>(
  func: () => Promise<T>,
  maxRetries: number = 3,
  delay = 1,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}`);
      return await func();
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${(error as Error).message}`);
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
    }
  }

  throw new Error(
    `All ${maxRetries} attempts failed. Last error: ${lastError?.message}`,
  );
}
