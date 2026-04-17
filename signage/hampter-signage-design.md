# HAMPTER Reactive Signage — 설계 노트

Face 시스템(EVE-Lite)에서 검증된 철학을 Signage 도메인으로 확장하는 설계 문서.

---

## 1. 핵심 철학

### 1.1 Face 시스템에서 배운 것

Face 시스템(EVE-Lite)이 작동하는 이유는 네 가지 설계 결정의 조합이다:

1. **LLM을 프레임 루프에서 분리**
   런타임은 항상 수식을 평가한다. LLM은 수식을 쓰고 빠진다.
2. **저차원의 의미 좌표계**
   `openness, squint, smile, slant` 같은 해석 가능한 축.
3. **Safe range + failure mode를 프롬프트에 박기**
   "joker 피해라", "smile 0.8+는 crescent일 때만" 같은 가드레일.
4. **계층 구조**: `baseline + trait + event + react(input)`

### 1.2 왜 "프리셋 선택"이 아니라 "수식 생성"인가

기존 방식: `스크롤 / 깜빡임 / 줌 / 바운스` 중 고르기
HAMPTER 방식: `brightness(t), offset_y(t), tracking(t)` 같은 시간 함수를 LLM이 생성

- 같은 스타일 안에서 무한한 변주
- 일관된 톤을 여러 디스플레이로 재타겟팅
- LED, e-ink, 웹, 로봇 디스플레이 공통 로직
- 수동 타임라인 작업 불필요

---

## 2. 왜 LLM이 수식 생성을 잘하는가

### 2.1 직관에 반하는 발견

"LLM은 숫자 튜닝 못한다"는 일반론과 달리, **이 특정 설계에서는** LLM이 수식 파라미터를 잘 뽑는다. 이유:

**A. 수식이 짧다**
`0.72 + 0.18 * env(0.12, 0.40, 1.20)` 정도는 LLM 컨텍스트에서 통째로 추론 가능한 크기.

**B. 의미→형태 매핑이 훈련 데이터에 존재한다**
"anxious는 빠르고 짧은 펄스", "ceremonial은 느리고 긴 envelope" 같은 연결은
수많은 캐릭터 디자인/애니메이션 문서에 있다.

**C. 구조화된 함수 공간**
무한한 자유도가 아니라 `env, decay, pulse, breathe` 같은
**파라미터화된 빌딩블록** 위에서 숫자만 고른다.

**D. 형태 좌표계가 sweet spot이다**
- 너무 낮음 (픽셀) → LLM 못 함
- 너무 높음 (프리셋) → 변주 없음
- **형태 좌표계 (openness, smile…)** → LLM의 강점 영역

### 2.2 예외: Smile 축

Face 시스템에서 유독 가드레일이 많이 필요한 축이 `smile`이었다. 이유는:

- 다른 표정은 **물리적 연속성**을 따른다 (슬픔→눈꺼풀↓, 놀람→눈 커짐)
- Smile은 **문화적 기호**다 (`^^`, `>_<`, `:)` 등 관습)

→ **교훈**: 채널을 설계할 때 "물리적으로 연속"인 축과 "문화적 기호"인 축을 구분해야 한다.

---

## 3. LLM용 DSL의 설계 원칙

### 3.1 핵심 원칙

> **사람용 DSL이 아니라 LLM용 DSL을 설계한다.**

최적화 기준이 다르다:

| | 사람용 DSL | LLM용 DSL |
|---|---|---|
| 외우기 | 쉬워야 함 | 상관 없음 |
| 타이핑 | 적게 | 많아도 됨 |
| 가독성 | 핵심 | 오히려 verbose가 좋음 |
| 최적화 목표 | **단순함** | **의미의 명확성** |

### 3.2 LLM용 복잡도는 공짜다

LLM은 복잡도를 무시할 수 있으므로 다음은 환영이다:

- 긴 이름 (`smile` > `s`)
- 많은 함수 (`env, decay, pulse, breathe, drift, react…`)
- 깊은 중첩 (`behavior → text → layers → match → per_char`)
- 상세한 프롬프트 주석 (safe range, failure mode, good patterns)
- 도메인 전문용어 (ADSR의 attack/hold/release)

### 3.3 여전히 나쁜 복잡도

