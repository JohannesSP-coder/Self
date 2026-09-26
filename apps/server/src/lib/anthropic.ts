import Anthropic from "@anthropic-ai/sdk";
import { env } from "../env.js";

export const anthropic = new Anthropic({ apiKey: env.anthropicApiKey || undefined });

export const COACH_MODEL = "claude-sonnet-5";
