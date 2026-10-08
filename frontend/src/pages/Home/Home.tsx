import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import './Home.scss'
import { SpecialistsSection } from '../../components/SpecialistsSection'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <SpecialistsSection />
            </main>

            <Footer />
        </div>
    )
}
