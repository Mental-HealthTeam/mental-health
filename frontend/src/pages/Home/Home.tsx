import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import { WhyChooseUs } from '../../components/WhyChooseUs'
import './Home.scss'
import { SpecialistsSection } from '../../components/SpecialistsSection'
import { WhyUs } from '../../components/WhyUs/WhyUs.tsx'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <SpecialistsSection />
                <WhyUs />
                <WhyChooseUs />
            </main>

            <Footer />
        </div>
    )
}
