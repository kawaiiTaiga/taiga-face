# Compact Axis Analysis

This document decomposes the current compact face coordinate system into measurable geometric effects.

Method:
- Hold one baseline compact vector fixed and sweep one axis at a time.
- Evaluate the pure compact DSL with no blink and no autonomous overlay.
- Recompute the shader eye-boundary equations in JavaScript and measure silhouette metrics from the resulting eye band.

Key metrics:
- `areaApprox`: integrated eye-band area.
- `centerThickness`: band thickness at the center sample.
- `taperRatio`: edge thickness divided by center thickness.
- `lowerDominance`: mean lower closure minus mean upper closure.
- `meanSmileBias`: average shader smile-band activation.
- `intraThicknessAsymmetry`: inner-vs-outer thickness imbalance inside one eye.
- `interEyeThicknessDiff`: left-vs-right thickness difference between eyes.

## Axis Classification

| axis | role |
| --- | --- |
| openness | primary aperture axis |
| squint | tension and compression axis |
| smile | lower-driven narrowing axis with nonlinear extreme regime |
| roundness | secondary width and softness axis |
| slant | directional inner-vs-outer redistribution axis |
| asymmetry | inter-eye balance axis |
| spacing | layout-only axis |
| gaze_x | appearance-only gaze axis |
| gaze_y | appearance-only gaze axis |
| glow | appearance-only emissive axis |
| warmth | appearance-only color axis |

## Key Findings

- Baseline compact state is not in the smile-band regime. Baseline lower dominance is -0.1807 and mean smile bias is 0.
- `openness` is the dominant aperture axis. Around the baseline, d(area)/d(openness) = 2.6124, mostly through upper-lid release (-0.6192) with only weak lower-lid change (-0.035).
- `squint` is a tension axis. It narrows the eye with d(area)/d(squint) = -1.1907, pushes the upper lid strongly (0.2292), pushes the lower lid less (0.07), and reduces width (-0.06).
- `smile` is locally lower-driven, not upper-driven. Around the baseline, d(lowerDominance)/d(smile) = 0.3221, d(lidBottom)/d(smile) = 0.3261, and d(lidTop)/d(smile) = 0.004.
- The smile failure is not a local cross-term problem near the baseline. All measured local pairwise interactions at the baseline are zero, so the instability is dominated by a nonlinear regime change rather than by first-order coupling.
- The nonlinear smile regime starts late. First lower-dominant smile occurs at 0.56, first visible shader smile-band activation occurs at 0.34, and taper exceeds 1.1 at 0.78.
- The steepest smile collapse occurs between smile=0.5 and smile=0.52, where center thickness changes by -0.0822 per dense sweep step. This is the strongest candidate for the awkward grin-to-frown transition.
- Inside the extreme-smile regime at smile=0.88, `openness` is the only clean recovery axis: d(centerThickness)/d(openness) = -0.194. By contrast, d(centerThickness)/d(squint) = -0.2033 and d(centerThickness)/d(roundness) = -0.1452.
- Inside the same regime, `roundness` stops behaving like a harmless softness control. It now increases smile-band activation with d(meanSmileBias)/d(roundness) = 0.1794 and increases taper with d(taperRatio)/d(roundness) = -0.1604.
- `roundness` is underpowered as a silhouette axis. It mostly changes width (-0.22) but only weakly changes area (-0.0784).
- `slant` is mostly a redistribution axis. Near the baseline it barely changes area (0.008) but strongly changes inner-vs-outer imbalance (-0.2731).
- `asymmetry` is not dead. Its average shape metrics stay flat, but its signed inter-eye sensitivity is d(signedInterEyeThickness)/d(asymmetry) = -0.4941. This axis must be judged with signed inter-eye metrics, not single-eye averages.

## Smile Dense Sweep

