# Message-routing capstone — plan

> Status: **COMPLETE 2026-10-10 (27/27 pages)**; built one page per "continue" from 2026-09-27.
> Dataset: 20 Newsgroups, `fetch_20newsgroups` (the "bydate" version: 18,846 Usenet posts from
> 1993, 20 forums, train = earlier posts, test = later posts). Text classification capstone, the
> fourth capstone after housing (regression), asteroid hazard (classification) and warehouse robot
> (RL). Route **`/learn/message-routing-capstone`**. Every number here was measured during planning
> by the scratch probes that became `scripts/routing_cases.py`; none is quoted from a paper.

---

## 1. Why this capstone exists, and what it adds

The SVM track ends on a checklist that names text as the classic linear-SVM win, but never
measures it. This capstone measures it, and uses the job to teach what the asteroid capstone
could not: what happens when the data is **unstructured**, when **who wrote it** is easier to
learn than **what it says**, and when the model is one part of a **system with a human in it**.

The asteroid capstone taught: imbalance, choosing the metric by cost, group leakage from repeated
entities, researching an unfamiliar field. This one assumes those and adds:

| Real-world skill | How it shows up here (measured) |
|---|---|
| Define the population the model will actually face | 66% of test posts are replies, and a reply inherits its thread's forum: no model needed. The job is the 2,527 new threads. |
| Research how each byte of the data was made | Headers written by software, quotes by other people, signatures by habit, and one forum's replies stamped by its moderator's server. |
| Shortcut learning: the model reads *who*, not *what* | The first model's top words include people's names and university hostnames. |
| A leak created by the labelling process | `athos.rutgers.edu` (the soc.religion.christian moderator's server) appears in 147 of that forum's 599 training posts and in 1 post elsewhere. |
| Leaks are redundant | Removing headers, quotes or footers alone costs 0.8 to 3.5 points; removing all three costs 16.2. |
| A validation scheme that predicts the future | On the training set, random 5-fold CV says 0.885, author-grouped 0.866, thread-grouped 0.821. The later-dated test set says 0.814. |
| Text into numbers | TF-IDF on the router's view: 109,888 features for 11,314 posts, 107 non-zero per post. |
| The 2026 question: pretrained embeddings | On new threads: MiniLM alone 0.783, bge-large alone 0.832, TF-IDF 0.824; TF-IDF + MiniLM 0.850, TF-IDF + bge-large 0.860 (the final model). Probe (old view, re-measure): embeddings win with few labels (0.595 vs 0.379 at 5 per forum). |
| Design the system around the model | A threshold set on older posts for 95% routes 81.5% of new threads and delivers 93.3%; handed-off posts get top-3 suggestions (right forum among them 88.5%). |
| Label budget | Probe: 0.38 / 0.65 / 0.75 / 0.81 at 5 / 25 / 100 / 400 labels per forum (TF-IDF). |
| The open world | A post from a forum the model has never seen still gets routed somewhere; its margin is lower (median 0.146 vs 0.650). |
| Label noise | 16 identical post bodies carry different labels (cross-posts filed once). |

## 2. The thesis (the spine)

> Every tutorial reports about 93% on 20 Newsgroups (0.929 on a random split). On the job the
> model would actually do — routing brand-new threads posted after the training data was
> collected, reading only what a real router would see — the same linear SVM scores 0.81. The
> points in between were never about topics: a random split puts a thread's replies on both sides
> of the line, and the model learns who writes where. The real work is (a) an evaluation that
> matches the job, and (b) a system that routes what it is sure of and hands the rest to a person.

## 3. The contract (same four beats as the asteroid capstone)

Every page: the general question first → the method → do it on the posts (predict first) → your
turn on your own data. One Playbook rule per page; the takeaways page hands over the whole list.

Own identity, not a recolour: the **newsreader printout**. Greenbar line-printer paper (theme-
independent, like the warehouse's concrete), monospace post headers, and the auditor's **red pen**
for anything the model should not be reading. The page opener is a post header — `Newsgroups:`
names the act, `Subject:` is the analyst's question; the transfer prompt is a `Followup-To:`; the
Playbook rule is the page's signature. Accent `--c-post` (ribbon navy).

Real posts are shown with personal identifiers masked (email local parts, names in signatures).
The measurements use the unmodified data.

## 4. Page list (27 pages, 7 acts)

### Act 1 — Frame the job and learn its world
1. `index` — Overview: which forum does this post belong in?
2. `the-job` — What job is the model actually doing? Replies inherit their thread; the population
   is new threads; auto-route vs suggest; what a misroute costs; success = accuracy on new threads
   and the share routed automatically at ≥ 95%.
3. `how-the-data-was-made` — Researching a domain by tracing its data-generating process: who
   or what writes each part of a record, when, and is it there at prediction time? Usenet 1993.
4. `anatomy-of-a-post` — The field guide: one post, every part colour-coded; content vs shortcut
   vs leak.
5. `research-questions` — Hypotheses written before looking.

### Act 2 — First contact: text into numbers
6. `first-look` — counts, lengths, empty posts, duplicates, posts without "Re:" that quote an
   earlier post (167 of the 2,527 new threads carry an attribution line). The reply share and the
   forum mix on the job already landed on page 2; do not repeat them.
7. `words-into-numbers` — bag of words → TF-IDF; d ≫ n; why that favours linear models.
8. `reading-the-weights` — the first model's top words are names and hostnames.

### Act 3 — The leak audit
9. `the-moderators-fingerprint` — a feature the labelling process created.
10. `closing-the-channels` — each channel alone vs all together (flagship lab).

### Act 4 — Lock the harness
11. `the-split` — random vs author vs thread vs the future.
12. `the-metric` — what to count, on which posts, and what a near miss costs.
13. `baselines` — majority and a keyword rule.

### Act 5 — Model, rung by rung
14. `naive-bayes` · 15. `logistic-regression` · 16. `linear-svm` · 17. `kernels-and-trees` ·
18. `better-features` · 19. `pretrained-embeddings` · 20. `choosing-the-model`

### Act 6 — Build the system around the model
21. `reading-the-errors` · 22. `automate-or-hand-off` · 23. `the-label-budget` ·
24. `when-the-world-changes`

### Act 7 — Conclude and transfer
25. `takeaways` — verdict, Playbook, notebook.
26. `transfer-near` · 27. `transfer-far` — two fresh text datasets: the reader runs the Playbook first, then the measurements.
   Candidates: SMS Spam Collection (UCI, short texts, imbalanced, duplicate messages) and
   Reuters-21578 (newswire, multi-label, extreme imbalance, finance jargon). **Both need a
   download; ask before fetching.**

## 5. Labs (planned)

- **PostAnatomyLab** (flagship) — a real post with its parts highlighted; switch channels off and
  see the measured accuracy for that combination.
- **RouteItLab** — type a post and a pruned linear SVM routes it live, showing the words that
  decided it (its accuracy measured against the full model).
- **SplitHarnessLab** — pick a validation scheme; compare its estimate with the future.
- **AutomationDialLab** — a confidence threshold: share auto-routed, their accuracy, the queue.
- **LabelBudgetLab** — learning curves, TF-IDF vs embeddings vs both.

## 6. Machinery

- `scripts/routing_cases.py` — every number, by section; `scripts/routing_regen.py --check` keeps
  pasted output blocks honest (same design as `svm_regen.py`).
- Embeddings are computed once on the GPU from the locally cached `all-MiniLM-L6-v2` and
  `BAAI/bge-large-en-v1.5` and cached outside the repo; the cache file's hash is printed.
- `src/lib/routingCapstoneTrack.ts`, `layout.tsx`, `siteMap.ts` CAPSTONES, `searchIndex.ts`.

## 7. Build log

(one entry per page, as with the SVM track)

**Page 1 of 27 — 2026-09-27.** *Overview & goal*, at `/learn/message-routing-capstone`. The
newsreader-printout skin (`newsreader.tsx`, `--nr-*` tokens, `.nr-paper`, accent `--c-post`),
`routingCapstoneTrack.ts`, layout, catalog + search wiring, and the SVM track's last page now
links here. Not in siteMap CAPSTONES until the capstone is complete.

- **Hero**: test post 4,984, a rec.motorcycles reply, printed with personal details masked
  (masks keep their length so the signature's drawn box stays square). Read whole, the model's
  rec.motorcycles score gets +0.842 from the signature, +0.279 from the quote, +0.267 from the
  header lines and +0.047 from the subject and body (of +1.435 from words). The router's view
  sends it to sci.electronics by 0.012. The rings are generated by `specimen`, which writes
  `src/data/routing/specimen.json`; the page imports it, and `routing_regen.py --check` re-runs it.
- **Thesis numbers**: random split 0.9252 (5 seeds, 0.9213-0.9280); later posts 0.8619; new
  threads 0.8239 whole post, 0.8235 router's view. Authors: 0.9081 seen vs 0.8083 new (whole
  post). athos.rutgers.edu in 147 of 599 soc.religion.christian training posts, 1 of 10,715
  elsewhere (it sits in the quoted Message-IDs; the moderator also signs inserted notes "--clh]").
- **Finding while measuring**: a threshold set on out-of-fold margins of the training new threads
  to give 95% under-delivers on the later posts: 93.35% while routing 81.5% (final model,
  TF-IDF + bge-large). With TF-IDF + MiniLM it was 92.35% at 77.6%, where an oracle on the later
  posts could route only 62.5% at 95%, and the mean of the five fold models gave 92.6%, so it is
  not the refit's larger margins. That is act 6's page, not a footnote.
- **Model ladder so far** (new threads): majority 0.0514, multinomial NB 0.7384 / 0.7851 (TF-IDF),
  complement NB 0.8093, logistic 0.8144, linear SVM 0.8235, MiniLM alone 0.7831, bge-large alone
  0.8322, TF-IDF + MiniLM 0.8504, TF-IDF + bge-large 0.8595 (weight 0.5 by thread-grouped CV,
  0.8571). The final model is the last one; thread-grouped CV picked it on training data.
- **Compute**: bge-large encode ~30 min on the GTX 1660 Ti in fp32 (fp16 was 4x slower on this
  card), cached after; MiniLM ~1 min. The CPU side (linear SVM on 1,024 dense columns) is the slow
  part of `embeddings`; the thread-grouped folds are vectorised once and the weight CV is cached,
  so `embeddings automation` runs in ~6 min. Probe-only (old view, to be re-measured in the script): rbf SVM 0.801 at ~150x the fit
  time, forest 0.755, LightGBM 0.745, kNN 0.747.

**Page 2 of 27 — 2026-09-27.** *What job is the model doing?*, at `/the-job`. New sections
`job` (writes `src/data/routing/job.json`) and `followers`, both guarded by `routing_regen.py`
(outJob, outFollowers, job.json). New figures in `src/components/figures/routing/JobFigures.tsx`
(RouterFlow, ForumMix; HTML grids so forum names stay readable on a phone). `ArticleOpener` now
wraps the Subject under its key on narrow screens (this was its first use).

- **The thread lookup.** No Message-ID/References headers survive in this release, so the thread
  key is the subject without "Re:". Of 5,005 later replies: 2,330 continue a thread filed before
  the cut-off (lookup right 97.51%), 1,573 a thread a later new post opened (99.17%), 1,102 sit in
  539 threads whose opening post is not in the data. Lookup files 4,466 (59.3%); the model's traffic
  is 3,066 (40.7%) = 2,527 new threads + one first reply per orphan thread. The 71 lookup misses are
  conversations that ran in two forums (talk.religion.misc/alt.atheism; guns/politics.misc on Waco),
  NOT generic subjects colliding (checked before writing).
- **Errors are weighted by what follows them.** The router's-view SVM files 82.35% of later new
  threads right; openers that drew replies are EASIER (84.62%, n=611) than those that drew none
  (81.48%, n=1,836), yet weighted by replies it is 75.84%: 181 of the 380 misplaced replies come
  from 5 threads (a 69-reply Windows thread filed under Mac hardware). First draft said "threads
  people answer are harder": wrong, the effect is concentration. Act 6 (reading-the-errors) reuses it.
- **Forum mix on the job**: 3.3%-5.3% per forum over all later posts, 1.1%-14.0% over new threads;
  misc.forsale opens a thread with 90.5% of its posts, alt.atheism with 9.1%. Act 4's metric page
  owes the reader the weighting decision this sets up.
- Orphan replies (the 539) are in the model's traffic but not in its score; the probe put the
  router's view at 0.789 on all 1,102 orphan replies vs 0.824 on new threads (not yet in the script;
  measure in `routing_cases.py` before citing, act 6).

**Page 3 of 27 — 2026-09-27.** *How the data was made*, at `/how-the-data-was-made`. New sections
`provenance` (writes `provenance.json`) and `senders`, guarded (outProvenance, outSenders). New
figure `PostLife` in `src/components/figures/routing/ProvenanceFigures.tsx`: one post's life, parts
tagged by what they tell (what / who / conversation / when-where / the forum itself), with a rule
where the router decides. Sources checked: RFC 1036 (1987) for who writes each header; Jason
Rennie's 20NG page for the bydate edits (60/40 by date, cross-posts dropped, Xref / Newsgroups /
Path / Followup-To / Date removed; Ken Lang "probably" collected it for NewsWeeder, 1995).