LLM이 못하는 것을 요구하는 복잡도는 여전히 나쁘다:

- **인덱스 계산**: "3번째 글자부터 5번째까지" → 틀림
- **글자 세기**: "HELLO에 L 몇 개?" → 틀림
- **긴 수치 시퀀스**: `[0.12, 0.34, 0.56, 0.78, 0.90, ...]` → 중간에 깨짐
- **상태 추적**: 이전 프레임 값 참조 → 못 함

→ **규칙**: LLM이 못하는 것을 프롬프트에서 요구하지 말 것. 대신 **의미 단위 매칭**으로 우회.

---

## 4. Signage 채널 설계

### 4.1 채널 분류

Face의 smile 교훈을 Signage에 적용하면:

**Primary (물리적 연속 — 가드레일 최소):**
- `brightness` / `glow`
- `offset_x`, `offset_y`
- `scale`
- `tracking` (자간)
- `tempo`
- `blur`
- `opacity`

**Stylistic (관습적 기호 — 가드레일 필요):**
- `glitch`
- `scanlines`
- `chromatic_aberration`
- `flicker_type`

**Semantic (LED/사이니지의 smile 자리):**
- `urgency` — 문화적 코드
- `warmth` — 문화적 코드
- → 이 둘은 명시적 가이드가 필요

### 4.2 동작 빌딩블록 (검증된 재사용 함수)

Face에서 그대로 가져옴:

- `env(attack, hold, release)` — 이벤트 envelope
- `decay(rate)` — 지수 감쇠
- `progress(duration)` — 선형 진행
- `breathe(a, speed)` — 부드러운 숨쉬기
- `pulse(a, speed)` — 반복 맥동
- `drift(a, speed)` — 느린 표류
- `twitch(chance, amplitude)` — 확률적 경련
- `react(input, gain, decay)` — 입력 반응

---

## 5. Signage의 핵심 과제: 글자 선택

### 5.1 문제

사용자가 원하는 것: **"특정 글자/단어만 꾸물거리게 / 팡팡 뛰게 / 흔들리게"**

LLM의 약점:
- 인덱스 계산 못 함
- 글자 세기 못 함

### 5.2 해결: Match 기반 선택자

CSS 셀렉터처럼 **의미 단위로 매칭**:

```yaml
match: "URGENT"           # 문자열 (가장 쉬움, 가장 많이 쓸 것)
match: { word: 2 }         # 2번째 단어
match: { chars: "AEIOU" }  # 이 글자들만 (모음)
match: { regex: "\\d+" }   # 숫자만
match: "all"               # 전체
match: "last_word"         # 마지막 단어
```

**핵심**: LLM은 "DOWN이라는 단어"는 완벽히 잡는다. "3번째 글자"는 틀린다.

### 5.3 char_index의 재정의

`char_index`를 **레이어 내부에서 0부터 시작**하게 만든다:

```yaml
text:
  content: "SERVER DOWN"
  layers:
    - match: "DOWN"
      # 여기서 char_index: D=0, O=1, W=2, N=3
      offset_y: "-0.1 * abs(sin(time * 6 + char_index * 0.8))"
```

→ LLM이 "DOWN의 첫 글자부터 파도처럼"을 그대로 표현 가능.
→ 전체 문자열에서 D가 몇 번째인지 계산할 필요 없음.

### 5.4 리듬 작곡으로서의 위상차

`char_index`를 수식 변수로 노출하면 LLM이 **리듬을 작곡**할 수 있다:

```yaml
# 순차적 파도
offset_y: "-0.08 * sin(time * 3 + char_index * 0.3)"

# 랜덤하게 꾸물
offset_x: "0.02 * sin(time * 2 + sin(char_index * 7.3))"

# 가운데서 바깥으로
offset_y: "-0.05 * sin(time * 4 + abs(char_index - length/2) * 0.5)"
```

이건 **shader 코드, After Effects expression, Processing 예제**에 많은 패턴이고
LLM이 학습 데이터에서 흡수한 영역이다.

---

## 6. 레이어 합성 모델

### 6.1 계층 구조 (Face와 동일)

```
state(t) = baseline(t) + trait(t) + event(t) + react(input)
```