| smile | area | centerThick | taper | lowerDom | smileBias | interEyeDiff |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 3.7696 | 1.9355 | 1.048 | -0.2192 | 0 | 0 |
| 0.02 | 3.7438 | 1.922 | 1.0483 | -0.2128 | 0 | 0 |
| 0.04 | 3.718 | 1.9084 | 1.0487 | -0.2063 | 0 | 0 |
| 0.06 | 3.6922 | 1.8949 | 1.049 | -0.1999 | 0 | 0 |
| 0.08 | 3.6664 | 1.8813 | 1.0494 | -0.1935 | 0 | 0 |
| 0.1 | 3.6406 | 1.8677 | 1.0497 | -0.1871 | 0 | 0 |
| 0.12 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0 |
| 0.14 | 3.5889 | 1.8406 | 1.0504 | -0.1742 | 0 | 0 |
| 0.16 | 3.5631 | 1.8271 | 1.0508 | -0.1678 | 0 | 0 |
| 0.18 | 3.5373 | 1.8135 | 1.0512 | -0.1614 | 0 | 0 |
| 0.2 | 3.5108 | 1.7996 | 1.0516 | -0.1548 | 0 | 0 |
| 0.22 | 3.483 | 1.7849 | 1.052 | -0.1479 | 0 | 0 |
| 0.24 | 3.4539 | 1.7697 | 1.0525 | -0.1406 | 0 | 0 |
| 0.26 | 3.4236 | 1.7538 | 1.0529 | -0.133 | 0 | 0 |
| 0.28 | 3.3923 | 1.7373 | 1.0534 | -0.1252 | 0 | 0 |
| 0.3 | 3.36 | 1.7204 | 1.054 | -0.1172 | 0 | 0 |
| 0.32 | 3.3129 | 1.6963 | 1.0538 | -0.1089 | 0.0046 | 0 |
| 0.34 | 3.2369 | 1.6585 | 1.0521 | -0.1004 | 0.0188 | 0 |
| 0.36 | 3.1352 | 1.6086 | 1.0489 | -0.0917 | 0.0416 | 0 |
| 0.38 | 3.0115 | 1.5482 | 1.0442 | -0.0829 | 0.0723 | 0 |
| 0.4 | 2.8702 | 1.4795 | 1.0379 | -0.074 | 0.1096 | 0 |
| 0.42 | 2.7158 | 1.4046 | 1.0301 | -0.065 | 0.1523 | 0 |
| 0.44 | 2.5531 | 1.3257 | 1.0207 | -0.0559 | 0.1987 | 0 |
| 0.46 | 2.3872 | 1.2453 | 1.0099 | -0.0468 | 0.2473 | 0 |
| 0.48 | 2.2229 | 1.1657 | 0.9978 | -0.0376 | 0.2965 | 0 |
| 0.5 | 2.056 | 1.0848 | 0.9837 | -0.0279 | 0.3472 | 0 |
| 0.52 | 1.8866 | 1.0026 | 0.9674 | -0.0173 | 0.3993 | 0 |
| 0.54 | 1.7278 | 0.9253 | 0.9498 | -0.006 | 0.4482 | 0 |
| 0.56 | 1.5943 | 0.8602 | 0.9331 | 0.006 | 0.4886 | 0 |
| 0.58 | 1.5015 | 0.8146 | 0.9208 | 0.0185 | 0.5142 | 0 |
| 0.6 | 1.4609 | 0.794 | 0.9168 | 0.0313 | 0.52 | 0 |
| 0.62 | 1.4348 | 0.7803 | 0.9154 | 0.0444 | 0.52 | 0 |
| 0.64 | 1.4085 | 0.7665 | 0.9138 | 0.0575 | 0.52 | 0 |
| 0.66 | 1.3823 | 0.7527 | 0.9123 | 0.0705 | 0.52 | 0 |
| 0.68 | 1.3566 | 0.7392 | 0.9107 | 0.0833 | 0.52 | 0 |
| 0.7 | 1.3315 | 0.726 | 0.909 | 0.0958 | 0.52 | 0 |
| 0.72 | 1.3075 | 0.7134 | 0.9074 | 0.1077 | 0.52 | 0 |
| 0.74 | 1.2848 | 0.7015 | 0.9059 | 0.119 | 0.52 | 0 |
| 0.76 | 1.2491 | 0.62 | 1.007 | 0.1295 | 0.5277 | 0 |
| 0.78 | 1.1905 | 0.5471 | 1.1228 | 0.1391 | 0.5488 | 0 |
| 0.8 | 1.1169 | 0.485 | 1.2478 | 0.1478 | 0.5791 | 0 |
| 0.82 | 1.0339 | 0.4328 | 1.3707 | 0.1556 | 0.6151 | 0 |
| 0.84 | 0.9494 | 0.391 | 1.4279 | 0.1625 | 0.6527 | 0 |
| 0.86 | 0.865 | 0.356 | 1.4215 | 0.1687 | 0.6907 | 0 |
| 0.88 | 0.7819 | 0.3244 | 1.3948 | 0.1748 | 0.7286 | 0 |
| 0.9 | 0.7038 | 0.2961 | 1.3552 | 0.1809 | 0.7648 | 0 |
| 0.92 | 0.6307 | 0.2711 | 1.3001 | 0.187 | 0.7992 | 0 |
| 0.94 | 0.5625 | 0.2493 | 1.2266 | 0.1932 | 0.8318 | 0 |
| 0.96 | 0.4994 | 0.2308 | 1.1321 | 0.1994 | 0.8625 | 0 |
| 0.98 | 0.4416 | 0.216 | 1.015 | 0.2058 | 0.8909 | 0 |
| 1 | 0.3902 | 0.2051 | 0.8783 | 0.2122 | 0.9166 | 0 |

