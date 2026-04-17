# Face DSL System

이 문서는 현재 구현된 EVE-Lite 얼굴 DSL 시스템이 실제로 어떻게 동작하는지 설명한다.

목표는 두 가지다.

- 이 시스템이 어떤 구조로 얼굴을 그리는지 이해하기
- DSL 안의 수식이 매 프레임 어떤 방식으로 평가되는지 이해하기

코드 기준 진입점은 다음 파일들이다.

- [`app.js`](C:/Users/dukes/Downloads/새%20폴더%20(3)/app.js)
- [`dsl-runtime.js`](C:/Users/dukes/Downloads/새%20폴더%20(3)/dsl-runtime.js)
- [`renderer.js`](C:/Users/dukes/Downloads/새%20폴더%20(3)/renderer.js)

## 1. 한 줄 요약

이 시스템은 "표정을 저장하는 시스템"이 아니라, "시간을 넣으면 얼굴 숫자를 다시 계산하는 시스템"이다.

즉 DSL은 사진처럼 정적인 포즈를 적는 포맷이 아니라, 아래 형태의 함수 집합이다.

```text
현재 시간 t
-> DSL 식 평가
-> 얼굴 파라미터 숫자 계산
-> 셰이더 유니폼으로 전달
-> 눈 렌더링
```

## 2. 전체 구조

실행 흐름은 아래와 같다.

1. 사용자가 YAML DSL을 입력한다.
2. `dsl-runtime.js`가 YAML을 파싱한다.
3. 각 값을 숫자 또는 수식으로 해석한다.
4. 수식이면 JavaScript 함수로 컴파일한다.
5. 매 프레임 현재 시간을 넣어 값을 다시 계산한다.
6. 계산된 의미 채널을 실제 눈 형태 파라미터로 매핑한다.
7. `renderer.js`가 WebGL 셰이더로 그린다.

중요한 점은 셰이더는 감정을 이해하지 않는다는 점이다.

- 셰이더는 숫자만 받는다.
- 감정, 시간 함수, transient 복귀 같은 로직은 전부 `dsl-runtime.js`에 있다.

## 3. 기본 개념

이 시스템에는 얼굴 상태가 두 겹 있다.

- `base behavior`
- `overlay transient`

`base behavior`는 항상 돌고 있는 기본 얼굴이다. 보통 `IDLE`이 여기에 들어간다.

`overlay transient`는 잠깐 덮였다가 사라지는 임시 반응이다.

예를 들면:

- 기본은 무표정 idle
- 사용자가 좋은 말을 했다
- 1.5초 동안 happy transient가 올라온다
- 끝나면 다시 idle만 남는다

최종 얼굴은 개념적으로 아래처럼 계산된다.

```text
final_face(t) = blend(base_face(t), transient_face(t), overlay_weight(t))
```

여기서:

- `base_face(t)`는 항상 존재하는 기본 얼굴
- `transient_face(t)`는 임시 표정
- `overlay_weight(t)`는 transient가 얼마나 강하게 섞일지 결정하는 값이다

## 4. DSL의 두 종류

현재 구현상 DSL은 크게 두 가지 모드가 있다.

- 저수준 얼굴 모드
- compact 모드

### 4.1 저수준 얼굴 모드

이 모드는 실제 렌더 파라미터에 가깝다.

예:

```yaml
face:
  left:
    lid_top: 0.2
    upper_inner: 0.3
    upper_outer: 0.1
    lower_inner: 0.1
    lower_outer: 0.2
    tilt: 0.1
    width: 1.0
  right:
    ...
  spacing: 0.46
  gaze: [0.0, -0.02]
  glow: 0.9
  warmth: 0.3
```

이 방식은 강력하지만, LLM이 직접 쓰기에는 얼굴 언어보다 기하 언어에 가깝다.

### 4.2 compact 모드

이 모드는 적은 의미 채널만 적는다.

예:

