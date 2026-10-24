import { useState } from 'react'
import classNames from 'classnames'
import { useTranslation } from 'react-i18next'
import { AboutCard } from '../AboutCard'
import { EducationCard } from '../EducationCard'
import { SpecializationsCard } from '../SpecializationsCard'
import { ReviewsCard } from '../../../pages/PsychologistProfile/components/ReviewsCard'
import { Tab } from '../../UI/Tab'
import type { SpecialistProfile } from '../../../types/specialist'

import './ProfileTabs.scss'

type ProfileSection = 'basicInf' | 'reviews'

type Props = {
    specialist: Pick<SpecialistProfile, 'bio' | 'certificates' | 'tags_symptoms'> &
        Partial<Pick<SpecialistProfile, 'reviews'>>
    showReviews?: boolean
    className?: string
}

export const ProfileTabs = ({ specialist, showReviews = false, className }: Props) => {
    const { t } = useTranslation('specialistProfile')
    const [activeSection, setActiveSection] = useState<ProfileSection>('basicInf')

    const hasReviewsTab = showReviews && specialist.reviews !== undefined
    const currentSection = hasReviewsTab ? activeSection : 'basicInf'

    const content =
        currentSection === 'reviews' && specialist.reviews ? (
            <ReviewsCard className="profile-tabs__reviews" reviews={specialist.reviews} />
        ) : (
            <div className="profile-tabs__basic-information">
                <AboutCard className="profile-tabs__about-card" about={specialist.bio.about} />
                <EducationCard
                    className="profile-tabs__education-card"
                    certificates={specialist.certificates}
                />
                <SpecializationsCard
                    className="profile-tabs__specializations"
                    tags_symptoms={specialist.tags_symptoms}
                />
            </div>
        )

    return (
        <div className={classNames('profile-tabs', className)}>
            <div className="profile-tabs__switch" role="tablist">
                <Tab
                    isActive={currentSection === 'basicInf'}
                    className="profile-tabs__item"
                    onClick={() => setActiveSection('basicInf')}
                >
                    {t('tabs.basicInfo')}
                </Tab>
                {hasReviewsTab && (
                    <Tab
                        isActive={currentSection === 'reviews'}
                        className="profile-tabs__item"
                        onClick={() => setActiveSection('reviews')}
                    >
                        {t('tabs.reviews')}
                    </Tab>
                )}
            </div>

            <div
                className="profile-tabs__panel"
                role={hasReviewsTab ? 'tabpanel' : undefined}
                id="profile-panel"
            >
                {content}
            </div>
        </div>
    )
}
