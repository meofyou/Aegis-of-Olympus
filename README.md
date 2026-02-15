# Aegis of Olympus - 개발 기준 README

이 문서는 지금까지 대화에서 정한 내용을 한 번에 보는 기준 문서다.  
순서는 실제 개발자가 처음 읽을 때 바로 실행 -> 문제 해결 -> 전체 기획 -> 제작 규격 순으로 배치했다.

## 1. 지금 바로 실행

```bash
cd "/Users/macmini/Desktop/Game Projects/Aegis of Olympus"
python3 -m http.server 5173
```

브라우저 접속:

- `http://127.0.0.1:5173`

## 2. 전투 시작 안 될 때 체크 (Three.js 로드 실패 포함)

1. `file:///.../index.html`로 열지 말고 반드시 로컬 서버로 실행
2. 주소창을 `http://127.0.0.1:5173`로 직접 입력
3. Console에 `THREE global not found`가 뜨면 CDN 로드 실패 상태
4. CDN 실패 시 로컬 파일로 대체

```bash
cd "/Users/macmini/Desktop/Game Projects/Aegis of Olympus"
curl -L "https://unpkg.com/three@0.161.0/build/three.min.js" -o "three.min.js"
```

`index.html`에서 Three.js 로드 줄을 아래로 유지:

```html
<script src="https://unpkg.com/three@0.161.0/build/three.min.js"></script>
<script defer src="./main.js"></script>
```

오프라인 개발로 고정할 경우:

```html
<script src="./three.min.js"></script>
<script defer src="./main.js"></script>
```

## 3. 현재 프로토타입 조작/상태

조작:

- 이동: `WASD`
- 달리기: `Shift`
- 공격: `J` 또는 마우스 좌클릭
- 재시작: `R`

현재 구현:

- 주인공/미노타우르스 단순 뼈대형 플레이스홀더 모델
- 기본 전투 루프(추적, 공격, 피격, 사망, 재시작)
- 체력 UI, 상태 텍스트, 원형 아레나

## 4. 게임 전체 목표 (최종판)

- 장르: 브라우저 3인칭 3D 액션 + 로그라이트
- 배경: 그리스·로마 신화 세계 균열
- 방향: 젤다식 자유도 + 몬스터 사냥/육성
- 클리어 시간: 메인 루트 평균 `10시간`

## 5. 핵심 플레이 루프

1. 탐험: 신역 이동, 퍼즐/지형 공략
2. 전투: 회피/패링/콤보/스킬 사용
3. 사냥: 신화 몬스터 처치, 재료/알 획득
4. 육성: 부화/진화/동료 스킬 세팅
5. 보스: 신역 보스 격파, 다음 권능 해금
6. 최종장: 축복+동료 빌드로 엔딩 분기

## 6. 자유도 시스템 (젤다식 설계)

- 월드: 4대 신역 대부분 초반 공개
- 공략 순서: 메인 보스 4체 순서 자유
- 이동: 등반, 글라이드, 수영(스태미나 기반)
- 상호작용: 불-기름, 물-전기, 바람-확산, 독-점화
- 다중 해법: 정면전, 잠입, 환경킬, 동료 활용 중 선택

신의 권능(도구형 스킬):

- `아테나의 정지장`: 대상 고정 후 반동 발사
- `헤르메스의 도약`: 공중 대시/벽 점프
- `포세이돈의 인력`: 물 흐름 조절/플랫폼 생성
- `하데스의 사슬`: 적 끌어오기/지형 연결

## 7. 몬스터 사냥/육성 시스템

- 처치 보상: `혼의 파편`
- 엘리트/보스: 낮은 확률 `신수의 알` 드랍
- 허브: 알 부화 -> 동료 몬스터 획득
- 동료 운용: 런당 1마리 소환
- 동료 성장: 3단계(유체기 -> 성체 -> 신화각성)
- 동료 전투: 액티브 1개 + 패시브 1개
- 동료 사망: 영구 소실 없음, 다음 런 1회 휴식

## 8. 10시간 스토리보드 (메인 루트 고정 기준)

