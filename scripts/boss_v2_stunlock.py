"""The v2 build that broke, and how the agent broke it.

    python scripts/boss_v2_stunlock.py

The first version of the v2 world set POISE_HIT2 = 50 against B_POISE_MAX = 50. One heavy attack
therefore broke the boss's poise from full, every time. A poise break is 60 frames of stagger, and
every hit landed during a stagger does RIPOSTE_MULT = 3x damage. So the loop was:

    heavy -> break -> 60 free frames -> riposte, riposte -> poise refills -> heavy -> break

The DQN trained against that world found it and won 198 of 200 duels without defending at all. The
point of keeping this script is that "the agent found a stunlock" is a claim, and a claim wants a
number. Both builds are reproducible because poise is a constructor argument, so this runs the old
one and the new one side by side.

Everything here is measured, including the prose at the bottom.
"""
import pathlib
import sys

import torch

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "results" / "boss_v2"
sys.path.insert(0, str(ROOT / "scripts"))

import importlib.util  # noqa: E402

# Nothing from the live world is imported here, deliberately. This script describes ONE repair to
# ONE superseded build, so every arm in it -- world, nets and scripted control alike -- comes from
# the frozen snapshot below. The live trainer used to be loaded here for its scripted player; see
# the note on `control`.

# The two nets below were trained against the v2 build that existed BEFORE the lunge, whose
# observation was 32 floats. The live world is wider now, so they cannot load against it and this
# script loads the frozen snapshot instead. The alternative was to let a published 198/200 become
# a number nobody can re-run.
_a = importlib.util.spec_from_file_location("_b1", ROOT / "scripts" / "archive" / "boss_v2_build1.py")
B1 = importlib.util.module_from_spec(_a)
_a.loader.exec_module(B1)

G = {k: getattr(B1, k) for k in dir(B1) if not k.startswith("__")}
# "fixed" here means the fixed version OF THAT BUILD (pool 70 / heavy 36), not the live
# world, which has moved on again. This script is about one specific repair.
NEW = dict(poise_max=70.0, poise_hit=25.0, poise_hit2=36.0, poise_regen=0.08)
# All four, not two. The light hit and the regen rate have changed since the broken build as
# well, so pinning only the pool and the heavy would quietly reproduce a third world that
# never existed and publish its numbers as history.
OLD = dict(poise_max=50.0, poise_hit=25.0, poise_hit2=50.0, poise_regen=0.08)


def _load_archived(tag, device):
    """Load a net against the ARCHIVED build, whose observation width it was trained for."""
    import torch.nn as nn
    n_obs, n_act = G["N_OBS"], G["N_ACTIONS"]
    net = nn.Sequential(nn.Linear(n_obs, 256), nn.ReLU(),
                        nn.Linear(256, 256), nn.ReLU(), nn.Linear(256, n_act)).to(device)
    sd = torch.load(OUT / (tag + ".pt"), map_location=device)
    net.load_state_dict({k.replace("f.", ""): v for k, v in sd.items()})
    net.eval()

    def pol(env):
        with torch.no_grad():
            q = net(torch.as_tensor(env.obs(), dtype=torch.float32, device=device).unsqueeze(0))
            return int(q.argmax(1).item())
    return pol


def head(s):
    print("\n" + s)
    print("-" * len(s))


def line(name, r):
    tot = max(r["dmg_dealt"], 1e-9)
    return ("  %-21s %4d %4d %6.1fs %7.1f %6.1f%% %7.2f %7.2f %7.2f %6.2f %6.1f%%"
            % (name, r["win"], r["die"], r["frames"] / 30.0, r["dmg_dealt"],
               100.0 * r["riposte_dmg"] / tot, r["heavies"], r["poise_breaks"],
               r["parry_presses"], r["rolls"], r["guard_pct"]))


