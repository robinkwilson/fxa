import {
  formatPriceAmount,
  getLocalizedCurrency,
  getLocalizedCurrencyString,
  getLocalizedDate,
  getLocalizedDateString,
} from './formats';

describe('format.ts', () => {
  describe('Currency Formatting', () => {
    describe('getLocalizedCurrency', () => {
      it('returns a FluentNumber with the correct currency options', () => {
        const localizedCurrency = getLocalizedCurrency(123, 'USD');

        expect(localizedCurrency.value).toEqual(1.23);
        expect(localizedCurrency.opts.currency).toEqual('USD');
        expect(localizedCurrency.opts.currencyDisplay).toEqual('symbol');
        expect(localizedCurrency.opts.style).toEqual('currency');
      });

      it('returns a FluentNumber with the correct currency options given a null amount', () => {
        const localizedCurrency = getLocalizedCurrency(0, 'USD');

        expect(localizedCurrency.value).toEqual(0);
        expect(localizedCurrency.opts.currency).toEqual('USD');
        expect(localizedCurrency.opts.currencyDisplay).toEqual('symbol');
        expect(localizedCurrency.opts.style).toEqual('currency');
      });
    });

    describe('getLocalizedCurrencyString', () => {
      it('returns a correctly formatted currency string', () => {
        const expected = '$1.23';
        const actual = getLocalizedCurrencyString(123, 'USD');

        expect(actual).toEqual(expected);
      });

      it('returns a correctly formatted currency string given a null amount', () => {
        const expected = '$0.00';
        const actual = getLocalizedCurrencyString(null, 'USD');

        expect(actual).toEqual(expected);
      });
    });

    describe('formatPriceAmount', () => {
      it('returns without tax', () => {
        const expected = '$1.00';
        const actual = formatPriceAmount(100, 'USD', false, null);

        expect(actual).toEqual(expected);
      });

      it('returns with tax', () => {
        const expected = '$1.00 + $0.40 tax';
        const actual = formatPriceAmount(100, 'USD', true, 40);

        expect(actual).toEqual(expected);
      });

      it('returns with tax, even though none is provided', () => {
        const expected = '$1.00 + $0.00 tax';
        const actual = formatPriceAmount(100, 'USD', true, null);

        expect(actual).toEqual(expected);
      });
    });
  });

  describe('DateTime Formatting', () => {
    const unixSeconds = 1582329605; // GMT Saturday, February 22, 2020 12:00:05 AM
    describe('getLocalizedDate', () => {
      describe('when numericDate is false', () => {
        it('returns a FluentDateTime with the correct options', () => {
          const localizedDate = getLocalizedDate(unixSeconds);

          expect(localizedDate.value).toEqual(1582329605 * 1000);
          expect(localizedDate.opts.day).toEqual('2-digit');
          expect(localizedDate.opts.month).toEqual('long');
          expect(localizedDate.opts.year).toEqual('numeric');
        });
      });

      describe('when numericDate is true', () => {
        it('returns a FluentDateTime with the correct options', () => {
          const localizedDate = getLocalizedDate(unixSeconds, true);

          expect(localizedDate.value).toEqual(1582329605 * 1000);
          expect(localizedDate.opts.day).toEqual('2-digit');
          expect(localizedDate.opts.month).toEqual('2-digit');
          expect(localizedDate.opts.year).toEqual('numeric');
        });
      });
    });

    describe('getLocalizedDateString', () => {
      describe('when numericDate is false', () => {
        it('returns a correctly formatted string', () => {
          const pattern = /February \d\d, 2020/;
          const actual = getLocalizedDateString(unixSeconds);

          expect(actual).toMatch(pattern);
        });
      });

      describe('when numericDate is true', () => {
        it('returns a correctly formatted string', () => {
          const pattern = /02\/\d\d\/2020/;
          const actual = getLocalizedDateString(unixSeconds, true);
          expect(actual).toMatch(pattern);
        });
      });
    });
  });
});
