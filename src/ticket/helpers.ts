export async function wait(milliseconds: number): Promise<boolean> {
  return new Promise((res) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      res(true);
    }, milliseconds);
  });
}