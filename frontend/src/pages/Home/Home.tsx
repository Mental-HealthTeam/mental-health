import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import { WhyChooseUs } from '../../components/WhyChooseUs'
import './Home.scss'
import { SpecialistsSection } from '../../components/SpecialistsSection'
import { AiChat } from '../../components/AiChat/AiChat.tsx'
import { WhyUs } from '../../components/WhyUs'
import { ContactSection } from '../../components/ContactSection'
import { FaqSection } from '../../components/FaqSection/FaqSection.tsx'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <WhyChooseUs />
                <SpecialistsSection />
                <WhyUs />
                <FaqSection />
                <ContactSection />
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
