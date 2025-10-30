import { createFileRoute } from "@tanstack/react-router";
import Header from "@/components/header";
import HeroSection from "@/components/landing/hero-section";
import FeaturesSection from "@/components/landing/features-section";
import CompetitiveSection from "@/components/landing/competitive-section";
import FAQSection from "@/components/landing/faq-section";
import Footer from "@/components/landing/footer";

export const Route = createFileRoute("/")({
	component: LandingPage,
});

function LandingPage() {
	return (
		<div className="bg-background">
			<Header />
			<HeroSection />
			<CompetitiveSection />
			<FeaturesSection />
			<FAQSection />
			<Footer />
		</div>
	);
}
