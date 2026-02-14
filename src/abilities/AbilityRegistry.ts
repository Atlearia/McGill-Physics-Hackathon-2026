import { PhysicsAbility } from './PhysicsAbility';
import { LowPressureAbility } from './implementations/LowPressureAbility';
import { HighPressureAbility } from './implementations/HighPressureAbility';
import { HeatAbility } from './implementations/HeatAbility';
import { ColdAbility } from './implementations/ColdAbility';
import { GravityAbility } from './implementations/GravityAbility';
import { WindJetAbility } from './implementations/WindJetAbility';

/**
 * Registry of all available ability types.
 * To add a new ability: instantiate it and push to `all`.
 */
class AbilityRegistryClass {
  private abilities: Map<string, PhysicsAbility> = new Map();

  register(ability: PhysicsAbility): void {
    this.abilities.set(ability.id, ability);
  }

  get(id: string): PhysicsAbility | undefined {
    return this.abilities.get(id);
  }

  getAll(): PhysicsAbility[] {
    return Array.from(this.abilities.values());
  }

  /**
   * Select exactly `count` abilities randomly (seeded for repeatability).
   */
  selectRandom(count: number, seed?: number): PhysicsAbility[] {
    const all = this.getAll();
    const shuffled = [...all];

    // Simple seeded RNG (mulberry32)
    let s = seed ?? Date.now();
    const rng = (): number => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    // Fisher-Yates shuffle with seeded RNG
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // If fewer abilities than count, duplicate to fill
    const result: PhysicsAbility[] = [];
    while (result.length < count) {
      for (const a of shuffled) {
        if (result.length >= count) break;
        result.push(a);
      }
    }

    return result;
  }
}

export const AbilityRegistry = new AbilityRegistryClass();

// Register all built-in abilities
AbilityRegistry.register(new LowPressureAbility());
AbilityRegistry.register(new HighPressureAbility());
AbilityRegistry.register(new HeatAbility());
AbilityRegistry.register(new ColdAbility());
AbilityRegistry.register(new GravityAbility());
AbilityRegistry.register(new WindJetAbility());
