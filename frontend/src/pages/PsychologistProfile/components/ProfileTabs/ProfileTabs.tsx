import { useState } from 'react'

import './ProfileTabs.scss'
import { AboutCard } from '../AboutCard'
import { EducationCard } from '../EducationCard'
import { SpecializationsCard } from '../SpecializationsCard'
import { ReviewsCard } from '../ReviewsCard'
import { Tab } from '../../../../components/UI/Tab'

type ProfileSection = 'basicInf' | 'reviews'

type Props = {
    className?: string
}

export const ProfileTabs = ({ className }: Props) => {
    const [activeSection, setActiveSection] = useState<ProfileSection>('basicInf')

    return (
        <div className={`profile-tabs ${className ?? ''}`.trim()}>
            <div className="profile-tabs__switch" role="tablist">
                <Tab
                    isActive={activeSection === 'basicInf'}
                    className="profile-tabs__item"
                    onClick={() => setActiveSection('basicInf')}
                >
                    Основна інформація
                </Tab>
                <Tab
                    isActive={activeSection === 'reviews'}
                    className="profile-tabs__item"
                    onClick={() => setActiveSection('reviews')}
                >
                    Відгуки
                </Tab>
            </div>

            <div
                className="profile-tabs__panel"
                role="tabpanel"
                id="profile-panel"
                aria-labelledby={`tab-${activeSection}`}
            >
                {activeSection === 'basicInf' ? (
                    <div className="profile-tabs__basic-information">
                        <AboutCard className="profile-tabs__about-card" />
                        <EducationCard className="profile-tabs__education-card" />
                        <SpecializationsCard className="profile-tabs__specializations" />
                    </div>
                ) : (
                    <ReviewsCard className="profile-tabs__reviews" />
                )}
            </div>
        </div>
    )
}