```yaml
face:
  mode: compact
  openness: 0.8
  squint: 0.1
  smile: 0.4
  roundness: 0.2
  slant: 0.0
  asymmetry: 0.02
  gaze: [0.0, -0.04]
  glow: 0.9
  warmth: 0.4
```

이 값들은 그대로 렌더되지 않는다.

먼저 `mapCompactChannelsToFace()`에서 실제 파라미터로 바뀐다.

## 5. compact 채널의 의미

- `openness`
  눈이 얼마나 열려 있는가. 높을수록 더 열리고 alert해 보인다.
- `squint`
  위아래로 눌리는 정도. 높을수록 더 조여지고 날카로워진다.
- `smile`
  아래 눈꺼풀의 따뜻한 상승. 높을수록 눈웃음이 생긴다.
- `roundness`
  실루엣이 더 둥글게 보이게 만든다. 놀람, 순수함, 귀여움 쪽으로 간다.
- `slant`
  음수면 더 날카롭고 강한 방향, 양수면 더 부드럽거나 여린 방향.
- `asymmetry`
  좌우 차이. 작게 쓰면 살아있는 느낌, 크게 쓰면 의심이나 호기심 쪽.
- `gaze`
  시선 방향. `[x, y]`.
- `glow`
  발광 강도.
- `warmth`
  차가운 느낌과 따뜻한 느낌 사이의 색 온도.

## 6. 수식은 어떻게 동작하는가

DSL 값은 숫자일 수도 있고 수식일 수도 있다.

숫자 예:

```yaml
openness: 0.8
```

수식 예:

```yaml
openness: 0.55 + 0.20 * env(0.12, 0.40, 1.20)
```

런타임은 수식을 문자열로 받아 JavaScript 함수로 컴파일한 뒤, 매 프레임 다시 평가한다.

즉 이 값은 한 번 계산되고 끝나는 것이 아니라, 매 프레임 다시 계산된다.

```text
frame 1 -> openness 계산
frame 2 -> openness 다시 계산
frame 3 -> openness 다시 계산
...
```

## 7. 사용 가능한 변수

현재 수식에서 중요한 시간 변수는 두 개다.

- `time`
- `local_time`

### 7.1 `time`

전역 시간이다.

- 앱이 실행된 뒤 계속 증가한다.
- idle처럼 항상 움직이는 리듬에 적합하다.

예:

```yaml
glow: 0.8 + 0.03 * sin(time * 0.7)
```

### 7.2 `local_time`

현재 transient가 시작된 뒤 흐른 시간이다.

- transient 반응 안에서만 의미가 있다.
- 공격적으로 올라오고, 잠깐 머물고, 다시 돌아가는 반응에 적합하다.

예:

```yaml
asymmetry: 0.04 * sin(local_time * 2.1)
```

이 식은 transient가 시작된 시점 기준으로 좌우 차이를 흔든다.

## 8. transient의 의미

transient는 잠깐 올라왔다가 사라지는 행동이다.

형식은 아래와 같다.

```yaml
behavior:
  kind: transient
  duration_scale: 1.2
  attack: 0.12
  hold: 0.40
  release: 1.20
```

뜻은 이렇다.

- `attack`
  0에서 1까지 올라가는 구간 길이
- `hold`
  1 근처를 유지하는 구간 길이
- `release`
  다시 0으로 줄어드는 구간 길이
- `duration_scale`
  attack, hold, release 전체를 한 번에 늘리거나 줄이는 배율. `1.2`면 전체 transient가 20% 더 길어진다.

이 세 값을 이용해 런타임은 엔벨로프를 만든다.

개념적으로:

```text
0 -> 서서히 상승 -> 유지 -> 서서히 감소 -> 0
```

## 9. `env()` 함수

`env(attack, hold, release)`는 transient 엔벨로프를 반환한다.

항상 0에서 1 사이 값이다.

예:

```yaml
smile: 0.65 + 0.20 * env(0.12, 0.40, 1.20)
```

의미:

- 기본 smile은 0.65
- transient 동안 최대 0.20이 더해진다
- 시간이 지나면 그 증가분이 다시 0으로 줄어든다

