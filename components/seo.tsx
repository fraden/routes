import { DefaultSeo } from 'next-seo'

const config = {
  title: 'eBike Routes of Dennis Frankenbach',
  description: 'Explore my routes.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ebike.dennisfrankenbach.me/',
    site_name: 'eBike Routes',
    images: [
      {
        url: 'https://ebike.dennisfrankenbach.me/og.png',
        alt: 'eBike Routes',
      },
    ],
  },
}

const SEO = (): JSX.Element => {
  return <DefaultSeo {...config} />
}

export default SEO
