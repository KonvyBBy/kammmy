/**
 * Inventory — item slots with counts
 */

class InvSlot {
  constructor(id = 0, count = 0) {
    this.id    = id;    // BlockType
    this.count = count;
  }
  get empty() { return this.count <= 0 || this.id === 0; }
  clone()     { return new InvSlot(this.id, this.count); }
}

class Inventory {
  /**
   * @param {number} size  Total slot count (hotbar + main)
   */
  constructor(size = 36) {
    this.size  = size;
    this.slots = Array.from({ length: size }, () => new InvSlot());
  }

  /** Add up to `count` of item `id`; returns amount actually added */
  add(id, count = 1) {
    if (!id || id === BlockType.AIR) return 0;
    let remaining = count;

    // First, stack onto existing slots
    for (let i = 0; i < this.size && remaining > 0; i++) {
      if (this.slots[i].id === id && this.slots[i].count < 64) {
        const space = 64 - this.slots[i].count;
        const take  = Math.min(space, remaining);
        this.slots[i].count += take;
        remaining -= take;
      }
    }
    // Then fill empty slots
    for (let i = 0; i < this.size && remaining > 0; i++) {
      if (this.slots[i].empty) {
        const take = Math.min(64, remaining);
        this.slots[i] = new InvSlot(id, take);
        remaining -= take;
      }
    }
    return count - remaining;
  }

  /** Remove `count` of `id`. Returns how many were actually removed. */
  remove(id, count = 1) {
    let remaining = count;
    for (let i = this.size - 1; i >= 0 && remaining > 0; i--) {
      if (this.slots[i].id === id) {
        const take = Math.min(this.slots[i].count, remaining);
        this.slots[i].count -= take;
        if (this.slots[i].count <= 0) this.slots[i] = new InvSlot();
        remaining -= take;
      }
    }
    return count - remaining;
  }

  /** Count how many of `id` are held */
  count(id) {
    return this.slots.reduce((s, sl) => s + (sl.id === id ? sl.count : 0), 0);
  }

  /** Return true if holding at least `count` of `id` */
  has(id, count = 1) { return this.count(id) >= count; }

  /** Hotbar slots are indices 0..8 */
  get hotbar() { return this.slots.slice(0, 9); }

  /** Selected block type from hotbar index */
  selectedId(sel) {
    const s = this.slots[sel];
    return s && !s.empty ? s.id : 0;
  }

  /** Decrement selected hotbar slot by 1 */
  consumeSelected(sel) {
    const s = this.slots[sel];
    if (!s || s.empty) return;
    s.count--;
    if (s.count <= 0) this.slots[sel] = new InvSlot();
  }
}