즉 transient가 끝나면 다시 기본값으로 돌아온다.

### 9.1 엔벨로프의 개념적 그래프

```text
attack            hold              release
  /------------------\____________________
 /                    \
/                      \
0                       1                  0
```

실제 구현에서는 `release`가 너무 기계적으로 꺼지지 않도록 tail이 조금 남는 곡선으로 처리한다.

## 10. `decay()` 함수

`decay(rate)`는 `exp(-local_time * rate)` 형태로 감소하는 함수다.

예:

```yaml
roundness: 0.3 + 0.1 * decay(3.0)
```

의미:

- transient 시작 직후 roundness가 더 높다
- 시간이 지나면 그 추가분이 빠르게 사라진다

이 함수는 "처음에 강하고, 시간이 갈수록 잦아드는 반응"에 적합하다.

## 11. `progress()` 함수

`progress(duration)`은 0에서 1까지의 진행도를 반환한다.

예:

```yaml
openness: 0.6 + 0.2 * progress(0.5)
```

의미:

- transient 시작 후 0.5초 동안 openness가 점점 증가
- 0.5초 이후에는 1로 고정

현재 구현에서는 `env()`와 `decay()`가 더 많이 쓰인다.

## 12. 기타 함수

현재 쓸 수 있는 대표 함수는 아래와 같다.

- `sin`, `cos`, `abs`, `pow`, `min`, `max`, `clamp`, `mix`, `smoothstep`, `exp`
- `floor`, `ceil`, `round`, `fract`
- `breathe(a, speed)`
- `pulse(a, speed)`
- `drift(a, speed)`
- `twitch(chance, amplitude)`
- `react(input, gain, decay)`

### 12.1 `breathe(a, speed)`

부드러운 사인파다.

예:

```yaml
smile: 0.8 + 0.03 * breathe(1.0, 1.8)
```

의미:

- 미세한 생체 리듬
- 완전히 정지한 얼굴보다 살짝 살아 있는 느낌

### 12.2 `pulse(a, speed)`

절댓값 사인 기반 맥동이다.

밝기나 에너지감에 자주 쓴다.

### 12.3 `drift(a, speed)`

더 느리고 유기적인 흔들림이다.

시선이나 졸림, 약한 wandering에 어울린다.

### 12.4 `twitch(chance, amplitude)`

가끔씩 튀는 미세 변화다.

긴장, 불안, 불규칙한 살아 있음에 쓸 수 있다.

## 13. compact 모드는 실제로 어떻게 눈이 되는가

compact 값은 그대로 셰이더에 들어가지 않는다.

런타임은 이 값을 실제 렌더 파라미터로 바꾼다.

정확한 코드는 `mapCompactChannelsToFace()`를 보면 되지만, 개념은 아래와 같다.

### 13.1 openness

`openness`가 높으면:

- 위 눈꺼풀 닫힘이 줄어들고
- 아래 눈꺼풀도 덜 밀리며
- 눈 폭이 조금 안정적으로 열린 쪽으로 감

### 13.2 squint

`squint`가 높으면:

- 위쪽이 더 닫히고
- 아래쪽도 조금 올라오고
- 전체적으로 더 조여진다

### 13.3 smile

`smile`이 높으면:

- 아래 눈꺼풀 특히 바깥쪽이 더 올라온다
- 눈웃음, 따뜻함, affection이 생긴다

### 13.4 roundness

`roundness`가 높으면:

- 실루엣이 더 둥글어진다
- 폭도 더 동글한 방향으로 재조정된다

### 13.5 slant

`slant`는 눈 안쪽과 바깥쪽의 감정 기울기를 만든다.

- 음수: 더 강하고 날카로운 쪽
- 양수: 더 여리고 부드러운 쪽

### 13.6 asymmetry

`asymmetry`는 좌우 채널을 살짝 다르게 만든다.

이 값이 0이면 너무 기계적인 대칭이 되기 쉽다.

## 14. 최종 복귀가 어떻게 일어나는가