1. `00:00~00:30` 프롤로그: 균열 발생, 반신 주인공 각성
2. `00:30~01:30` 튜토리얼: 이동/전투/기본 동료 획득
3. `01:30~02:50` 신역 A(에게해): 해안 퍼즐 + 지역 보스 1
4. `02:50~04:10` 신역 B(폐허 평원): 파괴 기믹 + 지역 보스 2
5. `04:10~05:30` 신역 C(독 늪지): 독 환경 + 지역 보스 3
6. `05:30~06:50` 신역 D(사막 신전): 환영 퍼즐 + 지역 보스 4
7. `06:50~08:00` 중반 전환: 타르타로스 열쇠 제작, 동료 강화 필수
8. `08:00~09:20` 최종장 진입: 연속 보스전(캄페/탈로스 급)
9. `09:20~09:50` 최종전: 티폰의 잔영 3페이즈
10. `09:50~10:00` 엔딩 분기: 봉인/공존/지배

## 9. 유명 그리스·로마 몬스터 10종 (확정)

| 몬스터 | 전투 특징 | 동료화 효과 |
|---|---|---|
| 메두사 (Medusa) | 시선 석화, 독사 채찍 | 석화/상태이상 저항 보조 |
| 미노타우로스 (Minotaur) | 돌진, 도끼 콤보 | 장애물 파괴, 브루저 |
| 케르베로스 (Cerberus) | 3두 브레스, 광역 포효 | 탱커형 |
| 레르네아의 히드라 (Hydra) | 머리 재생, 독 브레스 | 독 장판 지원 |
| 키메라 (Chimera) | 화염+돌진 복합 패턴 | 화염 강화 |
| 퀴클롭스 (Cyclops) | 바위 투척, 충격파 | 중량 오브젝트 이동 |
| 하르피 (Harpies) | 공중 급습, 디버프 | 공중 정찰 |
| 스핑크스 (Sphinx) | 환영 분신, 수수께끼 | 숨은 퍼즐 감지 |
| 스킬라 (Scylla) | 촉수 광역, 수역 매복 | 수중 이동 보조 |
| 네메아의 사자 (Nemean Lion) | 고강인 근접 압박 | 방어막 보조 |

## 10. 애니메이션 네이밍 규칙

- 소문자 + 언더스코어: `light_01`, `charge_start`
- 동작 분리: `start/loop/end`를 별도 클립으로 분리
- 전투 클립은 `히트 타이밍`을 프레임 기준으로 맞추기 좋게 제작
- 이동 클립은 기본적으로 `in-place` 권장

## 11. Hero 애니메이션 상세 (전체)

| 클립명 | 어떤 애니메이션인지 | Loop | 권장 프레임(30fps) |
|---|---|---|---|
| `idle` | 기본 대기 호흡 | O | 60 |
| `walk` | 저속 이동 | O | 24~32 |
| `run` | 기본 전투 이동 | O | 18~24 |
| `sprint` | 고속 이동 | O | 16~22 |
| `strafe_l` | 좌측 이동(정면 유지) | O | 20~28 |
| `strafe_r` | 우측 이동(정면 유지) | O | 20~28 |
| `back_walk` | 후진 이동 | O | 22~30 |
| `turn_l` | 제자리 좌회전 | X | 10~16 |
| `turn_r` | 제자리 우회전 | X | 10~16 |
| `jump_start` | 점프 이륙 | X | 8~12 |
| `jump_loop` | 공중 체공 | O | 12~18 |
| `jump_land` | 착지 | X | 10~14 |
| `dodge_f` | 전방 회피 | X | 14~20 |
| `dodge_b` | 후방 회피 | X | 14~20 |
| `dodge_l` | 좌회피 | X | 14~20 |
| `dodge_r` | 우회피 | X | 14~20 |
| `guard_start` | 가드 진입 | X | 6~10 |
| `guard_loop` | 가드 유지 | O | 20~40 |
| `guard_end` | 가드 해제 | X | 6~10 |
| `parry` | 패링 성공 동작 | X | 10~16 |
| `light_01` | 약공격 1타 | X | 18~26 |
| `light_02` | 약공격 2타 | X | 18~26 |
| `light_03` | 약공격 3타 | X | 22~30 |
| `heavy_01` | 강공격 1타 | X | 28~40 |
| `heavy_02` | 강공격 2타 | X | 30~44 |
| `skill_01` | 스킬 슬롯 1 | X | 36~60 |
| `skill_02` | 스킬 슬롯 2 | X | 36~60 |
| `skill_03` | 스킬 슬롯 3 | X | 36~60 |
| `hit_light` | 약 피격 | X | 10~16 |
| `hit_heavy` | 강 피격 | X | 16~24 |
| `knockdown` | 다운 | X | 18~30 |
| `getup` | 기상 | X | 20~36 |
| `interact` | 상호작용(레버/문) | X | 16~28 |
| `climb_loop` | 등반 | O | 20~30 |
| `glide_loop` | 글라이드 | O | 24~36 |
| `swim` | 수영 | O | 20~32 |
| `death` | 사망 | X | 40~80 |

