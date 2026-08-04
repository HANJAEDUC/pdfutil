import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.mypdf.co.kr';

  const routes = [
    '',
    '/pdf-to-jpg',
    '/pdf-to-word',
    '/pdf-merge',
    '/pdf-extract',
    '/pdf-passwd',
    '/pdf-rotate',
    '/pdf-watermark',
    '/pdf-unlock',
    '/pdfxxx',
    '/pdfxxxx',
    '/pdfxxxxx',
    '/pdfxxxxxx',
    '/pdfxxxxxxx',
    '/pdfxxxxxxxx',
    '/pdfxxxxxxxxx',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
