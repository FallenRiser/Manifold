"""
Real runs behind the k-NN 'In the wild' case-study pages (Chapter 10).
Every number cited on those pages comes from this script. Deterministic:
fixed random_state / seeds throughout, so re-running reproduces the values.

    python scripts/knn_cases.py

Cases:
  A) Handwritten digit recognition  — sklearn load_digits (1797 x 8x8)
  B) Recommendation / collaborative filtering — synthetic ratings, user-based k-NN CF
  C) Similarity search & anomaly detection — digits retrieval precision@k + LOF/kNN-distance ROC-AUC
"""
import numpy as np

# ----------------------------------------------------------------------------- A
def case_a_digits():
    from sklearn.datasets import load_digits
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.neighbors import KNeighborsClassifier
    from sklearn.decomposition import PCA
    from sklearn.pipeline import make_pipeline
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import accuracy_score, confusion_matrix

    X, y = load_digits(return_X_y=True)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25,
                                          random_state=0, stratify=y)
    print("=== Case A: handwritten digits (load_digits) ===")
    print(f"samples={X.shape[0]}  features={X.shape[1]} (8x8)  classes=10")
    print(f"train={Xtr.shape[0]}  test={Xte.shape[0]}")

    # accuracy vs k (raw pixels, euclidean)
    print("acc vs k (raw pixels):")
    for k in [1, 3, 5, 7, 11]:
        clf = KNeighborsClassifier(n_neighbors=k).fit(Xtr, ytr)
        acc = accuracy_score(yte, clf.predict(Xte))
        print(f"  k={k:>2}: {acc:.4f}")

    best = KNeighborsClassifier(n_neighbors=3).fit(Xtr, ytr)
    pred = best.predict(Xte)
    acc3 = accuracy_score(yte, pred)

    # most-confused off-diagonal pair
    cm = confusion_matrix(yte, pred)
    cmo = cm.copy(); np.fill_diagonal(cmo, 0)
    i, j = np.unravel_index(np.argmax(cmo), cmo.shape)
    print(f"k=3 test accuracy: {acc3:.4f}")
    print(f"most-confused pair: true {i} -> pred {j}  ({cmo[i, j]} times)")
    print(f"total test errors: {(pred != yte).sum()} of {len(yte)}")

    # PCA(30) + scaling: same/again accuracy, far fewer dims
    pca_knn = make_pipeline(StandardScaler(), PCA(n_components=30, random_state=0),
                            KNeighborsClassifier(n_neighbors=3)).fit(Xtr, ytr)
    acc_pca = accuracy_score(yte, pca_knn.predict(Xte))
    print(f"PCA(30)+scale, k=3 test accuracy: {acc_pca:.4f}")

    # tree vs brute give identical predictions (structure = speed, not accuracy)
    brute = KNeighborsClassifier(n_neighbors=3, algorithm="brute").fit(Xtr, ytr).predict(Xte)
    kdt = KNeighborsClassifier(n_neighbors=3, algorithm="kd_tree").fit(Xtr, ytr).predict(Xte)
    print(f"brute == kd_tree predictions identical: {np.array_equal(brute, kdt)}")
    print()


