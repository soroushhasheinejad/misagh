import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { togglePost } from "@/app/admin/actions";

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({
    orderBy: [{ isPublished: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    include: { category: true },
  });

  return (
    <div>
      <div className="rule pb-6">
        <h1 className="font-display text-xl font-black">بلاگ</h1>
        <span className="rule-label">journal</span>
      </div>

      <div className="flex items-center justify-between pb-5">
        <p className="text-sm text-muted">
          {posts.length.toLocaleString("fa-IR")} مقاله —{" "}
          {posts.filter((p) => p.isPublished).length.toLocaleString("fa-IR")} منتشرشده
        </p>
        <Link href="/admin/posts/new" className="btn btn-brass px-4 py-2 text-xs">
          مقاله جدید
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border border-line bg-surface">
        <table className="spec min-w-[720px]">
          <thead>
            <tr>
              <th>عنوان</th>
              <th>موضوع</th>
              <th>دسته مرتبط</th>
              <th>وضعیت</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>
                  <Link
                    href={`/admin/posts/${post.id}`}
                    className="font-display font-bold hover:text-brass-dark"
                  >
                    {post.title}
                  </Link>
                  <div className="mono pt-1 text-[0.68rem] text-faint">{post.slug}</div>
                </td>
                <td className="text-muted">{post.tag}</td>
                <td className="text-muted">{post.category?.nameFa ?? "—"}</td>
                <td>
                  {post.isPublished ? (
                    <span className="tier tier-genuine">منتشر شده</span>
                  ) : (
                    <span className="tier tier-copy">پیش‌نویس</span>
                  )}
                  {post.isFeatured ? <span className="tier tier-oem mr-1">شاخص</span> : null}
                </td>
                <td className="text-left">
                  <div className="flex justify-end gap-2">
                    {post.isPublished ? (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="btn btn-ghost px-3 py-1.5 text-[0.7rem]"
                      >
                        دیدن
                      </Link>
                    ) : null}
                    <form action={togglePost}>
                      <input type="hidden" name="id" value={post.id} />
                      <button type="submit" className="btn btn-ghost px-3 py-1.5 text-[0.7rem]">
                        {post.isPublished ? "پیش‌نویس کن" : "منتشر کن"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
