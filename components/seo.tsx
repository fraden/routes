import { DefaultSeo } from 'next-seo'

const config = {
  title: 'eBike Routes: Curated running & hiking routes',
  description: 'Explore curated trails in Sweden for hiking & running.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://routes.samuelkraft.com',
    site_name: 'eBike Routes',
    images: [
      {
        url: 'https://routes.samuelkraft.com/og.png',
        alt: 'Trail Routes',
      },
    ],
  },
  twitter: {
    handle: '@samuelkraft',
    site: '@samuelkraft',
    cardType: 'summary_large_image',
  },
}

const SEO = (): JSX.Element => {
  return <DefaultSeo {...config} />
}

export default SEO
