// Only the backend's sanitized public HTML belongs here; never render bodyMarkdown or arbitrary strings.
export default function ArticleBody({ html, finder = false }: { html: string; finder?: boolean }) {
  return <div
    className={`article-content ${finder ? 'text-[#1D1D1F] leading-relaxed text-[15px]' : 'text-base leading-8 text-foreground/85'} [&_p]:mt-4 [&_h1]:mt-10 [&_h1]:text-3xl [&_h2]:mt-10 [&_h2]:text-2xl [&_h3]:mt-8 [&_h3]:text-xl [&_h4]:mt-6 [&_h5]:mt-6 [&_h6]:mt-6 [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h4]:font-semibold [&_h5]:font-semibold [&_h6]:font-semibold [&_h1]:scroll-mt-24 [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24 [&_h4]:scroll-mt-24 [&_h5]:scroll-mt-24 [&_h6]:scroll-mt-24 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted/40 [&_pre]:p-5 [&_img]:max-w-full [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:pl-4 [overflow-wrap:anywhere]`}
    dangerouslySetInnerHTML={{ __html: html }}
  />
}
