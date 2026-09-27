# Message-routing capstone — plan

> Status: **planned 2026-09-27, being built one page per "continue".**
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
26. `transfer-near` · 27. `transfer-far` — two fresh text datasets, questions without answers.
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
