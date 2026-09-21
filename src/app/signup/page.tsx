import { SignupClient } from "./signup-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sign Up • DEALNEST",
  description:
    "Interactive onboarding for Individual solo professionals and Organization multi-department teams.",
};

export default function SignupPage() {
  return <SignupClient />;
}