## 12. Minotaur 애니메이션 상세 (전체)

| 클립명 | 어떤 애니메이션인지 | Loop | 권장 프레임(30fps) |
|---|---|---|---|
| `idle` | 위압적 대기 | O | 50~70 |
| `walk` | 중량 보행 | O | 24~32 |
| `run` | 추격 이동 | O | 18~24 |
| `turn_l` | 좌회전 | X | 12~18 |
| `turn_r` | 우회전 | X | 12~18 |
| `axe_01` | 수직 내려치기 | X | 24~34 |
| `axe_02` | 횡베기 | X | 22~32 |
| `axe_03` | 연계 마무리 | X | 26~36 |
| `charge_start` | 돌진 준비 | X | 14~22 |
| `charge_loop` | 돌진 지속 | O | 12~20 |
| `charge_end` | 돌진 종료 | X | 12~20 |
| `ground_slam` | 지면 강타 | X | 28~40 |
| `roar` | 포효/페이즈 전환 | X | 26~44 |
| `hit` | 피격 | X | 12~20 |
| `stun` | 브레이크(그로기) | X | 24~40 |
| `death` | 사망 | X | 50~90 |

## 13. 몬스터 10종별 애니메이션 세트

메두사:

- `idle`, `slither`, `turn_l`, `turn_r`, `bite`, `tail_whip`, `gaze_charge`, `gaze_fire`, `snake_summon`, `evade`, `hit`, `stun`, `death`

미노타우로스:

- `idle`, `walk`, `run`, `turn_l`, `turn_r`, `axe_01`, `axe_02`, `axe_03`, `charge_start`, `charge_loop`, `charge_end`, `ground_slam`, `roar`, `hit`, `stun`, `death`

케르베로스:

- `idle`, `walk`, `run`, `bite_l`, `bite_c`, `bite_r`, `combo_bite`, `flame_start`, `flame_loop`, `flame_end`, `pounce`, `howl`, `tail_slam`, `hit`, `death`

히드라:

- `idle`, `crawl`, `turn`, `multi_bite`, `poison_spit`, `venom_breath_start`, `venom_breath_loop`, `venom_breath_end`, `tail_sweep`, `head_regen`, `enrage`, `hit`, `death`

키메라:

- `idle`, `walk`, `run`, `claw_01`, `claw_02`, `goat_ram`, `snake_bite`, `fire_start`, `fire_loop`, `fire_end`, `leap`, `roar`, `hit`, `death`

퀴클롭스:

- `idle`, `walk`, `run`, `boulder_pick`, `boulder_throw`, `club_h`, `club_v`, `stomp`, `grab_smash`, `roar`, `hit`, `stun`, `death`

하르피:

- `perch_idle`, `takeoff`, `fly_forward`, `fly_turn_l`, `fly_turn_r`, `land`, `dive_claw`, `screech`, `feather_shot`, `wind_gust`, `hit_air`, `hit_ground`, `death_air`, `death_ground`

스핑크스:

- `idle`, `walk`, `run`, `wing_spread`, `claw_combo`, `pounce`, `tail_sting`, `riddle_cast`, `illusion_split`, `illusion_merge`, `hit`, `stun`, `death`

스킬라:

- `water_idle`, `emerge`, `submerge`, `tentacle_l`, `tentacle_r`, `tentacle_grab`, `water_spout`, `bite`, `sweep`, `enrage`, `hit`, `death`

네메아의 사자:

- `idle`, `walk`, `run`, `pounce`, `claw_01`, `claw_02`, `claw_03`, `roar_buff`, `tail_swipe`, `counter`, `hit`, `armor_break`, `death`

