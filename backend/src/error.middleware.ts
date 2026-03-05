import type { NextFunction, Request, Response } from "express";
import { logError } from "./logger";

function toErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.stack ?? err.message;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logError("request.error", { path: req.path, error: toErrorMessage(err) });
  res.status(500).json({
    message: "Something went wrong while processing your request."
  });
}