## Extreme Smile Anchor

```json
{
  "vector": {
    "openness": 0.65,
    "squint": 0.12,
    "smile": 0.88,
    "roundness": 0.22,
    "slant": 0,
    "asymmetry": 0,
    "spacing": 0.46,
    "gaze_x": 0,
    "gaze_y": -0.02,
    "glow": 1,
    "warmth": 0.3
  },
  "metrics": {
    "areaApprox": 0.7819,
    "meanThickness": 0.4108,
    "centerThickness": 0.3244,
    "edgeThickness": 0.4525,
    "taperRatio": 1.3948,
    "lowerDominance": 0.1748,
    "meanSmileBias": 0.7286,
    "meanCenterline": 0.0823,
    "intraThicknessAsymmetry": 0.0229,
    "interEyeAreaDiff": 0,
    "interEyeThicknessDiff": 0,
    "interEyeCenterlineDiff": 0,
    "interEyeLowerDominanceDiff": 0,
    "signedInterEyeArea": 0,
    "signedInterEyeThickness": 0,
    "signedInterEyeCenterline": 0,
    "signedInterEyeLowerDominance": 0
  },
  "sensitivities": {
    "openness": {
      "areaApprox": {
        "metric": -0.283,
        "lowLevel": {
          "leftLidTop": -0.6192,
          "leftLidBottom": -0.035,
          "leftWidth": 0.015
        }
      },
      "centerThickness": {
        "metric": -0.194,
        "lowLevel": {
          "leftLidTop": -0.6192,
          "leftLidBottom": -0.035,
          "leftWidth": 0.015
        }
      },
      "taperRatio": {
        "metric": 0.442,
        "lowLevel": {
          "leftLidTop": -0.6192,
          "leftLidBottom": -0.035,
          "leftWidth": 0.015
        }
      },
      "lowerDominance": {
        "metric": 0.5842,
        "lowLevel": {
          "leftLidTop": -0.6192,
          "leftLidBottom": -0.035,
          "leftWidth": 0.015
        }
      },
      "meanSmileBias": {
        "metric": 0.4996,
        "lowLevel": {
          "leftLidTop": -0.6192,
          "leftLidBottom": -0.035,
          "leftWidth": 0.015
        }
      }
    },
    "squint": {
      "areaApprox": {
        "metric": -0.6373,
        "lowLevel": {
          "leftLidTop": 0.2292,
          "leftLidBottom": 0.07,
          "leftWidth": -0.06
        }
      },
      "centerThickness": {
        "metric": -0.2033,
        "lowLevel": {
          "leftLidTop": 0.2292,
          "leftLidBottom": 0.07,
          "leftWidth": -0.06
        }
      },
      "taperRatio": {
        "metric": -0.4683,
        "lowLevel": {
          "leftLidTop": 0.2292,
          "leftLidBottom": 0.07,
          "leftWidth": -0.06
        }
      },
      "lowerDominance": {
        "metric": -0.1592,
        "lowLevel": {
          "leftLidTop": 0.2292,
          "leftLidBottom": 0.07,
          "leftWidth": -0.06
        }
      },
      "meanSmileBias": {
        "metric": 0.157,
        "lowLevel": {
          "leftLidTop": 0.2292,
          "leftLidBottom": 0.07,
          "leftWidth": -0.06
        }
      }
    },
    "roundness": {
      "areaApprox": {
        "metric": -0.3915,
        "lowLevel": {
          "leftLidTop": 0.0017,
          "leftLidBottom": 0.0302,
          "leftWidth": -0.16
        }
      },
      "centerThickness": {
        "metric": -0.1452,
        "lowLevel": {
          "leftLidTop": 0.0017,
          "leftLidBottom": 0.0302,
          "leftWidth": -0.16
        }
      },
      "taperRatio": {
        "metric": -0.1604,
        "lowLevel": {
          "leftLidTop": 0.0017,
          "leftLidBottom": 0.0302,
          "leftWidth": -0.16
        }
      },
      "lowerDominance": {
        "metric": 0.0285,
        "lowLevel": {
          "leftLidTop": 0.0017,
          "leftLidBottom": 0.0302,
          "leftWidth": -0.16
        }
      },
      "meanSmileBias": {
        "metric": 0.1794,
        "lowLevel": {
          "leftLidTop": 0.0017,
          "leftLidBottom": 0.0302,
          "leftWidth": -0.16
        }
      }
    }
  }
}
```

