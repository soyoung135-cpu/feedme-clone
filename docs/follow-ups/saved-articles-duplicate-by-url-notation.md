# 같은 페이지를 다른 주소 표기로 저장하면 저장한 글이 중복된다

**Symptom**: `https://example.com/a`를 저장한 뒤 `https://example.com/a/`나 `#해시`가 붙은 주소로 다시 저장하면, 같은 글이 저장한 글 목록에 두 건 생긴다. 스펙은 같은 출처 주소는 한 건만 유지하고 갱신하라고 한다.

**Observed evidence**: `features/saved-articles/components/save-button.tsx`가 사용자가 입력한 주소 문자열(`state.result.url`)을 그대로 `source_url`로 넘기고, `saved_articles`의 `unique (user_id, source_url)`은 문자열 비교다. 코드 리뷰(low)가 지적했고, 아직 런타임에서 재현하지는 않았다.

**Suspected cause**: 저장 키를 정규화하지 않는다. 변환 API가 따라간 최종 주소(`finalUrl`)도 응답에 담기지 않아 쓰지 못한다.

**What was tried**: 아무것도 하지 않았다. 일반적인 입력(같은 문자열 재저장)은 갱신으로 동작함을 런타임에서 확인했다.

**Proposed next step**: 저장 전에 주소를 정규화한다(해시 제거, 끝 슬래시 통일, 호스트 소문자). 정규화한 값을 `source_url`로 쓰고, 이미 저장된 행은 같은 규칙으로 갱신하는 마이그레이션을 함께 둔다. 이 변경이 스펙의 "같은 주소" 기준을 바꾸는지는 사용자가 정한다.
