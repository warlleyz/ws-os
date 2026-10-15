
import { translate as t, useLocale } from '../../shared/i18n/i18n';

const profile = {
    headline: 'Desenvolvedor de software',
    description:
        'Conheça minha trajetória, meus projetos e as tecnologias que utilizo no desenvolvimento de soluções digitais.',
    areas: [
        'Desenvolvimento web',
        'Interfaces interativas',
        'Arquitetura de aplicações',
    ],
};

export default function AboutMe() {
    useLocale();

    return (
        <article className="desktop-window__content">
            <header>
                <p>{t('Apresentação profissional')}</p>
                <h2>{t('Sobre Mim')}</h2>
                <h3>{t(profile.headline)}</h3>
                <p>{t(profile.description)}</p>
            </header>

            <section aria-labelledby="about-areas">
                <h3 id="about-areas">{t('Áreas de atuação')}</h3>

                <ul>
                    {profile.areas.map((area) => (
                        <li key={area}>{t(area)}</li>
                    ))}
                </ul>
            </section>

            <section aria-labelledby="about-project">
                <h3 id="about-project">{t('WS OS')}</h3>
                <p>
                    {t(
                        'Este portfólio apresenta projetos e experiências em uma interface inspirada em sistemas operacionais.',
                    )}
                </p>
            </section>

            <section aria-labelledby="about-links">
                <h3 id="about-links">{t('Links profissionais')}</h3>

                <a
                    href="https://github.com/warlleyz"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </a>
            </section>
        </article>
    );
}