def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    device = torch.device("cpu")

    stun = OUT / "v2_stunlock_s0.pt"
    if not stun.exists():
        raise SystemExit("missing %s -- the superseded net is the whole point of this script" % stun)
    old_net = _load_archived("v2_stunlock_s0", device)

    # The control has to come out of the ARCHIVE as well. It used to be taken from the live
    # trainer, which meant a CURRENT policy -- current helper functions, current PARRY_WIN --
    # driving a frozen world, so every later change to the live build silently moved a number
    # published as history. Widening the parry window from 3 frames to 6 walked this arm from
    # 136/200 to 118/200 without anyone touching the build it is supposed to describe. A control
    # that moves when the thing it is controlling for does not is not a control.
    control = dict(G["PLAYERS"])["patient parry"]
    arms = [("exploiter, broken", old_net, OLD),
            ("exploiter, fixed", old_net, NEW),
            ("patient parry, broken", control, OLD),
            ("patient parry, fixed", control, NEW)]

    fixed = OUT / "v2_dqn_2000k_s0.pt"
    if fixed.exists():
        new_net = _load_archived("v2_dqn_2000k_s0", device)
        arms.insert(2, ("retrained, fixed", new_net, NEW))

    head("one heavy attack against a 50-point poise pool, %d duels each" % n)
    print("  broken build: poise pool %.0f, heavy worth %.0f -- one heavy always breaks from full"
          % (OLD["poise_max"], OLD["poise_hit2"]))
    print("  fixed build:  poise pool %.0f, heavy worth %.0f -- a break costs two commitments"
          % (NEW["poise_max"], NEW["poise_hit2"]))
    print()
    print("  %-21s %4s %4s %7s %7s %7s %7s %7s %7s %6s %6s"
          % ("arm", "win", "die", "duel", "dmg", "riposte", "heavies", "breaks", "parries",
             "rolls", "guard"))
    rows = []
    for name, pol, kw in arms:
        r = G["score"](pol, n=n, seed0=1000, repeat=3, timeout="truncate", reward="damage", **kw)
        rows.append((name, r, kw))
        print(line(name, r))

    broke = rows[0][1]
    same_fixed = rows[1][1]
    pp_old = next(r for nm, r, kw in rows if nm == "patient parry, broken")
    pp_new = next(r for nm, r, kw in rows if nm == "patient parry, fixed")

    head("what the numbers say")
    print("  In the broken world the trained net won %d/%d in %.1f seconds while pressing parry"
          % (broke["win"], n, broke["frames"] / 30.0))
    print("  %.2f times a duel, rolling %.2f times and guarding %.1f%% of frames. It did not defend."
          % (broke["parry_presses"], broke["rolls"], broke["guard_pct"]))
    print("  %.0f%% of its damage was riposte damage, off %.2f poise breaks a duel."
          % (100.0 * broke["riposte_dmg"] / max(broke["dmg_dealt"], 1e-9), broke["poise_breaks"]))
    print()
    print("  Drop the SAME net into the fixed world and it wins %d/%d instead of %d/%d:"
          % (same_fixed["win"], n, broke["win"], n))
    print("  breaks fall from %.2f to %.2f a duel, and the duel runs %.1fs instead of %.1fs."
          % (broke["poise_breaks"], same_fixed["poise_breaks"],
             same_fixed["frames"] / 30.0, broke["frames"] / 30.0))
    print()
    drop_net = 100.0 * (1 - same_fixed["win"] / max(broke["win"], 1))
    drop_pp = 100.0 * (1 - pp_new["win"] / max(pp_old["win"], 1))
    print("  The scripted patient-parry player is the control, and it is NOT unaffected: %d/%d"
          % (pp_old["win"], n))
    print("  becomes %d/%d, because a poise pool that takes two commitments instead of one makes"
          % (pp_new["win"], n))
    print("  the fight longer for anybody. The fixed world is harder for everyone.")
    print()
    print("  What separates them is how much: the control loses %.0f%% of its wins, the exploiter"
          % drop_pp)
    print("  loses %.0f%%. The %.0f-point difference is the part of its record that was the" % (drop_net, drop_net - drop_pp))
    print("  stunlock and not the policy. Its poise breaks fall %.2f -> %.2f a duel against the"
          % (broke["poise_breaks"], same_fixed["poise_breaks"]))
    print("  control's %.2f -> %.2f, which is the same statement from the mechanism's side."
          % (pp_old["poise_breaks"], pp_new["poise_breaks"]))


if __name__ == "__main__":
    main()
