import { CodeBlock } from "@/components/CodeBlock";
import { ColorQuantizeLab } from "@/components/labs/ColorQuantizeLab";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";

export const metadata = {
  title: "Case A: image colour quantization — Manifold",
  description:
    "A full worked case: reduce an image to k colours by clustering its pixels in RGB space. k-means as a vector quantizer, end to end — including why the centroids ARE the compressed palette.",
};

export default function CaseImagePage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Clustering", color: "var(--c-clustering)" }, { label: "In the wild · Case A", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Case A: image colour quantization</>}
        intro={<>
          Our first real case is the cleanest possible use of k-means — no labels, no choosing-k agony, just
        the algorithm doing exactly what its objective says. Reduce an image to <em>k</em> colours by
        clustering its pixels.
        </>}
      />

      <div className="lesson">
        <h2>The problem, framed as clustering</h2>
        <p>
          An image is a grid of pixels, and each pixel is a point in 3-D <strong>RGB space</strong> —
          coordinates (R, G, B), each 0–255. A photo can contain tens of thousands of distinct
          colours. <strong>Colour quantization</strong> asks: replace them with just <em>k</em> colours so
          the image still looks right. That is precisely k-means — find <em>k</em> centroids in colour
          space, assign each pixel to the nearest, and repaint it with that centroid&rsquo;s colour.
        </p>

        <h2>Why this case is special</h2>
        <ul style={ul}>
          <li>
            <strong>The assumptions hold.</strong> Colours in RGB form roughly blobby groups, and Euclidean
            distance is a reasonable (if imperfect) colour difference. k-means is genuinely well-suited.
          </li>
          <li>
            <strong>k is a design choice, not a discovery.</strong> You aren&rsquo;t hunting for &ldquo;the true
            number of colours&rdquo; — you pick <em>k</em> to hit a file-size or quality target (16, 32, 256).
            No elbow needed.
          </li>
          <li>
            <strong>The centroids are the product.</strong> The <em>k</em> centroids are a learned colour
            <strong> palette</strong>; storing palette + per-pixel index is far smaller than full RGB. This
            is <em>vector quantization</em>, and it underpins indexed-colour formats like GIF and PNG-8.
          </li>
        </ul>

        <h2>Do it live</h2>
        <p>
          Below, every pixel of a synthetic image is clustered in RGB space. Change <em>k</em> and watch
          the palette shrink and the banding appear — fewer centroids, fewer bits, lower fidelity.
        </p>
        <ColorQuantizeLab />

        <h2>The practical details that matter</h2>
        <ul style={ul}>
          <li>
            <strong>Subsample for speed.</strong> A megapixel image is a million points. Fit k-means on a
            random sample of pixels (or use <code>MiniBatchKMeans</code>), then <em>apply</em> the learned
            palette to all pixels. The assign step is a cheap nearest-centroid lookup.
          </li>
          <li>
            <strong>Colour space choice.</strong> RGB distance doesn&rsquo;t match human perception well;
            clustering in a perceptual space like <strong>Lab</strong> gives nicer palettes for the same
            <em> k</em>. (Same algorithm, better-suited geometry — a recurring theme.)
          </li>
          <li>
            <strong>k-means++ matters here too.</strong> Good seeding avoids wasting palette entries on
            near-duplicate colours.
          </li>
        </ul>

        <Callout color="var(--c-clustering)" title={<>The takeaway</>}>
          This is k-means with the training wheels on, and it&rsquo;s a perfect mental model: <em>centroids
            are representatives</em>. Compression, codebook learning, and quantizing neural-network weights
            all use exactly this &ldquo;cluster, then replace each point with its centroid&rdquo; move. When the
            geometry fits and you just need representative points, k-means is unbeatable for the effort.
        </Callout>

        <h2>The whole thing in scikit-learn</h2>
        <CodeBlock fromScratch={codeScratch} withLibrary={codeLib} />

        <PrevNext prev={{ href: "/learn/k-means/when-to-use-k-means", label: <>← When to use k-means</> }} next={{ href: "/learn/k-means/case-customer-segmentation", label: <>Next up · Case B: customer segmentation →</> }} />
      </div>
    </article>
  );
}

const codeScratch = `import numpy as np
from PIL import Image

img = np.asarray(Image.open("photo.jpg")) / 255.0     # H x W x 3
pixels = img.reshape(-1, 3)                            # each pixel -> a 3-D point

# fit k-means on a random sample of pixels for speed
rng = np.random.default_rng(0)
sample = pixels[rng.choice(len(pixels), 10_000, replace=False)]
palette, _ = fit_kmeans(sample, k=16)                 # your k-means -> 16 centroids

# apply the palette to every pixel (cheap nearest-centroid lookup)
labels = ((pixels[:, None] - palette[None])**2).sum(2).argmin(1)
quantized = palette[labels].reshape(img.shape)`;

const codeLib = `import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

img = np.asarray(Image.open("photo.jpg")) / 255.0
h, w, _ = img.shape
pixels = img.reshape(-1, 3)

km = KMeans(n_clusters=16, n_init=4, random_state=0).fit(pixels[::20])  # subsample
labels = km.predict(pixels)
quantized = km.cluster_centers_[labels].reshape(h, w, 3)
Image.fromarray((quantized * 255).astype("uint8")).save("photo_16.png")`;

const ul: React.CSSProperties = { margin: "0 0 10px", paddingLeft: "1.3em", fontSize: 15, color: "var(--muted)", lineHeight: 1.8 };