## Baseline

```json
{
  "vector": {
    "openness": 0.65,
    "squint": 0.12,
    "smile": 0.12,
    "roundness": 0.22,
    "slant": 0,
    "asymmetry": 0,
    "spacing": 0.46,
    "gaze_x": 0,
    "gaze_y": -0.02,
    "glow": 1,
    "warmth": 0.3
  },
  "metrics": {
    "areaApprox": 3.6147,
    "meanThickness": 1.899,
    "centerThickness": 1.8542,
    "edgeThickness": 1.947,
    "taperRatio": 1.0501,
    "lowerDominance": -0.1807,
    "meanSmileBias": 0,
    "meanCenterline": -0.1778,
    "intraThicknessAsymmetry": 0.1421,
    "interEyeAreaDiff": 0,
    "interEyeThicknessDiff": 0,
    "interEyeCenterlineDiff": 0,
    "interEyeLowerDominanceDiff": 0,
    "signedInterEyeArea": 0,
    "signedInterEyeThickness": 0,
    "signedInterEyeCenterline": 0,
    "signedInterEyeLowerDominance": 0
  },
  "lowLevel": {
    "left": {
      "lidTop": 0.2447,
      "lidBottom": 0.064,
      "upperInner": 0.288,
      "upperOuter": 0.2014,
      "lowerInner": 0.0618,
      "lowerOuter": 0.0663,
      "tilt": 0,
      "width": 0.9542
    },
    "right": {
      "lidTop": 0.2447,
      "lidBottom": 0.064,
      "upperInner": 0.288,
      "upperOuter": 0.2014,
      "lowerInner": 0.0618,
      "lowerOuter": 0.0663,
      "tilt": 0,
      "width": 0.9542
    },
    "spacing": 0.46,
    "gaze": [
      0,
      -0.02
    ],
    "glow": 1,
    "warmth": 0.3
  }
}
```

## Axis Sweeps

### openness

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.15 | 2.3085 | 1.168 | 1.0795 | -0.4728 | 0 | 0.3163 | 0 |
| 0.35 | 2.831 | 1.4425 | 1.0644 | -0.3559 | 0 | 0.2466 | 0 |
| 0.55 | 3.3535 | 1.7169 | 1.0541 | -0.2391 | 0 | 0.1769 | 0 |
| 0.75 | 3.876 | 1.9914 | 1.0466 | -0.1222 | 0 | 0.1072 | 0 |
| 0.95 | 4.3985 | 2.2659 | 1.041 | -0.0054 | 0 | 0.0375 | 0 |

### squint

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 3.7576 | 1.9292 | 1.0481 | -0.1615 | 0 | 0.1127 | 0 |
| 0.15 | 3.579 | 1.8354 | 1.0506 | -0.1854 | 0 | 0.1494 | 0 |
| 0.35 | 3.3409 | 1.7103 | 1.0543 | -0.2173 | 0 | 0.1984 | 0 |
| 0.55 | 3.1028 | 1.5852 | 1.0586 | -0.2491 | 0 | 0.2473 | 0 |
| 0.75 | 2.8646 | 1.4601 | 1.0636 | -0.281 | 0 | 0.2963 | 0 |

### smile

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 3.7696 | 1.9355 | 1.048 | -0.2192 | 0 | 0.1498 | 0 |
| 0.2 | 3.5108 | 1.7996 | 1.0516 | -0.1548 | 0 | 0.1369 | 0 |
| 0.4 | 2.8702 | 1.4795 | 1.0379 | -0.074 | 0.1096 | 0.0906 | 0 |
| 0.7 | 1.3315 | 0.726 | 0.909 | 0.0958 | 0.52 | 0.0126 | 0 |
| 0.95 | 0.5303 | 0.2396 | 1.1821 | 0.1963 | 0.8474 | 0.0211 | 0 |

