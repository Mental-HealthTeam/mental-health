import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import { WhyChooseUs } from '../../components/WhyChooseUs'
import './Home.scss'
import { SpecialistsSection } from '../../components/SpecialistsSection'
import { WhyUs } from '../../components/WhyUs'
import { ReviewsSection } from '../../components/ReviewsSection'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <WhyChooseUs />
                <SpecialistsSection />
                <WhyUs />
                <ReviewsSection />
            </main>

            <Footer />
        </div>
    )
}