- **Documentation vs data**: the five documented removals hold (0 of 18,846), and three the
  standard requires are also gone, undocumented: Message-ID, References, Approved.
- **Time survives the Date removal**: quoted Message-IDs carry dates. Earlier posts: April days
  p10/median/p90 = 5/15/20, no May. Later posts: 19/22/27, 154 from May. Cut-off about 20 April 1993.
- **Parts on the job's posts**: new threads quote 10.8% (3.3% of lines), signature 27.1%; replies
  quote 87.9% (40.9% of lines), signature 38.5%.
- **Who, not what**: the From address alone files the 36.5% of new threads from known senders at
  81.69% (model on the same posts 85.27%); Organization 31.06% on 71.5%; posting host 43.53% on
  27.5%. 91.3% of repeat posters' training posts sit in their usual forum. Decision recorded:
  identity fields stay out of the model until act 3 measures them for known vs new senders.
- Known unknown for the labels: which folder a cross-posted article was kept in (undocumented).

**Page 4 of 27 — 2026-09-27.** *Anatomy of a post*, at `/anatomy-of-a-post`. New sections
`parsers` (writes `parsers.json`) and `sample` (writes `sample.json`), guarded (outParsers,
outSample). New lab `ParserLab` (three training posts x three views: as posted / this capstone's
parser / scikit-learn's cleaning; the script asserts the line map joins to exactly what
`fetch_20newsgroups(remove=...)` returns) and figure `SampleAudit` (AnatomyFigures.tsx).

- **scikit-learn's recommended cleaning** (its docs say to strip all three for a realistic score):
  the header rule drops the Subject from all 18,846 posts; the footer rule cuts the last block of
  95.6% of posts, incl. 1,655 of 2,527 later new threads with no '-- ' line (median 6 words).
  New threads: this parser 0.8235, without the subject 0.7899, scikit-learn's three 0.7812, + the
  subject 0.8184. The subject is worth 3.4 points.
- **Hand-read sample** (seed 20, 40 of the 2,550 training new threads the footer rule cuts with no
  '-- '): 30 signature/contact, 5 the poster's words, 4 both, 1 divider. Labels are in the script
  (`SAMPLE_LABELS`); the section asserts the draw is unchanged. Specimen 2780 (the X Consortium
  question) is reduced to "Hi," by scikit-learn's cleaning.
- **Our parser's own gap, found by the same sample**: signatures without '-- ' sit in the body.
  New `tail_split(p)` names that block ("the tail"). Cutting it: 0.8235 -> 0.8160; known senders
  0.8527 -> 0.8364, new senders 0.8067 -> 0.8042 (about 15 posts vs 4); gap 4.6 -> 3.2 points.
  **Decision: the router's view KEEPS the tail for now (every number on pages 1-3 stands); act 3
  (`closing-the-channels`) must audit it as a channel beside meta / quotes / sig, split by known
  vs new senders, and decide whether the router's view changes.** (A first probe that cut the last
  block even in posts WITH a '-- ' line gave 0.8180 / gap 2.4; that also cuts sign-off names above
  the delimiter. The page uses the tail_split definition.)

**Page 5 of 27 — 2026-09-27.** *Research questions*, at `/research-questions`. New section
`resolution` (writes `resolution.json`), guarded (outResolution). `automation` now reads its margins
from a cached `auto_route()` + `threshold()` (output unchanged: 2,059 routed, 0.9335, top-3 0.8846).
New lab `ResolutionLab` (8 comparisons x test-set size; normal interval from the disagreement
shares, the script's bootstrap at the real size) and `PredictionRegister` (the register, with the
reader's bets in localStorage `manifold-routing-bets`). Register text: `src/lib/routingRegister.ts`.

- **Resolution of the 2,527 new threads** (bootstrap, 2,000 resamples, seed 16): one accuracy
  +/-1.4 points; the smallest forum (alt.atheism, 29 new threads) 0.448, interval 0.276-0.621.
  Paired: only disagreements count. Tail kept vs cut +0.75, 71 disagreements, SETTLED (0.12-1.42);
  bge-large alone vs TF-IDF +0.87, 336 disagreements, NOT settled (-0.47 to +2.33, needs ~6,700).
- **Audit of pages 1 and 4.** Page 1 "a large one edges past them" was not settled: page 1 now says
  it "draws level". Everything else holds: MiniLM alone loses (+4.04, 2.45-5.62); TF-IDF + MiniLM
  beats TF-IDF (1.90-3.52); TF-IDF + bge-large beats bge-large alone (1.58-3.84) and TF-IDF
  (2.69-4.59); whole post vs router's view is -1.0 to +1.1 (the "worth nothing" claim, fairly read);
  known vs new senders +4.6 (1.8-7.5); page 4's tail split holds only just (known 1.6, new 0.25,
  difference 0.03-2.74); the 95% promise slip is real (0.9223-0.9441, 95% outside).
- **The register (H1-H7, frozen wording; E1 an estimate with no prediction):** H1 nothing
  non-linear beats the linear SVM, trees trail by > 3 pts (act 5 kernels-and-trees); H2 the
  moderator's words sit in soc.religion.christian bodies and one is among its 20 heaviest words in
  the router's view (act 3 fingerprint); H3 on a random split, all three channels together cost
  >= 3x the costliest alone (act 3 closing-the-channels); H4 the embedding helps new senders at
  least as much as familiar ones (act 5 pretrained-embeddings); H5 > half of misroutes stay in their
  family (act 6 reading-the-errors); H6 a threshold set on sender-grouped folds delivers 95% later
  (act 6 automate-or-hand-off); H7 < 1 in 10 of a left-out forum's posts are auto-routed (act 6
  when-the-world-changes); E1 labels per new forum (act 6 the-label-budget). Standing rule: every
  verdict is read with its 95% interval; straddling the line = "not settled". **Each settling page
  must set `verdict` + `settled` in routingRegister.ts, say so in its text, and show the reader's
  bet back to them.** H4's group sizes (923 / 1,604) put the noise on the difference of gains near
  +/-2 points; expect "not settled" to be a live outcome there.

**Page 6 of 27 — 2026-09-27.** *First look at the posts*, at `/first-look`. New section
`first_look` (writes `firstlook.json`), guarded (outFirstLook). New lab `LengthBandsLab` (six length
bands: posts, accuracy with bootstrap interval, median margin; click a band for six subjects drawn
at random, seed 6, the draw checked against the reviewed `FL_DRAW`). The page settles no register
entry.

- **Shape.** Router's view of the 2,527 later new threads: median 92 words (p10 31, p90 448, max
  9,395); subject median 4 words; 23 have an empty body (14 routed right). Accuracy by length:
  under 10 words 0.500 (n=36, 0.33-0.67), 10-19 0.759, 20-39 0.772, 40-79 0.814, 80-159 0.833,
  160+ 0.865 (0.84-0.89). Median margin rises 0.32 -> 0.88 with length (act 6 should use it).
  The shortest band's sample holds two "subscribe" posts and a "test (please ignore)".
