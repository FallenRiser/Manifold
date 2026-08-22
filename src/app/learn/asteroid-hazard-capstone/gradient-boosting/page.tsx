import { CodeBlock } from "@/components/CodeBlock";
import { CodeOutput } from "@/components/CodeOutput";
import { LessonHeader, Callout, PrevNext } from "@/components/lesson";
import { ModelAnatomy } from "@/components/ModelAnatomy";
import { AnalystQuestion, TransferBox, PlaybookRule } from "@/components/capstone/pedagogy";

export const metadata = {
  title: "Gradient boosting — when the stronger model doesn't win — Manifold",
  description:
    "Boosting builds trees sequentially, each correcting the last — often the strongest tabular model there is. Here default HistGradientBoosting scores PR-AUC 0.472, essentially tied with the random forest's 0.478. A stronger model class is a hypothesis to test, not a guarantee to bank; on this three-feature problem it doesn't earn its extra complexity.",
};

const SPACE = "var(--c-space)";

export default function GradientBoostingPage() {
  return (
    <article>
      <LessonHeader
        chips={[{ label: "Capstone", color: SPACE }, { label: "Act 5 · Model, rung by rung", color: "var(--c-metrics)" }]}
        time="about 8 minutes"
        title={<>Gradient boosting — when the stronger model doesn&rsquo;t win</>}
        intro={<>
          Gradient-boosted trees are, on many tabular problems, the strongest model you can reach for — the usual winner
          of this exact climb. So the honest expectation is that boosting tops the forest here. This page is about what to
          do when the reigning champion shows up and <em>doesn&rsquo;t</em>.
        </>}
        titleSize={40}
        introSize={17.5}
      />

      <div className="lesson">
        <AnalystQuestion>
          Does a stronger learner beat the forest on <em>this</em> problem — and if the gain is tiny, is it worth the
          extra complexity and tuning?
        </AnalystQuestion>

        <ModelAnatomy
          accent={SPACE}
          form={<>an additive sequence of shallow trees, each fit to the previous errors</>}
          loss={<>log-loss minimised by gradient steps (histogram-binned for speed)</>}
          optimiser={<>stagewise gradient descent in function space</>}
        />

        <h2>Why boosting usually wins — and might here</h2>
        <p>
          Where a forest builds many trees <em>independently</em> and averages, boosting builds them{" "}
          <strong>sequentially</strong>: each new shallow tree is fit to the part of the target the current ensemble
          still gets wrong. That focus on residual structure is why boosting so often edges out bagging on tabular data.
          A fair test uses a strong, sensible default — scikit-learn&rsquo;s <code>HistGradientBoostingClassifier</code>{" "}
          — on the same locked harness.
        </p>
        <CodeBlock fromScratch={code} />
        <CodeOutput>{`hist gradient boosting (defaults) — grouped split
  ROC-AUC : 0.906
  PR-AUC  : 0.472

the honest scoreboard so far (grouped PR-AUC)
  size rule       0.289
  logistic        0.309
  tuned tree      0.435
  random forest   0.478   <- still the leader
  hist boosting   0.472   <- essentially tied, slightly behind`}</CodeOutput>

        <Callout color={SPACE} title={<>A statistical tie — and why that&rsquo;s the finding</>}>
          Boosting lands at <strong>0.472</strong> versus the forest&rsquo;s <strong>0.478</strong>. That 0.006
          difference is well inside the noise of a single split — the two are, for practical purposes, <em>tied</em>. This
          is not a failure of boosting; it&rsquo;s a fact about the <em>problem</em>. With only three features and most of
          the signal being the blunt size gate, there is little intricate residual structure left for boosting&rsquo;s
          sequential correction to exploit. When the signal is simple, the strongest model has nothing extra to bite on.
        </Callout>

        <h2>The judgement call: would tuning change this?</h2>
        <p>
          A tempting next step is a long hyperparameter search — learning rate, tree count, depth, regularisation — to
          squeeze boosting ahead. Here that would be poor judgement. The forest and boosting have converged on
          essentially the same score from opposite directions, which strongly suggests we are near the{" "}
          <strong>ceiling of what these three features support</strong>, not near a tuning artifact. Spending days to
          maybe gain 0.01 PR-AUC — while the honest gap to the <em>baseline</em> is already the whole story — is effort
          misallocated. The disciplined move is to note the tie, prefer the simpler-to-reason-about model, and put
          remaining energy into interpretation and the operating point, where real decisions still live.
        </p>

        <TransferBox>
          Reach for the strongest model class as a <em>hypothesis</em>, not a foregone conclusion, and always compare it
          on the same harness against the simpler option. When a more complex model only ties a simpler one, that&rsquo;s
          evidence you&rsquo;re near the data&rsquo;s ceiling — keep the model you can defend and tune, and stop spending
          on complexity that isn&rsquo;t paying. Knowing when to <em>stop</em> tuning is as much a skill as tuning.
        </TransferBox>

        <PlaybookRule n={16}>
          Treat a stronger model class as a <strong>hypothesis to test, not a guarantee.</strong> Keep it only if it
          beats the simpler model by more than noise; a mere tie is a signal you&rsquo;ve hit the data&rsquo;s ceiling —
          stop paying for complexity.
        </PlaybookRule>

        <PrevNext
          prev={{ href: "/learn/asteroid-hazard-capstone/random-forest", label: <>← Random forest</> }}
          next={{ href: "/learn/asteroid-hazard-capstone/model-comparison", label: <>Next up · Model comparison →</> }}
        />
      </div>
    </article>
  );
}

const code = `from sklearn.ensemble import HistGradientBoostingClassifier

gb = HistGradientBoostingClassifier(random_state=0).fit(Xtr, ytr)
p = gb.predict_proba(Xte)[:, 1]
print("ROC-AUC:", roc_auc_score(yte, p))
print("PR-AUC :", average_precision_score(yte, p))`;
