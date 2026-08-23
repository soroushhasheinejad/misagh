import { prisma } from "@/lib/prisma";
import { PostForm } from "@/components/PostForm";

export default async function NewPostPage() {
  const categories = await prisma.partCategory.findMany({
    where: { isActive: true },
    orderBy: { nameFa: "asc" },
    select: { id: true, nameFa: true },
  });

  return (
    <div>
      <div className="rule pb-6">
        <h1 className="font-display text-xl font-black">مقاله جدید</h1>
        <span className="rule-label">new</span>
      </div>
      <PostForm post={null} categories={categories} />
    </div>
  );
}
