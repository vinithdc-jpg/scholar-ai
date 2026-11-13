import AuthenticatedHome from "@/components/authenticated-home";
import LandingPage from "@/components/landing-page";

export default function Home() {
  return (
    <AuthenticatedHome>
      <LandingPage />
    </AuthenticatedHome>
  );
}
