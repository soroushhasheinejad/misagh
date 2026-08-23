import Link from "next/link";
import { savePost } from "@/app/admin/actions";

type PostLike = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  tag: string;
  readMinutes: number;
  isPublished: boolean;
  isFeatured: boolean;
  categoryId: string | null;
} | null;

export function PostForm({
  post,
  categories,
}: {
  post: PostLike;
  categories: Array<{ id: string; nameFa: string }>;
}) {
  return (
    <form action={savePost} className="flex flex-col gap-6">
      {post ? <input type="hidden" name="id" value={post.id} /> : null}

      <section className="panel panel-brass p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="field-label">عنوان مقاله</span>
            <input name="title" required defaultValue={post?.title ?? ""} className="field" />
          </label>

          <label className="block">
            <span className="field-label">آدرس صفحه (انگلیسی، با خط تیره)</span>
            <input
              name="slug"
              required
              defaultValue={post?.slug ?? ""}
              placeholder="how-to-choose-brake-pads"
              className="field mono"
              dir="ltr"
            />
          </label>

          <label className="block">
            <span className="field-label">موضوع</span>
            <input
              name="tag"
              defaultValue={post?.tag ?? "راهنمای خرید"}
              className="field"
              list="post-tags"
            />
            <datalist id="post-tags">
              <option value="راهنمای خرید" />
              <option value="راهنمای فنی" />
              <option value="نگهداری" />
              <option value="اخبار" />
            </datalist>
          </label>

          <label className="block sm:col-span-2">
            <span className="field-label">خلاصه — در فهرست بلاگ و نتایج گوگل دیده می‌شود</span>
            <textarea
              name="excerpt"
              rows={2}
              defaultValue={post?.excerpt ?? ""}
              className="field resize-y"
            />
          </label>

          <label className="block">
            <span className="field-label">زمان مطالعه (دقیقه)</span>
            <input
              name="readMinutes"
              type="number"
              min={1}
              defaultValue={post?.readMinutes ?? 4}
              className="field tnum"
            />
          </label>

          <label className="block">
            <span className="field-label">دسته قطعه مرتبط — برای نمایش «قطعات مرتبط»</span>
            <select name="categoryId" defaultValue={post?.categoryId ?? ""} className="field">
              <option value="">بدون دسته</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameFa}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-6 pt-5">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isPublished"
              defaultChecked={post?.isPublished ?? false}
              className="size-4 accent-[var(--color-brass)]"
            />
            <span>منتشر شود</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isFeatured"
              defaultChecked={post?.isFeatured ?? false}
              className="size-4 accent-[var(--color-brass)]"
            />
            <span>مقاله شاخص بالای صفحه بلاگ</span>
          </label>
        </div>
      </section>

      <section className="panel p-6">
        <div className="rule pb-4">
          <h2 className="font-display text-sm font-bold">متن مقاله</h2>
          <span className="rule-label">markdown</span>
        </div>
        <p className="pb-3 text-xs leading-6 text-muted">
          <span className="mono">## تیتر</span> و <span className="mono">### زیرتیتر</span> ·{" "}
          <span className="mono">- فهرست</span> · <span className="mono">۱. فهرست شماره‌دار</span> ·{" "}
          <span className="mono">&gt; نقل‌قول</span> · <span className="mono">**پررنگ**</span> ·{" "}
          <span className="mono">`کد`</span> · <span className="mono">[متن](/آدرس)</span>
        </p>
        <textarea
          name="content"
          rows={22}
          defaultValue={post?.content ?? ""}
          className="field resize-y font-mono text-[0.82rem] leading-7"
        />
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-brass">
          ذخیره مقاله
        </button>
        <Link href="/admin/posts" className="btn btn-ghost">
          انصراف
        </Link>
      </div>
    </form>
  );
}