- **Encoded binaries.** 22 earlier posts carry 10+ uuencoded lines (19 in comp.os.ms-windows.misc),
  5 later; the longest later post is a reply of 22,330 "words", 901 lines uuencoded. Page 7 should
  mention them when it counts the vocabulary.
- **Near-copies** (TF-IDF cosine >= 0.9 to an earlier post): 56 new threads, routed right 0.875;
  without them 0.8223 vs 0.8235. Copy in the same forum: 48 of 49 right; in another forum: 1 of 7.
  Mostly reposted ads (misc.forsale 22), scheduled FAQs/listings, hockey series, reposted questions.
  Decision: keep them (the live router sees the earlier copy too).
- **Same body, two forums:** 12 texts, 25 posts, 10 later new threads (multi-posts or missed
  cross-posts; undecidable without Message-IDs). Relevant to act 4's near-miss decision.
- **Quoting new threads:** 167 carry an attribution line; 54 use "(was: ...)"; 5 match a known
  thread. 0.856 (0.796-0.904) vs 0.821: NOT settled, and the page says so.

**Page 7 of 27 — 2026-09-27.** *Words into numbers*, at `/words-into-numbers`. New section
`vectors` (writes `vectors.json`), guarded (outVectors). New lab `WeightingLab` (three later new
threads chosen for carrying no personal names, 4394 / 444 / 1659; counts vs TF-IDF vs TF-IDF with log
counts: ten heaviest words with their df, and the three nearest earlier posts by cosine; unknown
words underlined). New `fit_svm()` asserts liblinear finished (a capped fit is not a result).
`routing_regen.py` now runs every section ONCE in one process (it ran sections twice, once for page
blocks and once for data files); `vectors` alone takes ~13 min because unscaled counts converge slowly.

- **The table.** 109,888 words from 11,314 earlier posts; median 69 per post (mean 106); 0.097%
  non-zero; 9.9 GB dense vs 14.6 MB sparse. 61.7% of words seen in one post; 30.5% of the
  vocabulary only in the 22 posts with encoded files; 'ax' (62,405, second after 'the') is 99.9%
  from 12 parts of one uuencoded roman.bmp.
- **Unknown words** in later new threads: 3.5% of words, 78.4% of posts, >10% of words in 126.
  Fitting the vocabulary + IDF on all 18,846 posts: 0.8235 either way (a word absent from every
  training row gets no weight). The page still calls it wrong (it cannot run in production).
- **Separable.** At C=10 the SVM fits all but 6 earlier posts (5 have a text twin in another
  forum); C=0.3 beats C=10 on later new threads by +1.94 (1.03-2.81).
- **Weighting ladder, each row its own C by thread-grouped CV** (raw counts need C=0.01; above
  0.03 liblinear hits its cap): counts 0.7784 -> scaled +0.95 (0.08-1.78) -> + IDF +2.97
  (2.10-3.88) -> + log counts +0.59 (-0.08 to +1.27, not settled). min_df=2: 42,119 cols, +0.08
  (not settled). Stop words -0.40 (not settled). IDF is the step that matters.

**Page 8 of 27 — 2026-09-27.** *Reading the weights*, at `/reading-the-weights`. New section
`weights` (writes `weights.json`), guarded (outWeights). New lab `WeightsLab` (20 forums x whole
post / router's view: twelve heaviest words, bars coloured by the part of the post where each word
mostly occurs, tagged "a person" (hand-read list `WEIGHT_PEOPLE`, masked) and "mostly the sender's
own" (the word is in the post's own From line in >50% of the posts containing it)). New figure
`ScoreParts` (WeightFigures.tsx). The section's stdout stays ASCII (a piped child prints cp1252
on Windows; masks live only in the JSON).

- **Whole-post model**, top 10 x 20 forums: 19 private names, 26 live mostly in headers/quotes/
  sigs, 29 either; talk.politics.misc has 6 of 10 in quotes; soc.religion.christian's top 12 hold
  its three servers (rutgers, athos, geneva).
- **Where the winning score comes from** (whole post, later posts): new threads 83.8% subject+body,
  11.1% headers, 2.9% quotes, 2.2% sig; replies 47.0% / 10.8% / 36.7% / 5.5%.
- **Router's view:** 6 private names in the top 200; 4 of them (all alt.atheism) are mostly the
  sender's own sign-off (the tail); the sender's own name/address inside subject+body gives 1.8%
  of the winning score on later new threads. The first name k.... is in 114 earlier posts' content,
  sender has it in 69. **soc.religion.christian's router-view list holds the moderator's initials
  (c.., own-share 0.0): page 9 must settle H2 with it** (confirm it is the moderator's, count it in
  new threads, and measure removing it). The page teases it without a verdict.

