import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ next?: string; intent?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = new URLSearchParams();
  if (params.intent) query.set("intent", params.intent);
  if (params.next) query.set("next", params.next);
  const suffix = query.toString();
  redirect(suffix ? `/login?${suffix}` : "/login");
}
