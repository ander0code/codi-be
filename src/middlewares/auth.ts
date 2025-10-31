import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@/lib/jwt.js";
import type { JwtPayload } from "@/lib/jwt.js";
import { AuthError } from '@/config/errors/errors.js';

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthError("No token provided");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken<JwtPayload>(token);
    req.user = decoded;
    next();
  } catch {
    throw new AuthError("Invalid or expired token");
  }
}