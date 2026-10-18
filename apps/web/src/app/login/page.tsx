import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { currentSession } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await currentSession().catch(() => null)) redirect("/dashboard");
  return (
    <main className="center">
      <section className="card">
        <h1>Dronex <span>Gmail</span></h1>
        <p className="muted">اكتب <code>/key</code> في ديسكورد للحصول على كود دخول مؤقت (صالح 5 دقائق ويُستخدم مرة واحدة).</p>
        <LoginForm />
      </section>
    </main>
  );
}
