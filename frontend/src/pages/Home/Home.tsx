import { Footer } from '../../components/Footer'
import { Header } from '../../components/Header'
import { Hero } from '../../components/Hero'
import './Home.scss'
import { WhyUs } from '../../components/WhyUs/WhyUs.tsx'

export const Home = () => {
    return (
        <div className="home">
            <Header />

            <main className="home__content">
                <Hero />
                <WhyUs />
            </main>

            <Footer />
        </div>
    )
}
