/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const {
  GROUPS,
  initialize,
  mapBrowser,
  mapFormFactor,
  mapLocation,
  mapOs,
  toSnakeCase,
  validate,
} = require('fxa-shared/metrics/amplitude');
const { filterDntValues } = require('fxa-shared/metrics/dnt');
const config = require('../config');
const amplitude = config.get('amplitude');
const log = require('./logging/log')();
const ua = require('fxa-shared/metrics/user-agent');
const { version: VERSION } = require('../../package.json');
const Sentry = require('@sentry/node');
const { Container } = require('typedi');
const { StatsD } = require('hot-shots');

const FUZZY_EVENTS = new Map([
  [
    // Emit events from the front-end as `amplitude.${GROUP}.${EVENT}`
    /^amplitude\.([\w-]+)\.([\w-]+)$/,
    {
      group: (group) => GROUPS[group],
      event: (group, event) => toSnakeCase(event),
    },
  ],
]);

const transform = initialize(
  config.get('oauth_client_id_map'),
  {},
  FUZZY_EVENTS
);

module.exports = (event, request, data) => {
  const statsd = Container.get(StatsD);
  if (!amplitude.enabled || !event || !request || !data) {
    return;
  }

  const userAgent = ua.parse(request.headers?.['user-agent']);

  statsd.increment('amplitude.event');

  const amplitudeEvent = transform(event, {
    version: VERSION,
    ...mapBrowser(userAgent),
    ...mapOs(userAgent),
    ...mapFormFactor(userAgent),
    ...mapLocation(data.location),
    ...data,
  });

  if (amplitudeEvent) {
    if (amplitude.schemaValidation) {
      try {
        validate(amplitudeEvent);
      } catch (err) {
        log.error('amplitude.validationError', { err, amplitudeEvent });

        // Since we are adding a schema retroactively, let's be conservative:
        // temporarily capture any validation "errors" with Sentry to ensure
        // that the schema is not too strict against existing events.  We'll
        // update the schema accordingly.  And allow the events in the
        // meantime.
        Sentry.withScope((scope) => {
          scope.setContext('amplitude.validationError', {
            event_type: amplitudeEvent.event_type,
            flow_id: amplitudeEvent.user_properties.flow_id,
            error: err.message,
          });
          Sentry.captureMessage(
            `Amplitude event failed validation: ${err.message}.`,
            Sentry.Severity.Error
          );
        });
      }
    }

    const dnt = request.headers?.['dnt'] === '1';
    if (dnt) {
      amplitudeEvent.event_properties = filterDntValues(
        amplitudeEvent.event_properties
      );
      amplitudeEvent.user_properties = filterDntValues(
        amplitudeEvent.user_properties
      );
    }

    // Amplitude events are logged to stdout, where they are picked up by the
    // stackdriver logging agent.
    log.info('amplitudeEvent', amplitudeEvent);
  } else {
    statsd.increment('amplitude.event.dropped');
  }
};
