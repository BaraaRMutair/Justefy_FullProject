import Hero from "./main/sections/Hero";
import Services from "./main/sections/Services";
import Portfolio from "./main/sections/Portfolio";
import Testimonials from "./main/sections/Testimonials";
import Contact from "./main/sections/Contact";

export default function Home() {
    return (
        <main className="relative">
            <Hero />
            <Services />
            <Portfolio />
            <Testimonials />
            <Contact />
        </main>
    );
}