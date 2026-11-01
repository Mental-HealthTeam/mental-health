import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import { WhyChooseUs } from '../../components/WhyChooseUs'
import './Home.scss'
import { SpecialistsSection } from '../../components/SpecialistsSection'
import { AiChat } from '../../components/AiChat'
import { WhyUs } from '../../components/WhyUs'
import { ReviewsSection } from '../../components/ReviewsSection'
import { ContactSection } from '../../components/ContactSection'
import { FaqSection } from '../../components/FaqSection'

export const Home = () => {
    return (
        <div className="home" id="home">
            <Header />

            <main className="home__content">
                <Hero />

                <section id="about">
                    <WhyChooseUs />
                </section>

                <section id="psychologists">
                    <SpecialistsSection />
                </section>

                <section id="how-it-works">
                    <WhyUs />
                </section>

                <FaqSection />

                <section id="reviews">
                    <ReviewsSection />
                </section>

                <section id="contact">
                    <ContactSection />
                </section>
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
