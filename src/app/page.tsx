import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LandingPage } from "./landing";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("leadflow_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