### roundness

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 3.632 | 1.8632 | 1.0498 | -0.1851 | 0 | 0.1436 | 0 |
| 0.2 | 3.6163 | 1.855 | 1.0501 | -0.1811 | 0 | 0.1422 | 0 |
| 0.4 | 3.6006 | 1.8468 | 1.0503 | -0.1771 | 0 | 0.1409 | 0 |
| 0.7 | 3.5771 | 1.8344 | 1.0506 | -0.1711 | 0 | 0.1388 | 0 |
| 1 | 3.5536 | 1.822 | 1.051 | -0.1651 | 0 | 0.1368 | 0 |

### slant

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| -1 | 3.159 | 1.6148 | 1.0575 | -0.2947 | 0 | 0.4221 | 0 |
| -0.5 | 3.3869 | 1.7345 | 1.0535 | -0.2377 | 0 | 0.2821 | 0 |
| 0 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.5 | 3.3949 | 1.7387 | 1.0534 | -0.2357 | 0 | 0.009 | 0 |
| 1 | 3.175 | 1.6232 | 1.0572 | -0.2907 | 0 | 0.1241 | 0 |

### asymmetry

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| -0.5 | 3.6147 | 1.8542 | 1.0503 | -0.1807 | 0 | 0.1421 | 0.247 |
| -0.25 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0.1235 |
| 0 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.25 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0.1235 |
| 0.5 | 3.6147 | 1.8542 | 1.0503 | -0.1807 | 0 | 0.1421 | 0.247 |

### spacing

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.2 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.35 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.7 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.95 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |

### gaze_x

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| -1 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| -0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 1 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |

### gaze_y

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| -1 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| -0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 1 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |

### glow

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 1 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 1.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 2 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |

### warmth

| value | area | centerThick | taper | lowerDom | smileBias | intraAsym | interEyeDiff |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.25 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.5 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 0.75 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |
| 1 | 3.6147 | 1.8542 | 1.0501 | -0.1807 | 0 | 0.1421 | 0 |

## Local Sensitivities

