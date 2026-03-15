import { cookies } from "next/headers";
import { LandingPage } from "./landing";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("leadflow_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
