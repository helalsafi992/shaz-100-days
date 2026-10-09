/**
 * Short bounded retries for idempotent onboarding draft writes and read-only GETs.
 * Never use for checkout, account deletion, plan activation or training confirmation.
 */
export class OnboardingRequestError extends Error {
  constructor(message: string, public readonly status?: number, public readonly temporary = false) {
    super(message);
    this.name = "OnboardingRequestError";
  }
}

type RequestOptions = {
  attempts?: number;
  fetcher?: typeof fetch;
  wait?: (ms: number) => Promise<void>;
};

function retryableNetworkError(error: unknown) {
  return error instanceof TypeError ||
    (error instanceof Error && /load failed|failed to fetch|network(error| request)?|connection (lost|failed)|internet connection/i.test(error.message));
}

function messageFromResponse(json: unknown) {
  if (!json || typeof json !== "object") return null;
  const obj = json as Record<string, unknown>;
  return typeof obj.error === "string" && obj.error.length < 350 ? obj.error :
    typeof obj.message === "string" && obj.message.length < 350 ? obj.message : null;
}

export async function onboardingRequest<T = Record<string, unknown>>(
  url: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const attempts = Math.max(1, Math.min(3, options.attempts ?? 3));
  const request = options.fetcher || fetch;
  const wait = options.wait || ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  let lastError: OnboardingRequestError | null = null;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await request(url, { ...init, cache: init.cache || "no-store" });
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        throw new OnboardingRequestError(
          "Serveren sendte et ufuldstændigt svar. Prøv igen.",
          response.status,
          true,
        );
      }

      if (!response.ok) {
        const temporary = response.status === 429 || response.status >= 500;
        const responseMessage = messageFromResponse(data);
        if (response.status === 401 || response.status === 403) {
          throw new OnboardingRequestError("Din session er udløbet. Log ind igen.", response.status);
        }
        throw new OnboardingRequestError(
          responseMessage || (temporary ?
            "SHAZ er midlertidigt utilgængelig. Prøv igen." :
            "Vi kunne ikke gemme dine oplysninger. Kontrollér svarene og prøv igen."),
          response.status,
          temporary,
        );
      }
      if (data === null || typeof data !== "object") {
        throw new OnboardingRequestError("Serveren sendte et ufuldstændigt svar. Prøv igen.", response.status, true);
      }
      return data as T;
    } catch (error) {
      const temporary = error instanceof OnboardingRequestError ? error.temporary : retryableNetworkError(error);
      lastError = error instanceof OnboardingRequestError ? error : new OnboardingRequestError(
        "Forbindelsen blev afbrudt. Kontrollér dit net og prøv igen. Dine svar er stadig på skærmen.",
        undefined,
        temporary,
      );
      if (!temporary || attempt === attempts) break;
      await wait(attempt * 350);
    }
  }
  throw lastError || new OnboardingRequestError("Kunne ikke oprette forbindelse. Prøv igen.", undefined, true);
}
