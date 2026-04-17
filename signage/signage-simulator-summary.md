# Signage Simulator Summary

## 1. 목표

이 시스템은 글자 애니메이션을 `프리셋 선택` 문제가 아니라 `저수준 채널을 시간 함수로 제어하는 문제`로 다룬다.

핵심 흐름은 다음과 같다.

`텍스트 -> match selector -> 레이어 적용 -> 채널 값 계산 -> 캔버스 렌더링`

즉, `"SERVER DOWN"` 같은 텍스트가 있으면 전체 문자열을 통째로 다루는 것이 아니라,
특정 단어나 문자 집합을 선택한 뒤 그 범위에만 각 채널의 수식을 적용한다.

---

## 2. 설계 방향

### 2.1 Low-level 우선

이 시스템은 초기에 `env`, `pulse`, `breathe` 같은 매크로 함수보다
`offset_x`, `offset_y`, `scale_x`, `scale_y`, `rotation`, `skew_x`, `opacity`,
`tracking`, `glow`, `blur`, `brightness` 같은 저수준 채널을 직접 다루는 방향으로 설계했다.

이 판단의 이유는 다음과 같다.

- 타이포그래피에서는 얼굴/캐릭터 애니메이션식 은유가 어색할 수 있다.
- 실제로 필요한 것은 "무슨 움직임인지"보다 "어떤 채널이 어떻게 변하느냐"다.
- 초기에 로우레벨로 두면 나중에 sugar를 추가하더라도 구조가 덜 꼬인다.

### 2.2 Preset은 매크로가 아니라 데이터 묶음

여기서 preset은 거대한 블랙박스 효과가 아니라,
`text`, `theme`, `font`, `base`, `baseline`, `layers`를 묶어둔 데이터 구조다.

즉 preset은 "미리 렌더된 효과"가 아니라 "현재 엔진에 넣는 설정 세트"다.

---

## 3. 채널 모델

현재 코어 채널은 다음과 같다.

- `offset_x`, `offset_y`: 글자 위치 이동
- `scale_x`, `scale_y`: 가로/세로 스케일
- `rotation`: 회전
- `skew_x`: 가로 방향 기울임. 사다리꼴처럼 쏠리는 느낌을 만들 수 있다
- `opacity`: 투명도
- `tracking`: 자간
- `glow`: 발광 반경
- `blur`: 흐림
- `brightness`: 색 밝기 배수

중요한 점은 이 값들이 고정 숫자일 수도 있지만, 보통은 `t`를 포함한 시간 함수라는 것이다.

예:

```txt
offset_x = 4 * sin(t * 1.2 + char_index * 0.28)
skew_x   = 0.12 * sin(t * 4.8 + char_index * 0.58)
opacity  = 0.9 + 0.08 * sin(t * 0.8 + char_index * 0.2)
```

즉 채널은 "속성 종류"이고, 애니메이션은 "그 속성을 시간 함수로 쓰는 것"이다.

---

## 4. 선택자 모델

이 시스템의 핵심은 인덱스 계산 대신 의미 기반 매칭으로 가는 것이다.

지원하는 selector는 다음과 같다.

- `match: "DOWN"`: 특정 문자열
- `match: { word: 1 }`: n번째 단어
- `match: { chars: "AEIOU" }`: 특정 문자 집합
- `match: { regex: "\\d+" }`: 정규식
- `match: "all"`: 전체
- `match: "last_word"`: 마지막 단어

이 구조의 장점은 `"3번째 글자부터 5번째 글자까지"` 같은 취약한 인덱스 지시를 피할 수 있다는 점이다.
LLM이나 사람이 `"DOWN만 흔들리게"`처럼 의미 단위로 지시하면 엔진이 직접 범위를 계산한다.

---

## 5. char_index 재정의

`char_index`는 전체 문자열 기준 인덱스가 아니라,
`각 layer의 match 범위 내부에서 0부터 다시 시작하는 값`으로 정의했다.

예를 들어 `"SERVER DOWN"`에서 `match: "DOWN"`이면:

- `D = 0`
- `O = 1`
- `W = 2`
- `N = 3`

이렇게 되면 `"DOWN의 첫 글자부터 파도처럼"` 같은 식을 전체 문자열 인덱스를 계산하지 않고 바로 표현할 수 있다.

이게 중요한 이유는 타이포 애니메이션에서 리듬, 위상차, 파도, 계단형 움직임이 대부분
`char_index` 기반으로 만들어지기 때문이다.

---

## 6. 현재 preset 구조

프리셋은 대략 다음 구조를 가진다.

```json
{
  "content": "SERVER DOWN",
  "theme": {
    "background": "#05070b",
    "vignette": "#09111a",
    "fill": "#ffb199",
    "glowColor": "#ff5f57"
  },
  "font": {
    "family": "\"Arial Black\", Impact, sans-serif",
    "size": 132,
    "weight": "900"
  },
  "base": {
    "tracking": 6,
    "glow": 10,
    "brightness": 1,
    "opacity": 1,
    "scale_x": 1,
    "scale_y": 1
  },
  "baseline": {
    "offset_y": "1.8 * sin(t * 0.9 + global_index * 0.25)",
    "brightness": "1 + 0.04 * sin(t * 1.4)"
  },
  "layers": [
    {
      "match": "SERVER",
      "offset_x": "4 * sin(t * 1.2 + char_index * 0.28)"
    },
    {
      "match": "DOWN",
      "offset_y": "-18 * abs(sin(t * 4.8 + char_index * 0.58))",
      "skew_x": "0.12 * sin(t * 4.8 + char_index * 0.58)"
    }
  ]
}
```

