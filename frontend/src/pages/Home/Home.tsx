import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import { WhyChooseUs } from '../../components/WhyChooseUs'
import './Home.scss'
import { SpecialistsSection } from '../../components/SpecialistsSection'
import { WhyUs } from '../../components/WhyUs/WhyUs.tsx'
import { AiChat } from '../../components/AiChat/AiChat.tsx'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <WhyChooseUs />
                <SpecialistsSection />
                <WhyUs />
            </main>

            <Footer />

            <AiChat />
        </div>
    )
}
