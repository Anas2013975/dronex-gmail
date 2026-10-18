import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { currentSession } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await currentSession();
  if (!session) redirect("/login");
  return (
    <main className="center">
      <section className="card">
        <h1>لوحة التحكم</h1>
        <p className="muted">تم تسجيل الدخول بنجاح. هذه نسخة المرحلة الأولى: الجلسة فقط، وبقية الأقسام ستُضاف لاحقاً.</p>
        <dl>
          <dt>معرّف المستخدم</dt><dd dir="ltr">{session.userId}</dd>
          <dt>معرّف السيرفر</dt><dd dir="ltr">{session.guildId}</dd>
          <dt>تنتهي الجلسة</dt><dd dir="ltr">{session.expiresAt.toISOString()}</dd>
        </dl>
        <LogoutButton />
      </section>
    </main>
  );
}