```json
{
  "openness": {
    "areaApprox": {
      "metric": 2.6124,
      "lowLevel": {
        "leftLidTop": -0.6192,
        "leftLidBottom": -0.035,
        "leftWidth": 0.015
      }
    },
    "meanThickness": {
      "metric": 1.3724,
      "lowLevel": {
        "leftLidTop": -0.6192,
        "leftLidBottom": -0.035,
        "leftWidth": 0.015
      }
    },
    "lowerDominance": {
      "metric": 0.5842,
      "lowLevel": {
        "leftLidTop": -0.6192,
        "leftLidBottom": -0.035,
        "leftWidth": 0.015
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": -0.6192,
        "leftLidBottom": -0.035,
        "leftWidth": 0.015
      }
    },
    "intraThicknessAsymmetry": {
      "metric": -0.3485,
      "lowLevel": {
        "leftLidTop": -0.6192,
        "leftLidBottom": -0.035,
        "leftWidth": 0.015
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": -0.6192,
        "leftLidBottom": -0.035,
        "leftWidth": 0.015
      }
    }
  },
  "squint": {
    "areaApprox": {
      "metric": -1.1907,
      "lowLevel": {
        "leftLidTop": 0.2292,
        "leftLidBottom": 0.07,
        "leftWidth": -0.06
      }
    },
    "meanThickness": {
      "metric": -0.6255,
      "lowLevel": {
        "leftLidTop": 0.2292,
        "leftLidBottom": 0.07,
        "leftWidth": -0.06
      }
    },
    "lowerDominance": {
      "metric": -0.1592,
      "lowLevel": {
        "leftLidTop": 0.2292,
        "leftLidBottom": 0.07,
        "leftWidth": -0.06
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.2292,
        "leftLidBottom": 0.07,
        "leftWidth": -0.06
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0.2448,
      "lowLevel": {
        "leftLidTop": 0.2292,
        "leftLidBottom": 0.07,
        "leftWidth": -0.06
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.2292,
        "leftLidBottom": 0.07,
        "leftWidth": -0.06
      }
    }
  },
  "smile": {
    "areaApprox": {
      "metric": -1.2948,
      "lowLevel": {
        "leftLidTop": 0.004,
        "leftLidBottom": 0.3261,
        "leftWidth": -0.0012
      }
    },
    "meanThickness": {
      "metric": -0.6802,
      "lowLevel": {
        "leftLidTop": 0.004,
        "leftLidBottom": 0.3261,
        "leftWidth": -0.0012
      }
    },
    "lowerDominance": {
      "metric": 0.3221,
      "lowLevel": {
        "leftLidTop": 0.004,
        "leftLidBottom": 0.3261,
        "leftWidth": -0.0012
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.004,
        "leftLidBottom": 0.3261,
        "leftWidth": -0.0012
      }
    },
    "intraThicknessAsymmetry": {
      "metric": -0.065,
      "lowLevel": {
        "leftLidTop": 0.004,
        "leftLidBottom": 0.3261,
        "leftWidth": -0.0012
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.004,
        "leftLidBottom": 0.3261,
        "leftWidth": -0.0012
      }
    }
  },
  "roundness": {
    "areaApprox": {
      "metric": -0.0784,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0.02,
        "leftWidth": -0.22
      }
    },
    "meanThickness": {
      "metric": -0.0412,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0.02,
        "leftWidth": -0.22
      }
    },
    "lowerDominance": {
      "metric": 0.02,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0.02,
        "leftWidth": -0.22
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0.02,
        "leftWidth": -0.22
      }
    },
    "intraThicknessAsymmetry": {
      "metric": -0.0068,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0.02,
        "leftWidth": -0.22
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0.02,
        "leftWidth": -0.22
      }
    }
  },
  "slant": {
    "areaApprox": {
      "metric": 0.008,
      "lowLevel": {
        "leftLidTop": -0.002,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanThickness": {
      "metric": 0.0042,
      "lowLevel": {
        "leftLidTop": -0.002,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "lowerDominance": {
      "metric": 0.002,
      "lowLevel": {
        "leftLidTop": -0.002,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": -0.002,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "intraThicknessAsymmetry": {
      "metric": -0.2731,
      "lowLevel": {
        "leftLidTop": -0.002,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": -0.002,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    }
  },
  "asymmetry": {
    "areaApprox": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.1115,
        "leftLidBottom": 0.0063,
        "leftWidth": -0.0027
      }
    },
    "meanThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.1115,
        "leftLidBottom": 0.0063,
        "leftWidth": -0.0027
      }
    },
    "lowerDominance": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.1115,
        "leftLidBottom": 0.0063,
        "leftWidth": -0.0027
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.1115,
        "leftLidBottom": 0.0063,
        "leftWidth": -0.0027
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0.1115,
        "leftLidBottom": 0.0063,
        "leftWidth": -0.0027
      }
    },
    "signedInterEyeThickness": {
      "metric": -0.4941,
      "lowLevel": {
        "leftLidTop": 0.1115,
        "leftLidBottom": 0.0063,
        "leftWidth": -0.0027
      }
    }
  },
  "spacing": {
    "areaApprox": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "lowerDominance": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    }
  },
  "gaze_x": {
    "areaApprox": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "lowerDominance": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    }
  },
  "gaze_y": {
    "areaApprox": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "lowerDominance": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    }
  },
  "glow": {
    "areaApprox": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "lowerDominance": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    }
  },
  "warmth": {
    "areaApprox": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "lowerDominance": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "meanSmileBias": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "intraThicknessAsymmetry": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    },
    "signedInterEyeThickness": {
      "metric": 0,
      "lowLevel": {
        "leftLidTop": 0,
        "leftLidBottom": 0,
        "leftWidth": 0
      }
    }
  }
}
```

## Pairwise Interactions

```json
{
  "smile__squint": {
    "areaApprox": 0,
    "meanThickness": 0,
    "lowerDominance": 0,
    "meanSmileBias": 0,
    "intraThicknessAsymmetry": 0,
    "signedInterEyeThickness": 0
  },
  "smile__roundness": {
    "areaApprox": 0,
    "meanThickness": 0,
    "lowerDominance": 0,
    "meanSmileBias": 0,
    "intraThicknessAsymmetry": 0,
    "signedInterEyeThickness": 0
  },
  "smile__openness": {
    "areaApprox": 0,
    "meanThickness": 0,
    "lowerDominance": 0,
    "meanSmileBias": 0,
    "intraThicknessAsymmetry": 0,
    "signedInterEyeThickness": 0
  },
  "smile__slant": {
    "areaApprox": 0,
    "meanThickness": 0,
    "lowerDominance": 0,
    "meanSmileBias": 0,
    "intraThicknessAsymmetry": 0,
    "signedInterEyeThickness": 0
  },
  "squint__openness": {
    "areaApprox": 0,
    "meanThickness": 0,
    "lowerDominance": 0,
    "meanSmileBias": 0,
    "intraThicknessAsymmetry": 0,
    "signedInterEyeThickness": 0
  }
}
```