동료화 공통:

- `summon_spawn`, `companion_idle`, `follow_run`, `companion_attack`, `companion_skill`, `recall_despawn`, `companion_down`

## 14. 모델 제작 목록 (우선순위)

| 우선순위 | 모델 | 수량 | 리깅 |
|---|---|---:|---|
| P0 | Hero 바디 | 1 | O |
| P0 | Hero 무기(검/창/쌍검) | 3 | X |
| P0 | Minotaur 바디 | 1 | O |
| P1 | 메두사 | 1 | O |
| P1 | 케르베로스 | 1 | O |
| P1 | 히드라 | 1 | O |
| P1 | 키메라 | 1 | O |
| P1 | 퀴클롭스 | 1 | O |
| P1 | 하르피 | 1 | O |
| P1 | 스핑크스 | 1 | O |
| P1 | 스킬라 | 1 | O |
| P1 | 네메아 사자 | 1 | O |
| P2 | 환경 모듈러 킷 | 지역별 1세트 | X |
| P2 | 상호작용 오브젝트 | 8~12 | 일부 O |

## 15. Blender 내보내기 체크리스트 (glb)

```txt
[프로젝트 공통]
[ ] Unit System: Metric
[ ] Unit Scale: 1.0
[ ] 캐릭터 정면 방향 통일
[ ] Origin: 발 중앙
[ ] Ctrl+A -> Rotation/Scale 적용
[ ] 메시 노멀/면 뒤집힘 확인
[ ] 본/액션 이름 영어(ASCII) 통일

[리깅/스킨]
[ ] root 본 존재
[ ] 컨트롤 리그는 Bake 후 내보내기
[ ] Deform 본만 최종 내보내기
[ ] 웨이트 깨짐 없음

[애니메이션]
[ ] 액션 1개 = 클립 1개
[ ] 루프 클립 시작/끝 자연 연결
[ ] 30fps 기준
[ ] 이동 클립 in-place 권장
[ ] 테스트 액션 삭제

[Export: glTF 2.0]
[ ] Format: glTF Binary (.glb)
[ ] Selected Objects: ON
[ ] UVs / Normals / Materials / Skinning: ON
[ ] Cameras / Lights: OFF
[ ] +Y Up: ON
[ ] Apply Modifiers: ON
[ ] Draco Compression: OFF (1차 전달)
[ ] Animation: ON
[ ] Always Sample Animations: ON
[ ] NLA Strips: OFF
[ ] All Actions: ON
[ ] Sampling Rate: 1
[ ] Simplify: 0.0
```

## 16. 1차 최소 전달 세트 (지금 필요)

Hero:

- `idle`
- `run`
- `light_01`
- `dodge_f`
- `hit_light`

Minotaur:

- `idle`
- `run`
- `axe_01`
- `charge_start`
- `death`

파일명 권장:

- `hero_v01.glb`
- `minotaur_v01.glb`

선택 전달(있으면 좋음):

- `anim_notes.csv` (히트 프레임, 무적 타이밍 메모)

## 17. 코드 교체 포인트

- `main.js` -> `createHeroPlaceholder()`
- `main.js` -> `createMinotaurPlaceholder()`
- `main.js` -> `heroVisual.root`, `minotaurVisual.root`

`glb` 전달 후 작업 순서:

1. GLTF 로더로 Hero/Minotaur 교체
2. 클립 이름 매핑
3. FSM 연결 (`idle/run/attack/hit/death`)
4. 히트 판정 프레임 동기화

## 18. 구현 로드맵 (16주)

1. `1주차` 기획 고정: 전투/포획/진화 규칙 확정
2. `2~3주차` 코어 구축: Three.js 입력/카메라/저장
3. `4~5주차` 플레이어 액션: 회피/패링/콤보
4. `6~7주차` AI 프레임워크: 보스 페이즈/상태이상
5. `8주차` 포획/육성 시스템 완성
6. `9~11주차` 자유도 시스템: 등반/글라이드/원소 반응
7. `12~14주차` 몬스터 10종 + 신역 콘텐츠
8. `15주차` 10시간 페이싱 밸런싱
9. `16주차` 최적화/버그 수정/출시 준비
