import { z } from "zod";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(8).max(100),
});

export const commentSchema = z.object({
  nickname: z.string().min(1).max(50),
  email: z.string().email().max(200),
  content: z.string().min(1).max(2000),
});

export const postSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(slugRegex, "Slug must be lowercase alphanumeric with hyphens"),
  content: z.string().min(1).max(100000),
  excerpt: z.string().max(500).optional(),
  coverImage: z.string().url().max(500).optional().or(z.literal("")),
  published: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type PostInput = z.infer<typeof postSchema>;
