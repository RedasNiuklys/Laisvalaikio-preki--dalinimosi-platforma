import { ltLocale, enLocale } from '@/src/locales/calendarLocales';

describe('calendarLocales', () => {
  describe('ltLocale', () => {
    it('has 12 monthNames', () => {
      expect(ltLocale.monthNames).toHaveLength(12);
    });

    it('has 12 monthNamesShort', () => {
      expect(ltLocale.monthNamesShort).toHaveLength(12);
    });

    it('has 7 dayNames', () => {
      expect(ltLocale.dayNames).toHaveLength(7);
    });

    it('has 7 dayNamesShort', () => {
      expect(ltLocale.dayNamesShort).toHaveLength(7);
    });

    it('has today field', () => {
      expect(typeof ltLocale.today).toBe('string');
      expect(ltLocale.today.length).toBeGreaterThan(0);
    });

    it('first month is Sausis (January in Lithuanian)', () => {
      expect(ltLocale.monthNames[0]).toBe('Sausis');
    });
  });

  describe('enLocale', () => {
    it('has 12 monthNames', () => {
      expect(enLocale.monthNames).toHaveLength(12);
    });

    it('has 12 monthNamesShort', () => {
      expect(enLocale.monthNamesShort).toHaveLength(12);
    });

    it('has 7 dayNames', () => {
      expect(enLocale.dayNames).toHaveLength(7);
    });

    it('has 7 dayNamesShort', () => {
      expect(enLocale.dayNamesShort).toHaveLength(7);
    });

    it('has today field', () => {
      expect(enLocale.today).toBe('Today');
    });

    it('first month is January', () => {
      expect(enLocale.monthNames[0]).toBe('January');
    });

    it('first day is Sunday', () => {
      expect(enLocale.dayNames[0]).toBe('Sunday');
    });
  });
});
