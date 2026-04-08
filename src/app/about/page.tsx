import Image from "next/image";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-neutral-500">
          The Photographer
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide">
          About
        </h1>
      </div>

      <div className="grid gap-12 md:grid-cols-[300px_1fr] items-start">
        <div className="relative aspect-[3/4] overflow-hidden mx-auto md:mx-0 w-full max-w-[300px]">
          <Image
            src="https://picsum.photos/id/1005/600/800"
            alt="Photographer portrait"
            fill
            className="object-cover"
            sizes="300px"
          />
        </div>

        <div className="space-y-6 text-neutral-300 leading-relaxed">
          <p className="text-lg font-light">
            Hello, I&apos;m a photographer based in the heart of the city, drawn
            to the interplay of light, shadow, and fleeting moments that tell
            stories words cannot.
          </p>
          <p>
            With over a decade behind the lens, I specialize in landscape,
            street, and portrait photography. My work has been featured in
            various publications and exhibitions around the world.
          </p>
          <p>
            I believe every photograph is a conversation between the subject and
            the viewer. My goal is to create images that linger in your memory
            long after you&apos;ve looked away.
          </p>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-light tracking-wider text-white mb-4">
              Get in Touch
            </h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-neutral-500 mr-2">Email</span>
                <a
                  href="mailto:hello@example.com"
                  className="hover:text-white transition-colors"
                >
                  hello@example.com
                </a>
              </p>
              <p>
                <span className="text-neutral-500 mr-2">Instagram</span>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @photographer
                </a>
              </p>
              <p>
                <span className="text-neutral-500 mr-2">Twitter</span>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  @photographer
                </a>
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h2 className="text-lg font-light tracking-wider text-white mb-4">
              Available For
            </h2>
            <ul className="grid grid-cols-2 gap-2 text-sm text-neutral-400">
              <li>Commercial Projects</li>
              <li>Editorial Work</li>
              <li>Exhibitions</li>
              <li>Prints &amp; Licensing</li>
              <li>Workshops</li>
              <li>Collaborations</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
