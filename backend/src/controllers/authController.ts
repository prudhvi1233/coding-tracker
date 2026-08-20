import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev-only';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, displayName } = req.body;
    
    if (!email || !password || !displayName) { res.status(400).json({ error: "Missing fields" }); return; }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) { res.status(400).json({ error: "Email already exists" }); return; }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      email: email.toLowerCase(),
      passwordHash,
      displayName
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, email: user.email, displayName: user.displayName, timezone: user.timezone } });
  } catch (error: any) { res.status(500).json({ error: "Internal Error" });
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) { res.status(400).json({ error: "Missing fields" }); return; }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) { res.status(401).json({ error: "Invalid credentials" }); return; }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        timezone: user.timezone
      }
    });
  } catch (error: any) { res.status(500).json({ error: "Internal Error" });
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: "Unauthorized" }); return; }

    const user = await User.findById(req.user.id);
    if (!user) {
      res.status(500).json({ error: "Internal Error" });
      return;
    }

    res.json({
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone
    });
  } catch (error: any) { res.status(500).json({ error: "Internal Error" });
  }
};
