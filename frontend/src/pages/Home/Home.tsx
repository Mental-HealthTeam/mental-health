import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import './Home.scss'
import { WhyChooseUs } from '../../components/WhyChooseUs/WhyChooseUs.tsx'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <WhyChooseUs />
            </main>

            <Footer />
        </div>
    )
}
