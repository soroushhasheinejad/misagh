import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/PostForm";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [post, categories] = await Promise.all([
    prisma.post.findUnique({ where: { id } }),
    prisma.partCategory.findMany({
      where: { isActive: true },
      orderBy: { nameFa: "asc" },
      select: { id: true, nameFa: true },
    }),
  ]);
  if (!post) notFound();

  return (
    <div>
      <Link href="/admin/posts" className="text-xs text-muted hover:text-brass-dark">
        ← بازگشت به فهرست مقاله‌ها
      </Link>
      <div className="rule pb-6 pt-2">
        <h1 className="font-display text-xl font-black">{post.title}</h1>
        <span className="rule-label">{post.isPublished ? "published" : "draft"}</span>
      </div>
      <PostForm post={post} categories={categories} />
    </div>
  );
}
