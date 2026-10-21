import { describe, expect, it } from "vitest";

import { isAccountLocked } from "./presentation";

const me = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";

describe("ADM-01 accounts list presentation", () => {
  it("[ADM-01-AC17] an ordinary row (not self, not protected) is not locked", () => {
    expect(isAccountLocked({ id: other, isProtected: false }, me)).toBe(false);
  });
  it("[ADM-01-AC17] the caller's own row is locked even when not protected", () => {
    expect(isAccountLocked({ id: me, isProtected: false }, me)).toBe(true);
  });
  it("[ADM-01-AC17] a protected row is locked even when it is not the caller's own", () => {
    expect(isAccountLocked({ id: other, isProtected: true }, me)).toBe(true);
  });
  it("[ADM-01-AC17] the caller's own protected row is locked by both rules at once", () => {
    expect(isAccountLocked({ id: me, isProtected: true }, me)).toBe(true);
  });
});