의미는 다음과 같다.

- `base`: 기본값
- `baseline`: 전체 텍스트에 깔리는 저강도 모션
- `layers`: 선택자에 따라 부분적으로 덧씌우는 변화

즉 전체는 baseline으로 느리게 숨 쉬고,
특정 단어만 layer로 더 강하게 튀거나 쏠리거나 흔들릴 수 있다.

---

## 7. 현재 들어간 preset 예시

현재 구현에는 다음 예시가 들어 있다.

- `Server Down`
  - `"SERVER"`는 느리게 드리프트
  - `"DOWN"`은 강하게 튀고 glow가 커짐
- `Departure Board`
  - 첫 단어가 미세하게 흔들림
  - 숫자만 따로 점멸
- `Welcome Home`
  - 모음만 shimmer
  - 마지막 단어만 따뜻하게 swell
- `Breach Shear`
  - 마지막 단어에 `skew_x`와 `rotation`을 걸어 사다리꼴처럼 쏠리는 느낌 확인

이 중 `Breach Shear`는 단순한 크기 변경이 아니라
실제로 기하 변형이 들어가야 한다는 점을 보여주는 프리셋이다.

---

## 8. 렌더링 방식

현재 렌더러는 캔버스 기반이다.

각 글자를 개별 glyph처럼 순회하면서:

1. 문자 폭 측정
2. baseline 기준 위치 계산
3. 레이어를 합성해 글자별 상태 생성
4. `translate -> rotate -> skew -> scale`
5. `opacity`, `glow`, `brightness` 적용 후 렌더

이 방식은 실험용으로는 단순하고 좋지만,
정교한 타이포그래피 엔진이라고 보기는 어렵다.

현재 한계는 다음과 같다.

- kerning/shaping이 정교하지 않다
- 진짜 perspective/quad warp는 아직 없다
- 글자 단위 변형은 되지만 텍스트 엔진 수준 레이아웃은 아니다

즉 지금 단계는 `authoring model 검증용 시뮬레이터`에 가깝다.

---

## 9. 왜 new Function을 제거했는가

초기 구현은 수식 문자열을 `new Function(...)`으로 실행했다.

예:

```js
"0.1 * sin(t * 3)"
```

이런 문자열을 실제 JavaScript 함수로 만들어 실행하는 방식이다.

이 방식은 실험용으론 빠르지만, 구조적으로는 위험하다.
이유는 문자열이 단순 수식이 아니라 임의 코드가 되어도 실행될 수 있기 때문이다.

즉 "수식 평가기"가 아니라 사실상 "코드 실행기"가 된다.

그래서 지금은 작은 수식 파서로 바꿨다.

---

## 10. 현재 파서 구조

현재 파서는 다음 단계로 동작한다.

1. 문자열을 token으로 분해
2. token을 AST로 파싱
3. AST를 직접 재귀 평가

지원 문법은 현재 프리셋에서 필요한 최소 범위다.

- 숫자
- 식별자: `t`, `char_index`, `global_index`, `length` 등
- 함수 호출: `sin(x)`, `abs(x)`, `clamp(a, b, c)` 등
- 괄호
- 단항 `+`, `-`
- 이항 `+`, `-`, `*`, `/`, `%`

즉 지금은 JavaScript 전체를 실행하는 것이 아니라,
허용된 수식 문법만 해석한다.

이 변경의 장점은 다음과 같다.

- 임의 코드 실행 위험 감소
- 허용 문법을 명확히 통제 가능
- 나중에 에러 메시지나 정적 검증을 붙이기 쉬움

---

## 11. 현재 helper 함수

현재 수식에서 사용할 수 있는 helper는 다음과 같다.

- `sin`, `cos`, `tan`
- `abs`, `min`, `max`, `pow`, `sqrt`
- `clamp`
- `mix`
- `fract`
- `tri`
- `smoothstep`
- `hash`

이들은 JavaScript 전체를 노출하는 것이 아니라,
수식 계산에 필요한 작은 수학 유틸 집합만 노출한다.

---

## 12. 이 시스템의 강점

- 텍스트 애니메이션을 프리셋 UI가 아니라 수식 기반 구조로 다룬다
- 의미 기반 selector 덕분에 인덱스 계산을 많이 피한다
- `char_index` 재정의 덕분에 리듬/위상차를 자연스럽게 만들 수 있다
- 로우레벨 채널 중심이라 매크로에 종속되지 않는다
- 프리셋도 블랙박스 효과가 아니라 데이터 구조로 남는다

---

## 13. 남은 과제

다음 단계에서 필요한 것은 대략 이렇다.

- 채널별 safe range 정의
- parse error 위치 표시
- 허용 변수 목록을 더 엄격히 고정
- `quad_warp`나 `perspective` 같은 상위 기하 변형 추가
- 레이어 합성 우선순위와 clamp 정책 정리
- canvas 시뮬레이터를 넘어 실제 텍스트 엔진으로 확장 여부 결정

---

## 14. 한 줄 요약

이 시스템은 `텍스트를 의미 단위로 선택한 뒤, 저수준 타이포 채널을 시간 수식으로 구동하는 시뮬레이터`다.
그리고 현재 구현은 그 아이디어를 검증하기 위한 최소 프로토타입이며,
최근 변경의 핵심은 `new Function` 기반 실행기를 `안전한 수식 파서`로 치환한 것이다.