transient가 끝나면 시스템은 `base behavior`만 남긴다.

복귀 과정은 두 가지로 이루어진다.

- transient overlay weight가 점점 줄어든다
- overlay가 강할 때 줄여 두었던 idle 자율 움직임도 서서히 돌아온다

즉 최종적으로는 아래와 같은 체감이 되도록 설계되어 있다.

- transient 중: 의도된 감정이 우선
- transient release: 감정이 서서히 약해짐
- release 끝: 기본 idle만 남음

## 15. 현재 구현의 제약

### 15.1 식 값에 따옴표를 쓰면 안 된다

현재 파서는 아래를 허용하지 않는다.

```yaml
openness: "0.55 + 0.20 * env(...)"
```

이렇게 써야 한다.

```yaml
openness: 0.55 + 0.20 * env(...)
```

이건 현재 구현 제한이다.

### 15.2 너무 큰 변화는 복귀가 어색할 수 있다

transient가 너무 과격하면:

- 올라갈 때는 재밌어도
- 돌아올 때 너무 멀리서 복귀하는 느낌이 난다

그래서 자연스럽게 보이려면:

- `release`를 충분히 길게 두고
- 변화량을 적당히 제한하는 게 좋다

## 16. 수식 읽는 법

아래 식을 보자.

```yaml
openness: 0.55 + 0.20 * env(0.12, 0.40, 1.20)
```

읽는 법:

- 평소 openness는 0.55
- transient가 오면 최대 0.20이 더 붙는다
- 0.12초 동안 올라가고
- 0.40초 유지하고
- 1.20초 동안 천천히 빠진다

아래 식도 같은 방식이다.

```yaml
smile: 0.65 + 0.20 * env(0.12, 0.40, 1.20) + 0.03 * breathe(1.0, 1.8)
```

읽는 법:

- 평소에도 smile이 0.65 있다
- transient 동안 0.20 더 강해진다
- 그 상태에서 아주 약한 생체 리듬이 0.03 정도 흔든다

즉 "강한 미소가 잠깐 올라왔다가 다시 줄어들되, 완전히 죽은 값처럼 보이지는 않게" 만든 식이다.

## 17. 추천 작성 패턴

좋은 transient는 보통 아래 구조를 따른다.

```yaml
behavior:
  kind: transient
  attack: 0.10
  hold: 0.30
  release: 1.40

face:
  mode: compact
  openness: 기본값 + 증가분 * env(...)
  squint: 기본값 + 변화분 * env(...)
  smile: 기본값 + 변화분 * env(...) + 작은 breathe(...)
  roundness: 기본값 + 변화분 * env(...)
  asymmetry: 아주 작은 sin(local_time * ...)
  gaze: [기본 또는 약한 이동, 기본 또는 약한 이동]
  glow: 기본값 + 변화분 * env(...)
  warmth: 기본값 + 변화분 * env(...)
```

핵심은:

- 하나의 큰 감정 변화
- 하나의 작은 follow-through

이 두 개만 넣는 것이다.

## 18. 실전 해석

같은 happy를 요청해도 서로 다른 모델이 서로 다른 수식을 내놓을 수 있다.

그건 오류가 아니라 오히려 좋은 신호다.

- 감정 대분류는 happy로 유지되고
- 세부 톤은 모델마다 달라질 수 있기 때문이다

즉 이 DSL은 "정답 하나를 강제하는 시스템"이 아니라, "감정군 안에서 variation을 생성하는 시스템"으로 보는 것이 맞다.

## 19. 결론

이 DSL은 결국 아래 한 줄로 요약할 수 있다.

```text
얼굴 = 기본 idle + 시간이 지나면 자동으로 사라지는 transient 수식 오버레이
```

그리고 수식은 아래 두 가지 역할을 한다.

- 감정이 얼마나 강하게 들어오는지 정한다
- 시간이 지나며 어떻게 복귀하는지 정한다

즉 DSL은 애니메이션 파일 포맷이 아니라, "실시간 얼굴 행동 함수"를 적는 언어다.