# ----------------------------------------------------------------------------- B
def case_b_cf():
    print("=== Case B: recommendation / collaborative filtering (synthetic) ===")
    rng = np.random.default_rng(42)
    n_users, n_items, n_latent = 200, 60, 4
    U = rng.normal(size=(n_users, n_latent))          # user tastes
    V = rng.normal(size=(n_items, n_latent))          # item traits
    true_R = 3.0 + 0.9 * (U @ V.T)                    # latent-factor ratings
    true_R += rng.normal(scale=0.4, size=true_R.shape)
    true_R = np.clip(true_R, 1, 5)

    # observe ~25% of entries; hold out a test set of observed entries
    observed = rng.random(true_R.shape) < 0.25
    ui, ii = np.where(observed)
    order = rng.permutation(len(ui))
    n_test = len(ui) // 5
    test_idx, train_idx = order[:n_test], order[n_test:]

    R = np.full(true_R.shape, np.nan)
    R[ui[train_idx], ii[train_idx]] = true_R[ui[train_idx], ii[train_idx]]
    global_mean = np.nanmean(R)
    print(f"users={n_users}  items={n_items}  observed={observed.sum()}  "
          f"test-ratings={n_test}")

    # user-based k-NN CF with cosine similarity on mean-centred rows
    user_mean = np.nanmean(R, axis=1)
    Rc = R - user_mean[:, None]
    Rc0 = np.nan_to_num(Rc)                            # 0 where unobserved
    # cosine similarity between users over co-observed pattern
    norm = np.linalg.norm(Rc0, axis=1)
    sim = (Rc0 @ Rc0.T) / (np.outer(norm, norm) + 1e-9)
    np.fill_diagonal(sim, 0.0)

    def predict(u, it, k=20):
        cand = np.where(~np.isnan(R[:, it]))[0]       # users who rated this item
        if len(cand) == 0:
            return global_mean
        s = sim[u, cand]
        top = cand[np.argsort(s)[::-1][:k]]
        w = sim[u, top]
        if w.sum() <= 0:
            return user_mean[u] if not np.isnan(user_mean[u]) else global_mean
        pred = user_mean[u] + (w * Rc0[top, it]).sum() / (np.abs(w).sum() + 1e-9)
        return np.clip(pred, 1, 5)

    knn_err, base_err = [], []
    for t in test_idx:
        u, it = ui[t], ii[t]
        truth = true_R[u, it]
        knn_err.append((predict(u, it) - truth) ** 2)
        base_err.append((global_mean - truth) ** 2)
    knn_rmse = np.sqrt(np.mean(knn_err))
    base_rmse = np.sqrt(np.mean(base_err))
    print(f"global-mean baseline RMSE: {base_rmse:.4f}")
    print(f"user-based k-NN CF (k=20) RMSE: {knn_rmse:.4f}")
    print(f"improvement over baseline: {100*(1-knn_rmse/base_rmse):.1f}%")
    print()


# ----------------------------------------------------------------------------- C
def case_c_similarity_anomaly():
    from sklearn.datasets import load_digits
    from sklearn.neighbors import NearestNeighbors, LocalOutlierFactor
    from sklearn.metrics import roc_auc_score

    print("=== Case C: similarity search & anomaly detection ===")
    X, y = load_digits(return_X_y=True)

    # (1) similarity search: precision@k = fraction of k nearest sharing the label
    nn = NearestNeighbors(n_neighbors=11).fit(X)      # 1 self + 10 neighbours
    _, idx = nn.kneighbors(X)
    same = (y[idx[:, 1:]] == y[:, None]).mean()       # exclude self (col 0)
    print(f"similarity search precision@10 (digits): {same:.4f}")

    # (2) anomaly detection: inliers = digit '0', anomalies = a few other digits
    rng = np.random.default_rng(0)
    inliers = X[y == 0]
    others = X[y != 0]
    anoms = others[rng.choice(len(others), size=len(inliers) // 10, replace=False)]
    Xmix = np.vstack([inliers, anoms])
    is_anom = np.r_[np.zeros(len(inliers)), np.ones(len(anoms))]

    # score by mean distance to k nearest neighbours (bigger = more anomalous)
    nn2 = NearestNeighbors(n_neighbors=6).fit(Xmix)
    d, _ = nn2.kneighbors(Xmix)
    knn_score = d[:, 1:].mean(axis=1)                 # exclude self
    auc_knn = roc_auc_score(is_anom, knn_score)

    lof = LocalOutlierFactor(n_neighbors=20)
    lof.fit(Xmix)
    lof_score = -lof.negative_outlier_factor_          # higher = more anomalous
    auc_lof = roc_auc_score(is_anom, lof_score)

    print(f"anomaly set: {len(inliers)} inliers (digit 0) + {len(anoms)} anomalies")
    print(f"kNN mean-distance score ROC-AUC: {auc_knn:.4f}")
    print(f"LOF ROC-AUC: {auc_lof:.4f}")
    print()


if __name__ == "__main__":
    case_a_digits()
    case_b_cf()
    case_c_similarity_anomaly()
    print("done.")