**Page 9 of 27 — 2026-09-28.** *The moderator's fingerprint*, at `/the-moderators-fingerprint`. The
old one-line `fingerprint` section is now two, both guarded: `fingerprint` (writes `fingerprint.json`:
the specimen post and the forum's top-20 words with their note share; outFingerprint) and `notes_cost`
(writes `notes.json`: the 14 later new threads with a note; outNotesCost). `NOTE_RE` matches the
moderator's bracketed notes ("[... --c..]"); `strip_notes(p)` is the router's view without them. New
lab `NotesLab` (14 posts: moderator's share of the words, the note, route + margin with/without, the
median margin of all 2,527 as a tick), figure `NoteShareTop` (FingerprintFigures.tsx), and
`Settled` (PredictionRegister.tsx: a settling page's verdict box, answers the reader's stored bet;
the register's "settled in" line now links to the settling page). PartKey takes a `pen` label.
**H2 CONFIRMED** in `routingRegister.ts`.

- **Who wrote them.** Notes in the body of 68 of 599 earlier soc.religion.christian posts (0 of
  10,715 elsewhere), 80 notes from 59 different senders, none from the moderator's own address; 17
  more posts carry one after the '-- ' signature, 11 quote one. Median 69 words, longest 959; 6.5% of
  the forum's router-view words. The initials rank 4th of its top 20 (weight 1.85); 80 of 83 uses are
  inside notes (the other 3: posters naming him); no other top-20 word is over 11%. The notes' voice
  is routing: "not the right newsgroup", "crossposted from alt.sex", "I allow discussion only
  periodically".
- **A scan.** Words in 20+ posts, 95%+ in one forum: 158; the initials look like a topic word (61
  senders; 'bike' 136). Sorted by wrapping consistency (2 chars before, 1 after) the initials are
  8th (97.6% '--' ... ']'); the 7 above are 3 undelimited signatures + 2 repeated subjects
  (hand-read, `FRAME_ABOVE`, asserted).
- **Cost.** Notes out of the later posts: 0.8235 unchanged, 1 route moves (6580, wrong -> wrong).
  Out of both: 0.8231, 4 routes move (3 never had a note), -0.04 (-0.16 to +0.08), not settled. The
  14 later new threads with a note: 13 right either way; median margin 0.89 -> 0.71 (all new threads
  0.67); more than halves in 3; the moderator wrote 59% and 73% of two posts. 416 earlier posts carry
  other bracketed blocks, so the rule is the signed-note pattern, not brackets.
- **Decision recorded on the page:** the notes come out of the router's view. **Page 10
  (`closing-the-channels`) fixes the router's view ONCE, with the tail decision from page 4, and must
  re-measure what changes under it** (the ladder, embeddings, automation and page 1's overview numbers
  are all measured on the current view; the embedding caches encode the current view's text).

**Page 10 of 27 — 2026-09-28.** *Closing the channels*, at `/closing-the-channels`. New sections
`channels` (random split: all 16 combinations of header lines / quotes / signature / tail, 5 seeds,
notes out; writes `channels_random.json`; outChannels) and `channels_job` (the later new threads, all /
known / new senders, every combination against the audited view with paired bootstrap intervals, plus
the quoted text without attribution lines; writes `channels_job.json` with the lab's post 1165, masked;
outChannelsJob). New `view_of(p, keep=())`: notes stripped FIRST, then the tail found, then channels
added; with nothing kept it is **the audited router's view, used from act 4 on**. Flagship lab
`ChannelsLab` (4 toggles, the post dims, random-split card + job card with known/new intervals).
**H3 WRONG** in `routingRegister.ts`.

- **Random split** (whole post 0.9247, notes out): closing header lines 0.55, quotes 3.80, signature
  -0.17 (helps), all three 4.65, all four 5.03. The quotes are 82% of all three (76%-94% per split).
  Quotes cost 5.24 on test replies, 1.05 on test new threads; 83% of test replies have a post of their
  own thread on the training side: the leak is the thread's text, not names. (The planning probe's
  "0.8-3.5 alone, 16.2 together" used scikit-learn's removals, which also drop the subject; wrong here.)
- **The job** (2,527; 923 known, 1,604 new): acts 1-3 view 0.8235 (0.8527 / 0.8067); notes out 0.8231;
  tail out too = audited 0.8168 (0.8364 / 0.8055), -0.67 (-1.31 to -0.04, settled); known-new gap 4.6 ->
  3.1. Added to the audited view: header lines +0.75 ns (known +3.58 settled, new -0.87 ns); quotes +0.91
  settled (known +1.73 settled, new +0.44 ns); signature -0.04; tail +0.63 (lower bound exactly 0.00, ns;
  known +1.52 settled, new +0.12); all four +0.63 ns (known +3.68, new -1.12 ns); header+signature new
  -1.62 settled (lab). Quoted text without attribution lines +0.67 ns (known +1.63 settled, new +0.12).
  Thread-grouped CV on training new threads would pick the header lines (0.8426 vs 0.8251): its folds
  share senders (H6's point; do not use it to choose identity channels).
- **Decision:** the router reads subject + body, tail and notes out (0.8168), on principle (what the
  post says, not who sent it), paying 0.67 settled points, all from known senders. Quoted text and an
  explicit sender-history feature are deferred to act 5 (`better-features`), tested on act 4's harness,
  not picked on the later posts.
- **OWED by later pages:** every act 4-6 section must use `view_of(p)`, not `CONTENT`. The embedding
  caches (`*_content.npz`) encode the acts 1-3 view: act 5 needs new caches for the audited view (bge-large
  ~30 min on the GPU). Page 1's "Where we end up" (0.860, 81%, 93.3%, 88.5%) was measured on the acts
  1-3 view and must be re-measured and updated when acts 5 and 6 get there; page 10 tells the reader so.

**Page 11 of 27 — 2026-09-28.** *The split that predicts the future*, at `/the-split`. New section
`the_split` (writes `harness.json`; outSplit), lab `SplitHarnessLab` (forest plot: six tests' estimates
with 95% bootstrap intervals and fold ticks against the later posts' band; score all posts / only new
threads; the thread-grouped estimate weighted to the later sender mix). All on the audited view.

- **Target:** later new threads 0.8168 (0.8017-0.8310), all later posts 0.8056; 36.5% of later new
  threads from a sender seen earlier.
- **Tests on the earlier posts** (all posts / new threads, vs later): random 5-fold 0.8795 (+7.39) /
  0.8422 (+2.54), 46.8% met; author-grouped 0.8676 (+6.20) / 0.8333 (+1.66), 0% met (still overshoots:
  a new thread's replies by other people sit in training); thread-grouped 0.8050 (-0.06) / 0.8250
  (+0.82), 45.4% met; time holdouts by ARTICLE NUMBER (server arrival order; 1,894 of 11,314 earlier
  posts are numbered after their forum's first later post): latest 20% +1.43, 25% +1.19, 33% -0.70
  (one noisy split each). Thread-grouped folds spread 3.4 points on new threads.
- **Sender mix:** inside thread-grouped folds, met 0.8674 vs new 0.7897; weighted to 36.5% met: 0.8181
  (+0.13). Across C in (0.1, 0.3, 1, 3), weighting brings the gap from +0.8..+1.7 to +0.1..+1.0. The
  harness picks C=0.3, the later posts' best.
- **The harness, fixed for acts 5-6:** 5 folds grouped by thread on the earlier posts, audited view,
  scored on their new threads, reported raw and weighted to 36.5% known senders. The later posts only
  report. (Existing `best_c()`/`folds()`/`cv_weights()` use the acts 1-3 view scored on ALL posts:
  act 5 sections must use a new harness helper on `view_of`, new threads, weighted.)

**Page 12 of 27 — 2026-09-28.** *The metric, on the right posts*, at `/the-metric`. New sections
`the_metric` (writes `metric.json`; outMetric) and `metric_choice` (outMetricChoice), lab `CountingLab`
(the same routes counted three ways: each new thread / each forum / each post of its conversation, on the
later new threads or the harness; per-forum weight bars + accuracy with 95% interval; a floor slider that
names forums whose whole interval sits below it). **New act 4+ machinery in routing_cases.py:**
`audited()` (audited view of every post, cached, + `known` = 0.365), `harness_folds()` (thread-grouped,
audited, vectorised once), `harness_run(fit_predict)` (pooled harness new threads: ok/y/pred/met, raw and
weighted score), `forum_mean()`, `balanced_on_new()`. **Acts 5-6 must choose through `harness_run`.**

- **Forum mix comes with the posts:** all earlier posts are 22.8% (TV distance) from the later new threads'
  forum mix; earlier new threads 5.8%. Scoring new threads fixes the mix.
- **Three counts** (later / harness): each new thread 0.8168 (2.9 wide) / 0.8250; each forum (macro recall)
  0.7788 (3.9 wide) / 0.8061; each post of its conversation (1 + replies) 0.7881 (8.0 wide) / 0.8510 (harness
  misses it by 6.3). One alt.atheism thread = 12.2 misc.forsale threads under the forum count.
- **Per forum, floor 0.75 (whole interval below):** harness names alt.atheism 0.457, talk.religion.misc
  0.484; later adds **talk.politics.misc 0.529 (harness 0.849)**: 24 of 51 misrouted, 19 to
  talk.politics.guns, all 19 name Waco/Koresh/Davidians/BATF. Posts naming them: earlier 251 (guns 141,
  politics.misc 6), later 319 (156 / 102); new threads 49 (29 / 2) -> 58 (27 / 23). The fire was 19 April
  1993, at the cut-off. Moves the per-thread score 0.75 points. **Act 6 `when-the-world-changes` should use
  it** (a topic moved forums after the cut-off; the per-forum guard caught it, the average did not).
- **Does the count change the choice?** Harness picks C=0.3 counting threads (later agrees) and C=1 counting
  forums (+0.27, -0.32 to +0.94; later forum count prefers 0.3). Class weights balanced by new threads
  (alt.atheism post = 14.5 misc.forsale posts): threads -1.21 (-1.82, -0.61) settled, forums +0.16 ns; later
  -1.51 / +0.52. Forum-count intervals 25-35% wider.
- **Decision:** acts 5-6 rank by per-new-thread accuracy on the harness (raw + weighted to 36.5% met);
  every report lists the 20 forums with intervals and names those wholly below 0.75 (alt.atheism and
  talk.religion.misc start on it). Near misses count as misses until H5 (act 6 reading-the-errors).
- **Probe note for act 5 (not yet in the script):** on the harness, ComplementNB (alpha 0.3, audited view)
  scored 0.8293 raw / 0.8222 weighted vs the SVM's 0.8250 / 0.8181, but 0.8124 vs 0.8168 on the later new
  threads. The harness may prefer NB on a difference it cannot settle; act 5 must measure and say so.

**Page 13 of 27 — 2026-09-30.** *Baselines: the bar before the model*, at `/baselines`. New section
`baselines` (writes `keywords.json`; outBaselines), helpers `kw_fit` / `kw_route` (a keyword rule learned
from posts: words in 10+ posts belong to the forum with the largest share of their posts; each forum keeps
its K highest-share words; most keyword hits wins; no hit or a tie = not fired, sent to misc.forsale),
`KW_PEOPLE` (WEIGHT_PEOPLE + 6 hand-read private names/initials/address parts, masked in the JSON). Lab
`KeywordRuleLab` (K = 3..1000: rule accuracy on harness and later vs the SVM and the majority line; fires /
right when it fires / the SVM on the same posts; any forum's first 12 keywords tagged encoded file / a person
/ one thread). **Act 4 is complete.**

- **Majority:** most common forum of all posts (rec.sport.hockey) 0.0514 later (harness 0.0363, fold picks
  vary); most common forum of new threads (misc.forsale) 0.1397 later, 0.1281 harness.
- **Keyword rule:** harness picks K=100: 0.6543 (0.6454 weighted), later 0.6312 (later would pick K=250,
  0.6343). K=3 fires on 15.2% at 0.945 (SVM 0.952 on the same posts; later 0.908 vs 0.928); K=1000 fires on
  94.3% at 0.233. SVM - rule = +17.07 (15.68-18.43); rule alone right 140, SVM alone 817. At K=100 no forum
  where the rule wins (at small K misc.forsale "wins" only because unfired posts go there; the lab says so).
  At every K the SVM beats the rule on the rule's own fired posts (harness and later): no front door.
- **What it learned** (first 12 words x 20 forums = 240): 11 encoded-file fragments (all
  comp.os.ms-windows.misc's, so the rule files that forum at 0.199 vs the SVM's 0.837), 9 private people,
  49 one-thread words (sci.med barbecued / krillean 100% one thread; guns ranch / dividian from the "atf
  burns dividian ranch" thread, 43 posts).
- **Decision:** floors stay in every report (majority 0.128 harness, rule 0.654); the bar for act 5 is the
  linear SVM, 0.825 / 0.818 weighted, beaten by a margin the harness can settle.

**Page 14 of 27 — 2026-09-30.** *Naive Bayes: the first rung*, at `/naive-bayes`. New section `naive_bayes`
(writes `naivebayes.json`; outNaiveBayes). New act 5 machinery: `harness_counts()` (word counts per harness
fold, same vocabulary as the fold's TF-IDF), `nb_features(Ca, Cb, step)` (counts -> log counts 1+ln n -> each
post's length normalised -> + IDF, the last asserted equal to the harness TF-IDF), `harness_steps(make, step)`,
and **`harness_choose(runs)`: cross-validated selection (for each fold, the run best on the other four folds'
new threads, scored on this fold). Every later rung that searches settings must report its score through it,
and the bar's too.** `harness_run` now also returns `fold`. Lab `NaiveBayesLab` (3 later new threads x 3 models
fitted on all earlier posts: the right forum against its rival, each word's vote, votes tinted in the post).
Source checked: Rennie, Shih, Teevan & Karger, ICML 2003 (20NG on 10 random 80/20 splits: MNB 0.848, TWCNB
0.861, SVM 0.862; steps TF log, IDF, length norm, complement, weight norm).

- **Textbook model** (multinomial, counts, alpha 0.1): 0.7526 / 0.7442 weighted, -7.24 vs the SVM. It routes
  18 of 276 harness comp.os.ms-windows.misc new threads there (SVM 231; 5.4 of the 7.2 points), 20 of 3,966
  overall, and 0 of 170 later. Cause: 19 of the forum's 591 earlier posts carry an encoded file and hold 73.6%
  of its counted words; 'the' is 12.4 per 1000 there vs 25.0-62.8 elsewhere. Lab post 407 loses by 94 log
  units to "to" x7, "the" x5, "of" x4.
- **The fixes, cumulative, each cell its own alpha** (multinomial / complement / complement weights-normalised):
  counts 0.7526 / 0.7774 / 0.7595; + log 0.7592 / 0.8043 / 0.7786; + length normalised 0.7975 / **0.8348** /
  0.8260; + IDF 0.8058 / 0.8293 / 0.8270. Length normalisation is the fix (+3.83 / +3.05 / +4.74, settled);
  complement over multinomial +3.73; IDF +0.83 for multinomial but -0.55 (settled) for complement; weight
  normalisation never helps. The SVM wants IDF (0.8011 without, 0.8250 with). Complement on the SVM's TF-IDF vs
  the SVM: +0.43 (-0.58, +1.36), level. (An earlier probe ordered IDF before length norm: IDF then cost the
  complement 3.66 points; the published ladder normalises lengths first.)
- **The pick** of 60: complement, log counts + length normalised, no IDF, alpha 0.1: 0.8348 / 0.8283 weighted;
  vs SVM +0.98 (+0.05, +1.89). Chosen fold by fold: NB 0.8328 (same pick 4/5), SVM (C x IDF or not) 0.8222,
  +1.06 (+0.10, +1.97). Known +0.78 ns, new +1.16 ns. Forum count 0.8041 vs SVM 0.8061. Higher on 14 forums,
  SVM on 5; biggest differences are SVM's: talk.religion.misc 0.242 vs 0.484 (41 of 62 to
  soc.religion.christian, SVM 25), talk.politics.misc 0.699 vs 0.849; windows 0.768 vs 0.837; NB's best gain
  soc.religion.christian 0.889 vs 0.807. Below the floor: both alt.atheism + talk.religion.misc only.
  Agreement: they route 87.4% alike, right on 89.6% of those (act 6 automation may use two-model agreement).
- **Later (report only):** multinomial counts 0.7388; the pick 0.8219 vs SVM 0.8168, +0.51 (-0.71, +1.66).
- **Decision: complement NB (log counts, length normalised, no IDF, alpha 0.1) is the new bar: 0.835 harness,
  0.828 weighted, 0.833 chosen fold by fold.** Page 15 (logistic regression) onward must beat it by more than
  the noise, through `harness_choose`, each model at its own best features. talk.religion.misc and
  talk.politics.misc losses stay on record for act 6 (H5 near misses).

**Page 15 of 27 — 2026-10-02.** *Logistic regression: the second rung*, at `/logistic-regression`. New sections
`logistic` (outLogistic) and `how_sure` (outHowSure; writes `logistic.json`). New machinery: `logistic_proba()`
(softmax logistic regression, newton-cg, cold start, gradient 1e-8, asserted converged; results CACHED under
`~/scikit_learn_data/routing_cache/logistic`, keyed by a hash of every input array + C + tol + sklearn version,
because the 50-fit grid takes ~30 min; a cached rerun of both sections takes ~4 min), `harness_logistic(step, C)`,
`lr_runs()` / `nb_runs()` / `svm_runs()` (each grid run once per process; naive_bayes now uses the last two),
`calib_error()` (10 equal-width bins of stated probability), `reliability()`, `top_gap()`, `fitted_probability()`
(Platt: one-input logistic regression on the top-two gap, fitted fold by fold). Lab `HowSureLab` (reliability
diagram per model; logistic gets a C slider and a strip of share right vs mean stated probability across C).

- **Solver traps (measured):** sklearn's default (lbfgs, tol 1e-4) at C=100 stops after 61-85 of 100 steps with no
  warning, loss 0.9-6.6% above the minimum; routes 0.8195 vs 0.8207, but probabilities off by 0.010 (median) and up
  to 0.35. Warm-started newton-cg at tol 1e-4 does ZERO steps from C=100 up (loss 22% above the minimum at C=100).
  newton-cg at 1e-6 leaves a gradient of 0.7 at C=1000. Running fits in parallel (joblib, 5-10 workers) made each
  fit 5-10x slower: no gain; sequential + cache instead.
- **The rung:** needs IDF (no IDF 0.776-0.784); TF-IDF flat from C=3 to 1000 (within 8 posts of 3,966). Pick C=100,
  0.8207 / 0.8137 weighted; chosen fold by fold 0.8200 (4 of 5). **vs the bar (NB chosen 0.8328): -1.29 (-2.29,
  -0.25) settled. The bar stays.** vs the SVM chosen 0.8222: -0.23 ns. Known senders -1.17 ns, new -1.62 settled.
  Routed alike: LR-SVM 94.4%, LR-NB 85.6%, NB-SVM 87.4% (LR is the SVM's twin).
- **Probabilities:** LR's mean stated probability climbs 0.405 -> 0.837 from C=1 to 1000 while accuracy moves ~1 pt;
  lowest log loss at C=300 in every fold (accuracy picked 100). At C=300: says 0.809, right 0.821, expects 3,208 vs
  3,254, calibration error 0.043 (0.040 at C=1000, where it says more than it gets). The bar: says 0.184 (median
  0.113), expects 730 vs 3,311 right, error 0.651 (scores span 1.03 log units best-to-worst on the median post).
  Textbook NB says 0.966, right 0.753, error 0.213 (pick leads by 22.1 log units on the median post).
- **Sorting (what a threshold needs):** AUROC of confidence -> right / share right among the surest 80%: bar's
  probability 0.779 / 0.897; bar's top-two gap 0.835 / 0.913; SVM gap 0.841 / 0.912; LR C=300 probability 0.828 /
  0.902. **The bar + a Platt probability on its gap, fold by fold: expects 3,311, gets 3,311, error 0.032.**
- **Later (report only):** LR C=300 0.8073, says 0.821, expects 2,075 of 2,527, gets 2,040, error 0.055; bar + fitted
  probability 0.8219, says 0.829, expects 2,095, gets 2,077, error 0.037.
- **Decision:** the bar stays complement NB (0.833 chosen fold by fold). Act 6 starts from its top-two gap for the
  threshold; the number shown to a person is the fitted (Platt) probability. Logistic regression joins the router as
  that one-input calibrator, not as the router.

**Page 16 of 27 — 2026-10-02.** *The linear SVM: the third rung*, at `/linear-svm`. New sections `linear_svm`
(outLinearSvm) and `svm_memory` (outSvmMemory; writes `svm.json`). New machinery: `svm_fit()` (LinearSVC asserted to
finish before MAX_ITER, **seeded random_state=0**: unseeded, liblinear's L1 fits move by a post and a few words run to
run and one in a few runs past 20,000 iterations), `svm_kind_runs()` (hinge and L1 on the harness at SVM_C), `_Finished`
(svm_runs' LinearSVC, now asserted to finish; same fits as before, outputs unchanged), `_random_folds()` (page 11's
random 5-fold, vectorised per fold). Lab `MemoryDialLab` (C slider 0.01-10; three panels, new threads / replies whose
conversation is in training / replies whose conversation is not, SVM line vs the bar dashed; later posts or random folds;
tiles: training accuracy, share inside own margin, all posts as benchmarks count, C each test chooses).

- **The search (16 settings, harness):** squared hinge L2 TF-IDF C=0.3 stays the pick, 0.8250 / 0.8181; chosen fold by
  fold 0.8222 (4 of 5), same as the C x IDF search. Hinge at its best C (1) 0.8232, -0.18 ns. L1 at its best C (1) 0.7887
  with 3,803 of ~88,392 words, -3.63 settled. sklearn's default C=1 0.8235 (6 posts behind). **vs the bar: -1.06 (-1.97,
  -0.10) settled; the bar stays complement NB.**
- **Where the SVM wins (later posts, fitted on all earlier):** all 7,532 level (-0.08); new threads -0.51 ns; **replies
  whose conversation (thread key) is in the training posts, 2,330: SVM +1.76 (+0.52, +3.00) settled; replies to other
  conversations, 2,675: bar +1.27 settled.** The thread lookup files the 2,330 at 0.9751. Random 5-fold: all +0.34 ns,
  read replies +1.62 settled, new threads -1.11 settled. The SVM's usual text win is memory of conversations.
- **C is a memory dial (later posts):** training accuracy 0.886 (C=0.01) -> 0.992 (0.3) -> 0.9995 (10); share of earlier
  posts inside their own forum's margin 1.000 -> 0.935 -> 0.747. Read replies 0.763 -> 0.837 -> 0.854; new threads peak
  0.817 at 0.3, 0.800 at 10; unread replies peak 0.768 at 0.3. Random folds pick C=3 (all posts 0.8885); harness and later
  new threads pick 0.3; C=3 vs 0.3 on later new threads -1.46 (-2.26, -0.63) settled.
- **Decision:** the bar stays complement NB for every post that reaches a model; the SVM stays the yardstick at C=0.3.
  Its wins are on replies the lookup files without a model. Page 17 (kernels and trees) settles H1.

**Page 17 of 27 — 2026-10-02.** *Kernels and trees: the fourth rung*, at `/kernels-and-trees`. New sections
`kernels_trees` (outKernelsTrees), `kernel_reach` (outKernelReach; writes `kernels.json`) and `tree_questions`
(outTreeQuestions; writes `trees.json`). New machinery: `_cached()` (results under `routing_cache/nonlinear`, keyed by
tag + sklearn/LightGBM versions + every input array: the forests and boosted trees take ~1.5 h from cold, ~6 min
cached), `knn_runs()`, `kernel_runs()` (SVC on precomputed kernels per fold, RBF and the linear kernel), `forest_chunks()`
(forests grown 250 trees at a time, seeds 0, 1, ...: 2,000 trees of this depth do not fit in memory), `forest_votes()`,
`forest_runs()`, `boosted_votes()` / `boosted_runs()` (LightGBM, deterministic=True), `tree_questions()` (per post: questions
per tree, share about its own words, own words reached by any tree), `forest_questions()`, `later_kernel()` (the 11,314-post
kernel built in place). Lab `KernelReachLab` (gamma 0.03-10: the kernel's weight against distance over histograms of each
new thread's nearest and typical distance; share right by gamma against the linear SVM and the single nearest post; tiles).
Figure `TreePath` (`TreeFigures.tsx`: one post's 569 questions in the forest's first tree as a strip of marks).
**H1 NOT SETTLED** in `routingRegister.ts`.

- **The searches (harness, chosen fold by fold, vs the linear SVM 0.8222):** kernel SVM 0.8124, -0.98 (-1.77, -0.20); nearest
  neighbours (k up to 100, similarity votes) 0.7663, -5.60; random forest 0.7940, -2.82 (-3.81, -1.84); boosted trees 0.7859,
  -3.63 (-4.66, -2.67). All settled below the linear SVM and the bar (-2.04 to -6.66). Later new threads, same order: 0.8025 /
  0.7626 / 0.7934 / 0.7859 vs 0.8168, all settled below. **H1: first half holds, the three-point margin straddles for both tree
  models -> not settled.**
- **Kernel:** the same solver with a straight line (SVC, linear kernel, one-vs-one hinge) 0.8116; RBF vs straight +0.08 (-0.35,
  +0.48): the lost point is SVC's one-vs-one scheme, not the kernel. Distances (harness new threads): nearest training post 1.24
  (sq 1.534, cos 0.23), typical 1.39, max 1.41. At gamma 0.3 (pick) the weight halves at 1.52, nearest counts 1.13x typical,
  routes 91.4% as the linear SVM; gamma 3: 3.31x, 99.8% support vectors, 0.707; gamma 10: 0.06 (below the majority 0.128).
- **Forest:** better with FEWER words per split: sqrt (297) 0.7645 -> 100 0.7794 -> 30 0.7827 -> 10 0.7940 -> 3 0.7970 -> 1
  0.7978 (2,000 trees). At max_features=1 sklearn draws words until one varies at the node: the tree chooses no questions.
  mf=1 still +0.9 from 1,000 to 2,000 trees. Trees at mf=1 on all earlier posts: 6,425 leaves, longest path 1,560; a later new
  thread passes 640 questions per tree, 0.4% (2.7) about a word it contains; all 2,000 trees together reach 100% of a typical
  post's 62 words. By length vs the linear SVM: <40 words -3.61 settled, 40-159 -1.16 ns, 160+ -4.67 settled. Specimen 3041
  (rec.motorcycles, scratches): tree 1 asks 569 questions, own words only they/is/not/to/them, leaf talk.politics.mideast;
  the forest gets it with 10.9% of votes (baseball 9.3%).
- **Boosted:** LightGBM defaults peak 0.744; leaves of 5+ posts and a third of the words per tree 0.783-0.786 (step 0.02 still
  +0.3 from round 100 to 200).
- **Decision:** the bar stays complement NB; no non-linear model joins. Act 5 now changes the features: page 18
  `better-features` (quoted text, sender history, deferred from act 3), then page 19 embeddings.
- **Process note:** never run two multi-threaded fits at once on this machine (LightGBM next to a forest slowed ~10x); for runs
  past ~15-20 min, use the GPU or hand the user a whole Colab script.

**Page 18 of 27 — 2026-10-05.** *Better features: what else the router can read*, at `/better-features`. New sections
`better_features` (outFeatures), `pieces` (outPieces; writes `pieces.json`) and `sender_history` (outHistory; writes
`history.json`). New machinery: `feature_texts()` / `feature_blocks()` / `block_features()` (each reading is a block of
count-vectoriser columns, normalised on its own, blocks stacked and divided by sqrt(blocks)); `_bf_fit()` scores one fold for
complement NB (log counts, length-normalised) and the linear SVM (TF-IDF); `feature_scores()` searches C adaptively
(0.3/1/3, a step along 0.03-30 while the best C sits at an end; NB alpha 0.001-0.3 must pick inside); the folds run side by
side (`_cached_many`, joblib, 5 jobs, one core each) and are cached in `routing_cache/nonlinear` through `_cache_file()`
(46 min cold, ~1.5 min cached). Sender history: `sender_counts()`, `history_term()` (score + w ln((count+beta)/(n+20 beta)),
zero for a sender never met, asserted), `history_runs()`, `choose_history()` (beta and w fold by fold, 0.01-10, the model's
reading and setting held). Lab `SenderHistoryLab` (harness / later posts, w slider: share right by where the post went
against w, table of fixed and broken, tiles). Figure `PiecesPair` (`PiecesFigures.tsx`: two later posts the words route
wrong and pieces route right, with the features that moved them). No register entry settles here.

- **Readings (harness, chosen fold by fold):** for the bar's model, all four readings (pairs + pieces + subject again + quoted
  text) 0.8550 vs the words 0.8328, +2.22 (+1.46, +2.95), on senders met and new senders alike (+2.22 each); pieces alone
  +0.96, pairs +0.81, quotes -0.30 ns. The SVM reading all four 0.8492; SVM vs NB each with its search -0.58 ns. Later new
  threads: NB all four 0.8469, +2.49 vs the bar 0.8219.
- **Pieces help new senders:** +1.66 NB / +2.63 SVM settled; senders met ~0. NOT because of unseen words (new senders with
  no unseen word gain as much, +3.36). The real cause, first: scikit-learn's token pattern drops one-letter words, so "X"
  (the X Window System, 641 earlier posts, 42% comp.windows.x) is never counted; keeping one-letter words gives the SVM +1.08
  settled, about two-thirds of the pieces gain (comp.windows.x 0.821 -> 0.896). Second: word families ("crypt" in 370
  posts, 97% sci.crypt, vs "cryptosystem" in 14).
- **Sender history** (45.4% of harness new threads come from a sender met; 36.5% later): NB + history 0.8722 harness,
  +3.93 vs the bar; weighted to the later mix +1.38; later 0.8560 (+0.91 settled over all four; +3.40 vs the bar). SVM +
  history 0.8739, vs NB +0.18 ns. **Its cost lands on the senders who leave home:** the bar's model on posts to a forum the
  sender never used 0.718 -> 0.588 (-12.99 settled, 177 posts; the SVM 0.712 -> 0.497); later 0.655 -> 0.529. Usual forum
  0.919 -> 0.979.
- **Decision:** the bar becomes complement NB reading all four + the sender's history as its own term (alpha 0.01, beta 1,
  w 1): 0.872 harness, 0.856 later. Guards: posts to a forum new to their sender join page 12's named groups; the history
  counts only placements a person confirmed. Next: page 19 `pretrained-embeddings` (settles H4).

**Page 19 of 27 — 2026-10-05.** *Pretrained embeddings: a model that has read other text*, at
`/pretrained-embeddings`. New sections `pretrained` (outPretrained), `nearest` (outNearest; writes `nearest.json`) and
`embedding_reach` (outReach). New machinery: `embed_view(key)` (the AUDITED view encoded once on the GPU, cached as
`routing_cache/<key>_audited.npz` with each post's token count and a hash of the encoded text, asserted on load; MiniLM
82 s, bge-large 1,264 s), `emb_fit` / `emb_scores` (logistic regression on the embedding, C 0.3-100, cached per fold),
`emb_alone`, `fuse_choose` (score + v x the embedding model's log-probability; C and v chosen fold by fold with the
model's reading, setting, beta and w held, like `choose_history`), `fusion()` (both models x three stages x two
embeddings), `_gain_gap` (gain on new senders minus gain on senders met, groups resampled separately), `nearest_posts`
/ `later_nearest` (nearest earlier post by TF-IDF cosine and by bge-large). Lab `NearestPostsLab` (six later new
threads from new senders; the five nearest earlier posts by the words or the embedding, with forum and shared words).
**H4 CONFIRMED** in `routingRegister.ts`. bge-small is only partly in the HF cache (not used; would need a download).

- **Nearest post (harness):** same forum, words 69.5% / embedding 79.5% (new senders 61.4% / 74.8%); same sender for
  senders met, words 35.8% / embedding 28.6%. Later: 67.3% / 78.1%.
- **Alone (harness, vs the bar 0.8328):** bge-large 0.8366 (+0.38 ns; senders met -1.83, new +2.22, both settled);
  MiniLM 0.7829 (-4.99). Later: bge-large 0.8227 vs 0.8219.
- **Beside (late fusion; complement NB cannot read negative columns):** NB words +3.20, all four 0.8550 -> 0.8719
  (+1.69), all four + history 0.8722 -> 0.8893 (+1.71); MiniLM +0.40 ns / +0.93. The gains overlap (all four +2.22,
  bge +3.20, together +3.91). SVM same: 0.8901, vs NB +0.08 ns. All of it vs the bar +5.65. Later: all four + bge 0.8662,
  + history + bge 0.8809 (+5.90 vs the bar).
- **H4** (pre-set test: NB all four, bge-large, no history): +1.37 (+0.04, +2.74) confirmed; later +2.37 (+1.05, +3.60);
  every NB stage settled; SVM all four +1.37 (-0.06, +2.80) straddles.
- **By length:** <40 words +2.99, 40-159 +1.79, 160+ +0.69 ns (49.1% of those past 512 tokens).
- **Decision:** the bar = complement NB reading all four + the sender's history + bge-large's logistic regression
  (0.889 harness, 0.881 later), bge-large version pinned. Next: page 20 `choosing-the-model` (NB vs SVM, level).
- **Incident:** a patch script's failed `open(p, "w", newline=...)` truncated routing_cases.py to 0 bytes; restored from
  Claude Code's file history and verified with page 18's regen check. Patch scripts now write via a temp file.

**Page 20 of 27 — 2026-10-05.** *Choosing the model: two finalists, one router*, at `/choosing-the-model`. **Act 5
COMPLETE.** New sections `act5_ladder` (outLadder; writes `ladder.json`) and `choosing` (outChoosing). New machinery:
`ladder_runs()` (every act 5 rung as harness right/wrong, chosen fold by fold), `full_scores(model)` (the full model's
harness scores, picks as `fuse_choose` made them, asserted), `both_choose()` (NB-full + u x SVM-full, u fold by fold,
interior asserted), `fixed_full(model)` (one setting in every fold, as the later fit has), `later_full(model)`. Lab
`LadderLab` (14 rungs as dots with 95% intervals; all / senders met / new senders; the bar's dashed line).

- **Ladder (harness; met / new):** NB words 0.833 (0.875 / 0.798); LR 0.820; SVM 0.822; kernel 0.812; kNN 0.766 (new
  0.720); forest 0.794; boosted 0.786; NB + all four 0.855 (0.897 / 0.820); + history 0.872 (0.935 / 0.820); + bge
  0.889 (0.942 / 0.846); SVM path 0.849 / 0.874 / 0.890; both 0.897. New senders' biggest step = bge-large (+2.6);
  met = the history (+3.8).
- **Finalists:** harness NB 0.8893 vs SVM 0.8901 (+0.08 ns), 94.3% alike (split 225: NB 92, SVM 95); gap AUROC 0.863 /
  0.869 (+0.005 ns); no forum below 0.75 for either. talk.religion.misc SVM +6.45 settled (0.774 vs 0.710, 62 posts);
  forum new to sender NB better, SVM -6.21 settled (0.684 vs 0.621, 177). Later: NB 0.8809, SVM 0.8765 (-0.44 ns).
- **Both together:** harness +0.81 (+0.35, +1.24), u = 1 in every fold, gain in all 5 folds; one setting per fold
  +0.58; **later +0.00 (-0.52, +0.52), never above +0.20 at any u.** Not kept.
- **Cost (one run, this PC, prose only):** vectorise all four 45 s; NB fit 3.6 s; SVM (C 10) 133 s; LR on bge 1-3 s;
  scoring 2,527 posts < 0.25 s; bge-large encode ~15 posts/s.
- **Decision:** the router = complement NB reading all four + the sender's history + bge-large (0.889 harness / 0.881
  later); talk.religion.misc joins the named groups beside "posts to a forum new to their sender". Act 6 next:
  page 21 `reading-the-errors` (settles H5). Page 1's "Where we end up" is re-measured at the end of act 6.

**Page 21 of 27 — 2026-10-05.** *Reading the errors: where the router's mistakes land*, at `/reading-the-errors`. **Act 6
starts.** New sections `misroutes` (outMisroutes; writes `misroutes.json`), `near_misses` (outNearMisses) and `read_errors`
(outReadErrors; writes `misread.json`). New machinery: `family_of()` (H5's families as the register wrote them; misc.forsale
in none), `router_sets()` (the final router's harness scores from `full_scores("nb")` and later scores from `later_full("nb")`,
with each post's forum, prediction, family hit, rank of the right forum, top-two gap and page 18's sender group), `_rank()`,
`READ_LABELS` / `READ_SALE` / `READ_NAMES` (forty harness misroutes drawn at seed 21, labelled by hand before counting; the
draw is asserted) and `_mask_read()` (emails incl. `%` addresses, US phone numbers, listed names). Lab `MisrouteLab` (`only=
"land"`: family x family matrix of misroutes or one forum's destinations, harness / later; `only="read"`: the forty, filter by
label, one card at a time). **H5 NOT SETTLED** in `routingRegister.ts`.

- **Where (harness / later):** 439 / 301 misrouted; in their own family 0.519 (0.474-0.567) / 0.591 (0.533-0.646); at random
  0.159 / 0.153; right family 0.947 / 0.951. By family (harness): comp 0.742 in family, religion 0.786, sci 0.076 (sci.electronics
  -> PC hardware 18), rec 0.390. misc.forsale on either side of 113 misroutes (all off-family by definition); the other 326 stay
  0.699. Later: all 14 talk.politics.misc -> guns name Waco/Koresh/Davidians/BATF (page 24 material).
- **How near:** right forum second 0.661 / 0.674, top three 0.836 / 0.837, top five 0.941; over all new threads top three 0.982 /
  0.981. Gap does NOT tell near misses: median 0.58 in family vs 0.62 out (right 3.27); AUROC 0.869 vs 0.858, +0.011 (-0.025,
  +0.046). Senders posting to a forum they never had: 56 of 177 misrouted, 41 to the sender's usual forum.
- **Forty read by hand:** fits both 21 (10 sale/wanted ads), router missed 9 (7 with the right forum second, median gap 0.45; 3 the
  history's pull), router's forum better 2, too little / no forum 7, cleaning cut the words 1 (post 9016: the tail rule cut the
  whole question; the router saw "Hi,"). 19 of 40 in family.
- **Decision:** the metric stays strict (the sender's forum is the truth; hand labels stay beside the number); the hand-off shows
  the router's top three forums in order. Next: page 22 `automate-or-hand-off` (settles H6). Not done here: page 2's "misroutes
  weighted by replies" for the final router, and the orphan first replies (page 2 note); page 22 can use both.

**Page 22 of 27 — 2026-10-05.** *Automate or hand off: a promise that has to hold next month*, at `/automate-or-hand-off`.
New sections `automate` (outAutomate) and `latest_posts` (outLatest; writes `automation.json`). New machinery: `final_setting()`
(the router's one setting as later_full fits it, asserted: all four, alpha 0.01, beta 1, w 1, C 3, v 0.3), `router_fits(parts)`
(the router at that setting fitted on any training part, scoring earlier or later posts; side by side and cached; reproduces
later_full exactly), `sender_folds()` / `sender_scores()`, `time_scores(frac)` (page 11's time holdouts), `fold_models_later()`,
`gap_threshold()` (smallest gap where the surest posts stay at the target, optionally weighted), `auto_thresholds()`,
`_largest_block()`. Lab `AutomationDialLab` (threshold slider on the gap; right-among-filed and share-filed curves for the
harness, folds by sender, the latest quarter and the later posts; snaps to each test's threshold; tiles for the later posts).
**H6 WRONG** in `routingRegister.ts`. Compute: each batch of five router fits ~80 s cold (CPU), cached after.

- **Threshold for 95% (later delivery, 95% interval):** harness (thread folds, one setting) 0.831 -> files 0.836, right 0.9389
  (0.9283-0.9489), settled short. Folds grouped by sender 0.788 -> 0.841, 0.9388 (0.9284-0.9488): **H6 wrong**. Harness
  reweighted to 36.5% met 0.940 -> 0.9418 (0.9313-0.9519). Hindsight on the later posts: 1.218, files 0.768.
- **Not the senders:** at the harness threshold later met 0.9409 / new 0.9376. Sender folds route 0.8903 (harness 0.8926): met
  senders' posts drop 0.943 -> 0.903, others rise 0.851 -> 0.879 (thread leak, page 11); they cancel. Sender+thread folds can't be
  built: one block holds 7,888 of 11,314 earlier posts (69.7%). **Not the refit:** the five fold models deliver 0.9352-0.9412.
- **Time:** each forum's latest 20/25/33% at the harness threshold: 0.9413 / 0.9462 / 0.9375; own thresholds 1.069 / 1.036 /
  1.046 -> later 0.9447 / 0.9439 / 0.9443 (intervals reach 95%).
- **Hand-off (later, latest quarter vs harness):** filed 2,013 (0.797) vs 2,112; wrong 113 vs 129; replies following them 114 vs
  114; handed off 514 vs 415, right forum in the top three 0.926 vs 0.918. Monthly check of n filed posts: +-4.3 (100), +-2.5
  (300), +-1.4 (1000) points.
- **Decision:** threshold set on each forum's latest quarter (1.036), refitted with the router; a person reads a random sample of
  filed posts each month. Next: page 23 `the-label-budget` (E1), then page 24 `when-the-world-changes` (H7).
- Browser pane stopped drawing during verification (screenshots black / "not on screen"); the lab was verified by DOM
  measurement (no overflow 320-1320, paths valid, tiles match the output).

**Page 23 of 27 — 2026-10-10.** *The label budget: what a new forum needs before the router can file it*, at
`/the-label-budget`. Measures **E1** (an estimate; `ESTIMATES` gained `measured`, the register links it, and the page shows it in
the new `Measured` box in `PredictionRegister.tsx`). New sections `label_budget` (outBudget) and `budget_weighted` (outWeighted;
writes `labelbudget.json`). New machinery: `budget_counts()` (the router's count blocks vectorised once over all earlier posts and
the later new threads), `budget_nb(i, st, w)` (a refit keeps the columns its posts contain: bit-identical to `_bf_fit` on a subset
and to `later_readings` on all posts, asserted), `_cut` / `budget_keep` (a forum's first, latest or random n; k = -1 cuts every
forum), `budget_weights` (the new forum's posts weighted to an average forum's pull), `budget_fits` (3 single-process workers, 2
BLAS threads each, cached per fit in `routing_cache/nonlinear`), `budget_runs`, `budget_every`, `router_threshold()` (page 22's
1.036). Lab `LabelBudgetLab` (forum select or all pooled; textbook / unweighted / weighted curves; budget chips; tiles at the
threshold). Compute: a fit ~5 s naive Bayes + ~3 s embedding LR; 140 fits ~12 min on 3 workers; three sets + 8 extra fits run
(first, latest, latest weighted, every forum cut); everything cached, the two sections run in ~55 s.

- **Textbook curve (every forum cut to its latest n):** 5 0.525, 10 0.649, 20 0.748, 40 0.755, 80 0.808, 160 0.846, 320 0.872,
  all 0.881.
- **One new forum among old ones (each forum in turn keeps its latest n; every later new thread read off its own forum's run):**
  5 0.0044, 10 0.0099, 20 0.0503, 40 0.1761, 80 0.3712 (0.3526-0.3902), 160 0.5908, 320 0.7641. First n instead of latest: 0.3558
  at 80 (time is not it; volume is). Misroutes go to its own family 63.6% (at 80). New threads among the latest n: 1.6 / 3.2 /
  6.5 / 13.8 / 27.4 / 55.4 / 109.2.
- **Weighted** ((other posts / 19) / n, in both the naive Bayes counts and the embedding LR): 5 0.2624, 10 0.3949, 20 0.5576,
  40 0.6450, 80 0.7372 (0.7206-0.7543), 160 0.8041, 320 0.8516. Words alone 0.2374 -> 0.6981 at 80. The history barely matters (router
  vs no history within 1.3 pts at every budget, probe only).
- **At the threshold (1.036):** unweighted 5 posts: filed right 0.002, wrong 0.362, promise across all posts 0.9242. Weighted 80:
  filed right 0.566, wrong 0.081, others filed into it 2.4 per forum (established forum 5.7), promise 0.9425 (all full 0.9439).
  The new forum's own filed threads right 0.875 / 0.912 / 0.936 at 80 / 160 / 320 (established 0.944).
- **Labels multiplied:** comp.os.ms-windows.misc's latest 40 hold 14 encoded-file posts (12,817 lines): weighted, routed right
  0.447 at 20 -> 0.076 at 40.
- **E1 answer:** about 80 labelled posts (~27 hand-filed new threads) weighted to an average forum's pull: 73.7% routed right,
  56.6% filed right, promise 94.25%. Unweighted 37.1% at 80 and 76.4% at 320; the learning curve would have said 20.
- **Decision:** weight a new forum's posts to an average forum's pull and refit after a person reads each batch. The n = 0 case
  (a forum with no posts) is left to page 24 (H7); n = 5 unweighted already files 36% of its threads wrong. Next: page 24
  `when-the-world-changes` (H7 + the Waco drift).

**Page 24 of 27 — 2026-10-10.** *When the world changes: a forum it has never seen, a subject that moves*, at
`/when-the-world-changes`. **Act 6 complete.** New sections `left_out` (outLeftOut; writes `leftout.json`) and `drift`
(outDrift). **H7 WRONG** in `routingRegister.ts`. New machinery: `budget_nb` / `_budget_work` now return one column per forum
(-inf for a forum with no posts), so `budget_fits` with n = 0 refits on nineteen forums (the n >= 5 caches are unchanged);
`left_out_runs()`, `router_threshold()` reused; `router_fits_later(parts)` (the router fitted on earlier + later posts; with no
later posts it hits router_fits' own cache, asserted equal); `later_article_numbers()`, `later_halves()` (each forum's later
posts split at the median article number). Lab `LeftOutLab` (left-out forum select or all pooled; share filed at each
threshold on a log axis, left-out vs everyone else, with the router's threshold and the one-in-ten threshold; where its
threads went; hold-its-family toggle). Compute: 20 left-out refits ~3 min (3 workers); two drift refits ~2 min; cached.

- **H7:** a left-out forum's later new threads filed without a person 0.3696 (0.3518-0.3870) -> wrong (claim < 0.1). 75.4% of
  the filed land in its own family; hockey 94.6% filed (123 to baseball), talk.religion.misc 76.3%, baseball 75.3%; sci.med
  9.5%, sci.electronics 14.9%, sci.crypt 15.9%. Median gap left-out 0.699 vs others 2.823. Other forums in those runs: filed
  0.805, right among filed 0.9460.
- **Novelty signals (AUROC, mean of 20 runs):** gap 0.781, nearest earlier post (bge) 0.711, embedding top probability 0.757.
  A threshold that files only 10% of the stranger's threads: 2.801 -> files 50.3% of the others (80.5% at 1.036).
- **Family hold** (hand a person every thread routed into the new forum's family; misc.forsale has none): catches 75.4% of the
  stranger's filed threads, costs 15.7% of the other forums' filed threads (19 runs with a family); with it, 0.0910
  (0.0799-0.1025) still filed without a person, 125 of 230 being misc.forsale. The hold is where page 23's labels come from.
- **Waco drift:** posts naming Waco/Koresh/Davidians/BATF earlier 251 (guns 141, politics.misc 6), later first half 152
  (79 / 45), second half 167 (77 / 57). Later new threads: politics.misc naming Waco 23, right 0.348, 14 to guns, 10 of those
  filed (gaps to 6.35); guns' Waco threads all right. politics.misc harness 0.836 -> later 0.608. Refit with the later first
  half (3,770 posts), scored on the second half's 1,261 new threads: grow +0.24 (-0.63, +1.11), slide (same size, oldest
  dropped) -0.16 (-1.27, +0.87); politics.misc Waco threads to guns 10 of 18 either way. A subject in two forums, not a
  mapping a refit can relearn; only the per-forum view (page 12) sees it.
- **Decision:** when a forum opens, hold its family for a person, collect its first posts there, refit weighted at ~80
  (page 23), release the hold. Page 1's "Where we end up" keeps the planning model's numbers (pages 5 and 22 cite them) and
  adds the final router: 0.881 later, 80% filed at 94.4%, top three 92.6%. Next: act 7, page 25 `takeaways`; pages 26-27
  need the transfer datasets (ask before downloading).

**Page 25 of 27 — 2026-10-10.** *Verdict, playbook & notebook*, at `/learn/message-routing-capstone/takeaways`.
Section 51 `system` (writes `system.json`; regen block `outSystem`): the whole system on all 7,532 later posts.

- **Paths:** replies to a known thread go by lookup (earlier posts' forum, or wherever the thread's opener was placed); the
  router reads the 2,527 new threads + the first reply (earliest by article number) of each of the 539 threads whose opener
  is missing, files at gap >= 1.036, else a person (counted right); every other reply follows its thread.
  `later_all_scores()` = `router_fits_later` on every later post (new-thread rows asserted equal to `router_sets`).
- **Result:** 6,929 placed without a person (0.920), right 0.9495 (0.9328-0.9627, threads resampled); a person reads 603
  (514 new + 89 first replies); all posts right with the person's counted right 0.9535. The 350 wrong = 133 router misfiles
  + 149 replies that followed them + 68 replies in two-forum threads. The router alone on every later post 0.8979; on the
  lookup's replies 0.9077 vs the lookup 0.9514. Orphan first replies (page 2's open item, now measured): right 0.8961,
  filed 0.835 at 0.9556. Trade-off: file everything 697 wrong (272 followers); first 603 reads remove 347 (0.58 each), next
  523 remove 175 (0.33), the last 1,940 remove 94; a person reading all 3,066 leaves the lookup's 81.
- **Register:** `result` lines on every entry + `Scorecard` (PredictionRegister.tsx) scoring the reader's bets.
- **Playbook renumbered 1-24:** pages 5-24 had skipped #4; rule n now sits on page n+1. Rule 24: report what the whole
  system delivers on all of its traffic.
- **Notebook:** `public/capstone/message-routing-capstone.ipynb`, built from `scripts/routing_notebook.py` by
  `scripts/py_to_ipynb.py`; standalone (no routing_cases import), fast refits by column subsetting. Run here end to end
  (cached embedding, 612 s) it reproduced exactly: lookup 0.9818 / 4,466 / 3,066; random 0.9252 (0.9213-0.9280); 0.8239 /
  0.8235; audited 0.8168; harness 0.8250 / weighted 0.8181 (random 5-fold 0.8795 all posts); router 0.8809; threshold
  1.036, filed 0.797 at 0.9439, top three 0.926; system 0.920 at 0.9495; H7 0.3696 / hold 0.0910; E1 0.3712 / 0.7372.
  View hash a99e79bb3efe. Page 1 now promises a notebook that "rebuilds the router from the raw posts" (not every number).
- **Lab:** `WholeSystemLab` (stacked bar of every post's fate + wrong placements by cause against posts a person reads;
  grid 0 + GAP_GRID + the router's threshold + never). Next: pages 26-27 need the transfer datasets (ask before
  downloading); then siteMap CAPSTONES.

**Pages 26-27 of 27 — 2026-10-10.** *Transfer test I (near)* and *Transfer test II (far)*. The user OK'd both downloads
(UCI; unpacked under `~/scikit_learn_data/transfer/sms` and `.../reuters`). Sections 52 `sms`, 53 `sms_filter` (writes
`sms.json`; bge-large on the SMS texts cached in routing_cache/transfer, ~4 min on the GPU), 54 `reuters`, 55 `reuters_tags`
(writes `reuters.json`); all four registered in routing_regen.py. Each page: a data card, the job, "your turn first" (the
Playbook rules as questions), two PredictPrompts, a lab, a "what carried over" list by rule number, DecisionPoint,
Callout, Followup, SigRule.

- **Near (SMS Spam Collection v.1):** 5,574 messages, 747 spam. Classes from different collections (spam: UK complaints
  forum + an earlier corpus; real: mostly NUS Singapore students). **The collectors' placeholders** (`&lt;#&gt;` etc.) sit in
  236 real messages and 0 spam: numbers/links/times were removed from the real class only, so `gt`/`lt` are top real-message
  words and a five-digit run is in 3 real vs 585 spam. Five folds, copies grouped (403 exact repeats; grouping costs <= 0.8).
  At 1 real message in 200 to the folder: words 0.936, pieces 0.969, bge-large LR 0.940 spam caught. **Stress test** (add to
  every real message a phone number 07700 900123 / www.bbc.co.uk/news / a pound sum): pieces send 57.7% / 71.4% / 0.8% of
  them to the folder; words 0.6% / 82.3% / 0.2%; bge-large 20.9% / 10.7% / 13.4%. Scrubbing both classes the same way:
  pieces 0.959 caught, 10.6% / 11.7% / 3.1%. Baseline rule (5+ digits) 0.783 at 3 real. Lab `SpamFolderLab` (budget dial on
  round "1 in N" values incl. 1 in 200). Rule 25: check every class was collected and cleaned the same way.
- **Far (Reuters-21578, ModApte):** 7,770 / 3,019 stories split by date (to 7 Apr / from 8 Apr 1987), 90 topics (earn 2,877
  ... seven topics with 1; median 18), 85.6% of test stories single-topic, 280 test stories an indexer gave no topic. One
  LinearSVC per topic: micro 0.858 / macro 0.396 as fitted (25 smallest topics 0.020; 35 topics never right); balanced
  0.866 / 0.471; per-topic thresholds from training folds 0.870 / 0.568 (74 of 90 below 0); the name rule 0.304 / 0.355 but
  0.275 on the 25 smallest; model or rule chosen per topic on the folds 0.8825 / 0.613 (rule for 21 topics). Random split
  overstates (micro 0.881-0.893, macro 0.453-0.492). 82 of the 280 no-topic stories get a tag (training stories all carry a
  topic). Lab `TopicTailLab` (90 dots, F1 vs training stories; platinum: model 0.00, rule 1.00). Rule 26: give every label its
  own decision.
- **Wrap-up:** takeaways lists 26 rules (rules 25-26 link forward); page 1 no longer says "no answers given"; the capstone is
  in siteMap CAPSTONES (card figure `RoutingWaffle` from system.json: 56% lookup, 31% router, 8% person, 5% wrong; metric
  "new threads routed right" 0.824 -> 0.881).
