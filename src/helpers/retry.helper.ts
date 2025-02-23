/**
 * Executes an asynchronous function with retries.
 * @param func - The asynchronous function to execute.
 * @param maxRetries - The maximum number of retry attempts.
 * @returns The result of the successful execution of the function.
 * @throws The error if all retries fail.
 */
export default async function retry<T>(
  func: () => Promise<T>,
  maxRetries: number,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}`);
      return await func();
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${(error as Error).message}`);
      lastError = error as Error;
    }
  }

  throw new Error(
    `All ${maxRetries} attempts failed. Last error: ${lastError?.message}`,
  );
}