Signage 맥락:
- **baseline**: 항상 깔린 낮은 모션 (숨쉬기, 느린 glow)
- **trait**: 영구적 성격 (severe / warm / calm)
- **event**: 일시적 반응 (경고, 환영, 완료)
- **react**: 입력 반응 (센서, 큐 사이즈, 시각)

### 6.2 레이어 합성 예시

```yaml
behavior:
  kind: transient
  attack: 0.15
  hold: 2.0
  release: 0.8

text:
  content: "SERVER DOWN"
  mode: led_matrix
  
  baseline:
    glow: "0.7 + 0.05 * sin(time * 0.8)"
    warmth: 0.3
  
  layers:
    - name: urgency_pulse
      match: "DOWN"
      offset_y: "-0.04 * abs(sin(time * 4 + char_index * 0.5))"
      glow: "1.0 + 0.25 * pulse(1, 3)"
      warmth: 0.15
      
    - name: subtle_drift
      match: "SERVER"
      offset_x: "0.015 * sin(time * 1.2 + char_index * 0.3)"
      opacity: "0.85 + 0.1 * sin(time * 0.6)"
  
  fallback:
    glow: 0.9
    warmth: 0.3
```

- 전체는 느린 숨쉬기 베이스라인
- `DOWN` 단어만 파도처럼 튀면서 밝게 맥동
- `SERVER`는 미세하게 드리프트
- 매칭되지 않은 부분은 fallback

---

## 7. 두 가지 사용 모드

### 7.1 Mode A: 사용자가 모션을 직접 지정

사용자: "URGENT를 팡팡 튀게"
→ LLM이 수식 생성

### 7.2 Mode B: 사용자가 의도를 말하고 LLM이 판단

사용자: "서버 다운 메시지"
→ LLM이 "긴장감 있는 빨간 톤, DOWN 강조"라고 판단
→ 레이어 구성 및 수식 생성

**Mode B가 더 강력하지만 설계 난이도 높음.** 초기엔 A부터.

---

## 8. 선행 연구 대비 포지셔닝

비슷한 조각들은 있지만 **네 축이 동시에 교차하는 지점**은 비어있다:

| 선행 작업 | 가진 것 | 빠진 것 |
|---|---|---|
| Kinetic Typography Engine (Johnny Lee, 2002) | 런타임 + behavior 수식 | LLM 생성 없음 |
| Keyframer (Apple, 2024) | LLM + SVG 애니메이션 | one-shot, 런타임 없음 |
| Kinetic Typography 2.0 (2025) | "behavior-first" 철학 | 시스템 구현 없음 |
| MoVer (Stanford, 2025) | DSL + LLM + verify loop | 실시간 reactive 런타임 없음 |

**HAMPTER의 novelty**:

1. Running runtime + formulas
2. LLM의 자연어→수식 생성
3. **baseline + trait + event + react 계층** (← 가장 novel)
4. Face와 Signage가 같은 철학 공유

3번이 특히 중요: 캐릭터 애니메이션의 상식(Disney 12 principles의 secondary action, follow through)이 LLM 생성 시스템에는 아직 안 들어가 있다.

---

## 9. 설계 체크리스트

새로운 Signage DSL 기능을 추가할 때:

- [ ] 이 채널은 물리적 연속인가, 문화적 기호인가?
- [ ] 문화적 기호라면 safe range + failure mode 프롬프트에 박혔는가?
- [ ] LLM이 인덱스 계산을 해야 하는가? (하면 안 됨)
- [ ] 의미 단위 매칭으로 우회 가능한가?
- [ ] `char_index`는 레이어 내부에서 0부터 시작하는가?
- [ ] `baseline / event / react` 중 어느 계층인가?
- [ ] 같은 빌딩블록(`env, pulse, breathe…`)으로 표현 가능한가?
- [ ] Verbose해도 LLM이 더 잘 쓰는 구조인가?

---

## 10. 한 줄 요약

> **"프리셋 선택" → "수식 생성"** 으로 바꿀 때, DSL은 **사람이 쓰기 쉬움이 아니라 의미가 명확함으로 최적화**해야 한다. LLM은 복잡도를 공짜로 다루지만, **인덱스 계산·글자 세기·상태 추적**은 여전히 못 한다. 그래서 **형태 좌표계 + 의미 매칭 + 위상차 수식**이 sweet spot이다.
