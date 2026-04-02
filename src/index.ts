// Copyright 2026 Shinsuke Mori
// SPDX-License-Identifier: Apache-2.0

import {
	convertToModelMessages,
	type LanguageModel,
	streamText,
	type UIMessage,
} from "ai";

type FetchFunction = typeof globalThis.fetch;

export type LocalFetchOptions = {
	model: LanguageModel;
} & Omit<Parameters<typeof streamText>[0], "model" | "messages" | "prompt">;

/**
 * Creates a fetch-compatible function that executes `streamText` locally
 * using the provided `LanguageModel`, instead of making an HTTP request
 * to a server endpoint.
 *
 * Useful when the user supplies their own API key and no backend is available.
 *
 * @example
 * ```ts
 * import { createLocalFetch } from "ai-sdk-local-fetch";
 * import { openai } from "@ai-sdk/openai";
 *
 * const fetch = createLocalFetch({
 *   model: openai("gpt-5.2-chat"),
 *   system: "You are a helpful assistant.",
 * });
 * ```
 */
export const createLocalFetch =
	({ model, ...options }: LocalFetchOptions): FetchFunction =>
	async (
		_input: string | URL | Request,
		init?: RequestInit,
	): Promise<Response> => {
		if (
			init?.body === undefined ||
			init.body === null ||
			typeof init.body !== "string"
		) {
			throw new Error(
				"[ai-sdk-local-fetch] init.body must be a non-empty string.",
			);
		}

		const { messages } = JSON.parse(init.body) as { messages: UIMessage[] };

		const result = streamText({
			...options,
			model,
			messages: await convertToModelMessages(messages),
		});

		return result.toUIMessageStreamResponse();
	};
